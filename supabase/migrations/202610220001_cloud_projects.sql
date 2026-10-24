begin;

create table public.projects (
  id text primary key check (id ~ '^[0-9a-f]{24}$'),
  owner_user_id uuid not null references auth.users(id),
  source_draft_id uuid not null,
  name text not null check (char_length(btrim(name)) between 1 and 120 and name !~ '[[:cntrl:]]'),
  furniture_type text not null check (furniture_type in ('cabinet','shoe_rack','bookshelf','table')),
  version integer not null default 0 check (version >= 0),
  current_revision_id uuid,
  sync_status text not null default 'pending' check (sync_status in ('pending','ready')),
  pending_operation_id uuid,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_user_id,source_draft_id)
);
create index projects_owner_updated on public.projects(owner_user_id,updated_at desc) where deleted_at is null;

create table public.design_revision_index (
  id uuid primary key,
  project_id text not null references public.projects(id),
  revision_number integer not null check (revision_number > 0),
  schema_version integer not null default 1 check (schema_version = 1),
  engine_version text not null default 'project-shell-v1',
  snapshot_hash text not null check (snapshot_hash ~ '^[0-9a-f]{64}$'),
  state text not null default 'pending' check (state in ('pending','ready')),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique (project_id,revision_number), unique (project_id,id)
);
alter table public.projects add constraint project_current_revision foreign key (id,current_revision_id)
  references public.design_revision_index(project_id,id) deferrable initially deferred;

create table public.project_save_operations (
  id uuid primary key,
  owner_user_id uuid not null references auth.users(id),
  project_id text not null references public.projects(id),
  revision_id uuid not null unique references public.design_revision_index(id),
  expected_version integer not null,
  request_hash text not null check (request_hash ~ '^[0-9a-f]{64}$'),
  snapshot_hash text not null check (snapshot_hash ~ '^[0-9a-f]{64}$'),
  payload jsonb,
  state text not null default 'pending' check (state in ('pending','ready')),
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  check ((state='pending' and payload is not null and completed_at is null) or (state='ready' and payload is null and completed_at is not null))
);
create index pending_project_saves on public.project_save_operations(created_at) where state='pending';

alter table public.projects enable row level security;
alter table public.design_revision_index enable row level security;
alter table public.project_save_operations enable row level security;
revoke all on public.projects,public.design_revision_index,public.project_save_operations from anon,authenticated;
grant select on public.projects,public.design_revision_index to authenticated;
grant select,insert,update on public.projects,public.design_revision_index,public.project_save_operations to service_role;
create policy project_read_own on public.projects for select to authenticated using (owner_user_id=(select auth.uid()));
create policy revision_read_own on public.design_revision_index for select to authenticated using (
  exists(select 1 from public.projects p where p.id=project_id and p.owner_user_id=(select auth.uid()))
);

create function public.cutplan_immutable_ready_revision() returns trigger language plpgsql set search_path='' as $$
begin
  if old.state='ready' then raise exception 'immutable_revision'; end if;
  return new;
end; $$;
create trigger immutable_ready_revision before update or delete on public.design_revision_index
  for each row execute function public.cutplan_immutable_ready_revision();
revoke all on function public.cutplan_immutable_ready_revision() from public,anon,authenticated;

-- Only the authenticated application server can reserve/finalize writes. Browser JWTs cannot
-- mark Mongo content ready or mutate ownership/version by calling these functions directly.
create function public.cutplan_begin_project_save(
  p_owner uuid,p_operation uuid,p_project text,p_source uuid,p_expected integer,
  p_request_hash text,p_snapshot_hash text,p_payload jsonb
) returns jsonb language plpgsql security definer set search_path='' as $$
declare pr public.projects; op public.project_save_operations; rid uuid;
begin
  if p_expected is null or p_expected<0 or p_project !~ '^[0-9a-f]{24}$'
     or p_request_hash !~ '^[0-9a-f]{64}$' or p_snapshot_hash !~ '^[0-9a-f]{64}$'
     or p_payload is null or jsonb_typeof(p_payload)<>'object' or pg_column_size(p_payload)>8192
     or (select array_agg(key order by key) from jsonb_object_keys(p_payload) key)
        <> array['furnitureType','name','schemaVersion','stage']
     or p_payload->>'schemaVersion'<>'1' or p_payload->>'stage'<>'project-shell'
     or coalesce(p_payload->>'furnitureType','') not in ('cabinet','shoe_rack','bookshelf','table')
     or char_length(btrim(coalesce(p_payload->>'name',''))) not between 1 and 120
     or coalesce(p_payload->>'name','') ~ '[[:cntrl:]]'
     then raise exception 'invalid_save'; end if;
  -- Serializes duplicate operation requests before the project row exists.
  perform pg_advisory_xact_lock(hashtextextended(p_operation::text,0));
  select * into op from public.project_save_operations where id=p_operation;
  if found then
    if op.owner_user_id<>p_owner or op.request_hash<>p_request_hash then raise exception 'operation_conflict'; end if;
    return to_jsonb(op);
  end if;
  if p_expected=0 then
    insert into public.projects(id,owner_user_id,source_draft_id,name,furniture_type)
    values(p_project,p_owner,p_source,p_payload->>'name',p_payload->>'furnitureType') on conflict do nothing;
  end if;
  select * into pr from public.projects where id=p_project for update;
  if not found or pr.owner_user_id<>p_owner or pr.source_draft_id<>p_source or pr.deleted_at is not null then raise exception 'project_missing'; end if;
  if p_expected=0 and pr.version>0 then return jsonb_build_object('already_claimed',true,'project_id',pr.id); end if;
  if pr.pending_operation_id is not null then raise exception 'save_pending'; end if;
  if pr.version<>p_expected then raise exception 'version_conflict'; end if;
  if pr.furniture_type<>p_payload->>'furnitureType' then raise exception 'invalid_save'; end if;
  rid:=gen_random_uuid();
  insert into public.design_revision_index(id,project_id,revision_number,snapshot_hash,created_by)
  values(rid,pr.id,pr.version+1,p_snapshot_hash,p_owner);
  insert into public.project_save_operations(id,owner_user_id,project_id,revision_id,expected_version,request_hash,snapshot_hash,payload)
  values(p_operation,p_owner,pr.id,rid,p_expected,p_request_hash,p_snapshot_hash,p_payload) returning * into op;
  update public.projects set pending_operation_id=p_operation,sync_status='pending' where id=pr.id;
  return to_jsonb(op);
end; $$;

create function public.cutplan_finish_project_save(p_owner uuid,p_operation uuid,p_snapshot_hash text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare pr public.projects; op public.project_save_operations;
begin
  select * into op from public.project_save_operations where id=p_operation for update;
  if not found or op.owner_user_id<>p_owner or op.snapshot_hash<>p_snapshot_hash then raise exception 'operation_missing'; end if;
  select * into pr from public.projects where id=op.project_id for update;
  if pr.owner_user_id<>p_owner then raise exception 'project_missing'; end if;
  if op.state='ready' then return to_jsonb(pr); end if;
  if pr.pending_operation_id is distinct from op.id or pr.version<>op.expected_version then raise exception 'version_conflict'; end if;
  update public.design_revision_index set state='ready' where id=op.revision_id;
  update public.projects set name=op.payload->>'name',version=op.expected_version+1,
    current_revision_id=op.revision_id,sync_status='ready',pending_operation_id=null,updated_at=now()
    where id=pr.id returning * into pr;
  update public.project_save_operations set state='ready',payload=null,completed_at=now() where id=op.id;
  return to_jsonb(pr);
end; $$;

revoke all on function public.cutplan_begin_project_save(uuid,uuid,text,uuid,integer,text,text,jsonb) from public,anon,authenticated;
revoke all on function public.cutplan_finish_project_save(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.cutplan_begin_project_save(uuid,uuid,text,uuid,integer,text,text,jsonb) to service_role;
grant execute on function public.cutplan_finish_project_save(uuid,uuid,text) to service_role;
commit;

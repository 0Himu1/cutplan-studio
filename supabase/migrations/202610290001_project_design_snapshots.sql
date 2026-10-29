begin;

-- Keep the established JavaScript hash contract, not PostgreSQL's JSON formatting.
create function public.cutplan_valid_snapshot_content(p jsonb,c text,h text) returns boolean
language plpgsql immutable set search_path='' as $$
begin
 return coalesce(p is not null and c is not null and h ~ '^[0-9a-f]{64}$'
   and octet_length(c)<=131072 and pg_column_size(p)<=131072
   and c::jsonb=p and public.cutplan_valid_project_snapshot(p)
   and encode(sha256(convert_to(c,'UTF8')),'hex')=h,false);
exception when others then return false;
end; $$;
revoke all on function public.cutplan_valid_snapshot_content(jsonb,text,text) from public,anon,authenticated;

create table public.project_design_snapshots (
 revision_id uuid primary key,
 project_id text not null,
 snapshot jsonb not null,
 canonical_snapshot text not null,
 snapshot_hash text not null,
 created_at timestamptz not null,
 foreign key(project_id,revision_id) references public.design_revision_index(project_id,id),
 check(public.cutplan_valid_snapshot_content(snapshot,canonical_snapshot,snapshot_hash))
);
create index project_design_snapshots_project on public.project_design_snapshots(project_id,revision_id);
alter table public.project_design_snapshots enable row level security;
revoke all on public.project_design_snapshots from public,anon,authenticated,service_role;
grant select on public.project_design_snapshots to service_role;

create function public.cutplan_snapshot_insert_guard() returns trigger
language plpgsql security definer set search_path='' as $$
declare idx public.design_revision_index; pr public.projects;
begin
 select * into idx from public.design_revision_index where id=new.revision_id and project_id=new.project_id;
 if not found then raise exception 'snapshot_index_missing'; end if;
 select * into pr from public.projects where id=new.project_id;
 if idx.created_by<>pr.owner_user_id or idx.snapshot_hash<>new.snapshot_hash
    or idx.created_at<>new.created_at or idx.schema_version<>(new.snapshot->>'schemaVersion')::integer
    or idx.engine_version<>coalesce(new.snapshot->>'engineVersion','project-shell-v1')
    or pr.furniture_type<>new.snapshot->>'furnitureType' then raise exception 'snapshot_metadata_mismatch'; end if;
 return new;
end; $$;
create trigger snapshot_insert_guard before insert on public.project_design_snapshots
 for each row execute function public.cutplan_snapshot_insert_guard();
create function public.cutplan_snapshot_immutable() returns trigger
language plpgsql set search_path='' as $$
begin raise exception 'immutable_snapshot'; end; $$;
create trigger immutable_snapshot before update or delete on public.project_design_snapshots
 for each row execute function public.cutplan_snapshot_immutable();
revoke all on function public.cutplan_snapshot_insert_guard(),public.cutplan_snapshot_immutable() from public,anon,authenticated;

-- Controlled import also serves as the private insert primitive inside atomic RPCs.
create function public.cutplan_backfill_project_snapshot(
 p_owner uuid,p_project text,p_revision uuid,p_snapshot jsonb,p_canonical text,p_hash text,p_created timestamptz
) returns void language plpgsql security definer set search_path='' as $$
declare idx public.design_revision_index; existing public.project_design_snapshots;
begin
 if p_owner is null or p_project is null or p_revision is null or p_created is null
    or not public.cutplan_valid_snapshot_content(p_snapshot,p_canonical,p_hash) then raise exception 'invalid_snapshot'; end if;
 select i.* into idx from public.design_revision_index i join public.projects pr on pr.id=i.project_id
  where i.id=p_revision and i.project_id=p_project and pr.owner_user_id=p_owner and i.created_by=p_owner;
 if not found then raise exception 'project_missing'; end if;
 -- BSON Date has millisecond precision; keep SQL's original microseconds in the destination.
 if idx.snapshot_hash<>p_hash or date_trunc('milliseconds',idx.created_at)<>date_trunc('milliseconds',p_created) then raise exception 'snapshot_metadata_mismatch'; end if;
 perform pg_advisory_xact_lock(hashtextextended('snapshot:'||p_revision::text,0));
 select * into existing from public.project_design_snapshots where revision_id=p_revision;
 if found then
  if existing.project_id<>p_project or existing.snapshot_hash<>p_hash or existing.snapshot<>p_snapshot
    or existing.canonical_snapshot<>p_canonical or existing.created_at<>idx.created_at then raise exception 'snapshot_conflict'; end if;
  return;
 end if;
 insert into public.project_design_snapshots values(p_revision,p_project,p_snapshot,p_canonical,p_hash,idx.created_at);
end; $$;
revoke all on function public.cutplan_backfill_project_snapshot(uuid,text,uuid,jsonb,text,text,timestamptz) from public,anon,authenticated;
grant execute on function public.cutplan_backfill_project_snapshot(uuid,text,uuid,jsonb,text,text,timestamptz) to service_role;

-- An explicit deployment marker: new application code stays in maintenance until finalization.
create function public.cutplan_project_storage_ready() returns boolean
language sql stable security definer set search_path='' as $$select false$$;
revoke all on function public.cutplan_project_storage_ready() from public,anon,authenticated;
grant execute on function public.cutplan_project_storage_ready() to service_role;
commit;

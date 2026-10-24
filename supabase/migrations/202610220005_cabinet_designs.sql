begin;

-- Extends the existing discriminated snapshot envelope. Existing ready revisions stay untouched.
create function public.cutplan_valid_project_snapshot(p jsonb) returns boolean
language plpgsql immutable set search_path='' as $$
declare c jsonb; k text;
begin
  if p is null or jsonb_typeof(p)<>'object' or p->'schemaVersion' is distinct from '1'::jsonb
    or jsonb_typeof(p->'name') is distinct from 'string' or char_length(btrim(p->>'name')) not between 1 and 120
    or p->>'name' ~ '[[:cntrl:]]' then return false; end if;
  if p->>'stage'='project-shell' then
    return (select array_agg(key order by key) from jsonb_object_keys(p) key)=array['furnitureType','name','schemaVersion','stage']
      and coalesce(p->>'furnitureType','') in ('cabinet','shoe_rack','bookshelf','table');
  end if;
  if p->>'stage' is distinct from 'cabinet-design' or p->>'furnitureType' is distinct from 'cabinet'
    or p->>'engineVersion' is distinct from 'cabinet-review-1.0.0'
    or p->>'templateKey' is distinct from 'cabinet-between-sides-inset-doors-v1'
    or (select array_agg(key order by key) from jsonb_object_keys(p) key)
      <> array['cabinet','engineVersion','furnitureType','name','schemaVersion','stage','templateKey'] then return false; end if;
  c:=p->'cabinet';
  if c is null or jsonb_typeof(c)<>'object' then return false; end if;
  if (select array_agg(key order by key) from jsonb_object_keys(c) key) <> array[
    'backPosition','backThicknessMm','bodyThicknessMm','depthMm','doorCount','doorGapMm','doorThicknessMm','grainAxis',
    'heightMm','plinthSetbackMm','shelfCount','shelfSideClearanceMm','skirtingHeightMm','stockHeightMm','stockMarginMm','stockWidthMm','widthMm'] then return false; end if;
  foreach k in array array['backThicknessMm','bodyThicknessMm','depthMm','doorThicknessMm','heightMm','stockHeightMm','stockWidthMm','widthMm'] loop
    if jsonb_typeof(c->k) is distinct from 'number' then return false; end if;
    if (c->>k)::numeric<=0 or (c->>k)::numeric>100000 then return false; end if;
  end loop;
  foreach k in array array['doorCount','doorGapMm','plinthSetbackMm','shelfCount','shelfSideClearanceMm','skirtingHeightMm','stockMarginMm'] loop
    if jsonb_typeof(c->k) is distinct from 'number' then return false; end if;
    if (c->>k)::numeric<0 or (c->>k)::numeric>100000 then return false; end if;
  end loop;
  return coalesce(c->>'backPosition','') in ('inset','outside') and coalesce(c->>'grainAxis','') in ('none','width','height')
    and (c->>'shelfCount')::numeric between 0 and 20 and mod((c->>'shelfCount')::numeric,1)=0
    and (c->>'doorCount')::numeric between 0 and 2 and mod((c->>'doorCount')::numeric,1)=0;
end; $$;
revoke all on function public.cutplan_valid_project_snapshot(jsonb) from public,anon,authenticated;
grant execute on function public.cutplan_valid_project_snapshot(jsonb) to service_role;

create or replace function public.cutplan_begin_project_save(
  p_owner uuid,p_operation uuid,p_project text,p_source uuid,p_expected integer,
  p_request_hash text,p_snapshot_hash text,p_payload jsonb
) returns jsonb language plpgsql security definer set search_path='' as $$
declare pr public.projects; op public.project_save_operations; rid uuid;
begin
  if p_expected is null or p_expected<0 or p_project !~ '^[0-9a-f]{24}$'
     or p_request_hash !~ '^[0-9a-f]{64}$' or p_snapshot_hash !~ '^[0-9a-f]{64}$'
     or p_payload is null or jsonb_typeof(p_payload)<>'object' or pg_column_size(p_payload)>8192
     or not public.cutplan_valid_project_snapshot(p_payload)
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
  insert into public.design_revision_index(id,project_id,revision_number,snapshot_hash,created_by,engine_version)
  values(rid,pr.id,pr.version+1,p_snapshot_hash,p_owner,case when p_payload->>'stage'='cabinet-design' then p_payload->>'engineVersion' else 'project-shell-v1' end);
  insert into public.project_save_operations(id,owner_user_id,project_id,revision_id,expected_version,request_hash,snapshot_hash,payload)
  values(p_operation,p_owner,pr.id,rid,p_expected,p_request_hash,p_snapshot_hash,p_payload) returning * into op;
  update public.projects set pending_operation_id=p_operation,sync_status='pending' where id=pr.id;
  return to_jsonb(op);
end; $$;


commit;


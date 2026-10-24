begin;

-- Extend only the cabinet envelope. Existing revisions and owner policies remain untouched.
create function public.cutplan_valid_compartments(p jsonb, depth integer default 0) returns boolean
language plpgsql immutable set search_path='' as $$
declare c jsonb; s jsonb; d jsonb; k text;
begin
 if depth>3 or jsonb_typeof(p) is distinct from 'array' then return false; end if;
 if jsonb_array_length(p) not between 1 and 6 then return false; end if;
 if (select count(distinct v->>'id') from jsonb_array_elements(p) v)<>jsonb_array_length(p) then return false; end if;
 for c in select value from jsonb_array_elements(p) loop
  if jsonb_typeof(c) is distinct from 'object' then return false; end if;
  if (select array_agg(key order by key) from jsonb_object_keys(c) key)<>array['doorCount','id','sections','widthMm'] then return false; end if;
  if jsonb_typeof(c->'id') is distinct from 'string' or c->>'id' !~ '^[a-zA-Z0-9_-]{1,32}$' then return false; end if;
  if jsonb_typeof(c->'widthMm') is distinct from 'number' or jsonb_typeof(c->'doorCount') is distinct from 'number' then return false; end if;
  if (c->>'widthMm')::numeric not between 0 and 100000 or (c->>'doorCount')::numeric not between 0 and 2 or mod((c->>'doorCount')::numeric,1)<>0 then return false; end if;
  if jsonb_typeof(c->'sections') is distinct from 'array' then return false; end if;
  if jsonb_array_length(c->'sections') not between 1 and 8 or (select count(distinct v->>'id') from jsonb_array_elements(c->'sections') v)<>jsonb_array_length(c->'sections') then return false; end if;
  for s in select value from jsonb_array_elements(c->'sections') loop
   if jsonb_typeof(s) is distinct from 'object' then return false; end if;
   if (select array_agg(key order by key) from jsonb_object_keys(s) key)<>array['children','drawers','external','heightMm','id','rodOffsetMm','shelfCount','shelfMode','slideClearanceMm','type'] then return false; end if;
   if jsonb_typeof(s->'id') is distinct from 'string' or s->>'id' !~ '^[a-zA-Z0-9_-]{1,32}$' or coalesce(s->>'type','') not in ('open','shelf','hanging','drawer','divider') or coalesce(s->>'shelfMode','') not in ('fixed','adjustable') or jsonb_typeof(s->'external') is distinct from 'boolean' then return false; end if;
   foreach k in array array['heightMm','rodOffsetMm','shelfCount','slideClearanceMm'] loop
    if jsonb_typeof(s->k) is distinct from 'number' then return false; end if;
    if (s->>k)::numeric not between 0 and 100000 then return false; end if;
   end loop;
   if (s->>'shelfCount')::numeric>20 or mod((s->>'shelfCount')::numeric,1)<>0 or (s->>'slideClearanceMm')::numeric>30 then return false; end if;
   if jsonb_typeof(s->'drawers') is distinct from 'array' or jsonb_typeof(s->'children') is distinct from 'array' then return false; end if;
   if jsonb_array_length(s->'drawers')>6 or (s->>'type'='drawer' and jsonb_array_length(s->'drawers')=0) or (select count(distinct v->>'id') from jsonb_array_elements(s->'drawers') v)<>jsonb_array_length(s->'drawers') then return false; end if;
   for d in select value from jsonb_array_elements(s->'drawers') loop
    if jsonb_typeof(d) is distinct from 'object' then return false; end if;
    if (select array_agg(key order by key) from jsonb_object_keys(d) key)<>array['depthMm','heightMm','id'] or jsonb_typeof(d->'id') is distinct from 'string' or d->>'id' !~ '^[a-zA-Z0-9_-]{1,32}$' then return false; end if;
    if jsonb_typeof(d->'heightMm') is distinct from 'number' or jsonb_typeof(d->'depthMm') is distinct from 'number' then return false; end if;
    if (d->>'heightMm')::numeric not between 50 and 100000 or (d->>'depthMm')::numeric not between 0 and 100000 then return false; end if;
   end loop;
   if s->>'type'='divider' then
    if not public.cutplan_valid_compartments(s->'children',depth+1) then return false; end if;
   elsif jsonb_array_length(s->'children')<>0 then return false;
   end if;
  end loop;
 end loop;
 return true;
end; $$;
revoke all on function public.cutplan_valid_compartments(jsonb,integer) from public,anon,authenticated;
grant execute on function public.cutplan_valid_compartments(jsonb,integer) to service_role;

alter function public.cutplan_valid_panel_overrides(jsonb) rename to cutplan_valid_panel_overrides_v13;
create function public.cutplan_valid_panel_overrides(p jsonb) returns boolean
language plpgsql immutable set search_path='' as $$
declare pair record;
begin
 if jsonb_typeof(p) is distinct from 'object' then return false; end if;
 if (select count(*) from jsonb_object_keys(p))>256 then return false; end if;
 for pair in select * from jsonb_each(p) loop
  if pair.key ~ '^cabinet/layout/([a-zA-Z0-9_-]{1,32}/){1,12}(partition|separator|shelf-([1-9]|1[0-9]|20)|door-[12]|bottom|left|right|back|front|face)$' then
   if not public.cutplan_valid_panel_overrides_v13(jsonb_build_object('cabinet/shelf-1',pair.value)) then return false; end if;
  elsif not public.cutplan_valid_panel_overrides_v13(jsonb_build_object(pair.key,pair.value)) then return false;
  end if;
 end loop;
 return true;
end; $$;
revoke all on function public.cutplan_valid_panel_overrides(jsonb) from public,anon,authenticated;
grant execute on function public.cutplan_valid_panel_overrides(jsonb) to service_role;

alter function public.cutplan_valid_project_snapshot(jsonb) rename to cutplan_valid_project_snapshot_v13;
create function public.cutplan_valid_project_snapshot(p jsonb) returns boolean
language plpgsql immutable set search_path='' as $$
declare c jsonb; core jsonb;
begin
 if p->>'stage' is distinct from 'cabinet-design' then return public.cutplan_valid_project_snapshot_v13(p); end if;
 c:=p->'cabinet';
 if jsonb_typeof(c) is distinct from 'object' or pg_column_size(p)>131072 then return false; end if;
 core:=jsonb_set(p,'{cabinet}',c-array['doorPosition','compartmentMode','compartments']);
 if not public.cutplan_valid_project_snapshot_v13(core) then return false; end if;
 if c ? 'doorPosition' and coalesce(c->>'doorPosition','') not in ('inset','overlay') then return false; end if;
 if c ? 'compartmentMode' and coalesce(c->>'compartmentMode','') not in ('auto','manual') then return false; end if;
 if c ? 'compartments' then
  if not (c ? 'compartmentMode') or not public.cutplan_valid_compartments(c->'compartments') then return false; end if;
 elsif c->>'compartmentMode'='manual' then return false;
 end if;
 return true;
end; $$;
revoke all on function public.cutplan_valid_project_snapshot(jsonb) from public,anon,authenticated;
grant execute on function public.cutplan_valid_project_snapshot(jsonb) to service_role;

-- Keep the existing transactional save, revision, ownership and idempotency checks.

create or replace function public.cutplan_begin_project_save(
  p_owner uuid,p_operation uuid,p_project text,p_source uuid,p_expected integer,
  p_request_hash text,p_snapshot_hash text,p_payload jsonb
) returns jsonb language plpgsql security definer set search_path='' as $$
declare pr public.projects; op public.project_save_operations; rid uuid;
begin
  if p_expected is null or p_expected<0 or p_project !~ '^[0-9a-f]{24}$'
     or p_request_hash !~ '^[0-9a-f]{64}$' or p_snapshot_hash !~ '^[0-9a-f]{64}$'
     or p_payload is null or jsonb_typeof(p_payload)<>'object' or pg_column_size(p_payload)>131072
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
  values(rid,pr.id,pr.version+1,p_snapshot_hash,p_owner,case when p_payload->>'stage' in ('cabinet-design','furniture-design') then p_payload->>'engineVersion' else 'project-shell-v1' end);
  insert into public.project_save_operations(id,owner_user_id,project_id,revision_id,expected_version,request_hash,snapshot_hash,payload)
  values(p_operation,p_owner,pr.id,rid,p_expected,p_request_hash,p_snapshot_hash,p_payload) returning * into op;
  update public.projects set pending_operation_id=p_operation,sync_status='pending' where id=pr.id;
  return to_jsonb(op);
end; $$;

commit;

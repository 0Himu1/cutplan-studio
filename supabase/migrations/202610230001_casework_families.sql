begin;
alter function public.cutplan_valid_project_snapshot(jsonb) rename to cutplan_valid_project_snapshot_v9;
create function public.cutplan_valid_project_snapshot(p jsonb) returns boolean
language plpgsql immutable set search_path='' as $$
declare c jsonb; core jsonb; overrides jsonb; pair record; family text; k text;
begin
 if p->>'stage' is distinct from 'furniture-design' then return public.cutplan_valid_project_snapshot_v9(p); end if;
 if (select array_agg(key order by key) from jsonb_object_keys(p) key)<>array['configuration','engineVersion','furnitureType','name','schemaVersion','stage','templateKey'] or p->>'engineVersion' is distinct from 'casework-review-1.0.0' then return false; end if;
 family:=p->>'furnitureType'; c:=p->'configuration';
 if family not in ('shoe_rack','bookshelf') or family is null or c is null or jsonb_typeof(c)<>'object' or c->>'family' is distinct from family then return false; end if;
 if p->>'templateKey' is distinct from (case when family='shoe_rack' then 'shoe-rack-between-sides-v1' else 'bookshelf-open-casework-v1' end) then return false; end if;
 if family='shoe_rack' and c ?| array['mounting','shelfMode','wallSubstrate','fixingNotes'] then return false; end if;
 if family='bookshelf' then
  if coalesce(c->>'mounting','') not in ('floor','wall') or coalesce(c->>'shelfMode','') not in ('fixed','adjustable') or coalesce(c->>'wallSubstrate','') not in ('unknown','masonry','concrete','stud') or jsonb_typeof(c->'fixingNotes') is distinct from 'string' or char_length(c->>'fixingNotes')>240 or c->>'fixingNotes' ~ '[[:cntrl:]]' or c->'doorCount' is distinct from '0'::jsonb then return false; end if;
  if c->'shelfSideClearanceMm' is distinct from (case when c->>'shelfMode'='fixed' then '0'::jsonb else '2'::jsonb end) then return false; end if;
  if jsonb_typeof(c->'bodyThicknessMm') is distinct from 'number' then return false; end if;
  if (c->>'bodyThicknessMm')::numeric<18 then return false; end if;
  if c->>'mounting'='wall' then
   foreach k in array array['widthMm','heightMm','depthMm'] loop if jsonb_typeof(c->k) is distinct from 'number' then return false; end if; end loop;
   if (c->>'widthMm')::numeric>900 or (c->>'heightMm')::numeric>1200 or (c->>'depthMm')::numeric>350 or c->'skirtingHeightMm' is distinct from '0'::jsonb or c->>'wallSubstrate'='unknown' or char_length(btrim(c->>'fixingNotes'))<12 then return false; end if;
  end if;
 end if;
 core:=c-array['family','mounting','shelfMode','wallSubstrate','fixingNotes'];
 if c ? 'panelOverrides' then
  if jsonb_typeof(c->'panelOverrides') is distinct from 'object' then return false; end if;
  overrides:='{}'::jsonb;
  for pair in select * from jsonb_each(c->'panelOverrides') loop
   if left(pair.key,char_length(family)+1)<>family||'/' then return false; end if;
   overrides:=overrides||jsonb_build_object('cabinet/'||substring(pair.key from char_length(family)+2),pair.value);
  end loop;
  core:=jsonb_set(core,'{panelOverrides}',overrides);
 end if;
 return public.cutplan_valid_project_snapshot_v9(jsonb_build_object('schemaVersion',p->'schemaVersion','name',p->'name','furnitureType','cabinet','stage','cabinet-design','engineVersion','cabinet-review-1.0.0','templateKey','cabinet-between-sides-inset-doors-v1','cabinet',core));
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
     or p_payload is null or jsonb_typeof(p_payload)<>'object' or pg_column_size(p_payload)>32768
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

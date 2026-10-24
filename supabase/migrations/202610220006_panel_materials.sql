begin;
alter table public.finish_skus add column texture_url text check(texture_url is null or (char_length(texture_url)<=2048 and texture_url ~ '^https://[^[:space:]]+$'));
create function public.cutplan_valid_panel_overrides(p jsonb) returns boolean language plpgsql immutable set search_path='' as $$
declare pair record; k text; e record;
begin
 if jsonb_typeof(p) is distinct from 'object' then return false; end if;
 if (select count(*) from jsonb_object_keys(p))>32 then return false; end if;
 for pair in select * from jsonb_each(p) loop
  if pair.key !~ '^cabinet/(side-left|side-right|top|bottom|back|plinth-front|shelf-([1-9]|1[0-9]|20)|door-[12])$' or jsonb_typeof(pair.value)<>'object' then return false; end if;
  for k in select jsonb_object_keys(pair.value) loop
   if k not in ('boardId','thicknessMm','stockWidthMm','stockHeightMm','frontFinishId','backFinishId','edges','grainAxis') then return false; end if;
   if k in ('boardId','frontFinishId','backFinishId') and (jsonb_typeof(pair.value->k)<>'string' or pair.value->>k !~* '^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$') then return false; end if;
   if k in ('thicknessMm','stockWidthMm','stockHeightMm') then
    if jsonb_typeof(pair.value->k)<>'number' then return false; end if;
    if (pair.value->>k)::numeric<=0 or (pair.value->>k)::numeric>100000 then return false; end if;
   end if;
  end loop;
  if pair.value ? 'boardId' then
   if not (pair.value ?& array['thicknessMm','stockWidthMm','stockHeightMm']) then return false; end if;
  elsif pair.value ?| array['thicknessMm','stockWidthMm','stockHeightMm','frontFinishId','backFinishId'] then return false;
  end if;
  if pair.value ? 'grainAxis' and coalesce(pair.value->>'grainAxis','') not in ('none','width','height') then return false; end if;
  if pair.value ? 'edges' then
   if jsonb_typeof(pair.value->'edges')<>'object' then return false; end if;
   for e in select * from jsonb_each(pair.value->'edges') loop
    if e.key not in ('top','bottom','left','right') or jsonb_typeof(e.value)<>'string' or e.value#>>'{}' !~* '^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$' then return false; end if;
   end loop;
  end if;
 end loop;
 return true;
end; $$;
revoke all on function public.cutplan_valid_panel_overrides(jsonb) from public,anon,authenticated;
grant execute on function public.cutplan_valid_panel_overrides(jsonb) to service_role;
create or replace function public.cutplan_valid_project_snapshot(p jsonb) returns boolean
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
  if (select array_agg(key order by key) from jsonb_object_keys(c-'panelOverrides') key) <> array[
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
  if c ? 'panelOverrides' and not public.cutplan_valid_panel_overrides(c->'panelOverrides') then return false; end if;
  return coalesce(c->>'backPosition','') in ('inset','outside') and coalesce(c->>'grainAxis','') in ('none','width','height')
    and (c->>'shelfCount')::numeric between 0 and 20 and mod((c->>'shelfCount')::numeric,1)=0
    and (c->>'doorCount')::numeric between 0 and 2 and mod((c->>'doorCount')::numeric,1)=0;
end; $$;

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
  values(rid,pr.id,pr.version+1,p_snapshot_hash,p_owner,case when p_payload->>'stage'='cabinet-design' then p_payload->>'engineVersion' else 'project-shell-v1' end);
  insert into public.project_save_operations(id,owner_user_id,project_id,revision_id,expected_version,request_hash,snapshot_hash,payload)
  values(p_operation,p_owner,pr.id,rid,p_expected,p_request_hash,p_snapshot_hash,p_payload) returning * into op;
  update public.projects set pending_operation_id=p_operation,sync_status='pending' where id=pr.id;
  return to_jsonb(op);
end; $$;



create or replace function public.cutplan_catalog_change(p jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare item public.catalog_items; ident uuid; act text:=p->>'action'; stamp timestamptz:=clock_timestamp(); details jsonb:=p->'details';
begin
 if not public.cutplan_is_active_staff() then raise exception 'catalog_forbidden'; end if;
 if act='create' then
  insert into public.catalog_items(kind,code,name,created_by) values(p->>'kind',p->>'code',btrim(p->>'name'),auth.uid()) returning * into item;
  if item.kind='board' then insert into public.board_skus values(item.id,(details->>'thickness_mm')::numeric,(details->>'sheet_width_mm')::numeric,(details->>'sheet_height_mm')::numeric,details->>'grain_direction');
  elsif item.kind='finish' then insert into public.finish_skus(item_id,surface,color_code,texture_url) values(item.id,details->>'surface',nullif(details->>'color_code',''),nullif(details->>'texture_url',''));
  else insert into public.edging_skus values(item.id,details->>'material',(details->>'thickness_mm')::numeric,(details->>'width_mm')::numeric); end if;
 else
  select * into item from public.catalog_items where id=(p->>'id')::uuid for update;
  if not found then raise exception 'catalog_missing'; end if;
  if item.version<>(p->>'version')::integer then raise exception 'catalog_conflict'; end if;
  if item.retired_at is not null then raise exception 'catalog_retired'; end if;
  if act='edit' then
   update public.catalog_items set name=btrim(p->>'name'),is_sellable=false where id=item.id;
   if item.kind='board' then update public.board_skus set thickness_mm=(details->>'thickness_mm')::numeric,sheet_width_mm=(details->>'sheet_width_mm')::numeric,sheet_height_mm=(details->>'sheet_height_mm')::numeric,grain_direction=details->>'grain_direction' where item_id=item.id;
   elsif item.kind='finish' then update public.finish_skus set surface=details->>'surface',color_code=nullif(details->>'color_code',''),texture_url=nullif(details->>'texture_url','') where item_id=item.id;
   else update public.edging_skus set material=details->>'material',thickness_mm=(details->>'thickness_mm')::numeric,width_mm=(details->>'width_mm')::numeric where item_id=item.id; end if;
  elsif act='price' then
   if coalesce(p->>'amount','') !~ '^[0-9]{1,10}(\.[0-9]{1,2})?$' then raise exception 'catalog_invalid_price'; end if;
   if item.kind='board' and p->>'unit'<>'sheet' then raise exception 'catalog_board_unit'; end if;
   if item.kind='edging' and p->>'unit'<>'meter' then raise exception 'catalog_edging_unit'; end if;
   if exists(select 1 from public.catalog_price_versions where item_id=item.id and effective_from>=stamp) then raise exception 'catalog_future_price'; end if;
   update public.catalog_price_versions set effective_until=stamp where item_id=item.id and effective_until is null;
   insert into public.catalog_price_versions(item_id,price_bdt,unit,effective_from,reason,created_by) values(item.id,(p->>'amount')::numeric,p->>'unit',stamp,btrim(p->>'reason'),auth.uid());
   update public.catalog_items set is_sellable=false where id=item.id;
  elsif act='publish' then
   if coalesce((p->>'reviewed')::boolean,false)=false then raise exception 'catalog_review_required'; end if;
   if not exists(select 1 from public.catalog_price_versions where item_id=item.id and price_bdt>0 and effective_from<=stamp and (effective_until is null or effective_until>stamp) and (item.kind<>'board' or unit='sheet') and (item.kind<>'edging' or unit='meter')) then raise exception 'catalog_price_required'; end if;
   update public.catalog_items set is_sellable=true where id=item.id;
  elsif act='unpublish' then update public.catalog_items set is_sellable=false where id=item.id;
  elsif act='retire' then update public.catalog_items set is_sellable=false,retired_at=stamp where id=item.id;
  elsif act='compatibility' then
   if item.kind<>'board' or not exists(select 1 from public.catalog_items where id=(p->>'finishId')::uuid and kind='finish' and retired_at is null) then raise exception 'catalog_compatibility'; end if;
   if (p->>'enabled')::boolean then insert into public.board_finish_compatibility values(item.id,(p->>'finishId')::uuid,auth.uid(),stamp) on conflict do nothing;
   else delete from public.board_finish_compatibility where board_item_id=item.id and finish_item_id=(p->>'finishId')::uuid; end if;
  else raise exception 'catalog_invalid_action'; end if;
  update public.catalog_items set version=version+1,updated_at=stamp where id=item.id;
 end if;
 insert into public.catalog_events(item_id,actor,action) values(item.id,auth.uid(),act);
 return item.id;
end; $$;

commit;

begin;
-- Optional board appearance; existing colors, prices, references and permissions stay intact.
alter table public.board_skus add column color_code text check(color_code is null or color_code ~ '^#[0-9A-Fa-f]{6}$');

create or replace function public.cutplan_catalog_change(p jsonb) returns uuid language plpgsql security definer set search_path='' as $$

declare item public.catalog_items; ident uuid; act text:=p->>'action'; stamp timestamptz:=clock_timestamp(); details jsonb:=p->'details'; category text; allowed numeric[];

begin

 if not public.cutplan_is_active_staff() then raise exception 'catalog_forbidden'; end if;

 if act in ('create','edit') then

  if act='edit' then

   select * into item from public.catalog_items where id=(p->>'id')::uuid for update;

   if not found then raise exception 'catalog_missing'; end if;

   category:=coalesce(nullif(p->>'category_code',''),item.category_code);

   if item.category_code is not null and category is distinct from item.category_code then raise exception 'catalog_category_immutable'; end if;

  else category:=nullif(p->>'category_code',''); end if;

  if category is not null then

   if coalesce(item.kind,p->>'kind')<>'board' then raise exception 'catalog_board_category'; end if;

   allowed:=case category

    when 'PLAIN-MDF' then array[3,6,9,12,15,18,25]

    when 'PLAIN-WOOD-PARTICLE' then array[6,9,12,15,16,18,25]

    when 'MR-PLYWOOD' then array[6,12,15,18,20,25]

    when 'GORJON-PLYWOOD' then array[3,4,6,10,12,15,16,18,25]

    when 'MARINE-PLYWOOD' then array[6,12,16,18,19,25]

    when 'VENEERED-BOARD' then array[12,15,18,25]

    else null end;

   if allowed is null or not coalesce((details->>'thickness_mm')::numeric=any(allowed),false) then raise exception 'catalog_category_thickness'; end if;

   perform pg_advisory_xact_lock(hashtextextended('board-category:'||category,0));

   if exists(select 1 from public.catalog_items c join public.board_skus b on b.item_id=c.id

     where c.category_code=category and c.retired_at is null and c.id is distinct from item.id

     and b.thickness_mm=(details->>'thickness_mm')::numeric) then raise exception 'catalog_variant_exists'; end if;

  end if;

 end if;

 if act='create' then

  insert into public.catalog_items(kind,code,name,category_code,created_by) values(p->>'kind',p->>'code',btrim(p->>'name'),category,auth.uid()) returning * into item;

  if item.kind='board' then insert into public.board_skus(item_id,thickness_mm,sheet_width_mm,sheet_height_mm,grain_direction,color_code) values(item.id,(details->>'thickness_mm')::numeric,(details->>'sheet_width_mm')::numeric,(details->>'sheet_height_mm')::numeric,details->>'grain_direction',nullif(details->>'color_code',''));

  elsif item.kind='finish' then insert into public.finish_skus(item_id,surface,color_code,texture_url) values(item.id,details->>'surface',nullif(details->>'color_code',''),nullif(details->>'texture_url',''));

  else insert into public.edging_skus values(item.id,details->>'material',(details->>'thickness_mm')::numeric,(details->>'width_mm')::numeric); end if;

 else

  select * into item from public.catalog_items where id=(p->>'id')::uuid for update;

  if not found then raise exception 'catalog_missing'; end if;

  if item.version<>(p->>'version')::integer then raise exception 'catalog_conflict'; end if;

  if item.retired_at is not null then raise exception 'catalog_retired'; end if;

  if act='edit' then

   update public.catalog_items set name=btrim(p->>'name'),category_code=category,is_sellable=false where id=item.id;

   if item.kind='board' then update public.board_skus set thickness_mm=(details->>'thickness_mm')::numeric,sheet_width_mm=(details->>'sheet_width_mm')::numeric,sheet_height_mm=(details->>'sheet_height_mm')::numeric,grain_direction=details->>'grain_direction',color_code=case when details ? 'color_code' then nullif(details->>'color_code','') else color_code end where item_id=item.id;

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

begin;
alter table public.catalog_items add column version integer not null default 1;
alter table public.board_skus add constraint finite_board_sizes check(thickness_mm<100000 and sheet_width_mm<100000 and sheet_height_mm<100000);
alter table public.edging_skus add constraint finite_edging_sizes check(thickness_mm<100000 and width_mm<100000);
alter table public.catalog_price_versions add constraint finite_catalog_price check(price_bdt<100000000000);
create table public.catalog_events(id uuid primary key default gen_random_uuid(),item_id uuid not null references public.catalog_items(id),actor uuid not null references auth.users(id),action text not null,created_at timestamptz not null default now());
alter table public.catalog_events enable row level security;
revoke all on public.catalog_events from anon,authenticated;
grant select on public.catalog_events to authenticated;
create policy catalog_event_staff on public.catalog_events for select to authenticated using(public.cutplan_is_active_staff());
-- Staff-only mutation boundary. Lock the parent before every operation to serialize prices and edits.
create function public.cutplan_catalog_change(p jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare item public.catalog_items; ident uuid; act text:=p->>'action'; stamp timestamptz:=clock_timestamp(); details jsonb:=p->'details';
begin
 if not public.cutplan_is_active_staff() then raise exception 'catalog_forbidden'; end if;
 if act='create' then
  insert into public.catalog_items(kind,code,name,created_by) values(p->>'kind',p->>'code',btrim(p->>'name'),auth.uid()) returning * into item;
  if item.kind='board' then insert into public.board_skus values(item.id,(details->>'thickness_mm')::numeric,(details->>'sheet_width_mm')::numeric,(details->>'sheet_height_mm')::numeric,details->>'grain_direction');
  elsif item.kind='finish' then insert into public.finish_skus values(item.id,details->>'surface',nullif(details->>'color_code',''));
  else insert into public.edging_skus values(item.id,details->>'material',(details->>'thickness_mm')::numeric,(details->>'width_mm')::numeric); end if;
 else
  select * into item from public.catalog_items where id=(p->>'id')::uuid for update;
  if not found then raise exception 'catalog_missing'; end if;
  if item.version<>(p->>'version')::integer then raise exception 'catalog_conflict'; end if;
  if item.retired_at is not null then raise exception 'catalog_retired'; end if;
  if act='edit' then
   update public.catalog_items set name=btrim(p->>'name'),is_sellable=false where id=item.id;
   if item.kind='board' then update public.board_skus set thickness_mm=(details->>'thickness_mm')::numeric,sheet_width_mm=(details->>'sheet_width_mm')::numeric,sheet_height_mm=(details->>'sheet_height_mm')::numeric,grain_direction=details->>'grain_direction' where item_id=item.id;
   elsif item.kind='finish' then update public.finish_skus set surface=details->>'surface',color_code=nullif(details->>'color_code','') where item_id=item.id;
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
revoke all on function public.cutplan_catalog_change(jsonb) from public,anon;
grant execute on function public.cutplan_catalog_change(jsonb) to authenticated;
create function public.cutplan_preserve_catalog_price() returns trigger language plpgsql set search_path='' as $$
begin
 if tg_op='DELETE' then raise exception 'catalog_price_immutable'; end if;
 if (to_jsonb(new)-'effective_until') is distinct from (to_jsonb(old)-'effective_until') or old.effective_until is not null or new.effective_until is null then raise exception 'catalog_price_immutable'; end if;
 return new;
end; $$;
create trigger preserve_catalog_price before update or delete on public.catalog_price_versions for each row execute function public.cutplan_preserve_catalog_price();
-- Supplier provenance belongs only in the staff workspace.
drop policy catalog_sellable_read on public.catalog_items;
create policy catalog_staff_items on public.catalog_items for select to authenticated using(public.cutplan_is_active_staff());
commit;

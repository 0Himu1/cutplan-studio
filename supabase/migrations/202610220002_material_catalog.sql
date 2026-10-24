begin;

create table public.catalog_items (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('board','finish','edging')),
  code text not null check (code ~ '^[A-Za-z0-9][A-Za-z0-9._-]{1,63}$'),
  name text not null check (char_length(btrim(name)) between 2 and 120 and name !~ '[[:cntrl:]]'),
  is_sellable boolean not null default false,
  retired_at timestamptz,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (kind,code),
  check ((retired_at is null) or is_sellable=false)
);

create table public.board_skus (
  item_id uuid primary key references public.catalog_items(id),
  thickness_mm numeric(8,3) not null check (thickness_mm > 0),
  sheet_width_mm numeric(10,3) not null check (sheet_width_mm > 0),
  sheet_height_mm numeric(10,3) not null check (sheet_height_mm > 0),
  grain_direction text not null check (grain_direction in ('none','width','height'))
);

create table public.finish_skus (
  item_id uuid primary key references public.catalog_items(id),
  surface text not null check (surface in ('laminate','veneer','paint','raw','other')),
  color_code text check (color_code is null or color_code ~ '^#[0-9A-Fa-f]{6}$')
);

create table public.edging_skus (
  item_id uuid primary key references public.catalog_items(id),
  material text not null check (material in ('pvc','acrylic','aluminum','other')),
  thickness_mm numeric(8,3) not null check (thickness_mm > 0),
  width_mm numeric(8,3) not null check (width_mm > 0)
);

create table public.board_finish_compatibility (
  board_item_id uuid not null references public.catalog_items(id),
  finish_item_id uuid not null references public.catalog_items(id),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  primary key (board_item_id,finish_item_id),
  check (board_item_id <> finish_item_id)
);

create table public.catalog_price_versions (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.catalog_items(id),
  price_bdt numeric(14,2) not null check (price_bdt >= 0),
  unit text not null check (unit in ('sheet','square_meter','meter','piece')),
  effective_from timestamptz not null,
  effective_until timestamptz,
  reason text not null check (char_length(btrim(reason)) between 2 and 240 and reason !~ '[[:cntrl:]]'),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  check (effective_until is null or effective_until > effective_from)
);
create unique index catalog_price_start_unique on public.catalog_price_versions(item_id,effective_from);
create index catalog_price_current on public.catalog_price_versions(item_id,effective_from desc);

create function public.cutplan_catalog_price_no_overlap() returns trigger language plpgsql set search_path='' as $$
begin
  if exists (select 1 from public.catalog_price_versions p where p.item_id=new.item_id and p.id is distinct from new.id
    and tstzrange(p.effective_from,coalesce(p.effective_until,'infinity'::timestamptz),'[)') &&
        tstzrange(new.effective_from,coalesce(new.effective_until,'infinity'::timestamptz),'[)')) then
    raise exception 'catalog_price_overlap';
  end if;
  return new;
end; $$;
create trigger catalog_price_no_overlap before insert or update on public.catalog_price_versions for each row execute function public.cutplan_catalog_price_no_overlap();

create function public.cutplan_is_active_staff() returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.staff_memberships where user_id=auth.uid() and role='admin' and is_active=true)
$$;
grant execute on function public.cutplan_is_active_staff() to authenticated;

alter table public.catalog_items enable row level security;
alter table public.board_skus enable row level security;
alter table public.finish_skus enable row level security;
alter table public.edging_skus enable row level security;
alter table public.board_finish_compatibility enable row level security;
alter table public.catalog_price_versions enable row level security;
revoke all on public.catalog_items,public.board_skus,public.finish_skus,public.edging_skus,public.board_finish_compatibility,public.catalog_price_versions from anon,authenticated;
grant select on public.catalog_items,public.board_skus,public.finish_skus,public.edging_skus,public.board_finish_compatibility,public.catalog_price_versions to authenticated;
grant select,insert,update on public.catalog_items,public.board_skus,public.finish_skus,public.edging_skus,public.board_finish_compatibility,public.catalog_price_versions to service_role;
create policy catalog_sellable_read on public.catalog_items for select to authenticated using (is_sellable and retired_at is null or public.cutplan_is_active_staff());
create policy catalog_staff_read on public.board_skus for select to authenticated using (public.cutplan_is_active_staff());
create policy catalog_staff_finish_read on public.finish_skus for select to authenticated using (public.cutplan_is_active_staff());
create policy catalog_staff_edging_read on public.edging_skus for select to authenticated using (public.cutplan_is_active_staff());
create policy catalog_staff_compatibility_read on public.board_finish_compatibility for select to authenticated using (public.cutplan_is_active_staff());
create policy catalog_staff_price_read on public.catalog_price_versions for select to authenticated using (public.cutplan_is_active_staff());
commit;

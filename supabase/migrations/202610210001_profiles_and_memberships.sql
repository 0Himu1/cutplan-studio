-- Phase 3: reviewed source, not applied automatically. No staff membership is seeded.
begin;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 80 and display_name !~ '[[:cntrl:]]'),
  phone text check (phone is null or (phone ~ '^\+?[0-9 ()-]{7,25}$' and regexp_replace(phone, '[^0-9]', '', 'g') ~ '^[0-9]{7,15}$')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.staff_memberships (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin','operator')),
  is_active boolean not null default true,
  granted_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.staff_memberships enable row level security;
revoke all on public.profiles, public.staff_memberships from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (display_name, phone) on public.profiles to authenticated;
grant select on public.staff_memberships to authenticated;

create policy profiles_read_own on public.profiles for select to authenticated
  using ((select auth.uid()) = id);
create policy profiles_update_own on public.profiles for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy membership_read_own on public.staff_memberships for select to authenticated
  using ((select auth.uid()) = user_id);
-- No customer policy or grant permits membership mutation, self-promotion or profile identity changes.

create function public.cutplan_profile_created() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id) values (new.id);
  return new;
end;
$$;
revoke all on function public.cutplan_profile_created() from public, anon, authenticated;
create trigger cutplan_auth_user_created after insert on auth.users
for each row execute function public.cutplan_profile_created();

create function public.cutplan_touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
revoke all on function public.cutplan_touch_updated_at() from public, anon, authenticated;
create trigger cutplan_profile_updated before update on public.profiles
for each row execute function public.cutplan_touch_updated_at();
create trigger cutplan_membership_updated before update on public.staff_memberships
for each row execute function public.cutplan_touch_updated_at();

-- Preserve any existing Auth identities without copying user-controlled roles or contact metadata.
insert into public.profiles(id) select id from auth.users on conflict (id) do nothing;
commit;

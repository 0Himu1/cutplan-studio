begin;
create table public.photo_upload_attempts(id uuid primary key,owner_user_id uuid not null references auth.users(id),created_at timestamptz not null default now());
create index photo_attempts_owner on public.photo_upload_attempts(owner_user_id,created_at);
create table public.private_photos(id uuid primary key,owner_user_id uuid not null references auth.users(id),purpose text not null check(purpose in ('space','reference')),object_key text not null unique,state text not null default 'pending' check(state in ('pending','ready','deleted')),width integer,height integer,sha256 text,purged_at timestamptz,created_at timestamptz not null default now(),expires_at timestamptz not null default now()+interval '24 hours',check(width is null or width between 1 and 2048),check(height is null or height between 1 and 2048),check(state<>'ready' or (width is not null and height is not null and sha256 is not null and sha256 ~ '^[0-9a-f]{64}$')));
alter table public.photo_upload_attempts enable row level security;alter table public.private_photos enable row level security;
revoke all on public.photo_upload_attempts,public.private_photos from public,anon,authenticated;
grant select,delete on public.photo_upload_attempts to service_role;
grant select,insert,update on public.private_photos to service_role;
grant select(id,purpose,state,width,height,created_at,expires_at) on public.private_photos to authenticated;
create policy private_photo_owner on public.private_photos for select to authenticated using(owner_user_id=(select auth.uid()) and expires_at>now() and state='ready');
create function public.cutplan_reserve_photo(p_owner uuid,p_attempt uuid) returns boolean language plpgsql security definer set search_path='' as $$
begin
 perform pg_advisory_xact_lock(hashtextextended(p_owner::text,0));
 if exists(select 1 from public.photo_upload_attempts where id=p_attempt) then return false;end if;
 if (select count(*) from public.photo_upload_attempts where owner_user_id=p_owner and created_at>now()-interval '1 hour')>=10 then return false;end if;
 insert into public.photo_upload_attempts(id,owner_user_id) values(p_attempt,p_owner);return true;
end; $$;
revoke all on function public.cutplan_reserve_photo(uuid,uuid) from public,anon,authenticated;
grant execute on function public.cutplan_reserve_photo(uuid,uuid) to service_role;
do $$begin
 if to_regclass('storage.buckets') is not null then
  execute $q$insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('private-photos','private-photos',false,10485760,array['image/webp']) on conflict(id) do update set public=false,file_size_limit=10485760,allowed_mime_types=array['image/webp']$q$;
 end if;
end; $$;
commit;

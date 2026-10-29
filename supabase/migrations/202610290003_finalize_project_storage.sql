begin;
lock table public.projects,public.design_revision_index,public.project_save_operations,public.project_design_snapshots in access exclusive mode;
do $$
begin
 if exists(select 1 from public.design_revision_index i left join public.project_design_snapshots s on s.revision_id=i.id
   where i.state='ready' and (s.revision_id is null or s.project_id<>i.project_id or s.snapshot_hash<>i.snapshot_hash
     or not public.cutplan_valid_snapshot_content(s.snapshot,s.canonical_snapshot,s.snapshot_hash))) then raise exception 'cutover_missing_snapshot'; end if;
 if exists(select 1 from public.projects p left join public.design_revision_index i on i.id=p.current_revision_id and i.project_id=p.id
   where (p.version>0 and (i.id is null or i.state<>'ready' or i.revision_number<>p.version or i.created_by<>p.owner_user_id))
     or (p.version=0 and p.current_revision_id is not null)) then raise exception 'cutover_invalid_pointer'; end if;
 if exists(select 1 from public.project_save_operations where state='pending')
   or exists(select 1 from public.design_revision_index where state='pending')
   or exists(select 1 from public.projects where sync_status<>'ready' or pending_operation_id is not null) then raise exception 'cutover_pending_save'; end if;
end; $$;
create or replace function public.cutplan_project_storage_ready() returns boolean
language sql stable security definer set search_path='' as $$select true$$;
revoke execute on function public.cutplan_backfill_project_snapshot(uuid,text,uuid,jsonb,text,text,timestamptz) from public,anon,authenticated,service_role;
commit;

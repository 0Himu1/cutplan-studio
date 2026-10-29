-- Read-only hosted permission probe. No customer rows or credentials are returned.
begin;
set local role authenticated;
do $probe$
begin
 begin
  perform revision_id from public.project_design_snapshots limit 1;
  raise exception 'browser_access_unexpected';
 exception when insufficient_privilege then null;
 end;
end;
$probe$;
rollback;
select true as authenticated_snapshot_access_denied;

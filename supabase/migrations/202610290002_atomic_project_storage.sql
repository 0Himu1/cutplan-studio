begin;

-- Freeze legacy writers before reconciling/exporting the final source inventory.
revoke execute on function public.cutplan_begin_project_save(uuid,uuid,text,uuid,integer,text,text,jsonb) from public,anon,authenticated,service_role;
revoke execute on function public.cutplan_finish_project_save(uuid,uuid,text) from public,anon,authenticated,service_role;

create function public.cutplan_save_project(
 p_owner uuid,p_operation uuid,p_project text,p_source uuid,p_expected integer,
 p_request_hash text,p_snapshot_hash text,p_payload jsonb,p_canonical text
) returns jsonb language plpgsql security definer set search_path='' as $$
declare pr public.projects; op public.project_save_operations; rid uuid; stamp timestamptz:=now();
begin
 if not public.cutplan_project_storage_ready() then raise exception 'storage_maintenance'; end if;
 if p_owner is null or p_operation is null or p_source is null or p_expected is null or p_expected<0
    or coalesce(p_project,'') !~ '^[0-9a-f]{24}$' or coalesce(p_request_hash,'') !~ '^[0-9a-f]{64}$'
    or not public.cutplan_valid_snapshot_content(p_payload,p_canonical,p_snapshot_hash) then raise exception 'invalid_save'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_operation::text,0));
 select * into op from public.project_save_operations where id=p_operation;
 if found then
  if op.owner_user_id<>p_owner or op.project_id<>p_project or op.request_hash<>p_request_hash
    or op.snapshot_hash<>p_snapshot_hash or op.expected_version<>p_expected then raise exception 'operation_conflict'; end if;
  select * into pr from public.projects where id=op.project_id and owner_user_id=p_owner and deleted_at is null;
  if not found or pr.source_draft_id<>p_source then raise exception 'project_missing'; end if;
  if op.state<>'ready' then raise exception 'save_pending'; end if;
  if not exists(select 1 from public.project_design_snapshots where revision_id=op.revision_id
    and snapshot_hash=op.snapshot_hash and canonical_snapshot=p_canonical) then raise exception 'snapshot_missing'; end if;
  return jsonb_build_object('project',to_jsonb(pr),'alreadyClaimed',false);
 end if;
 if p_expected=0 then
  insert into public.projects(id,owner_user_id,source_draft_id,name,furniture_type)
   values(p_project,p_owner,p_source,p_payload->>'name',p_payload->>'furnitureType') on conflict do nothing;
 end if;
 select * into pr from public.projects where id=p_project for update;
 if not found or pr.owner_user_id<>p_owner or pr.source_draft_id<>p_source or pr.deleted_at is not null then raise exception 'project_missing'; end if;
 if p_expected=0 and pr.version>0 then return jsonb_build_object('project',to_jsonb(pr),'alreadyClaimed',true); end if;
 if pr.pending_operation_id is not null then raise exception 'save_pending'; end if;
 if pr.version<>p_expected then raise exception 'version_conflict'; end if;
 if pr.furniture_type<>p_payload->>'furnitureType' then raise exception 'invalid_save'; end if;
 rid:=gen_random_uuid();
 insert into public.design_revision_index(id,project_id,revision_number,schema_version,engine_version,snapshot_hash,created_by,created_at)
  values(rid,pr.id,pr.version+1,1,coalesce(p_payload->>'engineVersion','project-shell-v1'),p_snapshot_hash,p_owner,stamp);
 insert into public.project_save_operations(id,owner_user_id,project_id,revision_id,expected_version,request_hash,snapshot_hash,payload,created_at)
  values(p_operation,p_owner,pr.id,rid,p_expected,p_request_hash,p_snapshot_hash,p_payload,stamp);
 perform public.cutplan_backfill_project_snapshot(p_owner,pr.id,rid,p_payload,p_canonical,p_snapshot_hash,stamp);
 update public.design_revision_index set state='ready' where id=rid;
 update public.projects set name=p_payload->>'name',version=pr.version+1,current_revision_id=rid,
  sync_status='ready',pending_operation_id=null,updated_at=stamp where id=pr.id returning * into pr;
 update public.project_save_operations set state='ready',payload=null,completed_at=stamp where id=p_operation;
 return jsonb_build_object('project',to_jsonb(pr),'alreadyClaimed',false);
end; $$;

-- Only for a pre-cutover pending operation. Reuses its exact existing revision and payload.
create function public.cutplan_recover_project_save(p_owner uuid,p_project text,p_operation uuid,p_canonical text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare pr public.projects; op public.project_save_operations;
begin
 if p_owner is null or p_project is null or p_operation is null then raise exception 'operation_missing'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_operation::text,0));
 select * into pr from public.projects where id=p_project and owner_user_id=p_owner and deleted_at is null for update;
 if not found then raise exception 'project_missing'; end if;
 select * into op from public.project_save_operations where id=p_operation and project_id=p_project and owner_user_id=p_owner for update;
 if not found then raise exception 'operation_missing'; end if;
 if op.state='ready' then
  if not exists(select 1 from public.project_design_snapshots where revision_id=op.revision_id and snapshot_hash=op.snapshot_hash) then raise exception 'snapshot_missing'; end if;
  return to_jsonb(pr);
 end if;
 if pr.pending_operation_id is distinct from op.id or pr.version<>op.expected_version then raise exception 'version_conflict'; end if;
 if not public.cutplan_valid_snapshot_content(op.payload,p_canonical,op.snapshot_hash) then raise exception 'invalid_snapshot'; end if;
 perform public.cutplan_backfill_project_snapshot(p_owner,p_project,op.revision_id,op.payload,p_canonical,op.snapshot_hash,op.created_at);
 update public.design_revision_index set state='ready' where id=op.revision_id;
 update public.projects set name=op.payload->>'name',version=op.expected_version+1,current_revision_id=op.revision_id,
  sync_status='ready',pending_operation_id=null,updated_at=now() where id=pr.id returning * into pr;
 update public.project_save_operations set state='ready',payload=null,completed_at=now() where id=op.id;
 return to_jsonb(pr);
end; $$;
revoke all on function public.cutplan_save_project(uuid,uuid,text,uuid,integer,text,text,jsonb,text) from public,anon,authenticated;
revoke all on function public.cutplan_recover_project_save(uuid,text,uuid,text) from public,anon,authenticated;
grant execute on function public.cutplan_save_project(uuid,uuid,text,uuid,integer,text,text,jsonb,text) to service_role;
grant execute on function public.cutplan_recover_project_save(uuid,text,uuid,text) to service_role;
commit;

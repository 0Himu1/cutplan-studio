import 'server-only';
import { ObjectId } from 'mongodb';
import { createAdminClient } from '@/lib/supabase/admin';
import { commitMongoRevision, readMongoRevision, mongoConfigured } from './mongo';
import { snapshotFurniture, ProjectError, type CloudProject, type SaveInput } from './contracts';
import { projectIdentity, requestHash, snapshotHash } from './identity';
import { resumeSave, type SaveOperation } from './protocol';
import { publicCatalog } from '@/lib/catalog/public';
import { validateMaterials } from '@/lib/furniture/materials';

export const PROJECT_COLUMNS='id,source_draft_id,name,furniture_type,version,current_revision_id,sync_status,pending_operation_id,created_at,updated_at';

function rpcError(message: string): never {
  if (/version_conflict/.test(message)) throw new ProjectError(409,'version_conflict','This project changed in another tab. Your typed name is still here. Reload the latest project before saving again.');
  if (/save_pending/.test(message)) throw new ProjectError(409,'save_pending','An earlier save needs to finish. Open the account project and choose Retry save.');
  if (/operation_conflict/.test(message)) throw new ProjectError(409,'operation_conflict','This save request has changed. Retry the original save before starting a new one.');
  if (/project_missing|operation_missing/.test(message)) throw new ProjectError(404,'not_found','This account project is unavailable.');
  throw new ProjectError(503,'storage_unavailable','Account saving is unavailable. Your current work is preserved; retry this save.');
}

async function ownedProject(owner: string, id: string) {
  const {data,error}=await createAdminClient().from('projects').select(PROJECT_COLUMNS).eq('id',id).eq('owner_user_id',owner).is('deleted_at',null).maybeSingle();
  if (error) rpcError(error.message);
  if (!data) throw new ProjectError(404,'not_found','This account project is unavailable.');
  return data as CloudProject;
}

async function complete(operation: SaveOperation) {
  return resumeSave(operation,{
    commit: async op=>commitMongoRevision({_id:op.revision_id,projectId:new ObjectId(op.project_id),ownerUserId:op.owner_user_id,operationId:op.id,revisionNumber:op.expected_version+1,schemaVersion:1,engineVersion:op.payload!.stage!=='project-shell'?op.payload!.engineVersion:'project-shell-v1',snapshot:op.payload!,snapshotHash:op.snapshot_hash,createdAt:new Date(op.created_at)}),
    verify: async op=>{ await readMongoRevision(op.owner_user_id,op.project_id,op.revision_id,op.snapshot_hash); },
    finish: async op=>{
      const {data,error}=await createAdminClient().rpc('cutplan_finish_project_save',{p_owner:op.owner_user_id,p_operation:op.id,p_snapshot_hash:op.snapshot_hash});
      if (error) rpcError(error.message);
      // Return only customer metadata, never the privileged row or operation payload.
      return ownedProject(op.owner_user_id,(data as {id:string}).id);
    },
    read: op=>ownedProject(op.owner_user_id,op.project_id)
  });
}

export async function saveProject(owner: string, input: SaveInput) {
  const configuration=snapshotFurniture(input.snapshot);
  if(configuration&&Object.keys(configuration.panelOverrides??{}).length){
    const {data:existing,error:lookupError}=await createAdminClient().from('project_save_operations').select('id').eq('id',input.operationId).eq('owner_user_id',owner).maybeSingle();
    if(lookupError)throw new ProjectError(503,'storage_unavailable','Could not verify the earlier save. Retry.');
    const errors=existing?[]:validateMaterials(configuration.panelOverrides!,await publicCatalog());
    if(errors.length)throw new ProjectError(422,'material_unavailable',errors.join(' '));
  }
  if (!mongoConfigured()) throw new ProjectError(503,'setup_pending','Account saving is being configured. Your local draft is safe.');
  const id=projectIdentity(owner,input.sourceDraftId);
  if (input.projectId && input.projectId!==id) throw new ProjectError(404,'not_found','This account project is unavailable.');
  const {data,error}=await createAdminClient().rpc('cutplan_begin_project_save',{
    p_owner:owner,p_operation:input.operationId,p_project:id,p_source:input.sourceDraftId,p_expected:input.expectedVersion,
    p_request_hash:requestHash(owner,input,id),p_snapshot_hash:snapshotHash(input.snapshot),p_payload:input.snapshot
  });
  if (error) rpcError(error.message);
  if ((data as {already_claimed?:boolean}).already_claimed) return {project:await ownedProject(owner,id),alreadyClaimed:true};
  return {project:await complete(data as SaveOperation),alreadyClaimed:false};
}

export async function recoverProject(owner: string,id: string) {
  const project=await ownedProject(owner,id);
  if (!project.pending_operation_id) return project;
  const {data,error}=await createAdminClient().from('project_save_operations').select('*').eq('id',project.pending_operation_id).eq('owner_user_id',owner).maybeSingle();
  if (error) rpcError(error.message);
  if (!data) throw new ProjectError(503,'integrity_error','This save needs recovery. Contact the studio owner.');
  return complete(data as SaveOperation);
}

export async function projectRevision(owner: string,id: string, revisionId?: string) {
  const project=await ownedProject(owner,id);
  const target=revisionId??project.current_revision_id;
  const {data:historyData,error:historyError}=await createAdminClient().from('design_revision_index')
    .select('id,revision_number,created_at').eq('project_id',id).eq('state','ready').order('revision_number',{ascending:false}).limit(101);
  if (historyError) rpcError(historyError.message);
  const history=(historyData??[]).slice(0,100);
  if (!target) return {project,revision:null,history,hasMoreHistory:(historyData?.length??0)>100};
  const {data,error}=await createAdminClient().from('design_revision_index').select('id,revision_number,snapshot_hash,created_at').eq('project_id',id).eq('id',target).eq('state','ready').maybeSingle();
  if (error) rpcError(error.message);
  if (!data) throw new ProjectError(404,'not_found','This saved revision is unavailable.');
  const revision=await readMongoRevision(owner,id,target,data.snapshot_hash);
  return {project,revision:{id:data.id,number:data.revision_number,snapshot:revision.snapshot,createdAt:data.created_at},history,hasMoreHistory:(historyData?.length??0)>100};
}


import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import {readProjectSnapshot,requireProjectStorage,projectStorageReady} from './storage';
import { snapshotFurniture, ProjectError, type CloudProject, type SaveInput } from './contracts';
import { canonicalSnapshot,projectIdentity, requestHash, snapshotHash } from './identity';
import { publicCatalog } from '@/lib/catalog/public';
import {calculateFurniture} from '@/lib/furniture/families';
import { materialAssignments,validateMaterials } from '@/lib/furniture/materials';

export const PROJECT_COLUMNS='id,source_draft_id,name,furniture_type,version,current_revision_id,sync_status,pending_operation_id,created_at,updated_at';

function rpcError(message: string): never {
  if (/storage_maintenance/.test(message)) throw new ProjectError(503,'storage_maintenance','Account project storage is being migrated. Your work is preserved; retry after maintenance.');
  if (/snapshot_missing|snapshot_conflict|snapshot_metadata_mismatch|invalid_snapshot/.test(message)) throw new ProjectError(503,'integrity_error','The saved design could not be verified. Your work is preserved; contact the studio owner.');
  if (/invalid_save/.test(message)) throw new ProjectError(422,'invalid_input','The design contains unsupported or invalid measurements. Review it and retry.');
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

export async function saveProject(owner: string, input: SaveInput) {
  await requireProjectStorage();
  const configuration=snapshotFurniture(input.snapshot);
  const assignments=configuration?materialAssignments(configuration,calculateFurniture(configuration).panels):{};
  if(configuration&&Object.values(assignments).some(value=>value.boardId||value.frontFinishId||value.backFinishId||Object.values(value.edges??{}).length)){
    const {data:existing,error:lookupError}=await createAdminClient().from('project_save_operations').select('id').eq('id',input.operationId).eq('owner_user_id',owner).maybeSingle();
    if(lookupError)throw new ProjectError(503,'storage_unavailable','Could not verify the earlier save. Retry.');
    const errors=existing?[]:validateMaterials(assignments,await publicCatalog());
    if(errors.length)throw new ProjectError(422,'material_unavailable',errors.join(' '));
  }
  const id=projectIdentity(owner,input.sourceDraftId);
  if (input.projectId && input.projectId!==id) throw new ProjectError(404,'not_found','This account project is unavailable.');
  const {data,error}=await createAdminClient().rpc('cutplan_save_project',{
    p_owner:owner,p_operation:input.operationId,p_project:id,p_source:input.sourceDraftId,p_expected:input.expectedVersion,
    p_request_hash:requestHash(owner,input,id),p_snapshot_hash:snapshotHash(input.snapshot),p_payload:input.snapshot,p_canonical:canonicalSnapshot(input.snapshot)
  });
  if (error) rpcError(error.message);
  return {project:await ownedProject(owner,id),alreadyClaimed:Boolean((data as {alreadyClaimed?:boolean}).alreadyClaimed)};
}

export async function recoverProject(owner: string,id: string) {
  await requireProjectStorage();
  const project=await ownedProject(owner,id);
  if (!project.pending_operation_id) return project;
  const {data,error}=await createAdminClient().from('project_save_operations').select('*').eq('id',project.pending_operation_id).eq('owner_user_id',owner).maybeSingle();
  if (error) rpcError(error.message);
  if (!data) throw new ProjectError(503,'integrity_error','This save needs recovery. Contact the studio owner.');
  const {error:recoverError}=await createAdminClient().rpc('cutplan_recover_project_save',{
    p_owner:owner,p_project:id,p_operation:data.id,p_canonical:data.payload?canonicalSnapshot(data.payload):null
  });
  if(recoverError)rpcError(recoverError.message);
  return ownedProject(owner,id);
}

export async function projectRevision(owner: string,id: string, revisionId?: string) {
  const project=await ownedProject(owner,id);
  if(!await projectStorageReady())throw new ProjectError(503,'storage_maintenance','Account project storage is being migrated. Browser drafts remain available. Retry after maintenance.');
  const target=revisionId??project.current_revision_id;
  const {data:historyData,error:historyError}=await createAdminClient().from('design_revision_index')
    .select('id,revision_number,created_at').eq('project_id',id).eq('state','ready').order('revision_number',{ascending:false}).limit(101);
  if (historyError) rpcError(historyError.message);
  const history=(historyData??[]).slice(0,100);
  if (!target) return {project,revision:null,history,hasMoreHistory:(historyData?.length??0)>100};
  const {data,error}=await createAdminClient().from('design_revision_index').select('id,revision_number,snapshot_hash,created_at').eq('project_id',id).eq('id',target).eq('state','ready').maybeSingle();
  if (error) rpcError(error.message);
  if (!data) throw new ProjectError(404,'not_found','This saved revision is unavailable.');
  const revision=await readProjectSnapshot(id,target,data.snapshot_hash);
  return {project,revision:{id:data.id,number:data.revision_number,snapshot:revision.snapshot,createdAt:data.created_at},history,hasMoreHistory:(historyData?.length??0)>100};
}


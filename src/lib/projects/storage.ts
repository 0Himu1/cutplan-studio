import 'server-only';
import {createAdminClient} from '@/lib/supabase/admin';
import {ProjectError,type ProjectSnapshot} from './contracts';
import {canonicalSnapshot,snapshotHash} from './identity';

export async function projectStorageReady():Promise<boolean>{
 if(!process.env.NEXT_PUBLIC_SUPABASE_URL||!process.env.SUPABASE_SECRET_KEY)return false;
 const {data,error}=await createAdminClient().rpc('cutplan_project_storage_ready');
 if(error){console.error('[project-storage]',{action:'readiness',code:error.code});return false;}
 return data===true;
}
export async function requireProjectStorage(){
 if(process.env.PROJECT_WRITES_PAUSED==='true'||!await projectStorageReady())
  throw new ProjectError(503,'storage_maintenance','Account project storage is being migrated. Browser drafts and recovery copies remain available. Please retry after maintenance.');
}
/** The caller first authorizes the project; direct browser table access is denied. */
export async function readProjectSnapshot(projectId:string,revisionId:string,expectedHash:string){
 const {data,error}=await createAdminClient().from('project_design_snapshots')
  .select('snapshot,canonical_snapshot,snapshot_hash').eq('project_id',projectId).eq('revision_id',revisionId).maybeSingle();
 if(error){console.error('[project-storage]',{action:'read',code:error.code});throw new ProjectError(503,'storage_unavailable','Saved design storage is unavailable. Your work is preserved; retry.');}
 if(!data)throw new ProjectError(503,'snapshot_missing','This revision has no verified design content. Contact the studio owner; no replacement design was created.');
 try{
  const snapshot=data.snapshot as ProjectSnapshot;
  if(data.snapshot_hash!==expectedHash||snapshotHash(snapshot)!==expectedHash||canonicalSnapshot(snapshot)!==data.canonical_snapshot)
   throw new Error('hash');
  return {snapshot};
 }catch{throw new ProjectError(503,'integrity_error','This revision could not be verified. Retry or contact the studio owner.');}
}

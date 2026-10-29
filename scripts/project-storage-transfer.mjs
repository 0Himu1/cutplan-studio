import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {canonicalSnapshot,snapshotHash} from '../src/lib/projects/identity.ts';

export function verifyTransfer(source,sql){
 if(source.schemaVersion!==1||!Array.isArray(source.revisions)||!Array.isArray(source.workingDocuments))throw new Error('unsupported_export');
 const projects=new Map(sql.projects.map(p=>[p.id,p])),indexes=new Map(sql.revisions.map(r=>[r.id,r]));
 const operations=new Map(sql.operations.map(o=>[o.revision_id,o])),documents=new Map(),heads=new Map();
 for(const r of source.revisions){
  const i=indexes.get(r._id),p=projects.get(r.projectId),op=operations.get(r._id);
  if(documents.has(r._id))throw new Error('duplicate_source_revision');
  if(!i||!p||!op||i.project_id!==p.id||r.ownerUserId!==p.owner_user_id||i.created_by!==p.owner_user_id
   ||op.owner_user_id!==p.owner_user_id||op.project_id!==p.id
   ||r.operationId!==op.id||r.revisionNumber!==i.revision_number||op.expected_version+1!==r.revisionNumber
   ||r.schemaVersion!==i.schema_version||r.engineVersion!==i.engine_version
   ||r.snapshotHash!==i.snapshot_hash||r.snapshotHash!==op.snapshot_hash
   ||new Date(r.createdAt).getTime()!==new Date(i.created_at).getTime()
   ||new Date(r.createdAt).getTime()!==new Date(op.created_at).getTime()
   ||snapshotHash(r.snapshot)!==r.snapshotHash)throw new Error('source_revision_mismatch');
  documents.set(r._id,r);
 }
 for(const i of indexes.values())if(i.state==='ready'&&!documents.has(i.id))throw new Error('missing_source_revision');
 for(const h of source.workingDocuments){
  const p=projects.get(h._id),r=documents.get(h.currentRevisionId);
  if(heads.has(h._id)||!p||!r||h.ownerUserId!==p.owner_user_id||r.projectId!==p.id||h.version!==r.revisionNumber
   ||h.lastOperationId!==r.operationId||h.snapshotHash!==r.snapshotHash||snapshotHash(h.snapshot)!==h.snapshotHash)throw new Error('working_head_mismatch');
  const pending=sql.operations.find(o=>o.id===p.pending_operation_id);
  if(!(h.version===p.version&&h.currentRevisionId===p.current_revision_id)
   &&!(pending&&h.version===p.version+1&&h.currentRevisionId===pending.revision_id))throw new Error('working_pointer_mismatch');
  heads.set(h._id,h);
 }
 for(const p of projects.values())if(p.version>0&&!heads.has(p.id))throw new Error('missing_working_head');
 // Validate every recovery payload before importing even the first source revision.
 for(const op of sql.operations.filter(o=>o.state==='pending')){
  const p=projects.get(op.project_id),i=indexes.get(op.revision_id);
  if(!p||!i||p.owner_user_id!==op.owner_user_id||i.created_by!==op.owner_user_id
   ||i.project_id!==p.id||p.pending_operation_id!==op.id||p.version!==op.expected_version
   ||i.revision_number!==op.expected_version+1||i.snapshot_hash!==op.snapshot_hash
   ||!op.payload||snapshotHash(op.payload)!==op.snapshot_hash)throw new Error('invalid_pending_payload');
 }
 return {verified:true,projects:projects.size,readyRevisions:sql.revisions.filter(r=>r.state==='ready').length,exportedRevisions:documents.size,workingHeads:heads.size};
}
export async function readVerifiedArchive(directory){
 const manifest=JSON.parse(await readFile(resolve(directory,'manifest.json'),'utf8'));
 if(manifest.schemaVersion!==1||!Array.isArray(manifest.files)||manifest.files.length!==2||new Set(manifest.files.map(f=>f.name)).size!==2||!['export.json','source.ejson'].every(name=>manifest.files.some(f=>f.name===name)))throw new Error('invalid_manifest');
 for(const file of manifest.files){
  if(!['export.json','source.ejson'].includes(file.name))throw new Error('unexpected_archive_file');
  const bytes=await readFile(resolve(directory,file.name));
  if(bytes.length!==file.bytes||createHash('sha256').update(bytes).digest('hex')!==file.sha256)throw new Error('archive_checksum_mismatch');
 }
 const source=JSON.parse(await readFile(resolve(directory,'export.json'),'utf8'));
 if(!Array.isArray(source.revisions)||!Array.isArray(source.workingDocuments)||source.revisions.length!==manifest.revisions||source.workingDocuments.length!==manifest.heads)throw new Error('archive_count_mismatch');
 return source;
}
export async function storageRequest(path,body){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SECRET_KEY;
 if(!url||!key)throw new Error('supabase_configuration_missing');
 const response=await fetch(url+'/rest/v1/'+path,{method:body?'POST':'GET',headers:{apikey:key,Authorization:'Bearer '+key,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(30000)});
 if(!response.ok){const value=await response.json().catch(()=>({}));throw new Error('storage_request_failed_'+response.status+'_'+(value.code??'unknown'));}
 if(response.status===204)return null;
 const text=await response.text();return text?JSON.parse(text):null;
}
export async function storageRows(table,select='*'){
 const rows=[];for(let offset=0;;offset+=500){const page=await storageRequest(`${table}?select=${select}&order=id&limit=500&offset=${offset}`);rows.push(...page);if(page.length<500)return rows;}
}
export async function sourceInventory(){return {projects:await storageRows('projects'),revisions:await storageRows('design_revision_index'),operations:await storageRows('project_save_operations')};}

async function main(){
 const args=process.argv.slice(2),directory=args[args.indexOf('--input')+1];
 if(!args.includes('--input')||!directory)throw new Error('Use --input <private verified export directory>; default is dry run.');
 const source=await readVerifiedArchive(directory),sql=await sourceInventory(),report=verifyTransfer(source,sql);
 if(args.includes('--apply')){
  if(!args.includes('--approved-hosted-import')||process.env.PROJECT_WRITES_PAUSED!=='true')throw new Error('approved_maintenance_window_required');
  if(await storageRequest('rpc/cutplan_project_storage_ready',{})===true)throw new Error('storage_already_finalized');
  for(const r of source.revisions)await storageRequest('rpc/cutplan_backfill_project_snapshot',{
   p_owner:r.ownerUserId,p_project:r.projectId,p_revision:r._id,p_snapshot:r.snapshot,p_canonical:canonicalSnapshot(r.snapshot),p_hash:r.snapshotHash,p_created:r.createdAt,
  });
  for(const op of sql.operations.filter(o=>o.state==='pending')){
   if(!op.payload||snapshotHash(op.payload)!==op.snapshot_hash)throw new Error('invalid_pending_payload');
   await storageRequest('rpc/cutplan_recover_project_save',{p_owner:op.owner_user_id,p_project:op.project_id,p_operation:op.id,p_canonical:canonicalSnapshot(op.payload)});
  }
 }
 console.log(JSON.stringify({...report,mode:args.includes('--apply')?'imported':'dry_run'}));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)main().catch(error=>{console.error(error.message);process.exitCode=1;});

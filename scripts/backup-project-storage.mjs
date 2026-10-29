// Read-only design/metadata backup. Auth credentials and private files need separate backups.
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve,relative,sep,isAbsolute} from 'node:path';
import {createHash} from 'node:crypto';
import {sourceInventory,storageRequest,verifyTransfer} from './project-storage-transfer.mjs';
import {canonicalSnapshot,snapshotHash} from '../src/lib/projects/identity.ts';

try{
 const args=process.argv.slice(2),target=args[args.indexOf('--output')+1];
 if(!args.includes('--output')||!target)throw new Error('Use --output .private/project-storage/<new-directory>.');
 const directory=resolve(target),within=relative(resolve('.private/project-storage'),directory);
 if(!within||isAbsolute(within)||within==='..'||within.startsWith('..'+sep)||resolve('.private/project-storage',within)!==directory)throw new Error('private_backup_directory_required');
 const sql=await sourceInventory(),snapshots=[];
 if(sql.operations.some(o=>o.state==='pending')||sql.revisions.some(r=>r.state!=='ready'))throw new Error('pending_save_requires_reconciliation');
 for(let offset=0;;offset+=500){
  const page=await storageRequest('project_design_snapshots?select=*&order=revision_id&limit=500&offset='+offset);
  snapshots.push(...page);if(page.length<500)break;
 }
 const bodies=new Map(snapshots.map(s=>[s.revision_id,s]));
 if(bodies.size!==sql.revisions.length)throw new Error('snapshot_coverage_mismatch');
 const revisions=sql.revisions.map(i=>{
  const s=bodies.get(i.id),operation=sql.operations.find(o=>o.revision_id===i.id);
  if(!s||!operation||s.project_id!==i.project_id||s.snapshot_hash!==i.snapshot_hash||snapshotHash(s.snapshot)!==i.snapshot_hash||canonicalSnapshot(s.snapshot)!==s.canonical_snapshot)throw new Error('snapshot_integrity_error');
  return {_id:i.id,projectId:i.project_id,ownerUserId:i.created_by,operationId:operation.id,revisionNumber:i.revision_number,schemaVersion:i.schema_version,engineVersion:i.engine_version,snapshot:s.snapshot,snapshotHash:i.snapshot_hash,createdAt:i.created_at};
 });
 const workingDocuments=sql.projects.filter(p=>p.version>0).map(p=>{
  const r=revisions.find(r=>r._id===p.current_revision_id);
  if(!r)throw new Error('current_snapshot_missing');
  return {_id:p.id,ownerUserId:p.owner_user_id,currentRevisionId:p.current_revision_id,lastOperationId:r.operationId,version:p.version,snapshot:r.snapshot,snapshotHash:r.snapshotHash,updatedAt:p.updated_at};
 });
 const source={schemaVersion:1,exportedAt:new Date().toISOString(),source:'Supabase verified snapshot backup',revisions,workingDocuments};
 const report=verifyTransfer(source,sql),files=[];
 // Exclusive creation prevents silently replacing a previously verified recovery point.
 await mkdir(directory,{recursive:false,mode:0o700});
 for(const [name,value] of Object.entries({'export.json':source,'source.ejson':{sql,snapshots}})){
  const bytes=Buffer.from(JSON.stringify(value));await writeFile(resolve(directory,name),bytes,{flag:'wx',mode:0o600});
  files.push({name,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});
 }
 await writeFile(resolve(directory,'sql-before.json'),JSON.stringify(sql),{flag:'wx',mode:0o600});
 await writeFile(resolve(directory,'manifest.json'),JSON.stringify({schemaVersion:1,revisions:revisions.length,heads:workingDocuments.length,files},null,2),{flag:'wx',mode:0o600});
 console.log(JSON.stringify({...report,backupWritten:true,includesDesignContent:true}));
}catch(error){console.error(JSON.stringify({backupWritten:false,error:error.message}));process.exitCode=1;}

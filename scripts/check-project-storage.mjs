import {storageRequest,sourceInventory} from './project-storage-transfer.mjs';
import {snapshotHash,canonicalSnapshot} from '../src/lib/projects/identity.ts';
try{
 const inventory=await sourceInventory(),ready=await storageRequest('rpc/cutplan_project_storage_ready',{});
 let verified=0;
 for(const index of inventory.revisions.filter(r=>r.state==='ready')){
  const rows=await storageRequest(`project_design_snapshots?select=snapshot,canonical_snapshot,snapshot_hash,project_id&revision_id=eq.${index.id}`),row=rows[0];
  if(!row||row.project_id!==index.project_id||row.snapshot_hash!==index.snapshot_hash||snapshotHash(row.snapshot)!==index.snapshot_hash||canonicalSnapshot(row.snapshot)!==row.canonical_snapshot)throw new Error('snapshot_verification_failed');
  verified++;
 }
 for(const p of inventory.projects)if(p.version>0&&!inventory.revisions.some(r=>r.project_id===p.id&&r.id===p.current_revision_id&&r.state==='ready'&&r.revision_number===p.version))throw new Error('invalid_current_pointer');
 const pending=inventory.operations.filter(o=>o.state==='pending').length;
 console.log(JSON.stringify({ready,projects:inventory.projects.length,verifiedRevisions:verified,pendingSaves:pending}));
 if(!ready||pending)process.exitCode=1;
}catch(error){console.error(error.message);process.exitCode=1;}

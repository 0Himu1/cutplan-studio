import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {verifyTransfer,readVerifiedArchive} from '../../scripts/project-storage-transfer.mjs';
import {snapshotHash} from '../../src/lib/projects/identity.ts';

function fixture(){
 const owner='00000000-0000-4000-8000-000000000001',id='0123456789abcdef01234567',revision='00000000-0000-4000-8000-000000000201',operation='00000000-0000-4000-8000-000000000301',date='2026-10-22T00:00:00.000Z';
 const snapshot={schemaVersion:1,name:'Original — বাংলা',furnitureType:'cabinet',stage:'project-shell'},hash=snapshotHash(snapshot);
 const doc={_id:revision,projectId:id,ownerUserId:owner,operationId:operation,revisionNumber:1,schemaVersion:1,engineVersion:'project-shell-v1',snapshot,snapshotHash:hash,createdAt:date};
 const source={schemaVersion:1,revisions:[doc],workingDocuments:[{_id:id,ownerUserId:owner,currentRevisionId:revision,lastOperationId:operation,version:1,snapshot,snapshotHash:hash}]};
 const sql={projects:[{id,owner_user_id:owner,version:1,current_revision_id:revision,pending_operation_id:null}],revisions:[{id:revision,project_id:id,created_by:owner,revision_number:1,schema_version:1,engine_version:'project-shell-v1',snapshot_hash:hash,created_at:date,state:'ready'}],operations:[{id:operation,revision_id:revision,expected_version:0,snapshot_hash:hash,created_at:date,state:'ready'}]};
 sql.operations[0].owner_user_id=owner;sql.operations[0].project_id=id;
 return {source,sql};
}
test('transfer validation conserves every source revision and working head before any write',()=>{
 const {source,sql}=fixture();assert.equal(verifyTransfer(source,sql).readyRevisions,1);
 for(const mutate of [
  s=>s.revisions=[],s=>s.revisions.push(structuredClone(s.revisions[0])),s=>s.revisions[0].snapshot.name='Tampered',
  s=>s.revisions[0].ownerUserId='different-owner',s=>s.revisions[0].revisionNumber=2,s=>s.revisions[0].createdAt='2020-01-01',
  s=>s.workingDocuments=[],s=>s.workingDocuments[0].currentRevisionId='missing',s=>s.workingDocuments[0].snapshotHash='a'.repeat(64),
 ]){const bad=structuredClone(source);mutate(bad);assert.throws(()=>verifyTransfer(bad,sql));}
 for(const mutate of [s=>s.operations[0].owner_user_id='different-owner',s=>s.operations[0].project_id='different-project',s=>{s.operations[0].state='pending';s.operations[0].payload=null;}]){
  const bad=structuredClone(sql);mutate(bad);assert.throws(()=>verifyTransfer(source,bad));
 }
});
test('archives require exact file hashes and refuse a corrupted export',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'cutplan-transfer-'));
 try{
  const {source}=fixture(),files={'export.json':JSON.stringify(source),'source.ejson':'{}'},manifest={schemaVersion:1,revisions:1,heads:1,files:[]};
  for(const[name,bytes]of Object.entries(files)){await writeFile(join(directory,name),bytes);manifest.files.push({name,bytes:Buffer.byteLength(bytes),sha256:createHash('sha256').update(bytes).digest('hex')});}
  await writeFile(join(directory,'manifest.json'),JSON.stringify(manifest));assert.equal((await readVerifiedArchive(directory)).revisions.length,1);
  await writeFile(join(directory,'export.json'),'{}');await assert.rejects(readVerifiedArchive(directory),/archive_checksum_mismatch/);
 }finally{await rm(directory,{recursive:true,force:true});}
});

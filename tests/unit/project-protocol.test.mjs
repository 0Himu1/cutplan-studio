import test from 'node:test';
import assert from 'node:assert/strict';
import { projectIdentity, requestHash, snapshotHash } from '../../src/lib/projects/identity.ts';
import { ProjectError, saveInput } from '../../src/lib/projects/contracts.ts';
import { resumeSave } from '../../src/lib/projects/protocol.ts';

const owner='00000000-0000-4000-8000-000000000001';
const source='00000000-0000-4000-8000-000000000101';
const operationId='00000000-0000-4000-8000-000000000201';
const snapshot={schemaVersion:1,name:'Reading cabinet',furnitureType:'cabinet',stage:'project-shell'};

test('project identities and request hashes are deterministic and ownership-scoped', () => {
  const id=projectIdentity(owner,source);
  assert.match(id,/^[0-9a-f]{24}$/);
  assert.equal(projectIdentity(owner,source),id);
  assert.notEqual(projectIdentity('00000000-0000-4000-8000-000000000002',source),id);
  const input={operationId,sourceDraftId:source,expectedVersion:0,snapshot};
  assert.equal(requestHash(owner,input,id),requestHash(owner,input,id));
  assert.match(snapshotHash(snapshot),/^[0-9a-f]{64}$/);
});

test('project save input accepts only the Phase 4 shell contract', () => {
  assert.deepEqual(saveInput({operationId,sourceDraftId:source,expectedVersion:0,snapshot:{...snapshot,name:'  Reading cabinet  '}})?.snapshot.name,'Reading cabinet');
  for (const invalid of [
    {...snapshot,dimensions:{width:600}}, {...snapshot,stage:'editor'}, {...snapshot,name:''}, {...snapshot,name:'bad\nname'},
  ]) assert.equal(saveInput({operationId,sourceDraftId:source,expectedVersion:0,snapshot:invalid}),null);
  assert.equal(saveInput({operationId,sourceDraftId:source,expectedVersion:1,snapshot}),null);
  assert.equal(saveInput({operationId,sourceDraftId:source,expectedVersion:0,snapshot,ownerUserId:owner}),null);
});

test('retry resumes safely across every durable save boundary', async () => {
  const operation={id:operationId,owner_user_id:owner,project_id:'0123456789abcdef01234567',revision_id:'00000000-0000-4000-8000-000000000301',expected_version:0,snapshot_hash:snapshotHash(snapshot),state:'pending',payload:snapshot,created_at:'2026-10-22T00:00:00.000Z'};
  for (const failAt of ['commit','verify','finish']) {
    const durable={revision:false,head:false,ready:false};
    let shouldFail=true;
    const ports={
      commit:async()=>{ durable.revision=true; durable.head=true; if (failAt==='commit'&&shouldFail) throw new Error('network'); },
      verify:async()=>{ assert.equal(durable.revision,true); if (failAt==='verify'&&shouldFail) throw new Error('network'); },
      finish:async()=>{ if (failAt==='finish'&&shouldFail) throw new Error('network'); durable.ready=true; return {id:operation.project_id}; },
      read:async()=>({id:operation.project_id}),
    };
    await assert.rejects(resumeSave(operation,ports));
    shouldFail=false;
    assert.equal((await resumeSave(operation,ports)).id,operation.project_id);
    assert.deepEqual(durable,{revision:true,head:true,ready:true});
  }
});

test('ready operations read without another write and tampered pending payloads never finish', async () => {
  let writes=0;
  const ready={id:operationId,owner_user_id:owner,project_id:'0123456789abcdef01234567',revision_id:'00000000-0000-4000-8000-000000000301',expected_version:0,snapshot_hash:snapshotHash(snapshot),state:'ready',payload:null,created_at:'2026-10-22T00:00:00.000Z'};
  const ports={commit:async()=>{writes++;},verify:async()=>{},finish:async()=>{writes++;return {};},read:async()=>({id:ready.project_id})};
  assert.equal((await resumeSave(ready,ports)).id,ready.project_id); assert.equal(writes,0);
  await assert.rejects(resumeSave({...ready,state:'pending',payload:{...snapshot,name:'Changed'}},ports),error=>error instanceof ProjectError&&error.code==='integrity_error');
  assert.equal(writes,0);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { projectIdentity, requestHash, snapshotHash } from '../../src/lib/projects/identity.ts';
import { saveInput } from '../../src/lib/projects/contracts.ts';

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

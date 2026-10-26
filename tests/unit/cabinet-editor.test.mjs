import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { cabinetInput, DEFAULT_CABINET, edit, initialHistory, panelBounds, parseRecovery, redo, toDisplay, toMm, undo } from '../../src/lib/furniture/editor.ts';
import { calculateCabinet } from '../../src/lib/furniture/cabinet.ts';
import { parseDrafts } from '../../src/lib/guest-drafts/model.ts';
import { designSnapshot, saveInput } from '../../src/lib/projects/contracts.ts';
import { snapshotHash } from '../../src/lib/projects/identity.ts';

test('editor undo redo restores the complete construction and rejects invalid edits',()=>{
  const initial=initialHistory(DEFAULT_CABINET);
  const changed=edit(initial,{...DEFAULT_CABINET,widthMm:950,shelfCount:3,backPosition:'outside',skirtingHeightMm:80});
  assert.deepEqual(undo(changed).present,initial.present);
  assert.deepEqual(redo(undo(changed)).present,changed.present);
  assert.equal(edit(changed,{...changed.present,widthMm:0}),changed);
  assert.equal(edit(changed,changed.present),changed);
  assert.equal(edit(undo(changed),{...DEFAULT_CABINET,depthMm:450}).future.length,0);
  let history=initial;
  for(let i=0;i<120;i++)history=edit(history,{...DEFAULT_CABINET,widthMm:800+i});
  assert.equal(history.past.length,100);
});

test('unit conversion retains canonical mm precision; projected dimensions match actual panel bounds',()=>{
  for(const mm of [6,18,25.4,800,813,1219,2438])assert.ok(Math.abs(toMm(toDisplay(mm,'in'),'in')-mm)<1e-10);
  const result=calculateCabinet(DEFAULT_CABINET);
  const left=panelBounds(result.panels.find(p=>p.componentId==='side-left'));
  assert.ok(Math.abs(left.min[0])<1e-10);
  assert.ok(Math.abs(left.max[0]-18)<1e-10);
  assert.deepEqual([left.min[1],left.max[1],left.min[2],left.max[2]],[0,1200,0,400]);
  const shelf=panelBounds(result.panels.find(p=>p.componentId==='shelf-1'));
  assert.equal(shelf.max[0]-shelf.min[0],760);
  assert.ok(Math.abs(shelf.max[1]-shelf.min[1]-18)<1e-10);
  assert.ok(Math.abs(shelf.max[2]-shelf.min[2]-348.6)<1e-10);
});

test('local envelopes read old shells, retain valid geometry and reject corrupt or future geometry',()=>{
  const project={id:'00000000-0000-4000-8000-000000000101',name:'Cabinet',furnitureType:'cabinet',version:1,createdAt:'2026-10-22T00:00:00Z',updatedAt:'2026-10-22T00:00:00Z'};
  assert.equal(parseDrafts(JSON.stringify({schemaVersion:1,projects:[project]})).status,'ready');
  const valid=parseDrafts(JSON.stringify({schemaVersion:2,projects:[{...project,cabinet:DEFAULT_CABINET}]}));
  assert.deepEqual(valid.projects[0].cabinet,DEFAULT_CABINET);
  for(const cabinet of [{...DEFAULT_CABINET,widthMm:0},{...DEFAULT_CABINET,future:1},{}])assert.equal(parseDrafts(JSON.stringify({schemaVersion:2,projects:[{...project,cabinet}]})).status,'corrupt');
  assert.equal(parseDrafts(JSON.stringify({schemaVersion:5,projects:[]})).status,'newer-version');
  assert.equal(parseRecovery('{bad'),null);
  assert.equal(parseRecovery(JSON.stringify({schemaVersion:2,baseVersion:1,input:DEFAULT_CABINET})),null);
  assert.deepEqual(parseRecovery(JSON.stringify({schemaVersion:1,baseVersion:2,input:DEFAULT_CABINET})).input,DEFAULT_CABINET);
});

test('design snapshots validate canonical geometry, hash all dimensions and preserve old shell hashes',()=>{
  const snapshot=designSnapshot('Cabinet',DEFAULT_CABINET);
  const request={operationId:'00000000-0000-4000-8000-000000000201',sourceDraftId:'00000000-0000-4000-8000-000000000101',expectedVersion:0,snapshot};
  assert.deepEqual(saveInput(request).snapshot,snapshot);
  assert.notEqual(snapshotHash(snapshot),snapshotHash(designSnapshot('Cabinet',{...DEFAULT_CABINET,widthMm:850})));
  const reordered=Object.fromEntries(Object.entries(DEFAULT_CABINET).reverse());
  assert.equal(snapshotHash(snapshot),snapshotHash(designSnapshot('Cabinet',reordered)));
  for(const change of [{cabinet:{...DEFAULT_CABINET,heightMm:0}},{furnitureType:'table'},{engineVersion:'unknown'},{templateKey:'other'},{approved:true}])assert.equal(saveInput({...request,snapshot:{...snapshot,...change}}),null);
  const old={schemaVersion:1,name:'Old',furnitureType:'cabinet',stage:'project-shell'};
  assert.equal(snapshotHash(old),createHash('sha256').update(JSON.stringify(old)).digest('hex'));
  assert.equal(cabinetInput({...DEFAULT_CABINET,unknown:1}),null);
});

test('Phase 7 SQL extends saves without changing ready shell revisions or weakening role checks',async()=>{
  const db=new PGlite();
  const owner='00000000-0000-4000-8000-000000000001',source='00000000-0000-4000-8000-000000000101';
  const project='0123456789abcdef01234567',hash='a'.repeat(64);
  try{
    await db.exec(`create role anon; create role authenticated; create role service_role; create schema auth; grant usage on schema public,auth to anon,authenticated,service_role;
      create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$; insert into auth.users values('${owner}');`);
    await db.exec(await readFile(new URL('../../supabase/migrations/202610220001_cloud_projects.sql',import.meta.url),'utf8'));
    const begin=async(payload,expected,suffix)=>db.query(`select public.cutplan_begin_project_save($1,$2,$3,$4,$5,$6,$7,$8::jsonb) value`,[owner,`00000000-0000-4000-8000-000000000${suffix}`,project,source,expected,hash,hash,JSON.stringify(payload)]);
    const shell={schemaVersion:1,name:'Cabinet',furnitureType:'cabinet',stage:'project-shell'};
    const first=(await begin(shell,0,'201')).rows[0].value;
    await db.query('select public.cutplan_finish_project_save($1,$2,$3)',[owner,first.id,hash]);
    await db.exec(await readFile(new URL('../../supabase/migrations/202610220005_cabinet_designs.sql',import.meta.url),'utf8'));
    const design=designSnapshot('Cabinet',DEFAULT_CABINET);
    const saved=(await begin(design,1,'202')).rows[0].value;
    const retry=(await begin(design,1,'202')).rows[0].value;
    assert.equal(saved.revision_id,retry.revision_id);
    await db.query('select public.cutplan_finish_project_save($1,$2,$3)',[owner,saved.id,hash]);
    assert.deepEqual((await db.query('select revision_number,engine_version,state from public.design_revision_index order by revision_number')).rows,[{revision_number:1,engine_version:'project-shell-v1',state:'ready'},{revision_number:2,engine_version:'cabinet-review-1.0.0',state:'ready'}]);
    await assert.rejects(begin({...design,cabinet:{...DEFAULT_CABINET,doorCount:3}},2,'203'),/invalid_save/);
    await assert.rejects(begin({...design,extra:true},2,'204'),/invalid_save/);
    await assert.rejects(db.exec('update public.design_revision_index set engine_version=\'changed\' where revision_number=1'),/immutable_revision/);
    await db.exec('set role authenticated;');
    await assert.rejects(begin(design,2,'205'),/permission denied/);
  }finally{await db.close();}
});

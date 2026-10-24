import test from 'node:test';
import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';
import {readFile} from 'node:fs/promises';
import {calculateFurniture,defaultFurniture,furnitureInput} from '../../src/lib/furniture/families.ts';
import {panelBounds,edit,initialHistory,undo,redo,parseRecovery} from '../../src/lib/furniture/editor.ts';
import {parseDrafts} from '../../src/lib/guest-drafts/model.ts';
import {furnitureSnapshot,saveInput} from '../../src/lib/projects/contracts.ts';
import {snapshotHash} from '../../src/lib/projects/identity.ts';
import {panelPresentation,advancePresentation} from '../../src/lib/furniture/presentation.ts';

test('shoe-rack arithmetic, stock, plinth and stable family identities are explicit proposed fixtures',()=>{
 const input=defaultFurniture('shoe_rack'),result=calculateFurniture(input);
 assert.deepEqual(result.blockingErrors,[]);assert.equal(result.panels.length,11);
 assert.equal(result.panels.find(p=>p.role==='shelf').widthMm,773);
 assert.equal(result.panels.find(p=>p.role==='door').widthMm,385.5);
 assert.ok(result.panels.every(p=>p.panelId.startsWith('shoe_rack/')));assert.equal(result.manufacturingApproved,false);
 for(const panel of result.panels){const box=panelBounds(panel);for(let i=0;i<3;i++){assert.ok(box.min[i]>=-.001);assert.ok(box.max[i]<=[input.widthMm,input.heightMm,input.depthMm][i]+.001);}}
 assert.ok(calculateFurniture({...input,heightMm:2600}).blockingErrors.length);
 const open=calculateFurniture({...input,doorCount:0,skirtingHeightMm:0});assert.equal(open.panels.length,8);
 const assigned={...input,panelOverrides:{'shoe_rack/side-left':{boardId:'00000000-0000-4000-8000-000000000001',thicknessMm:24,stockWidthMm:1219,stockHeightMm:2438}}};
 assert.equal(calculateFurniture(assigned).panels.find(p=>p.role==='shelf').widthMm,767);
 assert.equal(furnitureInput({...assigned,panelOverrides:{'cabinet/side-left':assigned.panelOverrides['shoe_rack/side-left']}}),null);
});

test('bookshelf fixed/adjustable spans and floor/wall limits are enforced without load claims',()=>{
 const floor=defaultFurniture('bookshelf');assert.deepEqual(calculateFurniture(floor).blockingErrors,[]);
 assert.equal(calculateFurniture(floor).panels.find(p=>p.role==='shelf').widthMm,564);
 const adjustable={...floor,shelfMode:'adjustable',shelfSideClearanceMm:2};
 for(const panel of calculateFurniture(adjustable).panels.filter(p=>p.role==='shelf')){assert.equal(panel.widthMm,560);assert.equal(panel.pose.positionMm[1]%32,0);}
 for(const change of [{doorCount:1},{bodyThicknessMm:12},{widthMm:900},{mounting:'wall'},{shelfMode:'adjustable'},{drawerCount:1},{panelOverrides:null}])assert.ok(calculateFurniture({...floor,...change}).blockingErrors.length);
 const wall={...floor,mounting:'wall',heightMm:900,depthMm:250,wallSubstrate:'concrete',fixingNotes:'Installer to approve anchors and substrate'};
 assert.deepEqual(calculateFurniture(wall).blockingErrors,[]);assert.ok(calculateFurniture(wall).warnings.some(w=>w.includes('no fixing hardware')));
 assert.ok(calculateFurniture({...wall,fixingNotes:123}).blockingErrors.length);
 assert.ok(calculateFurniture({...wall,skirtingHeightMm:80}).blockingErrors.length);
});

test('new family snapshots, history, recovery and local envelopes preserve discriminators and old hashes',()=>{
 const request={operationId:'00000000-0000-4000-8000-000000000201',sourceDraftId:'00000000-0000-4000-8000-000000000101',expectedVersion:0};
 for(const family of ['shoe_rack','bookshelf']){
  const input=defaultFurniture(family),snapshot=furnitureSnapshot('Review',input);assert.deepEqual(saveInput({...request,snapshot}).snapshot,snapshot);
  assert.equal(saveInput({...request,snapshot:{...snapshot,furnitureType:family==='bookshelf'?'shoe_rack':'bookshelf'}}),null);
  const next={...input,widthMm:input.widthMm+10},history=edit(initialHistory(input),next);assert.deepEqual(redo(undo(history)).present,next);
  assert.notEqual(snapshotHash(snapshot),snapshotHash(furnitureSnapshot('Review',next)));
  assert.deepEqual(parseRecovery(JSON.stringify({schemaVersion:1,baseVersion:1,input})).input,input);
  const draft={id:request.sourceDraftId,name:'Review',furnitureType:family,createdAt:'2026-10-23T00:00:00Z',updatedAt:'2026-10-23T00:00:00Z',version:1,design:input};
  assert.equal(parseDrafts(JSON.stringify({schemaVersion:3,projects:[draft]})).status,'ready');assert.equal(parseDrafts(JSON.stringify({schemaVersion:3,projects:[{...draft,furnitureType:'table'}]})).status,'corrupt');
 }
});

test('hinge animation preserves its pivot, explode/collapse is reversible and reduced motion snaps',()=>{
 const input=defaultFurniture('cabinet'),panel=calculateFurniture(input).panels.find(p=>p.role==='door'),before=structuredClone(panel);
 const pose=panelPresentation(panel,[400,600,200],0,1);assert.ok(Math.abs(pose.position[0]-(panel.pose.positionMm[0]-panel.widthMm/2))<1e-9);assert.ok(pose.position[2]>panel.pose.positionMm[2]);
 assert.deepEqual(panelPresentation(panel,[400,600,200],0,0).position,panel.pose.positionMm);assert.deepEqual(panel,before);
 assert.ok(advancePresentation(0,1,.016,false)>0&&advancePresentation(0,1,.016,false)<1);assert.equal(advancePresentation(0,1,.016,true),1);
 let value=0;for(let i=0;i<120;i++)value=advancePresentation(value,1,.016,false);assert.equal(value,1);
});

test('SQL family extension accepts new designs, rejects cross-family data and keeps revision engine metadata',async()=>{
 const db=new PGlite();try{
  await db.exec(`create role anon;create role authenticated;create role service_role;create schema auth;create table auth.users(id uuid primary key,email text);create function auth.uid() returns uuid language sql stable as $$select null::uuid$$;`);
  for(const file of ['202610210001_profiles_and_memberships.sql','202610220001_cloud_projects.sql','202610220002_material_catalog.sql','202610220003_catalog_sources.sql','202610220004_catalog_operations.sql','202610220005_cabinet_designs.sql','202610220006_panel_materials.sql','202610230001_casework_families.sql'])await db.exec(await readFile(new URL('../../supabase/migrations/'+file,import.meta.url),'utf8'));
  for(const family of ['cabinet','shoe_rack','bookshelf']){const payload=furnitureSnapshot('Review',defaultFurniture(family));const valid=async p=>(await db.query('select public.cutplan_valid_project_snapshot($1::jsonb) valid',[JSON.stringify(p)])).rows[0].valid;assert.equal(await valid(payload),true);if(family!=='cabinet')assert.equal(await valid({...payload,configuration:{...payload.configuration,family:'table'}}),false);}
  const owner='00000000-0000-4000-8000-000000000001';await db.query('insert into auth.users(id) values($1)',[owner]);
  const payload=furnitureSnapshot('SQL shoe rack',defaultFurniture('shoe_rack')),hash=snapshotHash(payload);
  const op=(await db.query('select public.cutplan_begin_project_save($1,$2,$3,$4,0,$5,$5,$6::jsonb) op',[owner,'00000000-0000-4000-8000-000000000201','0123456789abcdef01234567','00000000-0000-4000-8000-000000000101',hash,JSON.stringify(payload)])).rows[0].op;
  await db.query('select public.cutplan_finish_project_save($1,$2,$3)',[owner,op.id,hash]);assert.equal((await db.query('select engine_version from public.design_revision_index')).rows[0].engine_version,'casework-review-1.0.0');
  await db.exec('set role authenticated');await assert.rejects(db.query('select public.cutplan_valid_project_snapshot($1::jsonb)',[JSON.stringify(furnitureSnapshot('Review',defaultFurniture('shoe_rack')))]),/permission denied/);
 }finally{await db.close();}
});

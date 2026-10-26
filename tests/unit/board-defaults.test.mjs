import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';
import {readFile,readdir} from 'node:fs/promises';
import {DEFAULT_CABINET,cabinetInput,initialHistory,edit,undo,redo} from '../../src/lib/furniture/editor.ts';
import {calculateCabinet} from '../../src/lib/furniture/cabinet.ts';
import {cabinetInterior,compartmentDefault,sectionDefault} from '../../src/lib/furniture/compartments.ts';
import {selectGroupBoard,setGroupThickness} from '../../src/lib/furniture/material-defaults.ts';
import {parseMaterialDefaults,materialForPanel,materialAssignments,previewPanelColor,previewBoardColor,validateMaterials,physicalMaterial} from '../../src/lib/furniture/materials.ts';
import {nestFurniture} from '../../src/lib/furniture/nesting.ts';
import {cuttingJob,defaultCuttingSettings} from '../../src/lib/cutting/workspace.ts';
import {designSnapshot,saveInput} from '../../src/lib/projects/contracts.ts';
import {snapshotHash} from '../../src/lib/projects/identity.ts';
import {boardCatalog,bodyId,backId,doorId,finishId} from '../fixtures/board-defaults.ts';
const configured=()=>{let c={...DEFAULT_CABINET,widthMm:1600,heightMm:2000,compartmentMode:'manual',compartments:[compartmentDefault('a',773),compartmentDefault('b',773)]};for(const [role,id]of [['body',bodyId],['back',backId],['front',doorId]])c=selectGroupBoard(c,role,id,boardCatalog);return c;};
test('role boards atomically update physical specifications and resize compartments without losing contents',()=>{
 const old=configured(),c=setGroupThickness(selectGroupBoard(old,'body','',boardCatalog),'body',20),r=calculateCabinet(c);assert.deepEqual(r.blockingErrors,[]);assert.equal(c.bodyThicknessMm,20);
 assert.ok(Math.abs(c.compartments.reduce((n,v)=>n+v.widthMm,0)+20-cabinetInterior(c).width)<1e-8);assert.deepEqual(c.compartments.map(v=>v.sections),old.compartments.map(v=>v.sections));
 const body=calculateCabinet(old).panels.find(p=>p.role==='side');assert.equal(body.thicknessMm,16);assert.equal(body.grainAxis,'height');assert.deepEqual(body.allowedRotationsDeg,[0]);
});
test('new frames, shelves and drawer pieces inherit their correct board roles without copied assignments',()=>{
 const c=configured();c.compartments[1].sections=[{...sectionDefault('drawer'),heightMm:300,type:'drawer'},{...sectionDefault('shelf'),type:'shelf'}];const r=calculateCabinet(c);assert.deepEqual(r.blockingErrors,[]);
 for(const p of r.panels){const a=materialForPanel(c,p);assert.equal(a.boardId,p.materialSlot==='body'?bodyId:p.materialSlot==='back'?backId:doorId);}
 assert.ok(r.panels.some(p=>p.label.startsWith('Door frame')));assert.ok(r.panels.some(p=>p.label.startsWith('Drawer box back')));assert.equal(c.panelOverrides,undefined);
 assert.deepEqual(validateMaterials(materialAssignments(c,r.panels),boardCatalog),[]);
 const nesting=nestFurniture(c);assert.deepEqual(nesting.errors,[]);assert.equal(nesting.unplaced.length,0);assert.ok(nesting.sheets.every(s=>[bodyId,backId,doorId].includes(JSON.parse(s.stockKey)[0])));
 const job=cuttingJob(c,defaultCuttingSettings);assert.deepEqual(job.errors,[]);assert.ok(job.parts.every(p=>p.boardType.includes(materialForPanel(c,{panelId:p.id,materialSlot:p.category}).boardId)));
});
test('preview colors persist, compatible finishes take priority, and individual boards can override defaults',()=>{
 const c=configured();c.materialDefaults.body.previewColor='#123456';const p=calculateCabinet(c).panels.find(p=>p.role==='side');assert.equal(previewPanelColor(c,p,boardCatalog,'front'),'#123456');
 c.materialDefaults.front={...c.materialDefaults.front,previewColor:'#ff0000',frontFinishId:finishId,backFinishId:finishId};const door=calculateCabinet(c).panels.find(p=>p.role==='door');assert.equal(previewPanelColor(c,door,boardCatalog,'front'),'#f1eee5');
 const overridden={...c,panelOverrides:{[p.panelId]:physicalMaterial(c.materialDefaults.front)}};assert.equal(materialForPanel(overridden,p).boardId,doorId);assert.equal(previewPanelColor(overridden,p,boardCatalog,'front'),'#f1eee5');
 assert.deepEqual(validateMaterials(materialAssignments(c,calculateCabinet(c).panels),boardCatalog),[]);
 const history=edit(initialHistory(DEFAULT_CABINET),c);assert.deepEqual(redo(undo(history)).present,c);assert.deepEqual(cabinetInput(c).materialDefaults,c.materialDefaults);
 assert.notEqual(snapshotHash(designSnapshot('x',c)),snapshotHash(designSnapshot('x',{...c,materialDefaults:{...c.materialDefaults,back:{...c.materialDefaults.back,previewColor:'#abcdef'}}})));
});
test('malformed defaults, mismatched thickness, stale board specs and incompatible finishes fail validation',()=>{
 for(const raw of [null,[],{glass:{}},{body:{previewColor:'red'}},{body:{previewColor:null}},{body:{boardId:bodyId}},{body:{oops:true}}])assert.equal(parseMaterialDefaults(raw),null);
 const c=configured();assert.ok(calculateCabinet({...c,bodyThicknessMm:99}).blockingErrors.length);
 const stale=structuredClone(boardCatalog);stale.items[0].board_skus.thickness_mm=99;assert.ok(validateMaterials(materialAssignments(c,calculateCabinet(c).panels),stale).length);
 c.materialDefaults.body.frontFinishId=finishId;assert.ok(validateMaterials(materialAssignments(c,calculateCabinet(c).panels),boardCatalog).length);
});
test('SQL accepts role defaults, preserves old snapshots and keeps validator privileges unchanged',async()=>{
 const db=new PGlite();try{
  await db.exec("create role anon;create role authenticated;create role service_role;create schema auth;create table auth.users(id uuid primary key,email text);create function auth.uid() returns uuid language sql stable as $$select null::uuid$$;");
  const files=(await readdir(new URL('../../supabase/migrations/',import.meta.url))).filter(f=>f.endsWith('.sql')).sort();let before;
  for(const f of files){if(f==='202610250001_cabinet_material_defaults.sql')before=(await db.query("select proacl::text acl from pg_proc where oid='public.cutplan_valid_project_snapshot(jsonb)'::regprocedure")).rows[0].acl;await db.exec(await readFile(new URL('../../supabase/migrations/'+f,import.meta.url),'utf8'));}
  assert.equal((await db.query("select proacl::text acl from pg_proc where oid='public.cutplan_valid_project_snapshot(jsonb)'::regprocedure")).rows[0].acl,before);
  const validate=async c=>(await db.query('select public.cutplan_valid_project_snapshot($1::jsonb) valid',[JSON.stringify(designSnapshot('Test',c))])).rows[0].valid;
  const c=configured();c.materialDefaults.front.previewColor='#ffffff';assert.equal(await validate(c),true);assert.equal(await validate(DEFAULT_CABINET),true);
  assert.equal(await validate({...c,materialDefaults:{glass:{}}}),false);assert.equal(await validate({...c,materialDefaults:{body:{previewColor:'red'}}}),false);assert.equal(await validate({...c,bodyThicknessMm:18}),false);
  assert.ok(saveInput({operationId:'00000000-0000-4000-8000-000000001201',sourceDraftId:'00000000-0000-4000-8000-000000001202',expectedVersion:0,snapshot:designSnapshot('Defaults',c)}));
  await db.exec('set role anon');await assert.rejects(db.query('select public.cutplan_valid_project_snapshot($1::jsonb)',[JSON.stringify(designSnapshot('No access',c))]),/permission denied/);
 }finally{await db.close();}
});

test('Mongo snapshot schema accepts role defaults only on cabinets and retains strict preview-color shape',async()=>{
 const {cabinetSchema,snapshotSchema}=await import('../../scripts/cabinet-document-schema.mjs');
 assert.equal(cabinetSchema.properties.materialDefaults.additionalProperties,false);assert.deepEqual(Object.keys(cabinetSchema.properties.materialDefaults.properties),['body','back','front']);
 assert.equal(cabinetSchema.properties.materialDefaults.properties.body.properties.previewColor.pattern,'^#[0-9A-Fa-f]{6}$');
 for(const item of snapshotSchema.oneOf)if(item.properties.configuration)assert.equal(item.properties.configuration.properties.materialDefaults,undefined);
});


test('catalog board colors drive both faces and edges, with finish priority and legacy fallback',()=>{
 const catalog=structuredClone(boardCatalog);catalog.items.find(item=>item.id===bodyId).board_skus.color_code='#123456';catalog.items.find(item=>item.id===doorId).board_skus.color_code='#abcdef';
 const c=configured();c.materialDefaults.body.previewColor='#ff0000';const p=calculateCabinet(c).panels.find(panel=>panel.materialSlot==='body');
 assert.equal(previewPanelColor(c,p,catalog,'front'),'#123456');assert.equal(previewPanelColor(c,p,catalog,'back'),'#123456');assert.equal(previewBoardColor(c,p,catalog),'#123456');
 c.panelOverrides={[p.panelId]:physicalMaterial(c.materialDefaults.front)};assert.equal(previewPanelColor(c,p,catalog,'front'),'#abcdef');c.panelOverrides[p.panelId].frontFinishId=finishId;assert.equal(previewPanelColor(c,p,catalog,'front'),'#f1eee5');assert.equal(previewBoardColor(c,p,catalog),'#abcdef');
 delete c.panelOverrides;delete catalog.items.find(item=>item.id===bodyId).board_skus.color_code;assert.equal(previewPanelColor(c,p,catalog,'front'),'#ff0000');
});

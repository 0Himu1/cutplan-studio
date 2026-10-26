import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_CABINET,cabinetInput,initialHistory,edit,undo,redo,panelBounds,parseRecovery} from '../../src/lib/furniture/editor.ts';
import {calculateCabinet} from '../../src/lib/furniture/cabinet.ts';
import {cabinetCompartments,cabinetInterior,compartmentDefault,sectionDefault,validCompartments} from '../../src/lib/furniture/compartments.ts';
import {furnitureInput} from '../../src/lib/furniture/families.ts';
import {designSnapshot,saveInput} from '../../src/lib/projects/contracts.ts';
import {parseOverrides} from '../../src/lib/furniture/materials.ts';
import {nestFurniture} from '../../src/lib/furniture/nesting.ts';
import {PGlite} from '@electric-sql/pglite';
import {readFile,readdir} from 'node:fs/promises';
import {defaultFurniture} from '../../src/lib/furniture/families.ts';
import {furnitureSnapshot} from '../../src/lib/projects/contracts.ts';
import {formatMeasurement,panelDimensionText} from '../../src/lib/measurement.ts';

const base=()=>({...DEFAULT_CABINET,widthMm:1000,doorPosition:'overlay',compartmentMode:'manual',compartments:[compartmentDefault('left',473),compartmentDefault('right',473)]});
const valid=c=>{const result=calculateCabinet(c);assert.deepEqual(result.blockingErrors,[]);return result;};
test('3D dimension text follows display units and omits thickness',()=>{
 const panel={widthMm:800,heightMm:1200,thicknessMm:18},before=JSON.stringify(panel);
 assert.equal(formatMeasurement(25.4,'in'),'1 in 0 suta');assert.equal(formatMeasurement(3.175,'in'),'0 in 1 suta');
 assert.equal(panelDimensionText(panel,'mm'),'W 800 mm · H 1200 mm');assert.match(panelDimensionText(panel,'in'),/in .*suta/);assert.equal(JSON.stringify(panel),before);
});
test('legacy geometry stays unchanged and overlay doors remain beyond carcass depth',()=>{
 const old=valid(DEFAULT_CABINET),over=valid({...DEFAULT_CABINET,doorPosition:'overlay'});
 assert.equal(old.panels.length,over.panels.length);
 const door=over.panels.find(p=>p.role==='door'),bounds=panelBounds(door);
 assert.equal(bounds.min[2],DEFAULT_CABINET.depthMm+DEFAULT_CABINET.doorGapMm);
 assert.ok(door.widthMm>old.panels.find(p=>p.role==='door').widthMm);
});
test('manual compartments conserve widths, divider thickness and stable identities',()=>{
 const c=base(),calc=valid(c),partition=calc.panels.find(p=>p.role==='divider');
 assert.equal(cabinetInterior(c).width,964);assert.equal(partition.thicknessMm,18);
 assert.equal(partition.pose.positionMm[0],491);assert.equal(new Set(calc.panels.map(p=>p.panelId)).size,calc.panels.length);
 assert.equal(calc.panels.filter(p=>p.role==='door').length,4);
 const changed={...c,compartments:structuredClone(c.compartments)};changed.compartments[0].widthMm=474;
 assert.ok(calculateCabinet(changed).blockingErrors.length);
});
test('sections create independent shelves, drawer boxes, nested partitions and hardware rods',()=>{
 const c=base();c.compartments[0].sections=[{...sectionDefault('drawers'),heightMm:300,type:'drawer',external:true},{...sectionDefault('hanging'),type:'hanging'}];
 const split={...sectionDefault('split'),type:'divider',children:[compartmentDefault('a',227.5,0),compartmentDefault('b',227.5,0)]};split.children[0].sections=[{...sectionDefault('shelves'),type:'shelf',shelfCount:2,shelfMode:'adjustable'}];c.compartments[1].sections=[split];
 const calc=valid(c);assert.equal(calc.panels.filter(p=>p.role==='drawer').length,6);assert.equal(calc.hardware.length,1);assert.equal(calc.hardware[0].diameterMm,25);
 assert.equal(calc.panels.filter(p=>p.label.startsWith('Adjustable shelf')).length,2);
 assert.ok(calc.panels.filter(p=>p.panelId.startsWith('cabinet/layout/left/')&&p.role==='door').every(p=>panelBounds(p).min[1]>=336));
 assert.equal(calc.panels.some(p=>p.panelId.endsWith('/rod')),false);
 const plan=nestFurniture(c);assert.deepEqual(plan.errors,[]);assert.equal(plan.sheets.flatMap(s=>s.placements).length,calc.panels.length);
 assert.ok(calc.panels.filter(p=>p.role==='door').every(p=>p.hingeSide==='left'||p.hingeSide==='right'));
});
test('auto layout tracks cabinet width while preserving independent section configuration',()=>{
 const c={...base(),compartmentMode:'auto'};c.compartments[0].sections[0].type='hanging';const tree=cabinetCompartments(c);assert.equal(tree[0].sections[0].type,'hanging');assert.equal(tree.reduce((n,v)=>n+v.widthMm,0)+(tree.length-1)*18,964);valid(c);
 const larger={...c,widthMm:1800};assert.ok(cabinetCompartments(larger).length>=tree.length);valid(larger);
});
test('stacked drawers retain legacy head clearance and supports without overlapping parts',()=>{
 const c=base();c.compartments[0].sections=[{...sectionDefault('drawers'),type:'drawer',external:true,drawers:[{id:'a',heightMm:150,depthMm:0},{id:'b',heightMm:150,depthMm:0}]}];
 const calc=valid(c),parts=calc.panels.filter(p=>p.panelId.startsWith('cabinet/layout/left/'));
 assert.equal(parts.find(p=>p.componentId.endsWith('/a/left')).heightMm,118.6);assert.equal(parts.filter(p=>p.label.startsWith('Drawer support')).length,1);
 const boxes=parts.map(panelBounds);for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++)assert.ok([0,1,2].some(k=>boxes[i].max[k]<=boxes[j].min[k]+.0001||boxes[j].max[k]<=boxes[i].min[k]+.0001),parts[i].label+' intersects '+parts[j].label);
});
test('malformed trees, invalid drawers, overflow and unsupported dimensions fail closed',()=>{
 const c=base();for(const mutate of [v=>v.compartments[0].sections[0].heightMm=-1,v=>v.compartments[0].sections[0].extra=true,v=>v.compartments[0].sections.push({...sectionDefault('section-1')}),v=>v.compartments[0].sections[0].heightMm=100000,v=>v.compartments[0].sections[0].type='unexpected',v=>v.doorPosition='invalid',v=>v.compartments[0].sections[0].children.push(compartmentDefault('unexpected',100))]){const bad=structuredClone(c);mutate(bad);assert.ok(calculateCabinet(bad).blockingErrors.length);assert.equal(cabinetInput(bad),null);}
 const bad=base();bad.compartments[0].sections=[{...sectionDefault('drawer'),type:'drawer',drawers:[{id:'d',heightMm:3000,depthMm:10000}]}];assert.ok(calculateCabinet(bad).blockingErrors.length);
 const deep=base();let s=deep.compartments[0].sections[0];for(let i=0;i<5;i++){s.type='divider';s.children=[compartmentDefault('child',100,0)];s=s.children[0].sections[0];}assert.equal(validCompartments(deep.compartments),false);
});
test('configuration, undo, recovery and account snapshots retain the complete nested tree',()=>{
 const c=base();assert.deepEqual(cabinetInput(c),c);assert.deepEqual(furnitureInput(c),c);
 const history=edit(initialHistory(DEFAULT_CABINET),c);assert.deepEqual(undo(history).present,DEFAULT_CABINET);assert.deepEqual(redo(undo(history)).present,c);
 assert.deepEqual(parseRecovery(JSON.stringify({schemaVersion:1,baseVersion:1,input:c})).input,c);
 const saved=saveInput({operationId:'00000000-0000-4000-8000-000000000901',sourceDraftId:'00000000-0000-4000-8000-000000000902',expectedVersion:0,snapshot:designSnapshot('Compartments',c)});assert.deepEqual(saved.snapshot.cabinet,c);
});
test('layout materials accept stable part IDs and reject inconsistent physical thickness',()=>{
 const c=base(),p=valid(c).panels.find(p=>p.role==='divider'),assignment={boardId:'00000000-0000-4000-8000-000000000501',thicknessMm:18,stockWidthMm:1219,stockHeightMm:2438};assert.ok(parseOverrides({[p.panelId]:assignment}));valid({...c,panelOverrides:{[p.panelId]:assignment}});assert.ok(calculateCabinet({...c,panelOverrides:{[p.panelId]:{...assignment,thicknessMm:25}}}).blockingErrors.length);
});
test('SQL migration accepts old families and nested cabinets while preserving private saves and immutable revisions',async()=>{
 const db=new PGlite();try{
  await db.exec("create role anon;create role authenticated;create role service_role;create schema auth;create table auth.users(id uuid primary key,email text);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;");
  for(const file of (await readdir(new URL('../../supabase/migrations/',import.meta.url))).filter(f=>f.endsWith('.sql')).sort())await db.exec(await readFile(new URL('../../supabase/migrations/'+file,import.meta.url),'utf8'));
  const validate=async snapshot=>(await db.query('select public.cutplan_valid_project_snapshot($1::jsonb) valid',[JSON.stringify(snapshot)])).rows[0].valid;
  for(const f of ['cabinet','shoe_rack','bookshelf','table'])assert.equal(await validate(furnitureSnapshot('Old revision',defaultFurniture(f))),true);
  const c=base(),snapshot=designSnapshot('New layout',c);assert.equal(await validate(snapshot),true);
  const framed={...c,panelOverrides:{'cabinet/layout/right/door-frame/partition':{grainAxis:'height'}}};assert.equal(await validate(designSnapshot('Framed layout',framed)),true);
  const partial=base();partial.compartments[0].sections[0].heightMm=300;assert.equal(await validate(designSnapshot('Manual empty space',partial)),true);
  for(const mutate of [v=>v.cabinet.compartments[0].sections[0].extra=true,v=>v.cabinet.doorPosition='unsupported',v=>v.cabinet.compartments[0].doorCount=3,v=>v.cabinet.compartments[0].sections[0].heightMm=-1]){const bad=structuredClone(snapshot);mutate(bad);assert.equal(await validate(bad),false);}
  const id=valid(c).panels.find(p=>p.role==='divider').panelId;assert.equal(await validate(designSnapshot('Material', {...c,panelOverrides:{[id]:{grainAxis:'width'}}})),true);
  const owner='00000000-0000-4000-8000-000000000001',operation='00000000-0000-4000-8000-000000000201',source='00000000-0000-4000-8000-000000000101',project='0123456789abcdef01234567',hash='a'.repeat(64);
  await db.query('insert into auth.users(id) values($1)',[owner]);
  const call=()=>db.query('select public.cutplan_begin_project_save($1,$2,$3,$4,0,$5,$5,$6::jsonb) value',[owner,operation,project,source,hash,JSON.stringify(snapshot)]);
  const op=(await call()).rows[0].value;assert.equal((await call()).rows[0].value.revision_id,op.revision_id);await db.query('select public.cutplan_finish_project_save($1,$2,$3)',[owner,operation,hash]);
  await assert.rejects(db.exec("update public.design_revision_index set engine_version='changed'"),/immutable_revision/);
  await db.exec('set role authenticated');await assert.rejects(call(),/permission denied/);await assert.rejects(db.query('select public.cutplan_valid_compartments($1::jsonb)',[JSON.stringify(c.compartments)]),/permission denied/);
 }finally{await db.close();}
});

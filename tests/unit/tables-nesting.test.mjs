import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {defaultFurniture,calculateFurniture,furnitureInput} from '../../src/lib/furniture/families.ts';
import {panelBounds} from '../../src/lib/furniture/editor.ts';
import {nestFurniture,validateNesting} from '../../src/lib/furniture/nesting.ts';
import {furnitureSnapshot,saveInput} from '../../src/lib/projects/contracts.ts';
test('panel tables have exact non-overlapping bounds, variant envelopes and strict assignments',()=>{
 const input=defaultFurniture('table'),c=calculateFurniture(input);assert.deepEqual(c.blockingErrors,[]);assert.equal(c.panels.length,4);
 assert.deepEqual(c.panels.map(p=>[p.widthMm,p.heightMm,p.thicknessMm]),[[1200,600,25],[500,725,25],[500,725,25],[1050,200,25]]);
 const boxes=c.panels.map(panelBounds);for(const box of boxes)for(let i=0;i<3;i++){assert.ok(box.min[i]>=-.0001);assert.ok(box.max[i]<=[1200,750,600][i]+.0001);}
 for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++)assert.ok([0,1,2].some(k=>boxes[i].max[k]<=boxes[j].min[k]+.0001||boxes[j].max[k]<=boxes[i].min[k]+.0001));
 for(const change of [{doorCount:1},{shelfCount:1},{drawerCount:1},{tableKind:'round'},{widthMm:9999},{bodyThicknessMm:12},{panelOverrides:{'cabinet/top':{}}},{panelOverrides:null}])assert.equal(furnitureInput({...input,...change}),null);
 assert.ok(furnitureInput({...input,tableKind:'side',widthMm:600,heightMm:500,depthMm:500}));assert.ok(furnitureInput({...input,tableKind:'dining',widthMm:1500,depthMm:800}));
 const snapshot=furnitureSnapshot('Table',input);assert.deepEqual(saveInput({operationId:'00000000-0000-4000-8000-000000000201',sourceDraftId:'00000000-0000-4000-8000-000000000101',expectedVersion:0,snapshot}).snapshot,snapshot);
});
test('nesting conserves all instances, respects material groups, grain and spacing and is deterministic',()=>{
 for(const family of ['cabinet','shoe_rack','bookshelf','table']){const input=defaultFurniture(family),plan=nestFurniture(input);assert.deepEqual(plan.errors,[]);assert.deepEqual(plan,nestFurniture(input));assert.equal(plan.sheets.flatMap(s=>s.placements).length+plan.unplaced.length,calculateFurniture(input).panels.length);assert.ok(plan.utilization>0&&plan.utilization<=1);}
 const input={...defaultFurniture('table'),stockWidthMm:500,stockHeightMm:500,grainAxis:'width'},plan=nestFurniture(input);assert.equal(plan.unplaced.length,4);assert.equal(plan.sheets.length,0);
 const assigned={...defaultFurniture('table'),panelOverrides:{'table/top':{grainAxis:'width'},'table/back':{grainAxis:'height'}}};const grouped=nestFurniture(assigned);assert.equal(grouped.groups.length,3);assert.ok(grouped.sheets.flatMap(s=>s.placements).filter(p=>['table/top','table/back'].includes(p.panelId)).every(p=>p.rotation===0));
 const corrupt=structuredClone(nestFurniture(defaultFurniture('table')));corrupt.sheets[0].placements.push(corrupt.sheets[0].placements[0]);assert.ok(validateNesting(corrupt,calculateFurniture(defaultFurniture('table')).panels).length);
 assert.ok(nestFurniture(defaultFurniture('table'),NaN).errors.length);assert.ok(nestFurniture(defaultFurniture('table'),-1).errors.length);
});
test('table migration retains old validators and rejects malformed or cross-family snapshots',async()=>{
 const db=new PGlite();try{await db.exec('create role anon;create role authenticated;create role service_role;create schema auth;create table auth.users(id uuid primary key,email text);create function auth.uid() returns uuid language sql stable as $$select null::uuid$$;');
 for(const file of (await readdir(new URL('../../supabase/migrations/',import.meta.url))).filter(f=>f.endsWith('.sql')).sort())await db.exec(await readFile(new URL('../../supabase/migrations/'+file,import.meta.url),'utf8'));
 const valid=async p=>(await db.query('select public.cutplan_valid_project_snapshot($1::jsonb) valid',[JSON.stringify(p)])).rows[0].valid;
 for(const family of ['cabinet','shoe_rack','bookshelf','table'])assert.equal(await valid(furnitureSnapshot('Review',defaultFurniture(family))),true);
 const snapshot=furnitureSnapshot('Review',defaultFurniture('table'));for(const change of [{doorCount:1},{tableKind:'round'},{family:'bookshelf'},{widthMm:99999},{drawerCount:2}])assert.equal(await valid({...snapshot,configuration:{...snapshot.configuration,...change}}),false);
 await db.exec('set role authenticated');await assert.rejects(db.query('select public.cutplan_valid_project_snapshot($1::jsonb)',[JSON.stringify(snapshot)]),/permission denied/);
 }finally{await db.close();}
});

test('independent nesting audit detects collisions, missing instances and incompatible stock',()=>{
 const input=defaultFurniture('table'),panels=calculateFurniture(input).panels,plan=nestFurniture(input);
 const wrongStock=structuredClone(plan);wrongStock.sheets[0].stockKey='foreign';assert.ok(validateNesting(wrongStock,panels,input).includes('Panel is assigned to incompatible stock.'));
 const missing=structuredClone(plan);missing.sheets[0].placements.pop();assert.ok(validateNesting(missing,panels,input).includes('Missing panel instances.'));
 const overlap=structuredClone(plan),placements=overlap.sheets[0].placements;placements[1].x=placements[0].x;placements[1].y=placements[0].y;assert.ok(validateNesting(overlap,panels,input).includes('Panel collision or insufficient spacing.'));
 for(const kerf of [0,.5,4,30])for(const margin of [0,10,100,700]){const result=nestFurniture(input,kerf,margin);assert.deepEqual(result.errors,[]);assert.equal(result.sheets.flatMap(s=>s.placements).length+result.unplaced.length,4);}
 const grain={...input,grainAxis:'width'};assert.ok(nestFurniture(grain).unplaced.some(p=>p.panelId==='table/top'));assert.equal(nestFurniture(grain,4,0).unplaced.length,0);
});

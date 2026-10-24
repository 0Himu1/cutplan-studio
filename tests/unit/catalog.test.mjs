import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {DEFAULT_CABINET} from '../../src/lib/furniture/editor.ts';
import {designSnapshot} from '../../src/lib/projects/contracts.ts';
import {catalogInput} from '../../src/lib/catalog/contracts.ts';
test('catalog input rejects unsafe prices and unreviewed publishing',()=>{
 const base={id:'00000000-0000-4000-8000-000000000001',version:1};
 assert.equal(catalogInput({...base,action:'price',amount:'NaN',unit:'sheet',reason:'new price'}),null);
 assert.equal(catalogInput({...base,action:'publish',reviewed:false}),null);
 assert.ok(catalogInput({...base,action:'price',amount:'1250.50',unit:'sheet',reason:'Supplier confirmed'}));
});
test('catalog transactions deny customers, preserve prices, reject stale edits and retire without loss',async()=>{
 const db=new PGlite();const owner='00000000-0000-4000-8000-000000000001',customer='00000000-0000-4000-8000-000000000002';
 try{
 await db.exec(`create role anon;create role authenticated;create role service_role;create schema auth;grant usage on schema public,auth to authenticated,anon;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;insert into auth.users values('${owner}'),('${customer}');`);
 for(const name of ['202610210001_profiles_and_memberships.sql','202610220001_cloud_projects.sql','202610220002_material_catalog.sql','202610220003_catalog_sources.sql','202610220004_catalog_operations.sql','202610220005_cabinet_designs.sql','202610220006_panel_materials.sql'])await db.exec(await readFile(new URL('../../supabase/migrations/'+name,import.meta.url),'utf8'));
 const snapshot=designSnapshot('Material schema test',{...DEFAULT_CABINET,panelOverrides:{'cabinet/side-left':{boardId:owner,thicknessMm:24,stockWidthMm:1219,stockHeightMm:2438,grainAxis:'none',edges:{top:customer}}}});
 assert.equal((await db.query('select public.cutplan_valid_project_snapshot($1::jsonb) valid',[JSON.stringify(snapshot)])).rows[0].valid,true);
 const forged=structuredClone(snapshot);forged.cabinet.panelOverrides['cabinet/side-left'].edges.top='not-a-uuid';
 assert.equal((await db.query('select public.cutplan_valid_project_snapshot($1::jsonb) valid',[JSON.stringify(forged)])).rows[0].valid,false);
 await db.exec(`insert into public.staff_memberships(user_id,role) values('${owner}','admin');set role authenticated;select set_config('request.jwt.claim.sub','${customer}',false);`);
 const call=async p=>(await db.query('select public.cutplan_catalog_change($1::jsonb) id',[JSON.stringify(p)])).rows[0].id;
 const create={action:'create',kind:'board',code:'TEST-18',name:'Test board',details:{thickness_mm:18,sheet_width_mm:1220,sheet_height_mm:2440,grain_direction:'none'}};
 await assert.rejects(call(create),/catalog_forbidden/);
 await db.exec(`select set_config('request.jwt.claim.sub','${owner}',false);`);
 const id=await call(create);
 await assert.rejects(call({action:'publish',id,version:1,reviewed:true}),/catalog_price_required/);
 await call({action:'price',id,version:1,amount:'2000.00',unit:'sheet',reason:'Initial supplier price'});
 await assert.rejects(call({action:'publish',id,version:1,reviewed:true}),/catalog_conflict/);
 await call({action:'publish',id,version:2,reviewed:true});
 await call({action:'price',id,version:3,amount:'2200.00',unit:'sheet',reason:'Updated supplier price'});
 assert.equal((await db.query('select * from public.catalog_price_versions')).rows.length,2);
 assert.equal((await db.query('select * from public.catalog_price_versions where effective_until is null')).rows.length,1);
 await db.exec('reset role;');
 await assert.rejects(db.query(`update public.catalog_price_versions set price_bdt=999`),/catalog_price_immutable/);
 await db.exec('set role authenticated;');
 const finish=await call({action:'create',kind:'finish',code:'FINISH-TEST',name:'Test finish',details:{surface:'laminate',color_code:'#FFFFFF'}});
 const edging=await call({action:'create',kind:'edging',code:'EDGE-TEST',name:'Test PVC edge',details:{material:'pvc',thickness_mm:1.2,width_mm:22}});
 await assert.rejects(call({action:'price',id:edging,version:1,amount:'100',unit:'piece',reason:'Supplier review'}),/catalog_edging_unit/);
 await call({action:'price',id:edging,version:1,amount:'100',unit:'meter',reason:'Supplier review'});
 await call({action:'publish',id:edging,version:2,reviewed:true});
 assert.equal((await db.query('select is_sellable from public.catalog_items where id=$1',[edging])).rows[0].is_sellable,true);
 await call({action:'compatibility',id,version:4,finishId:finish,enabled:true});
 assert.equal((await db.query('select * from public.board_finish_compatibility')).rows.length,1);
 await assert.rejects(call({action:'compatibility',id:finish,version:1,finishId:id,enabled:true}),/catalog_compatibility/);
 await call({action:'retire',id,version:5});
 assert.equal((await db.query('select * from public.catalog_price_versions where item_id=$1',[id])).rows.length,2);
 await assert.rejects(call({action:'publish',id,version:6,reviewed:true}),/catalog_retired/);
 await db.exec(`select set_config('request.jwt.claim.sub','${customer}',false);`);
 assert.equal((await db.query('select * from public.catalog_items')).rows.length,0);
 await assert.rejects(db.query(`update public.catalog_items set is_sellable=true`),/permission denied/);
 }finally{await db.close();}
});



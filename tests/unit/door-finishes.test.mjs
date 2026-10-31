import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {compatibleFinishes,materialForPanel,physicalMaterial,parseOverrides,validateMaterials,previewPanelColor} from '../../src/lib/furniture/materials.ts';
import {catalogInput} from '../../src/lib/catalog/contracts.ts';
import {defaultFurniture,calculateFurniture,furnitureInput} from '../../src/lib/furniture/families.ts';
import {furnitureSnapshot} from '../../src/lib/projects/contracts.ts';
import {snapshotHash} from '../../src/lib/projects/identity.ts';

const board='00000000-0000-4000-8000-000000000001',finish='00000000-0000-4000-8000-000000000002',other='00000000-0000-4000-8000-000000000003';
const catalog={items:[{id:board,kind:'board',board_skus:{thickness_mm:18,sheet_width_mm:1219,sheet_height_mm:2438,grain_direction:'none'}},{id:finish,kind:'finish',finish_skus:{surface:'laminate',color_code:'#3355aa',texture_url:'https://example.com/formica.webp'}},{id:other,kind:'finish',finish_skus:{surface:'laminate',color_code:'#ffffff'}}],compatibility:[{board_item_id:board,finish_item_id:finish}]};
const material={boardId:board,thicknessMm:18,stockWidthMm:1219,stockHeightMm:2438,grainAxis:'none'};

test('door finishing retains inherited board/back finish, affects one front and survives canonical save',()=>{
 const input={...defaultFurniture('cabinet'),materialDefaults:{front:{...material,backFinishId:finish}}};
 const panels=calculateFurniture(input).panels,door=panels.find(p=>p.role==='door'),otherDoor=panels.find(p=>p.role==='door'&&p.panelId!==door.panelId);
 const assignment={...physicalMaterial(materialForPanel(input,door)),frontFinishId:finish};
 const next={...input,panelOverrides:{[door.panelId]:assignment}};
 assert.deepEqual(compatibleFinishes(catalog,board).map(f=>f.id),[finish]);assert.deepEqual(compatibleFinishes(catalog,undefined),[]);
 assert.deepEqual(validateMaterials(next.panelOverrides,catalog),[]);
 assert.ok(parseOverrides(next.panelOverrides));assert.equal(materialForPanel(next,door).backFinishId,finish);
 assert.equal(materialForPanel(next,otherDoor).frontFinishId,undefined);
 assert.equal(previewPanelColor(next,door,catalog,'front'),'#3355aa');
 const parsed=furnitureInput(JSON.parse(JSON.stringify(next)));assert.ok(parsed);
 assert.equal(snapshotHash(furnitureSnapshot('Formica test',parsed)),snapshotHash(furnitureSnapshot('Formica test',next)));
 assert.deepEqual(calculateFurniture(next).panels.map(p=>[p.panelId,p.widthMm,p.heightMm,p.thicknessMm]),panels.map(p=>[p.panelId,p.widthMm,p.heightMm,p.thicknessMm]));
 assert.ok(validateMaterials({[door.panelId]:{...assignment,frontFinishId:other}},catalog).length);
});

test('finish catalog accepts HTTPS images and rejects executable, malformed and credential-bearing URLs',()=>{
 const input={action:'create',kind:'finish',code:'HPL-01',name:'Formica blue',details:{surface:'laminate',color_code:'#3355aa',texture_url:'https://example.com/formica.webp'}};
 assert.ok(catalogInput(input));
 for(const url of ['javascript:alert(1)','file:///tmp/swatch.png','data:image/png;base64,a','http://example.com/a.png','https://user:password@example.com/a.png','not-a-url','https://example.com/'+'x'.repeat(2048)])assert.equal(catalogInput({...input,details:{...input.details,texture_url:url}}),null);
});

test('finish image migration adds a separate public WebP bucket without changing private photos',async()=>{
 const db=new PGlite();try{
  await db.exec("create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);insert into storage.buckets values('private-photos','private-photos',false,10485760,array['image/webp']);");
  const sql=await readFile(new URL('../../supabase/migrations/202610310001_catalog_finish_images.sql',import.meta.url),'utf8');await db.exec(sql);await db.exec(sql);
  const rows=(await db.query('select * from storage.buckets order by id')).rows;
  assert.equal(rows.length,2);assert.equal(rows[0].id,'catalog-finishes');assert.equal(rows[0].public,true);assert.deepEqual(rows[0].allowed_mime_types,['image/webp']);assert.equal(rows[1].public,false);
  await db.exec("update storage.buckets set public=false where id='catalog-finishes'");await assert.rejects(db.exec(sql),/catalog_finish_bucket_configuration_conflict/);await db.exec('rollback');
 }finally{await db.close();}
});

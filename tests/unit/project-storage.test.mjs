import test from 'node:test';
import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';
import {readFile,readdir} from 'node:fs/promises';
import {canonicalSnapshot,snapshotHash,projectIdentity,requestHash} from '../../src/lib/projects/identity.ts';
import {defaultFurniture} from '../../src/lib/furniture/families.ts';
import {furnitureSnapshot} from '../../src/lib/projects/contracts.ts';

const owner='00000000-0000-4000-8000-000000000001',other='00000000-0000-4000-8000-000000000002';
const uuid=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const shell=name=>({schemaVersion:1,name,furnitureType:'cabinet',stage:'project-shell'});
const migration=name=>readFile(new URL('../../supabase/migrations/'+name,import.meta.url),'utf8');
async function failsMigration(db,name,pattern){await assert.rejects(db.exec(await migration(name)),pattern);await db.exec('rollback');}

test('Supabase project storage preserves history, denies unsafe cutover and saves atomically',async t=>{
 const db=new PGlite();
 try{
  await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;
   grant usage on schema public,auth to anon,authenticated,service_role;create table auth.users(id uuid primary key);
   create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
   insert into auth.users values('${owner}'),('${other}');`);
  for(const file of (await readdir(new URL('../../supabase/migrations/',import.meta.url))).filter(f=>f.endsWith('.sql')&&f<'202610290002').sort())await db.exec(await migration(file));
  const snapshot=shell('Preserved history'),hash=snapshotHash(snapshot),project=projectIdentity(owner,uuid(100)),op=uuid(200);
  const reserve=async(id,source,operation,payload)=> (await db.query('select public.cutplan_begin_project_save($1,$2,$3,$4,0,$5,$6,$7::jsonb) op',[owner,operation,id,source,'b'.repeat(64),snapshotHash(payload),JSON.stringify(payload)])).rows[0].op;
  const legacy=await reserve(project,uuid(100),op,snapshot);
  await db.query('select public.cutplan_finish_project_save($1,$2,$3)',[owner,op,hash]);
  const backfill=async(who=owner,payload=snapshot,canonical=canonicalSnapshot(payload))=>db.query('select public.cutplan_backfill_project_snapshot($1,$2,$3,$4::jsonb,$5,$6,$7)',[who,project,legacy.revision_id,JSON.stringify(payload),canonical,hash,new Date(legacy.created_at).toISOString()]);
  await t.test('cutover refuses missing history; backfill verifies content/owner/hash and is idempotent',async()=>{
   assert.equal((await db.query('select public.cutplan_project_storage_ready() ready')).rows[0].ready,false);
   await failsMigration(db,'202610290003_finalize_project_storage.sql',/cutover_missing_snapshot/);
   await assert.rejects(backfill(other),/project_missing/);
   await assert.rejects(backfill(owner,{...snapshot,name:'Tampered'}),/invalid_snapshot/);
   await assert.rejects(backfill(owner,snapshot,JSON.stringify(snapshot,null,2)),/invalid_snapshot/);
   for(const [payload,text] of [[null,'null'],[snapshot,'not-json'],[{...snapshot,name:'x'.repeat(140000)},'x'.repeat(140000)]]){
    assert.equal((await db.query('select public.cutplan_valid_snapshot_content($1::jsonb,$2,$3) valid',[JSON.stringify(payload),text,hash])).rows[0].valid,false);
   }
   const unrelated=projectIdentity(other,uuid(999));
   await assert.rejects(db.query('select public.cutplan_backfill_project_snapshot($1,$2,$3,$4::jsonb,$5,$6,$7)',[owner,unrelated,legacy.revision_id,JSON.stringify(snapshot),canonicalSnapshot(snapshot),hash,legacy.created_at]),/project_missing/);
   await backfill();await backfill();
   assert.equal((await db.query('select count(*)::int n from public.project_design_snapshots')).rows[0].n,1);
   await assert.rejects(db.exec("update public.project_design_snapshots set snapshot_hash=repeat('c',64)"),/immutable_snapshot/);
   await assert.rejects(db.exec('delete from public.project_design_snapshots'),/immutable_snapshot/);
  });
  const pendingSnapshot=shell('Interrupted save'),pendingProject=projectIdentity(owner,uuid(101)),pending=await reserve(pendingProject,uuid(101),uuid(201),pendingSnapshot);
  await db.exec(await migration('202610290002_atomic_project_storage.sql'));
  await t.test('legacy pending save is recovered before finalization, with original revision identity',async()=>{
   await failsMigration(db,'202610290003_finalize_project_storage.sql',/cutover_pending_save/);
   await db.exec('set role service_role');
   await assert.rejects(reserve(projectIdentity(owner,uuid(102)),uuid(102),uuid(202),shell('Old writer')),/permission denied/);
   const recover=(canonical=canonicalSnapshot(pendingSnapshot))=>db.query('select public.cutplan_recover_project_save($1,$2,$3,$4) pr',[owner,pendingProject,pending.id,canonical]);
   await assert.rejects(recover('false'),/invalid_snapshot/);
   assert.equal((await recover()).rows[0].pr.current_revision_id,pending.revision_id);
   assert.equal((await recover()).rows[0].pr.version,1);
   await db.exec('reset role');
   await db.exec(await migration('202610290003_finalize_project_storage.sql'));
   assert.equal((await db.query('select public.cutplan_project_storage_ready() ready')).rows[0].ready,true);
   await db.exec('set role service_role');await assert.rejects(backfill(),/permission denied/);await db.exec('reset role');
  });
  const save=async(input,who=owner)=>{
   const id=projectIdentity(who,input.sourceDraftId);
   return (await db.query('select public.cutplan_save_project($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9) result',[
    who,input.operationId,id,input.sourceDraftId,input.expectedVersion,requestHash(who,input,id),snapshotHash(input.snapshot),JSON.stringify(input.snapshot),canonicalSnapshot(input.snapshot),
   ])).rows[0].result;
  };
  await t.test('all families save/reopen; response-loss retries and initial claims are idempotent',async()=>{
   await db.exec('set role service_role');
   for(const [i,family] of ['cabinet','shoe_rack','bookshelf','table'].entries()){
    const input={sourceDraftId:uuid(300+i),operationId:uuid(400+i),expectedVersion:0,snapshot:furnitureSnapshot('Atomic '+family,defaultFurniture(family))};
    const result=await save(input),again=await save(input);
    assert.equal(result.project.version,1);assert.equal(again.project.current_revision_id,result.project.current_revision_id);
    const row=(await db.query('select snapshot,canonical_snapshot,snapshot_hash from public.project_design_snapshots where revision_id=$1',[result.project.current_revision_id])).rows[0];
    assert.equal(snapshotHash(row.snapshot),row.snapshot_hash);assert.equal(row.canonical_snapshot,canonicalSnapshot(input.snapshot));
    assert.equal((await save({...input,operationId:uuid(500+i)})).alreadyClaimed,true);
    await assert.rejects(save({...input,snapshot:{...input.snapshot,name:'Changed retry'}}),/operation_conflict/);
   }
   await db.exec('reset role');
  });
  await t.test('stale competing saves lose cleanly and transaction errors leave no orphan revisions',async()=>{
   const source=uuid(300),id=projectIdentity(owner,source),input={sourceDraftId:source,expectedVersion:1,snapshot:furnitureSnapshot('Second cabinet',defaultFurniture('cabinet'))};
   const attempts=await Promise.allSettled([save({...input,operationId:uuid(600)}),save({...input,operationId:uuid(601)})]);
   assert.equal(attempts.filter(r=>r.status==='fulfilled').length,1);assert.match(attempts.find(r=>r.status==='rejected').reason.message,/version_conflict/);
   const before=(await db.query('select count(*)::int n from public.design_revision_index')).rows[0].n;
   await db.exec(`create function public.inject_failure() returns trigger language plpgsql as $$begin if new.name='Force rollback' then raise exception 'injected_failure';end if;return new;end$$;
    create trigger inject_failure before update on public.projects for each row execute function public.inject_failure();`);
   await assert.rejects(save({...input,expectedVersion:2,operationId:uuid(602),snapshot:{...input.snapshot,name:'Force rollback'}}),/injected_failure/);
   assert.equal((await db.query('select count(*)::int n from public.design_revision_index')).rows[0].n,before);
   assert.equal((await db.query('select version from public.projects where id=$1',[id])).rows[0].version,2);
   assert.equal((await db.query('select count(*)::int n from public.project_save_operations where state=\'pending\'')).rows[0].n,0);
  });
  await t.test('browser roles cannot read bodies or call privileged storage RPCs; metadata stays owner-scoped',async()=>{
   for(const role of ['anon','authenticated']){
    await db.exec('set role '+role);
    await assert.rejects(db.query('select * from public.project_design_snapshots'),/permission denied/);
    await assert.rejects(save({sourceDraftId:uuid(777),operationId:uuid(778),expectedVersion:0,snapshot:shell('Forbidden')}),/permission denied/);
    await assert.rejects(db.query('select public.cutplan_project_storage_ready()'),/permission denied/);
    await db.exec('reset role');
   }
   await db.exec('set role authenticated');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[other]);
   assert.equal((await db.query('select id from public.projects')).rows.length,0);await db.exec('reset role');
  });
 }finally{await db.close();}
});

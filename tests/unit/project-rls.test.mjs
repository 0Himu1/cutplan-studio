import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

test('Phase 4 migration enforces ownership, immutable revisions, conflicts and retry idempotency', async () => {
  const db=new PGlite();
  const first='00000000-0000-4000-8000-000000000001', second='00000000-0000-4000-8000-000000000002';
  const source='00000000-0000-4000-8000-000000000101', operation='00000000-0000-4000-8000-000000000201';
  const project='0123456789abcdef01234567', hash='a'.repeat(64), request='b'.repeat(64);
  const payload=JSON.stringify({schemaVersion:1,name:'Reading cabinet',furnitureType:'cabinet',stage:'project-shell'}).replaceAll("'","''");
  try {
    await db.exec(`create role anon; create role authenticated; create role service_role; create schema auth;
      grant usage on schema public,auth to anon,authenticated,service_role;
      create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      insert into auth.users values('${first}'),('${second}');`);
    await db.exec(await readFile(new URL('../../supabase/migrations/202610220001_cloud_projects.sql',import.meta.url),'utf8'));
    const begin=`select public.cutplan_begin_project_save('${first}','${operation}','${project}','${source}',0,'${request}','${hash}','${payload}'::jsonb) value`;
    const reserved=(await db.query(begin)).rows[0].value;
    assert.equal(reserved.state,'pending'); assert.equal(reserved.expected_version,0);
    assert.equal((await db.query(begin)).rows[0].value.revision_id,reserved.revision_id);
    await assert.rejects(db.query(begin.replace(request,'c'.repeat(64))),/operation_conflict/);
    await assert.rejects(db.query(`select public.cutplan_begin_project_save('${first}','00000000-0000-4000-8000-000000000202','${project}','${source}',0,'${'d'.repeat(64)}','${hash}','${payload}'::jsonb)`),/save_pending/);
    await assert.rejects(db.query(`select public.cutplan_begin_project_save('${first}','00000000-0000-4000-8000-000000000203','${project}','${source}',0,'${'e'.repeat(64)}','${hash}',jsonb_build_object('schemaVersion',1,'name','x','furnitureType','cabinet','stage','project-shell','role','admin'))`),/invalid_save/);
    await db.query(`select public.cutplan_finish_project_save('${first}','${operation}','${hash}')`);
    await db.query(`select public.cutplan_finish_project_save('${first}','${operation}','${hash}')`);
    assert.deepEqual((await db.query(`select version,sync_status,current_revision_id is not null head from public.projects where id='${project}'`)).rows,[{version:1,sync_status:'ready',head:true}]);
    assert.deepEqual((await db.query(`select state,payload is null payload_cleared from public.project_save_operations where id='${operation}'`)).rows,[{state:'ready',payload_cleared:true}]);
    await assert.rejects(db.query(`update public.design_revision_index set snapshot_hash='${'f'.repeat(64)}' where id='${reserved.revision_id}'`),/immutable_revision/);
    await assert.rejects(db.query(`delete from public.design_revision_index where id='${reserved.revision_id}'`),/immutable_revision/);

    await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub','${second}',false);`);
    assert.equal((await db.query('select * from public.projects')).rows.length,0);
    assert.equal((await db.query('select * from public.design_revision_index')).rows.length,0);
    await assert.rejects(db.query('select * from public.project_save_operations'),/permission denied/);
    await assert.rejects(db.query(`select public.cutplan_begin_project_save('${second}','00000000-0000-4000-8000-000000000204','fedcba987654321001234567','00000000-0000-4000-8000-000000000102',0,'${request}','${hash}','${payload}'::jsonb)`),/permission denied/);
    await db.exec(`select set_config('request.jwt.claim.sub','${first}',false);`);
    assert.equal((await db.query('select * from public.projects')).rows.length,1);
    assert.equal((await db.query('select * from public.design_revision_index')).rows.length,1);
    await db.exec('set role anon;');
    await assert.rejects(db.query('select * from public.projects'),/permission denied/);
  } finally { await db.close(); }
});

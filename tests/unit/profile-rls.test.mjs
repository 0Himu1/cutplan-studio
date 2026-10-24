import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

test('migration executes and PostgreSQL restricts profiles and memberships by identity', async () => {
  const db = new PGlite();
  const first='00000000-0000-4000-8000-000000000001';
  const second='00000000-0000-4000-8000-000000000002';
  try {
    // Minimal local equivalents of Supabase-managed roles and auth.uid; no network or live data.
    await db.exec(`create role anon; create role authenticated; create schema auth;
      grant usage on schema public, auth to anon, authenticated;
      create table auth.users (id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      insert into auth.users(id) values ('${first}');`);
    await db.exec(await readFile(new URL('../../supabase/migrations/202610210001_profiles_and_memberships.sql',import.meta.url),'utf8'));
    // Existing identity backfilled; newly inserted identity receives its profile through the trigger.
    await db.exec(`insert into auth.users(id) values ('${second}');
      insert into public.staff_memberships(user_id,role) values ('${second}','operator');`);
    assert.equal((await db.query('select * from public.profiles')).rows.length,2);
    await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub','${first}',false);`);
    assert.deepEqual((await db.query('select id from public.profiles')).rows,[{id:first}]);
    assert.equal((await db.query('select * from public.staff_memberships')).rows.length,0);
    assert.equal((await db.query(`update public.profiles set display_name='Other' where id='${second}' returning id`)).rows.length,0);
    assert.equal((await db.query(`update public.profiles set display_name='My profile' where id='${first}' returning display_name`)).rows[0].display_name,'My profile');
    await assert.rejects(db.query(`update public.profiles set id='${second}' where id='${first}'`),/permission denied/);
    await assert.rejects(db.query(`insert into public.staff_memberships(user_id,role) values ('${first}','admin')`),/permission denied/);
    await assert.rejects(db.query(`update public.staff_memberships set role='admin' where user_id='${second}'`),/permission denied/);
    await assert.rejects(db.query(`delete from public.profiles where id='${first}'`),/permission denied/);
    await assert.rejects(db.query(`update public.profiles set display_name=repeat('x',81) where id='${first}'`),/check constraint/);
    await assert.rejects(db.query(`update public.profiles set phone='-------' where id='${first}'`),/check constraint/);
    await db.exec(`select set_config('request.jwt.claim.sub','${second}',false);`);
    assert.deepEqual((await db.query('select role from public.staff_memberships')).rows,[{role:'operator'}]);
    await db.exec(`set role anon;`);
    await assert.rejects(db.query('select * from public.profiles'),/permission denied/);
    await assert.rejects(db.query('select * from public.staff_memberships'),/permission denied/);
  } finally { await db.close(); }
});

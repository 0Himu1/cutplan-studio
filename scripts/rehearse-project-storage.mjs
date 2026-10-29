import {PGlite} from '@electric-sql/pglite';
import {readFile,readdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {readVerifiedArchive,verifyTransfer} from './project-storage-transfer.mjs';
import {canonicalSnapshot,snapshotHash} from '../src/lib/projects/identity.ts';

const directory=process.argv[process.argv.indexOf('--input')+1];
if(!process.argv.includes('--input')||!directory)throw new Error('Use --input <private archive directory>. No hosted database is contacted.');
const source=await readVerifiedArchive(directory),sql=JSON.parse(await readFile(resolve(directory,'sql-before.json'),'utf8'));
const report=verifyTransfer(source,sql),db=new PGlite();let restored;
try{
 await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;
  grant usage on schema public,auth to anon,authenticated,service_role;create table auth.users(id uuid primary key);
  create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;`);
 const files=(await readdir(new URL('../supabase/migrations/',import.meta.url))).filter(f=>f.endsWith('.sql')).sort();
 for(const file of files.filter(f=>f<'202610290002'))await db.exec(await readFile(new URL('../supabase/migrations/'+file,import.meta.url),'utf8'));
 const owners=[...new Set(sql.projects.map(p=>p.owner_user_id))];
 for(const owner of owners)await db.query('insert into auth.users values($1)',[owner]);
 await db.exec('begin;set constraints all deferred');
 for(const [table,rows] of [['projects',sql.projects],['design_revision_index',sql.revisions],['project_save_operations',sql.operations]])
  await db.query(`insert into public.${table} select * from jsonb_populate_recordset(null::public.${table},$1::jsonb)`,[JSON.stringify(rows)]);
 await db.exec('commit');
 for(let repeat=0;repeat<2;repeat++)for(const row of source.revisions)await db.query('select public.cutplan_backfill_project_snapshot($1,$2,$3,$4::jsonb,$5,$6,$7)',[row.ownerUserId,row.projectId,row._id,JSON.stringify(row.snapshot),canonicalSnapshot(row.snapshot),row.snapshotHash,row.createdAt]);
 for(const file of files.filter(f=>f>='202610290002'))await db.exec(await readFile(new URL('../supabase/migrations/'+file,import.meta.url),'utf8'));
 const archive=await db.dumpDataDir(),bytes=new Uint8Array(await archive.arrayBuffer());
 await writeFile(resolve(directory,'rehearsal-sql-backup.tar.gz'),bytes,{flag:'wx',mode:0o600});
 await db.close();restored=new PGlite({loadDataDir:new Blob([bytes])});
 const rows=(await restored.query('select s.*,i.snapshot_hash index_hash from public.project_design_snapshots s join public.design_revision_index i on i.id=s.revision_id')).rows;
 assert.equal(rows.length,report.readyRevisions);
 for(const row of rows){assert.equal(snapshotHash(row.snapshot),row.index_hash);assert.equal(row.canonical_snapshot,canonicalSnapshot(row.snapshot));}
 assert.equal((await restored.query('select public.cutplan_project_storage_ready() ready')).rows[0].ready,true);
 const result={...report,isolatedImport:true,repeatedImportWithoutDuplicates:true,restoredDesignDocuments:rows.length,sqlArchiveSha256:createHash('sha256').update(bytes).digest('hex'),hostedChangesApplied:false};
 await writeFile(resolve(directory,'rehearsal-report.json'),JSON.stringify(result,null,2),{flag:'wx',mode:0o600});
 console.log(JSON.stringify(result));
}catch(error){console.error(JSON.stringify({rehearsalPassed:false,error:error.message,code:error.code}));process.exitCode=1;}
finally{if(!db.closed)await db.close();if(restored&&!restored.closed)await restored.close();}

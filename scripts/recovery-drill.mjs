import {PGlite} from '@electric-sql/pglite';
import {readFile,readdir,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {defaultFurniture,calculateFurniture} from '../src/lib/furniture/families.ts';
import {furnitureSnapshot} from '../src/lib/projects/contracts.ts';
import {snapshotHash,canonicalSnapshot,projectIdentity,requestHash} from '../src/lib/projects/identity.ts';
import {nestFurniture} from '../src/lib/furniture/nesting.ts';
import assert from 'node:assert/strict';
/** Isolated fixtures only: no environment credentials or hosted services. */
export async function recoveryDrill(){
 const original=new PGlite();let restored;
 try{
  await original.exec("create role anon;create role authenticated;create role service_role;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;");
  const migrations=(await readdir(new URL('../supabase/migrations/',import.meta.url))).filter(f=>f.endsWith('.sql')).sort();
  for(const file of migrations)await original.exec(await readFile(new URL('../supabase/migrations/'+file,import.meta.url),'utf8'));
  const owner='00000000-0000-4000-8000-000000000001',other='00000000-0000-4000-8000-000000000002';
  await original.query('insert into auth.users values($1),($2)',[owner,other]);
  for(const [i,family] of ['cabinet','shoe_rack','bookshelf','table'].entries()){
   const snapshot=furnitureSnapshot('Synthetic recovery '+family,defaultFurniture(family)),source=`00000000-0000-4000-8000-${String(200+i).padStart(12,'0')}`;
   const id=projectIdentity(owner,source),input={sourceDraftId:source,operationId:`00000000-0000-4000-8000-${String(300+i).padStart(12,'0')}`,expectedVersion:0,snapshot};
   await original.query('select public.cutplan_save_project($1,$2,$3,$4,0,$5,$6,$7::jsonb,$8)',[owner,input.operationId,id,source,requestHash(owner,input,id),snapshotHash(snapshot),JSON.stringify(snapshot),canonicalSnapshot(snapshot)]);
  }
  const archive=await original.dumpDataDir(),bytes=new Uint8Array(await archive.arrayBuffer()),archiveSha256=createHash('sha256').update(bytes).digest('hex');
  await original.close();restored=new PGlite({loadDataDir:new Blob([bytes])});
  const saved=(await restored.query('select p.id,p.current_revision_id,s.snapshot,s.canonical_snapshot,s.snapshot_hash,i.snapshot_hash index_hash from public.projects p join public.design_revision_index i on i.id=p.current_revision_id join public.project_design_snapshots s on s.revision_id=i.id order by p.id')).rows;
  assert.equal(saved.length,4);
  for(const row of saved){
   assert.equal(snapshotHash(row.snapshot),row.index_hash);assert.equal(row.snapshot_hash,row.index_hash);assert.equal(canonicalSnapshot(row.snapshot),row.canonical_snapshot);
   const input=row.snapshot.cabinet??row.snapshot.configuration;assert.equal(calculateFurniture(input).blockingErrors.length,0);assert.equal(nestFurniture(input).unplaced.length,0);
  }
  await assert.rejects(restored.exec('delete from public.project_design_snapshots'),/immutable_snapshot/);
  await restored.exec('set role authenticated');await restored.query("select set_config('request.jwt.claim.sub',$1,false)",[owner]);assert.equal((await restored.query('select id from public.projects')).rows.length,4);
  await assert.rejects(restored.query('select * from public.project_design_snapshots'),/permission denied/);
  await restored.query("select set_config('request.jwt.claim.sub',$1,false)",[other]);assert.equal((await restored.query('select id from public.projects')).rows.length,0);
  await assert.rejects(restored.query('select * from public.production_jobs'),/permission denied/);
  await restored.exec('reset role;set role anon');await assert.rejects(restored.query('select * from public.projects'),/permission denied/);await restored.exec('reset role');
  const designBytes=new TextEncoder().encode(JSON.stringify(saved));
  return {report:{schemaVersion:2,purpose:'isolated_supabase_snapshot_recovery',passed:true,migrations:migrations.length,restoredProjects:4,restoredDesignDocuments:4,designContentRestoredFromSqlArchive:true,ownerIsolation:true,privateProductionDenied:true,archiveSha256,archiveBytes:bytes.length,hostedRestoreVerified:false,photoBinaryRestoreVerified:false},bytes,designBytes};
 }finally{if(!original.closed)await original.close();if(restored&&!restored.closed)await restored.close();}
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1]){
 const result=await recoveryDrill(),directory=new URL('../project-records/recovery-drills/supabase-project-storage/',import.meta.url);
 await mkdir(directory,{recursive:true});await writeFile(new URL('synthetic-pglite-backup.tar.gz',directory),result.bytes);await writeFile(new URL('synthetic-design-documents.json',directory),result.designBytes);await writeFile(new URL('report.json',directory),JSON.stringify(result.report,null,2));console.log(JSON.stringify(result.report,null,2));
}

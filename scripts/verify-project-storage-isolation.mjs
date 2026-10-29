// Creates/removes one unprivileged hosted Auth identity. No emails or staff grants.
import {createClient} from '@supabase/supabase-js';
import {createServerClient} from '@supabase/ssr';
import {randomUUID,randomBytes} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';

const args=process.argv.slice(2),base='http://127.0.0.1:3100';
if(!args.includes('--approved-hosted-test'))throw new Error('Explicit --approved-hosted-test required: creates and removes a temporary Auth identity.');
const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const admin=createClient(url,process.env.SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
let testUserId;
try{
 const original=JSON.parse(await readFile('.private/project-storage/20261029-atlas-ui/sql-before.json','utf8'));
 const email='storage-isolation-'+randomUUID()+'@example.invalid',password=randomBytes(36).toString('base64url');
 const {data:created,error:createError}=await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{purpose:'Temporary project-storage ownership verification'}});
 if(createError||!created.user)throw new Error('temporary_identity_creation_failed');
 testUserId=created.user.id;
 const jar=new Map();
 const client=createServerClient(url,key,{auth:{autoRefreshToken:false},cookies:{getAll:()=>[...jar].map(([name,value])=>({name,value})),setAll:items=>{for(const c of items)jar.set(c.name,c.value);}}});
 const {data:login,error:loginError}=await client.auth.signInWithPassword({email,password});
 if(loginError||!login.user||!login.session||login.user.id!==testUserId)throw new Error('temporary_identity_login_failed');
 const cookie=[...jar].map(([name,value])=>name+'='+value).join('; ');
 const request=async(path,body)=>{
  const response=await fetch(base+path,{method:body?'POST':'GET',headers:{Cookie:cookie,Origin:base,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
  return {status:response.status,body:await response.json()};
 };
 const listing=await request('/api/projects');
 if(listing.status!==200||listing.body.projects.length!==0||listing.body.configured!==true)throw new Error('cross_owner_listing_failed');
 let reads=0;
 for(const p of original.projects){
  if((await request('/api/projects/'+p.id)).status!==404)throw new Error('cross_owner_read_allowed');
  reads++;
 }
 const p=original.projects[0],index=original.revisions.find(r=>r.project_id===p.id);
 if((await request('/api/projects/'+p.id+'?revision='+index.id)).status!==404)throw new Error('cross_owner_history_allowed');
 if((await request('/api/projects/'+p.id+'/recover',{})).status!==404)throw new Error('cross_owner_recovery_allowed');
 const forged={projectId:p.id,sourceDraftId:p.source_draft_id,operationId:randomUUID(),expectedVersion:p.version,snapshot:{schemaVersion:1,name:'Forbidden cross-owner save',furnitureType:p.furniture_type,stage:'project-shell'}};
 if((await request('/api/projects',forged)).status!==404)throw new Error('cross_owner_save_allowed');
 const direct=await fetch(url+'/rest/v1/project_design_snapshots?select=revision_id',{headers:{apikey:key,Authorization:'Bearer '+login.session.access_token}});
 if(direct.ok)throw new Error('authenticated_direct_read_allowed');
 await client.auth.signOut();
 const anonymous=await fetch(base+'/api/projects');
 if(anonymous.status!==401)throw new Error('signed_out_project_access_allowed');
 const {error:deleteError}=await admin.auth.admin.deleteUser(testUserId);
 if(deleteError)throw new Error('temporary_identity_cleanup_failed');
 testUserId=undefined;
 const report={secondIdentity:'temporary real hosted Supabase Auth login',signedInListingEmpty:true,crossOwnerCurrentReadsDenied:reads,crossOwnerHistoryDenied:true,crossOwnerRecoveryDenied:true,crossOwnerSaveDenied:true,authenticatedDirectSnapshotReadDenied:true,signedOutApiDenied:true,temporaryIdentityRemoved:true,staffGrantsCreated:false,emailsSent:false};
 await writeFile('project-records/storage-migration/20261029/hosted-isolation.json',JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report));
}catch(error){console.error(JSON.stringify({isolationVerified:false,error:error.message}));process.exitCode=1;}
finally{if(testUserId){const {error}=await admin.auth.admin.deleteUser(testUserId);if(error){console.error('temporary_identity_cleanup_required');process.exitCode=1;}}}

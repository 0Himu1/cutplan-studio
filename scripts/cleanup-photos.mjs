import {createClient} from '@supabase/supabase-js';
const apply=process.argv.includes('--apply');
const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SECRET_KEY;
if(!url||!key)throw new Error('Private photo cleanup needs server configuration.');
const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}}),now=new Date().toISOString(),stale=new Date(Date.now()-3600000).toISOString();
const {data,error}=await client.from('private_photos').select('id,object_key').is('purged_at',null).or(`expires_at.lte.${now},state.eq.deleted,and(state.eq.pending,created_at.lte.${stale})`).limit(100);
if(error)throw new Error('Could not inspect expired photo records.');
let purged=0;
if(apply)for(const photo of data??[]){const marked=await client.from('private_photos').update({state:'deleted'}).eq('id',photo.id);if(marked.error)continue;const removed=await client.storage.from('private-photos').remove([photo.object_key]);if(removed.error)continue;const saved=await client.from('private_photos').update({purged_at:now}).eq('id',photo.id);if(!saved.error)purged++;}
if(apply){const result=await client.from('photo_upload_attempts').delete().lt('created_at',new Date(Date.now()-7*86400000).toISOString());if(result.error)throw new Error('Old quota records still need cleanup.');}
console.log(JSON.stringify({mode:apply?'apply':'dry-run',eligible:(data??[]).length,purged,batchLimit:100}));

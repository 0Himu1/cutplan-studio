import {staffPermission} from '@/lib/auth/permissions';
import {privateJson,sameOrigin} from '@/lib/auth/http';
import {createAdminClient} from '@/lib/supabase/admin';
import {boundedPhotoBody,normalizePhoto} from '@/lib/photos/image';

export async function POST(request:Request){
 if(!sameOrigin(request))return privateJson({error:'Use the studio to upload finish images.'},403);
 try{if(!await staffPermission('catalog'))return privateJson({error:'Staff catalog access is required.'},403);}
 catch{return privateJson({error:'Catalog access could not be verified. Retry.'},503);}
 let image;
 try{image=await normalizePhoto(await boundedPhotoBody(request),request.headers.get('content-type')??'');}
 catch{return privateJson({error:'Use one JPEG, PNG or WebP image, up to 10 MB and 20 megapixels.'},400);}
 try{
  // shortcut: retain uploaded swatches until reference-aware catalog retention is approved.
  const storage=createAdminClient().storage.from('catalog-finishes'),key=crypto.randomUUID()+'.webp';
  const {error}=await storage.upload(key,image.bytes,{contentType:'image/webp',upsert:false,cacheControl:'31536000'});
  if(error)return privateJson({error:'Finish image storage is unavailable. Your form is preserved; retry or use an HTTPS image URL.'},503);
  return privateJson({url:storage.getPublicUrl(key).data.publicUrl});
 }catch{return privateJson({error:'Finish image upload failed. Your form is preserved; retry.'},503);}
}

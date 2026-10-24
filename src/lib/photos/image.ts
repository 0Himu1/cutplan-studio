import sharp from 'sharp';
import {imageKind,MAX_PHOTO_BYTES,MAX_PHOTO_PIXELS} from './contracts.ts';
export async function normalizePhoto(bytes:Uint8Array,declaredMime:string){
 const kind=imageKind(bytes),expected=kind==='jpeg'?'image/jpeg':kind?`image/${kind}`:null;
 if(!bytes.length||bytes.length>MAX_PHOTO_BYTES||!expected||declaredMime!==expected)throw new Error('Use a JPEG, PNG or WebP photo up to 10 MB with a matching file type.');
 const image=sharp(bytes,{limitInputPixels:MAX_PHOTO_PIXELS,failOn:'error'}),meta=await image.metadata();
 if(!meta.width||!meta.height||meta.width*meta.height>MAX_PHOTO_PIXELS||(meta.pages??1)!==1)throw new Error('Use one still image within the 20 megapixel limit.');
 const {data,info}=await image.autoOrient().resize({width:2048,height:2048,fit:'inside',withoutEnlargement:true}).webp({quality:85}).toBuffer({resolveWithObject:true});
 return {bytes:data,width:info.width,height:info.height,mime:'image/webp' as const};
}
export async function boundedPhotoBody(request:Request){const reader=request.body?.getReader();if(!reader)throw new Error('Choose a photo.');const chunks:Uint8Array[]=[];let size=0;while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>MAX_PHOTO_BYTES){await reader.cancel();throw new Error('Photo exceeds 10 MB.');}chunks.push(value);}const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}return bytes;}

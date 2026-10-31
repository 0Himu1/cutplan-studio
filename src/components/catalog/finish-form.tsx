'use client';
import {useState} from 'react';
import {Palette} from 'lucide-react';
import {ConfigSelect} from '@/components/ui/config-fields';
import {CatalogField,CatalogHeading} from './ui';
import {FinishImage} from './finish-image';
import {MaterialForm,MaterialIdentity,type MaterialFormProps} from './material-form';

export function FinishForm({item,busy,onSave}:MaterialFormProps){
 const details=item?.finish_skus??{};
 const [surface,setSurface]=useState(String(details.surface??'laminate')),[color,setColor]=useState(String(details.color_code??''));
 const [textureUrl,setTextureUrl]=useState(String(details.texture_url??'')),[imageFile,setImageFile]=useState<File|null>(null);
 async function upload(signal:AbortSignal){
  if(!imageFile)return {};
  const response=await fetch('/api/admin/catalog/image',{method:'POST',headers:{'Content-Type':imageFile.type},body:imageFile,signal}),result=await response.json();
  if(!response.ok||typeof result.url!=='string')throw new Error(result.error??'Image upload failed.');
  if(!signal.aborted){setTextureUrl(result.url);setImageFile(null);}return {texture_url:result.url};
 }
 return <MaterialForm item={item} kind="finish" busy={busy} onSave={onSave} details={{surface,color_code:color,texture_url:textureUrl}} beforeSave={upload} pendingLabel={imageFile?'Uploading image…':'Saving…'}>
  <MaterialIdentity item={item}/>
  <section className="border-t border-[var(--border)] pt-4"><CatalogHeading icon={Palette} title="Appearance" hint="Add a named color, image or both. Choose compatible boards in each board's Finishes tab after publishing."/><div className="cad-fields"><ConfigSelect label="Surface" value={surface} onChange={setSurface}>{['laminate','veneer','paint','raw','other'].map(value=><option key={value} value={value}>{value==='laminate'?'Formica / HPL lamination':value}</option>)}</ConfigSelect><CatalogField label="Color code (optional)" value={color} onChange={event=>setColor(event.target.value)} placeholder="#FFFFFF" pattern="#[0-9A-Fa-f]{6}"/><div className="col-span-2 flex items-center gap-3 rounded-md border border-[var(--border)] bg-surface p-3"><input type="color" aria-label="Pick finish color" value={/^#[0-9a-f]{6}$/i.test(color)?color:'#bda382'} onChange={event=>setColor(event.target.value)} className="size-11! shrink-0 cursor-pointer p-1!"/><span className="text-xs text-muted">{color||'No color assigned'}</span>{color&&<button type="button" className="ml-auto text-xs text-accent-ink underline underline-offset-4" onClick={()=>setColor('')}>Clear color</button>}</div></div></section>
  <FinishImage url={textureUrl} onUrl={setTextureUrl} file={imageFile} onFile={setImageFile} disabled={busy}/>
 </MaterialForm>;
}

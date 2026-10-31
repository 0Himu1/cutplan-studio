'use client';
import {useEffect,useState} from 'react';
import {CatalogField} from './ui';

export function FinishImage({url,onUrl,file,onFile,disabled}:{url:string;onUrl:(url:string)=>void;file:File|null;onFile:(file:File|null)=>void;disabled:boolean}){
 const [preview,setPreview]=useState(''),[error,setError]=useState('');
 useEffect(()=>{if(!file)return;const objectUrl=URL.createObjectURL(file);let active=true;queueMicrotask(()=>{if(active)setPreview(objectUrl);});return()=>{active=false;URL.revokeObjectURL(objectUrl);};},[file]);
 return <section className="border-t border-[var(--border)] pt-4">
  <div className="mb-3 flex items-center gap-3"><span className="size-12 shrink-0 rounded-md border border-[var(--border)] bg-surface bg-cover bg-center" style={{backgroundImage:(file?preview:url)?`url(${JSON.stringify(file?preview:url)})`:undefined}} aria-hidden="true"/><div><h3 className="text-xs font-semibold">Formica / HPL image</h3><p className="mt-1 text-xs text-muted">Use a full-sheet image. Preview preserves proportions and crops each panel at board-sheet scale. Color is the fallback.</p></div></div>
  <label className="config-field"><span className="config-field-label">Upload finish image</span><input type="file" accept="image/jpeg,image/png,image/webp" disabled={disabled} onChange={event=>{const selected=event.target.files?.[0]??null;if(selected&&(selected.size>10485760||!['image/jpeg','image/png','image/webp'].includes(selected.type))){setError('Choose a JPEG, PNG or WebP up to 10 MB.');event.target.value='';return;}setError('');onFile(selected);}}/></label>
  {file&&<p className="mt-2 text-xs text-muted">{file.name} <button type="button" className="ml-2 text-accent-ink underline" onClick={()=>onFile(null)}>Remove upload</button></p>}
  <div className="mt-3"><CatalogField label="Texture image URL (optional)" name="texture_url" type="url" pattern="https://.*" value={url} disabled={disabled||Boolean(file)} onChange={event=>onUrl(event.target.value)} maxLength={2048} placeholder="https://…"/></div>
  <p className="mt-2 text-xs leading-5 text-muted">Uploaded catalog images are public. Use a licensed product swatch, not a private photo.</p>
  {error&&<p role="alert" className="mt-2 text-xs text-danger-ink">{error}</p>}
 </section>;
}

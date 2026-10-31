'use client';
import {useEffect,useRef,useState,type ReactNode,type FormEvent} from 'react';
import {Layers,Link2,Save} from 'lucide-react';
import {CATALOG_CODE_PATTERN,catalogInputError,type CatalogItem} from '@/lib/catalog/contracts';
import {CatalogField,CatalogHeading,CatalogFooter,catalogPrimary} from './ui';

export type CatalogSave=(value:Record<string,unknown>)=>Promise<boolean>;
export type MaterialFormProps={item?:CatalogItem;busy:boolean;onSave:CatalogSave};

export function MaterialIdentity({item,code,name}:{item?:CatalogItem;code?:string;name?:string}){
 return <section><CatalogHeading icon={Layers} title="Identity" hint="Code: 2–64 letters/numbers, dots, underscores or hyphens; no spaces. Name: 2–120 characters. Code cannot change after creation."/><div className="cad-fields">
  <CatalogField label="Code" name="code" {...(code!==undefined?{value:code,readOnly:true}:{defaultValue:item?.code})} disabled={Boolean(item)} required minLength={2} maxLength={64} pattern={CATALOG_CODE_PATTERN} title="Use 2–64 letters or numbers, dots, underscores or hyphens, without spaces."/>
  <CatalogField label="Name" name="name" {...(name!==undefined?{value:name,readOnly:true}:{defaultValue:item?.name})} required minLength={2} maxLength={120}/>
 </div></section>;
}

export function MaterialForm({item,kind,busy,onSave,details,categoryCode,beforeSave,pendingLabel='Saving…',children}:MaterialFormProps&{kind:CatalogItem['kind'];details:Record<string,unknown>;categoryCode?:string;beforeSave?:(signal:AbortSignal)=>Promise<Record<string,unknown>>;pendingLabel?:string;children:ReactNode}){
 const [dirty,setDirty]=useState(false),[pending,setPending]=useState(false),[error,setError]=useState('');
 const controller=useRef<AbortController|null>(null),[initialDetails]=useState(()=>JSON.stringify(details));
 useEffect(()=>()=>controller.current?.abort(),[]);
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(pending||busy)return;
  const form=new FormData(event.currentTarget),payload:Record<string,unknown>={action:item?'edit':'create',id:item?.id,version:item?.version,kind,code:item?.code??form.get('code'),name:form.get('name'),...(categoryCode?{category_code:categoryCode}:{}),details};
  const problem=catalogInputError(payload);if(problem){setError(problem);return;}
  const request=new AbortController();controller.current=request;setPending(true);setError('');
  try{if(beforeSave){payload.details={...details,...await beforeSave(request.signal)};if(request.signal.aborted)return;const problem=catalogInputError(payload);if(problem)throw new Error(problem);}await onSave(payload);}
  catch(cause){if(!request.signal.aborted)setError(cause instanceof Error?cause.message:'The material was not saved. Retry.');}
  finally{if(!request.signal.aborted)setPending(false);}
 }
 return <form className="catalog-form cabinet-config flex min-h-0 flex-1 flex-col" aria-label={item?'Material details':`New ${kind}`} onSubmit={submit} onChangeCapture={()=>setDirty(true)} aria-busy={busy||pending}>
  <div className="min-h-0 flex-1 overflow-y-auto p-4"><fieldset disabled={busy||pending||Boolean(item?.retired_at)} className="min-w-0 space-y-5">{children}
   {item?.source_url&&<section className="border-t border-[var(--border)] pt-4"><CatalogHeading icon={Link2} title="Supplier source" hint="Verify the specification, price and availability before publishing."/><a className="break-all text-xs text-accent-ink underline underline-offset-4" href={item.source_url} target="_blank" rel="noreferrer">{item.source_name??'Supplier listing'}</a></section>}
  </fieldset>{error&&<p role="alert" className="mt-3 text-xs text-danger-ink">{error}</p>}</div>
  {!item?.retired_at&&<CatalogFooter>{(dirty||JSON.stringify(details)!==initialDetails)&&<span className="mr-auto text-xs text-[var(--config-warning)]">Unsaved details</span>}<button className={catalogPrimary} disabled={busy||pending}><Save size={14} aria-hidden="true"/>{pending?pendingLabel:busy?'Saving…':item?'Save details and unpublish':'Create unpublished material'}</button></CatalogFooter>}
 </form>;
}

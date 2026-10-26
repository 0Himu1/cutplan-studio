'use client';

import {useCallback,useEffect,useLayoutEffect,useRef,useState} from 'react';

import {ArrowLeft,Layers,Palette,Plus,Ruler,Search,X,PackageOpen} from 'lucide-react';

import {boardGroups,boardCategory} from '@/lib/catalog/board-categories';

import {ConfigSelect} from '@/components/ui/config-fields';

import {type CatalogItem} from '@/lib/catalog/contracts';

import {MaterialEditor} from './material-editor';

import {PriceEditor,PublishControls,CompatibleFinishes,type Compatibility} from './catalog-controls';

import {MaterialStatus,catalogButton,catalogPrimary} from './ui';

type Tab='details'|'pricing'|'finishes'|'availability';

export function CatalogWorkspace(){

 const editorRef=useRef<HTMLDivElement>(null),workspaceRef=useRef<HTMLElement>(null);

 const [preset,setPreset]=useState<CatalogItem|undefined>();

 const [items,setItems]=useState<CatalogItem[]>([]),[compatibility,setCompatibility]=useState<Compatibility[]>([]),[selected,setSelected]=useState<string|null>(null),[creating,setCreating]=useState(false),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[filter,setFilter]=useState(''),[kind,setKind]=useState('all'),[tab,setTab]=useState<Tab>('details');

 const load=useCallback(async()=>{setError('');try{const response=await fetch('/api/admin/catalog',{cache:'no-store'}),data=await response.json();if(!response.ok)throw new Error(data.error);setItems(data.items);setCompatibility(data.compatibility);return data as {items:CatalogItem[];compatibility:Compatibility[]};}catch(cause){setError(cause instanceof Error?cause.message:'Catalog unavailable. Retry.');return null;}finally{setLoading(false);}},[]);

 useEffect(()=>{const controller=new AbortController();fetch('/api/admin/catalog',{cache:'no-store',signal:controller.signal}).then(async response=>{const data=await response.json();if(!response.ok)throw new Error(data.error);setItems(data.items);setCompatibility(data.compatibility);setLoading(false);}).catch(cause=>{if(!controller.signal.aborted){setError(cause instanceof Error?cause.message:'Catalog unavailable. Retry.');setLoading(false);}});return()=>controller.abort();},[]);

 function close(){setPreset(undefined);setSelected(null);setCreating(false);setTab('details');setError('');}

 async function saveChanges(payloads:Record<string,unknown>[]){

  if(!payloads.length){close();return true;}setBusy(true);setError('');setNotice('');let rows=items,written=0;

  try{for(const payload of payloads){const current=rows.find(item=>item.id===payload.id),response=await fetch('/api/admin/catalog',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...payload,...(current?{version:current.version}:{})})}),data=await response.json();if(!response.ok)throw new Error(data.error);written++;const fresh=await load();if(!fresh){if(payloads.length===1){close();setNotice('Saved. Reload the catalog to see the changes.');setError('The updated catalog could not load.');return true;}throw new Error('Some pairings were saved. Reload the catalog before retrying the remaining pairings.');}rows=fresh.items;}

   close();const action=payloads[0].action;if(action==='create'){setFilter('');setKind(String(payloads[0].kind??'all'));}else if(action==='edit')setFilter('');setNotice(action==='price'?'New price saved. Material is unpublished.':action==='publish'?'Material published.':action==='unpublish'?'Material unpublished.':action==='retire'?'Material retired.':action==='compatibility'?'Compatible finishes saved.':action==='create'?'Material created as unpublished.':'Details saved. Material is unpublished.');return true;

  }catch(cause){setError((written>0?'Some changes were saved. Review the current state before retrying. ':'')+(cause instanceof Error?cause.message:'Change not saved. Retry.'));return false;}finally{setBusy(false);}

 }

 const change=(payload:Record<string,unknown>)=>saveChanges([payload]),current=items.find(item=>item.id===selected),editing=creating||Boolean(current),active=items.filter(item=>!item.retired_at),groups=boardGroups(active),categoryRows=groups.map(group=>group.variants[0]),gridItems=[...categoryRows,...active.filter(item=>item.kind!=='board')],visible=gridItems.filter(item=>(kind==='all'||item.kind===kind)&&([item.name,item.code,...(groups.find(group=>group.variants.some(variant=>variant.id===item.id))?.variants.map(variant=>variant.code)??[])].join(' ')).toLowerCase().includes(filter.toLowerCase())),currentGroup=groups.find(group=>group.variants.some(item=>item.id===selected)),missingThicknesses=boardCategory(current?.category_code)?.thicknesses.filter(thickness=>!currentGroup?.variants.some(item=>Number(item.board_skus?.thickness_mm)===thickness))??[];

 useLayoutEffect(()=>{

  const editor=editorRef.current;if(!editing||!editor)return;let previous=0;

  const fit=()=>{const height=Math.max(280,Math.min(560,window.innerHeight-Math.max(8,editor.getBoundingClientRect().top)-16));if(height!==previous){previous=height;editor.style.setProperty('--catalog-editor-height',height+'px');}};

  fit();const observer=new ResizeObserver(fit);if(workspaceRef.current)observer.observe(workspaceRef.current);window.addEventListener('resize',fit);return()=>{observer.disconnect();window.removeEventListener('resize',fit);};

 },[editing]);

 const tabs:{id:Tab;label:string}[]=[{id:'details',label:'Details'},{id:'pricing',label:'Pricing'},...(current?.kind==='board'?[{id:'finishes' as const,label:'Finishes'}]:[]),{id:'availability',label:'Availability'}];

 return <section ref={workspaceRef} className="catalog-workspace mx-auto w-full max-w-330 px-4 py-6 sm:px-6 lg:px-10"><header className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-xl font-semibold tracking-tight">Material catalog</h1><p className="mt-1 text-xs text-muted">Boards, finishes and edging for your designs.</p></div>{!editing&&<button type="button" className={catalogPrimary} onClick={()=>{setPreset(undefined);setCreating(true);setSelected(null);setNotice('');setError('');setTab('details');}}><Plus size={15} aria-hidden="true"/>Add material</button>}</header>

 {error&&<div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-md border border-[var(--border)] p-3 text-xs text-danger-ink"><span>{error}</span><button type="button" className={catalogButton} disabled={busy} onClick={()=>void load()}>Reload catalog</button></div>}{notice&&<p role="status" className="mb-4 text-xs text-[var(--config-available)]">{notice}</p>}

 {editing?<div className="mx-auto max-w-190"><button type="button" className={`${catalogButton} mb-3`} disabled={busy} onClick={close}><ArrowLeft size={14} aria-hidden="true"/>Back to materials</button><div ref={editorRef} className="catalog-editor flex flex-col overflow-hidden rounded-lg border border-[var(--border)] bg-base"><div className="flex shrink-0 items-start justify-between gap-3 border-b border-[var(--border)] px-4 py-3"><div className="min-w-0"><h2 className="break-words text-sm font-semibold">{creating?'Add material':current!.name}</h2>{current&&<p className="mt-1 text-xs text-muted">{current.code} · {current.kind}</p>}</div>{current&&<MaterialStatus item={current}/>}<button type="button" className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted hover:bg-surface max-[600px]:size-11" aria-label="Close material editor" disabled={busy} onClick={close}><X size={16}/></button></div>

 {currentGroup&&<div className="flex shrink-0 items-end gap-2 border-b border-[var(--border)] px-4 py-3"><div className="min-w-0 flex-1"><ConfigSelect label="Thickness variant (mm)" value={current!.id} disabled={busy} onChange={id=>{setSelected(id);setError('');setNotice('');}}>{currentGroup.variants.map(item=>{const price=item.catalog_price_versions.find(p=>!p.effective_until);return <option key={item.id} value={item.id}>{String(item.board_skus?.thickness_mm)} mm · {price?`BDT ${Number(price.price_bdt).toLocaleString('en-BD')} / sheet`:'Price needed'}</option>;})}</ConfigSelect></div>{current?.category_code&&missingThicknesses.length>0&&<button type="button" className={catalogButton} disabled={busy} onClick={()=>{setPreset({...current,board_skus:{...current.board_skus,thickness_mm:missingThicknesses[0]}});setSelected(null);setCreating(true);setTab('details');}}><Plus size={14} aria-hidden="true"/>Add thickness</button>}</div>}

 {current&&<div role="group" aria-label="Material sections" className="grid shrink-0 grid-flow-col auto-cols-fr border-b border-[var(--border)] bg-surface p-1">{tabs.map(item=><button type="button" key={item.id} aria-pressed={tab===item.id} className="min-h-8 rounded-md px-2 text-xs text-muted hover:text-ink aria-pressed:bg-base aria-pressed:font-medium aria-pressed:text-accent-ink max-[600px]:min-h-11" disabled={busy} onClick={()=>setTab(item.id)}>{item.label}</button>)}</div>}

 <div className={tab==='details'?'flex min-h-0 flex-1 flex-col':'hidden'}><MaterialEditor key={current?`${current.id}-${current.version}`:'new'} item={current} preset={preset} busy={busy} onSave={change}/></div>

 {current&&<><div className={tab==='pricing'?'flex min-h-0 flex-1 flex-col':'hidden'}><PriceEditor key={`price-${current.id}-${current.version}`} item={current} busy={busy} onSave={change}/></div>{current.kind==='board'&&<div className={tab==='finishes'?'flex min-h-0 flex-1 flex-col':'hidden'}><CompatibleFinishes key={`pairings-${current.id}`} item={current} items={items} compatibility={compatibility} busy={busy} onSavePairings={desired=>{const existing=compatibility.filter(pair=>pair.board_item_id===current.id).map(pair=>pair.finish_item_id),all=new Set([...existing,...desired]);return saveChanges([...all].filter(id=>existing.includes(id)!==desired.includes(id)).map(finishId=>({action:'compatibility',id:current.id,version:current.version,finishId,enabled:desired.includes(finishId)})));}}/></div>}<div className={tab==='availability'?'flex min-h-0 flex-1 flex-col':'hidden'}><PublishControls key={`availability-${current.id}-${current.version}`} item={current} busy={busy} onSave={change} onPricing={()=>setTab('pricing')}/></div></>}

 </div></div>:<><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div role="group" aria-label="Material categories" className="flex flex-wrap gap-1">{[['all','All'],['board','Boards'],['finish','Finishes'],['edging','Edging']].map(([value,label])=><button type="button" key={value} className={`${catalogButton} aria-pressed:border-[var(--accent-text)] aria-pressed:bg-accent-soft aria-pressed:text-accent-ink`} aria-pressed={kind===value} onClick={()=>setKind(value)}>{label}<span className="tabular-nums text-muted">{gridItems.filter(item=>value==='all'||item.kind===value).length}</span></button>)}</div><label className="flex min-h-9 w-full items-center gap-2 rounded-md border border-[var(--border)] bg-base px-3 sm:max-w-70"><Search size={15} className="shrink-0 text-muted" aria-hidden="true"/><input aria-label="Find a material" type="search" className="min-h-9 min-w-0 flex-1 border-0! bg-transparent text-xs outline-offset-2" value={filter} onChange={event=>setFilter(event.target.value)} placeholder="Name or code"/></label></div>

 {loading?<p role="status" className="py-10 text-sm text-muted">Loading catalog…</p>:visible.length?<ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-label="Materials">{visible.map(item=>{const group=groups.find(group=>group.variants.some(variant=>variant.id===item.id)),prices=group?.variants.flatMap(variant=>{const current=variant.catalog_price_versions.find(price=>!price.effective_until);return current?[Number(current.price_bdt)]:[]})??[],Icon=item.kind==='board'?Layers:item.kind==='finish'?Palette:Ruler,details=item.board_skus??item.finish_skus??item.edging_skus??{},price=item.catalog_price_versions.find(p=>!p.effective_until),summary=group&&item.category_code?group.variants.map(variant=>String(variant.board_skus?.thickness_mm)).join(', ')+' mm':item.kind==='board'?`${details.sheet_width_mm} × ${details.sheet_height_mm} × ${details.thickness_mm} mm`:item.kind==='finish'?`${details.surface??'Finish'}${details.color_code?' · '+details.color_code:''}`:`${details.width_mm} × ${details.thickness_mm} mm · ${details.material??'edging'}`;return <li key={item.id}><button type="button" onClick={()=>{setSelected(item.id);setCreating(false);setTab('details');setNotice('');setError('');}} className="group flex h-full w-full flex-col gap-4 rounded-lg border border-[var(--border)] bg-base p-4 text-left transition-colors hover:border-[var(--accent-text)] hover:bg-surface" aria-label={`Edit ${item.name}`}><div className="flex items-center justify-between gap-3"><span className="flex size-10 items-center justify-center rounded-md border border-[var(--border)] bg-surface text-muted" style={(item.kind==='finish'||item.kind==='board')&&details.color_code?{backgroundColor:String(details.color_code)}:undefined}>{!((item.kind==='finish'||item.kind==='board')&&details.color_code)&&<Icon size={21} strokeWidth={1.5} aria-hidden="true"/>}</span><span className="text-xs text-muted">{group&&item.category_code?`${group.variants.filter(variant=>variant.is_sellable).length} / ${group.variants.length} published`:<MaterialStatus item={item}/>}</span></div><div className="min-w-0"><strong className="block break-words text-sm font-medium group-hover:text-accent-ink">{item.name}</strong><span className="mt-1 block text-xs text-muted">{item.category_code??item.code}</span></div><div className="mt-auto border-t border-[var(--border)] pt-3"><span className="block break-words text-xs text-muted">{summary}</span><span className={`mt-2 block text-xs font-medium tabular-nums ${price?'text-ink':'text-[var(--config-warning)]'}`}>{group&&item.category_code?(prices.length?`BDT ${Math.min(...prices).toLocaleString('en-BD')}${Math.max(...prices)!==Math.min(...prices)?`–${Math.max(...prices).toLocaleString('en-BD')}`:''} / sheet${prices.length<group.variants.length?' · some prices needed':''}`:'Prices needed'):price?`BDT ${Number(price.price_bdt).toFixed(2)} / ${price.unit.replace('_',' ')}`:'Price needed'}</span></div></button></li>;})}</ul>:<div className="flex flex-col items-center rounded-lg border border-dashed border-[var(--border)] px-4 py-12 text-center"><PackageOpen size={28} strokeWidth={1.5} className="mb-3 text-muted" aria-hidden="true"/><h2 className="text-sm font-medium">{items.length?'No matching materials':'No materials yet'}</h2><p className="mt-2 max-w-80 text-xs leading-5 text-muted">{items.length?'Try another name, code or category.':'Add your first board, then its price and compatible finishes.'}</p>{items.length>0&&<button type="button" className={`${catalogButton} mt-4`} onClick={()=>{setFilter('');setKind('all');}}>Clear filters</button>}</div>}</>}

 </section>;

}


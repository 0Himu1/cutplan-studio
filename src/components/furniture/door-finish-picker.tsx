'use client';
import {useState} from 'react';
import Link from 'next/link';
import {Check,Palette} from 'lucide-react';
import {BoardPicker} from '@/components/catalog/board-picker';
import {ConfigSelect} from '@/components/ui/config-fields';
import {calculateFurniture,type FurnitureInput} from '@/lib/furniture/families';
import {compatibleFinishes,materialForPanel,physicalMaterial,type MaterialCatalog,type PanelMaterial} from '@/lib/furniture/materials';

export function DoorFinishPicker({input,selected,onSelect,onChange,catalog,loading,error,retry,disabled}:{input:FurnitureInput;selected:string;onSelect:(id:string)=>void;onChange:(input:FurnitureInput)=>void;catalog:MaterialCatalog;loading:boolean;error:string;retry:()=>void;disabled:boolean}){
 const [query,setQuery]=useState('');
 const doors=calculateFurniture(input).panels.filter(panel=>panel.role==='door'),door=doors.find(panel=>panel.panelId===selected);
 const value=door?physicalMaterial(materialForPanel(input,door)):{},board=catalog.items.find(item=>item.id===value.boardId&&item.kind==='board');
 const finishes=compatibleFinishes(catalog,value.boardId).filter(item=>item.finish_skus?.surface==='laminate');
 const visible=finishes.filter(item=>(item.name+' '+item.code).toLowerCase().includes(query.toLowerCase()));
 const current=catalog.items.find(item=>item.id===value.frontFinishId);
 function change(next:PanelMaterial){if(door)onChange({...input,panelOverrides:{...input.panelOverrides,[door.panelId]:next}});}
 return <section className="cabinet-config" aria-label="Door finishings">
  <ConfigSelect label="Door" value={door?selected:''} onChange={onSelect}><option value="">Choose a door</option>{doors.map(panel=><option key={panel.panelId} value={panel.panelId}>{panel.label}</option>)}</ConfigSelect>
  <p className="my-3 text-xs leading-5 text-muted">Formica / HPL lamination on the outside face. Back finish, edges and board thickness stay unchanged.</p>
  {loading&&<p role="status" className="cad-help">Loading finishes…</p>}{error&&<p role="alert" className="cad-error">{error} <button type="button" onClick={retry}>Retry</button></p>}
  {door&&<fieldset disabled={disabled||loading||Boolean(error)} className="min-w-0 space-y-4">
   <div className={board?'cad-fields':''}><BoardPicker items={catalog.items} value={value.boardId??''} thickness={value.thicknessMm??door.thicknessMm} empty="Choose the door board first" onChange={id=>{const item=catalog.items.find(item=>item.id===id&&item.kind==='board');if(!item)return;change({boardId:id,thicknessMm:Number(item.board_skus?.thickness_mm),stockWidthMm:Number(item.board_skus?.sheet_width_mm),stockHeightMm:Number(item.board_skus?.sheet_height_mm),grainAxis:item.board_skus?.grain_direction as PanelMaterial['grainAxis']});}}/></div>
   {value.frontFinishId&&<p className="text-xs">Current: <strong>{current?.name??'Unavailable finish'}</strong>{!finishes.some(item=>item.id===value.frontFinishId)&&<span className="ml-2 text-[var(--config-warning)]">Select a compatible replacement.</span>}</p>}
   {board&&<><label className="config-field"><span className="config-field-label">Find a finishing</span><input type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Name or code"/></label>
    <div className="grid grid-cols-2 gap-2" role="group" aria-label="Available Formica and HPL finishes">
     <button type="button" aria-pressed={!value.frontFinishId} className="cad-finish-card cad-finish-none" onClick={()=>{const next={...value};delete next.frontFinishId;change(next);}}><Palette size={18} aria-hidden="true"/>No added finishing</button>
     {visible.map(finish=>{const details=finish.finish_skus??{},url=typeof details.texture_url==='string'&&details.texture_url.startsWith('https://')?details.texture_url:'';return <button type="button" key={finish.id} aria-label={`Select ${finish.name}`} aria-pressed={value.frontFinishId===finish.id} className="cad-finish-card" onClick={()=>change({...value,frontFinishId:finish.id})}><span className="cad-finish-swatch" style={{backgroundColor:String(details.color_code??'#bda382'),backgroundImage:url?`url(${JSON.stringify(url)})`:undefined}}/><span className="cad-finish-caption"><span className="min-w-0"><strong className="block break-words font-medium">{finish.name}</strong><span className="mt-1 block text-muted">{finish.code}</span></span>{value.frontFinishId===finish.id&&<Check size={14} className="shrink-0 text-accent-ink" aria-hidden="true"/>}</span></button>;})}
    </div>
    {!visible.length&&<p role="status" className="text-xs leading-5 text-muted">{finishes.length?'No matching finishes. Try another name.':'No published Formica / HPL finishes are paired with this board yet.'}</p>}
   </>}
   {!board&&<p className="text-xs text-[var(--config-warning)]">Choose a published door board to see compatible finishes.</p>}
  </fieldset>}
  <Link href="/admin/catalog" target="_blank" className="mt-4 inline-block text-xs text-accent-ink underline underline-offset-4">Manage finishes in the catalog</Link>
 </section>;
}

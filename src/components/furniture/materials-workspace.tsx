'use client';
import {useState} from 'react';
import {Layers,MousePointer2} from 'lucide-react';
import {CabinetBoards} from './cabinet-boards';
import {PanelMaterials} from './panel-materials';
import {calculateFurniture,type FurnitureInput,type SupportedFamily} from '@/lib/furniture/families';
import type {MaterialCatalog} from '@/lib/furniture/materials';
import {UnitSelect} from '@/components/measurement/unit-provider';

export function MaterialsWorkspace({family,input,selected,onSelect,onChange,catalog,loading,error,retry,disabled}:{family:SupportedFamily;input:FurnitureInput;selected:string;onSelect:(id:string)=>void;onChange:(input:FurnitureInput)=>void;catalog:MaterialCatalog;loading:boolean;error:string;retry:()=>void;disabled:boolean}){
 const [scope,setScope]=useState(selected?'panel':'cabinet');
 const stockIssues=calculateFurniture(input).stockIssues??[];
 const cabinet=family==='cabinet'&&scope==='cabinet';
 return <section className="cabinet-config" aria-label="Materials workspace">
  {family==='cabinet'&&<div role="group" aria-label="Material scope" className="mb-4 grid grid-cols-2 gap-1 rounded-md border border-[var(--border)] bg-surface p-1">{([['cabinet','Cabinet boards',Layers],['panel','Individual panel',MousePointer2]] as const).map(([value,label,Icon])=><button type="button" key={value} aria-pressed={scope===value} onClick={()=>setScope(value)} className="flex min-h-9 items-center justify-center gap-2 rounded px-2 text-xs text-muted transition-colors hover:text-ink aria-pressed:bg-base aria-pressed:text-accent-ink max-[600px]:min-h-11"><Icon size={14} aria-hidden="true"/>{label}</button>)}</div>}
  <fieldset disabled={disabled||loading||Boolean(error)} className="min-w-0">
   {cabinet?<><UnitSelect/><CabinetBoards input={input} onChange={onChange} catalog={catalog} loading={loading} error="" retry={retry}/></>:<PanelMaterials input={input} selected={selected} onSelect={onSelect} onChange={onChange} catalog={catalog} loading={false} error="" retry={retry} disabled={disabled} compact/>}
  </fieldset>
  {stockIssues.length>0&&<details className="mt-4 rounded-md border border-[var(--border)] p-3 text-xs text-[var(--config-warning)]"><summary className="cursor-pointer font-medium">{stockIssues.length} stock fit warnings</summary><ul className="mt-2 space-y-2 leading-5">{stockIssues.map(issue=><li key={issue.field}>{issue.message}</li>)}</ul></details>}
  {loading&&!cabinet&&<p role="status" className="cad-help">Loading boards…</p>}
  {error&&<div role="alert" className="mt-3 flex items-center justify-between gap-2 text-xs text-danger-ink"><span>Materials unavailable. Your current choices are kept.</span><button type="button" className="min-h-9 rounded border border-[var(--border)] px-3" onClick={retry}>Retry</button></div>}
 </section>;
}

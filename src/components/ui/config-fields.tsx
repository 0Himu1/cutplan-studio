'use client';
import type {ReactNode} from 'react';
/** Shared dense configuration controls; native labels and browser validation remain intact. */
export function ConfigSelect({label,value,onChange,children,disabled=false}:{label:string;value:string|number;onChange:(value:string)=>void;children:ReactNode;disabled?:boolean}){return <label>{label}<select aria-label={label} value={value} disabled={disabled} onChange={e=>onChange(e.target.value)}>{children}</select></label>;}
export function ConfigNumber({label,value,onChange,min=0,max=100000}:{label:string;value:number;onChange:(value:number)=>void;min?:number;max?:number}){return <label>{label}<input aria-label={label} type="number" min={min} max={max} step={1} value={Number.isFinite(value)?value:''} onChange={e=>onChange(e.target.value===''?NaN:Number(e.target.value))}/></label>;}
export function ConfigTabs({value,onChange,items}:{value:string;onChange:(value:string)=>void;items:{id:string;label:string}[]}){return <div className="config-tabs" role="group" aria-label="Configuration pages">{items.map(item=><button key={item.id} type="button" aria-pressed={item.id===value} onClick={()=>onChange(item.id)}>{item.label}</button>)}</div>;}

export function ConfigChoice({label,value,items,onChange}:{label:string;value:string;items:[string,string][];onChange:(value:string)=>void}){
 return <div className="col-span-2"><span className="text-xs text-muted">{label}</span><div role="group" aria-label={label} className="config-tabs mt-1">{items.map(([id,title])=><button type="button" key={id} aria-pressed={value===id} onClick={()=>onChange(id)}>{title}</button>)}</div></div>;
}
export function ConfigSwitch({label,checked,onChange}:{label:string;checked:boolean;onChange:(checked:boolean)=>void}){return <button type="button" role="switch" aria-label={label} aria-checked={checked} className="flex min-h-11 items-center gap-2 text-left text-xs" onClick={()=>onChange(!checked)}><span aria-hidden="true" className={`relative h-5 w-8 shrink-0 rounded-full border border-[var(--border)] ${checked?'bg-[var(--accent)]':'bg-[var(--bg-base)]'}`}><span className={`absolute top-0.5 h-3.5 w-3.5 rounded-full bg-[var(--text-primary)] transition-transform motion-reduce:transition-none ${checked?'translate-x-3.5':'translate-x-0.5'}`}/></span>{label}</button>;}


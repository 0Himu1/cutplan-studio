'use client';
import {createContext,useContext,useSyncExternalStore,type ReactNode} from 'react';
import {MEASUREMENT_UNIT_KEY,type MeasurementUnit} from '@/lib/measurement';
let memoryUnit:MeasurementUnit='mm';
let overrideUnit:MeasurementUnit|null=null;
const listeners=new Set<()=>void>();
function snapshot():MeasurementUnit{if(overrideUnit)return overrideUnit;try{const value=localStorage.getItem(MEASUREMENT_UNIT_KEY);return value==='in'||value==='mm'?value:memoryUnit;}catch{return memoryUnit;}}
function subscribe(listener:()=>void){listeners.add(listener);function changed(event:StorageEvent){if(event.key===MEASUREMENT_UNIT_KEY||event.key===null){memoryUnit=event.newValue==='in'?'in':'mm';overrideUnit=null;listener();}}window.addEventListener('storage',changed);return()=>{listeners.delete(listener);window.removeEventListener('storage',changed);};}
function setUnit(unit:MeasurementUnit){if(unit!=='mm'&&unit!=='in')return;memoryUnit=unit;overrideUnit=unit;try{localStorage.setItem(MEASUREMENT_UNIT_KEY,unit);overrideUnit=null;}catch{/* Keep the preference usable in this page if browser storage is unavailable. */}listeners.forEach(listener=>listener());}
const Context=createContext<{unit:MeasurementUnit;setUnit:(unit:MeasurementUnit)=>void}>({unit:'mm',setUnit:()=>{}});
export function UnitProvider({children}:{children:ReactNode}){const unit=useSyncExternalStore(subscribe,snapshot,()=>'mm' as const);return <Context.Provider value={{unit,setUnit}}>{children}</Context.Provider>;}
export const useMeasurementUnit=()=>useContext(Context);
export function UnitSelect({disabled=false}:{disabled?:boolean}){const {unit,setUnit}=useMeasurementUnit();return <label>Display units<select aria-label="Display units" className="mt-1 min-h-11 w-full rounded-md border border-[var(--border)] bg-[var(--bg-base)] px-2 text-[var(--text-primary)]" value={unit} disabled={disabled} onChange={e=>setUnit(e.target.value as MeasurementUnit)}><option value="mm">Millimeters (mm)</option><option value="in">Inch + suta</option></select></label>;}

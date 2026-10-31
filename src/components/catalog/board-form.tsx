'use client';
import {useState} from 'react';
import {Palette,Ruler} from 'lucide-react';
import {MeasurementInput} from '@/components/measurement/measurement-input';
import {UnitSelect} from '@/components/measurement/unit-provider';
import {ConfigSelect} from '@/components/ui/config-fields';
import {boardCategories,boardCategory} from '@/lib/catalog/board-categories';
import type {CatalogItem} from '@/lib/catalog/contracts';
import {CatalogField,CatalogHeading} from './ui';
import {MaterialForm,MaterialIdentity,type MaterialFormProps} from './material-form';

export function BoardForm({item,busy,onSave,preset}:MaterialFormProps&{preset?:CatalogItem}){
 const details=item?.board_skus??preset?.board_skus??{};
 const [categoryCode,setCategoryCode]=useState(item?(item.category_code??''):(preset?.category_code??'PLAIN-MDF')),category=boardCategory(categoryCode);
 const [measurements,setMeasurements]=useState(()=>Object.fromEntries(['thickness_mm','sheet_width_mm','sheet_height_mm'].map(key=>[key,String(details[key]??(key==='thickness_mm'?18:''))])));
 const [grain,setGrain]=useState(String(details.grain_direction??'none')),[color,setColor]=useState(String(details.color_code??'#bda382'));
 const measurement=(key:string,label:string)=><MeasurementInput fixedMm={key==='thickness_mm'} required label={label} name={key} value={measurements[key]} onChange={value=>setMeasurements(previous=>({...previous,[key]:value}))}/>;
 return <MaterialForm item={item} kind="board" busy={busy} onSave={onSave} categoryCode={category?.code} details={{...measurements,grain_direction:grain,color_code:color}}>
  <ConfigSelect label="Board category" value={categoryCode} disabled={Boolean(item)} onChange={value=>{setCategoryCode(value);const next=boardCategory(value);setMeasurements(current=>({...current,thickness_mm:String(next&&(next.thicknesses as readonly number[]).includes(Number(current.thickness_mm))?current.thickness_mm:next?.thicknesses[0]??18)}));}}>{item&&!item.category_code&&<option value="">Legacy board</option>}{boardCategories.map(category=><option key={category.code} value={category.code}>{category.name}</option>)}</ConfigSelect>
  <MaterialIdentity key={categoryCode} item={item} code={category?`${category.code}-${measurements.thickness_mm}`:undefined} name={category?.name}/>
  <section className="border-t border-[var(--border)] pt-4"><CatalogHeading icon={Ruler} title="Dimensions" hint="Sheet dimensions follow global units. Board thickness always stays in millimeters."/><div className="cad-fields"><div className="col-span-2"><UnitSelect/></div>{measurement('sheet_width_mm','Sheet width')}{measurement('sheet_height_mm','Sheet height')}{category?<ConfigSelect label="Thickness (mm)" disabled={Boolean(item?.category_code)} value={measurements.thickness_mm} onChange={value=>setMeasurements(current=>({...current,thickness_mm:value}))}>{category.thicknesses.map(value=><option key={value} value={value}>{value} mm</option>)}</ConfigSelect>:measurement('thickness_mm','Thickness')}<ConfigSelect label="Grain direction" value={grain} onChange={setGrain}><option value="none">No grain restriction</option><option value="width">Along sheet width</option><option value="height">Along sheet height</option></ConfigSelect></div></section>
  <section className="border-t border-[var(--border)] pt-4"><CatalogHeading icon={Palette} title="Board color" hint="Saved with this thickness variant and used by the 3D preview. An assigned face finish takes priority."/><div className="flex items-end gap-3"><label className="config-field shrink-0"><span className="config-field-label">Color</span><input type="color" aria-label="Pick board color" value={/^#[0-9a-f]{6}$/i.test(color)?color:'#bda382'} onChange={event=>setColor(event.target.value)} className="h-9! w-12! cursor-pointer rounded-md border border-[var(--border)] bg-base p-1!"/></label><div className="min-w-0 flex-1"><CatalogField label="Board color code" value={color} onChange={event=>setColor(event.target.value)} placeholder="#BDA382" required pattern="#[0-9A-Fa-f]{6}" maxLength={7}/></div></div></section>
 </MaterialForm>;
}

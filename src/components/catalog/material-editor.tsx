'use client';

import {useState,type FormEvent} from 'react';

import {Layers,Palette,Ruler,Link2,Save} from 'lucide-react';

import {MeasurementInput} from '@/components/measurement/measurement-input';

import {UnitSelect} from '@/components/measurement/unit-provider';

import {ConfigSelect,ConfigChoice} from '@/components/ui/config-fields';

import {boardCategories,boardCategory} from '@/lib/catalog/board-categories';

import type {CatalogItem} from '@/lib/catalog/contracts';

import {CatalogField,CatalogHeading,CatalogFooter,catalogPrimary} from './ui';

export type CatalogSave=(value:Record<string,unknown>)=>Promise<boolean>;

export function MaterialEditor({item,busy,onSave,preset}:{item?:CatalogItem;busy:boolean;onSave:CatalogSave;preset?:CatalogItem}){

 const [kind,setKind]=useState(item?.kind??'board'),[dirty,setDirty]=useState(false),details=item?.board_skus??item?.finish_skus??item?.edging_skus??preset?.board_skus??{};

 const [categoryCode,setCategoryCode]=useState(item?(item.category_code??''):(preset?.category_code??'PLAIN-MDF')),category=kind==='board'?boardCategory(categoryCode):undefined;

 const [measurements,setMeasurements]=useState(()=>Object.fromEntries(['thickness_mm','sheet_width_mm','sheet_height_mm','width_mm'].map(key=>[key,String(details[key]??(key==='thickness_mm'?18:''))])));

 const [grain,setGrain]=useState(String(details.grain_direction??'none')),[surface,setSurface]=useState(String(details.surface??'laminate')),[material,setMaterial]=useState(String(details.material??'pvc')),[color,setColor]=useState(String(details.color_code??((item?.kind??'board')==='board'?'#bda382':'')));

 const measurement=(key:string,label:string)=><MeasurementInput fixedMm={key==='thickness_mm'} required label={label} name={key} value={measurements[key]} onChange={value=>{setDirty(true);setMeasurements(previous=>({...previous,[key]:value}));}}/>;

 function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();const form=new FormData(event.currentTarget),values:Record<string,unknown>={};for(const key of ['thickness_mm','sheet_width_mm','sheet_height_mm','texture_url','width_mm'])if(form.has(key))values[key]=form.get(key);if(kind==='board'){values.grain_direction=grain;values.thickness_mm=measurements.thickness_mm;values.color_code=color;}if(kind==='finish'){values.surface=surface;values.color_code=color;}if(kind==='edging')values.material=material;void onSave({action:item?'edit':'create',id:item?.id,version:item?.version,kind,category_code:kind==='board'?category?.code:undefined,code:item?.code??(category?`${category.code}-${measurements.thickness_mm}`:form.get('code')),name:category?.name??form.get('name'),details:values});}

 return <form className="catalog-form cabinet-config flex min-h-0 flex-1 flex-col" aria-label={item?'Material details':'New material'} onSubmit={submit} onChangeCapture={()=>setDirty(true)} aria-busy={busy}>

  <div className="min-h-0 flex-1 overflow-y-auto p-4"><fieldset disabled={busy||Boolean(item?.retired_at)} className="min-w-0 space-y-5">

   {!item&&<ConfigChoice label="Material type" value={kind} items={[["board","Board"],["finish","Finish"],["edging","Edging"]]} onChange={v=>{setKind(v as CatalogItem['kind']);setDirty(true);}}/>}

   <section>{kind==='board'&&<div className="mb-4"><ConfigSelect label="Board category" value={categoryCode} disabled={Boolean(item?.category_code)||Boolean(item&&!item.category_code)} onChange={value=>{setCategoryCode(value);setDirty(true);const next=boardCategory(value);setMeasurements(current=>({...current,thickness_mm:String(next&&(next.thicknesses as readonly number[]).includes(Number(current.thickness_mm))?current.thickness_mm:next?.thicknesses[0]??18)}));}}>{item&&!item.category_code&&<option value={categoryCode}>Legacy board</option>}{boardCategories.map(category=><option key={category.code} value={category.code}>{category.name}</option>)}</ConfigSelect></div>}<CatalogHeading icon={Layers} title="Identity" hint="Use a unique code and a recognizable name. Material type and code cannot change after creation."/><div className="cad-fields"><CatalogField key={kind} label="Code" name="code" value={item?.code??(category?`${category.code}-${measurements.thickness_mm}`:undefined)} readOnly={Boolean(category)} disabled={Boolean(item)} required pattern="[A-Za-z0-9][A-Za-z0-9._-]{1,63}" maxLength={64}/><CatalogField label="Name" name="name" key={category?.code??kind} {...(category?{value:category.name,readOnly:true}:{defaultValue:item?.name})} required minLength={2} maxLength={120}/></div></section>

   <section className="border-t border-[var(--border)] pt-4"><CatalogHeading icon={kind==='finish'?Palette:Ruler} title={kind==='finish'?'Appearance':'Dimensions'} hint={kind==='finish'?'Color is the fallback when an approved texture is unavailable. Choose compatible boards in the Finishes tab of each board.':'Sheet dimensions follow global units. Board thickness always stays in millimeters.'}/>

    <div className="cad-fields">{kind!=='finish'&&<div className="col-span-2"><UnitSelect/></div>}{kind==='board'?<>{measurement('sheet_width_mm','Sheet width')}{measurement('sheet_height_mm','Sheet height')}{category?<ConfigSelect label="Thickness (mm)" disabled={Boolean(item?.category_code)} value={measurements.thickness_mm} onChange={value=>{setDirty(true);setMeasurements(current=>({...current,thickness_mm:value}));}}>{category.thicknesses.map(value=><option key={value} value={value}>{value} mm</option>)}</ConfigSelect>:measurement('thickness_mm','Thickness')}<ConfigSelect label="Grain direction" value={grain} onChange={v=>{setGrain(v);setDirty(true);}}><option value="none">No grain restriction</option><option value="width">Along sheet width</option><option value="height">Along sheet height</option></ConfigSelect></>:kind==='finish'?<><ConfigSelect label="Surface" value={surface} onChange={v=>{setSurface(v);setDirty(true);}}>{['laminate','veneer','paint','raw','other'].map(value=><option key={value}>{value}</option>)}</ConfigSelect><CatalogField label="Color code (optional)" value={color} onChange={e=>setColor(e.target.value)} placeholder="#FFFFFF" pattern="#[0-9A-Fa-f]{6}"/><div className="col-span-2 flex items-center gap-3 rounded-md border border-[var(--border)] bg-surface p-3"><input type="color" aria-label="Pick finish color" value={/^#[0-9a-f]{6}$/i.test(color)?color:'#bda382'} onChange={e=>setColor(e.target.value)} className="size-11! shrink-0 cursor-pointer p-1!"/><span className="text-xs text-muted">{color||'No color assigned'}</span>{color&&<button type="button" className="ml-auto text-xs text-accent-ink underline underline-offset-4" onClick={()=>{setColor('');setDirty(true);}}>Clear color</button>}</div></>:<>{measurement('thickness_mm','Thickness')}{measurement('width_mm','Width')}<ConfigSelect label="Material" value={material} onChange={v=>{setMaterial(v);setDirty(true);}}>{['pvc','acrylic','aluminum','other'].map(value=><option key={value}>{value}</option>)}</ConfigSelect></>}</div>

   </section>

   {kind==='board'&&<section className="border-t border-[var(--border)] pt-4"><CatalogHeading icon={Palette} title="Board color" hint="Saved with this thickness variant and used by the 3D preview. An assigned face finish takes priority."/><div className="flex items-end gap-3"><label className="config-field shrink-0"><span className="config-field-label">Color</span><input type="color" aria-label="Pick board color" value={/^#[0-9a-f]{6}$/i.test(color)?color:'#bda382'} onChange={event=>{setColor(event.target.value);setDirty(true);}} className="h-9! w-12! cursor-pointer rounded-md border border-[var(--border)] bg-base p-1!"/></label><div className="min-w-0 flex-1"><CatalogField label="Board color code" value={color} onChange={event=>{setColor(event.target.value);setDirty(true);}} placeholder="#BDA382" required pattern="#[0-9A-Fa-f]{6}" maxLength={7}/></div></div></section>}

   {kind==='finish'&&<details className="border-t border-[var(--border)] pt-4"><summary className="cursor-pointer text-xs font-medium">Texture image <span className="ml-1 font-normal text-muted">Optional</span></summary><div className="mt-3"><CatalogField label="Approved texture URL (optional)" name="texture_url" type="url" pattern="https://.*" defaultValue={String(details.texture_url??'')} maxLength={2048} placeholder="https://…"/><p className="mt-2 text-xs leading-5 text-muted">Use a licensed, public HTTPS image.</p></div></details>}

   {item?.source_url&&<section className="border-t border-[var(--border)] pt-4"><CatalogHeading icon={Link2} title="Supplier source" hint="Verify the specification, price and availability before publishing."/><a className="break-all text-xs text-accent-ink underline underline-offset-4" href={item.source_url} target="_blank" rel="noreferrer">{item.source_name??'Supplier listing'}</a></section>}

  </fieldset></div>

  {!item?.retired_at&&<CatalogFooter>{dirty&&<span className="mr-auto text-xs text-[var(--config-warning)]">Unsaved details</span>}<button className={catalogPrimary} disabled={busy}><Save size={14} aria-hidden="true"/>{busy?'Saving…':item?'Save details and unpublish':'Create unpublished material'}</button></CatalogFooter>}

 </form>;

}


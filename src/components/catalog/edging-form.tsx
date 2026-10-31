'use client';
import {useState} from 'react';
import {Ruler} from 'lucide-react';
import {MeasurementInput} from '@/components/measurement/measurement-input';
import {UnitSelect} from '@/components/measurement/unit-provider';
import {ConfigSelect} from '@/components/ui/config-fields';
import {CatalogHeading} from './ui';
import {MaterialForm,MaterialIdentity,type MaterialFormProps} from './material-form';

export function EdgingForm({item,busy,onSave}:MaterialFormProps){
 const details=item?.edging_skus??{};
 const [thickness,setThickness]=useState(String(details.thickness_mm??'')),[width,setWidth]=useState(String(details.width_mm??'')),[material,setMaterial]=useState(String(details.material??'pvc'));
 return <MaterialForm item={item} kind="edging" busy={busy} onSave={onSave} details={{material,thickness_mm:thickness,width_mm:width}}>
  <MaterialIdentity item={item}/>
  <section className="border-t border-[var(--border)] pt-4"><CatalogHeading icon={Ruler} title="Edging dimensions" hint="Thickness stays in millimeters. Width follows the global measurement unit. Edging is priced per meter."/><div className="cad-fields"><div className="col-span-2"><UnitSelect/></div><MeasurementInput required fixedMm label="Thickness" name="thickness_mm" value={thickness} onChange={setThickness}/><MeasurementInput required label="Width" name="width_mm" value={width} onChange={setWidth}/><ConfigSelect label="Material" value={material} onChange={setMaterial}>{['pvc','acrylic','aluminum','other'].map(value=><option key={value} value={value}>{value}</option>)}</ConfigSelect></div></section>
 </MaterialForm>;
}

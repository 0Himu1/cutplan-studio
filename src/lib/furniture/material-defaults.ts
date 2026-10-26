import {calculateCabinet,type CabinetInput} from './cabinet.ts';
import {cabinetCompartments,cabinetInterior} from './compartments.ts';
import {fitNestedWidths} from './cabinet-allocation.ts';
import type {MaterialCatalog,MaterialDefault,MaterialSlot} from './materials.ts';
export const materialThicknessKey={body:'bodyThicknessMm',back:'backThicknessMm',front:'doorThicknessMm'} as const;
/** One atomic group-board change: physical dimensions, inherited material and compartment widths agree. */
export function selectGroupBoard(input:CabinetInput,slot:MaterialSlot,boardId:string,catalog:MaterialCatalog):CabinetInput{
 const previous=input.materialDefaults?.[slot],board=catalog.items.find(item=>item.id===boardId&&item.kind==='board'),spec=board?.board_skus;
 if(boardId&&(!board||![spec?.thickness_mm,spec?.sheet_width_mm,spec?.sheet_height_mm].every(n=>Number.isFinite(Number(n))&&Number(n)>0)))return input;
 const nextDefault:MaterialDefault=board?{boardId,thicknessMm:Number(spec!.thickness_mm),stockWidthMm:Number(spec!.sheet_width_mm),stockHeightMm:Number(spec!.sheet_height_mm),grainAxis:String(spec!.grain_direction??'none') as 'none'|'width'|'height',...(previous?.previewColor?{previewColor:previous.previewColor}:{})}:previous?.previewColor?{previewColor:previous.previewColor}:{};
 const next:CabinetInput={...input,materialDefaults:{...input.materialDefaults,[slot]:nextDefault}};
 if(board)next[materialThicknessKey[slot]]=nextDefault.thicknessMm!;
 const members=new Set(calculateCabinet(input).panels.filter(p=>p.materialSlot===slot).map(p=>p.panelId));
 next.panelOverrides=Object.fromEntries(Object.entries(input.panelOverrides??{}).filter(([id])=>!members.has(id)));
 if(!Object.keys(next.panelOverrides).length)delete next.panelOverrides;
 return reflowGroup(input,next,slot);
}
function reflowGroup(input:CabinetInput,next:CabinetInput,slot:MaterialSlot){
 if(slot==='body'&&input.compartmentMode&&Number.isFinite(next.bodyThicknessMm)&&next.bodyThicknessMm>0){
  const old=cabinetCompartments(input),clear=cabinetInterior(next).width-(old.length-1)*next.bodyThicknessMm,total=old.reduce((n,comp)=>n+comp.widthMm,0);
  next.compartments=input.compartmentMode==='manual'?old.map(comp=>({...comp,widthMm:comp.widthMm*clear/total})):cabinetCompartments(next);
  next.compartments=next.compartments.map(comp=>fitNestedWidths(comp,next.bodyThicknessMm));
 }
 return next;
}

export function setGroupThickness(input:CabinetInput,slot:MaterialSlot,value:number){return reflowGroup(input,{...input,[materialThicknessKey[slot]]:value},slot);}

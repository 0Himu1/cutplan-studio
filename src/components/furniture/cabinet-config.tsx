'use client';
import {useRef,useState} from 'react';
import {calculateCabinet,type CabinetInput} from '@/lib/furniture/cabinet';
import {cabinetCompartments,cabinetInterior,cabinetDrawerDepth,sectionMinimumHeight,compartmentDefault,sectionDefault,type CabinetCompartment,type CabinetSection} from '@/lib/furniture/compartments';
import {allocateHeight,editSectionHeight,equalWidths,fitNestedWidths} from '@/lib/furniture/cabinet-allocation';
import {MeasurementInput} from '@/components/measurement/measurement-input';
import {UnitSelect,useMeasurementUnit} from '@/components/measurement/unit-provider';
import {formatMeasurement} from '@/lib/measurement';
import {ConfigNumber,ConfigSelect,ConfigChoice as Choice,ConfigSwitch as Toggle} from '@/components/ui/config-fields';

const parse=(value:string)=>value.trim()===''?NaN:Number(value);
const uid=(prefix:string)=>prefix+'-'+crypto.randomUUID().slice(0,8);
/** Recursive editing mirrors the saved tree. Calculated measurements use the same allocator as panel generation. */
function Compartment({comp,index,height,input,onChange,onRemove,manual,depth=0}:{comp:CabinetCompartment;index:number;height:number;input:CabinetInput;onChange:(comp:CabinetCompartment)=>void;onRemove?:()=>void;manual:boolean;depth?:number}){
 const childCache=useRef<Record<string,CabinetCompartment[]>>({});
 const {unit}=useMeasurementUnit(),fmt=(n:number)=>Number.isFinite(n)?formatMeasurement(n,unit):'—';
 const t=input.bodyThicknessMm,b=input.panelOverrides?.['cabinet/back']?.thicknessMm??input.backThicknessMm;
 const allocation=allocateHeight(comp.sections.map(s=>s.heightMm),height,t);
 const updateSection=(index:number,patch:Partial<CabinetSection>)=>onChange({...comp,sections:comp.sections.map((s,i)=>i===index?{...s,...patch}:s)});
 const flexible=allocation.remaining-(allocation.automatic+1)*50-t;
 const canAppend=(section:CabinetSection)=>{const sections=[...comp.sections,section],next=allocateHeight(sections.map(s=>s.heightMm),height,t);return comp.sections.length<8&&allocation.automatic>0&&flexible>=0&&next.valid&&sections.every((s,i)=>next.resolved[i]>=sectionMinimumHeight(s,t));};
 const canAdd=canAppend(sectionDefault('new'));
 return <details open className="my-3 rounded-md border border-[var(--border)] p-3" aria-label={`${depth?'Slot':'Compartment'} ${index+1}`}>
  <summary className="cursor-pointer text-xs font-semibold">{depth?'Slot':'Compartment'} {index+1}<span className="ml-2 font-normal text-muted">{fmt(comp.widthMm)} wide · {comp.sections.length} sections</span></summary>
  <div className="cad-fields mt-3">
   {manual?<MeasurementInput label="Compartment width" value={String(comp.widthMm)} onChange={v=>onChange({...comp,widthMm:parse(v)})}/>:<p className="config-summary">Calculated width<br/>{fmt(comp.widthMm)}</p>}
   {depth===0&&<ConfigSelect label="Compartment doors" value={comp.doorCount} onChange={v=>onChange({...comp,doorCount:Number(v)})}>{[0,1,2].map(n=><option key={n}>{n}</option>)}</ConfigSelect>}
  </div>
  <div className="my-3 rounded-md bg-[var(--bg-base)] p-2 text-xs leading-5" aria-live="polite">Available height {fmt(height)} · Dividers {fmt(allocation.dividers)}<br/>Manual allocation {fmt(allocation.manual)} · {allocation.automatic?'Automatic space':'Unallocated space'} {fmt(allocation.remaining)}</div>
  {!allocation.valid&&<p className="cad-error" role="alert">Heights must fit after divider thickness. Reduce a manual height or select automatic height; each section needs at least 50 mm.</p>}
  <p className="cad-help">Sections run bottom to top. Automatic sections share remaining clear height.</p>
  {comp.sections.map((section,si)=>{
   const sh=allocation.resolved[si],drawers=section.drawers,drawerUsed=drawers.reduce((sum,d)=>sum+d.heightMm,0)+Math.max(0,drawers.length-1)*t,drawerRemaining=sh-drawerUsed;
   const changeType=(type:CabinetSection['type'])=>{if(section.type==='divider')childCache.current[section.id]=section.children;updateSection(si,{type,children:type==='divider'?(childCache.current[section.id]??equalWidths([compartmentDefault('slot-1',0,0),compartmentDefault('slot-2',0,0)],comp.widthMm,t)):[]});};
   return <details key={section.id} open className="my-2 border-l-2 border-[var(--border)] pl-3" aria-label={`Section ${si+1}`}>
    <summary className="min-h-11 cursor-pointer py-3 text-xs font-medium">Section {si+1} · {section.type} <span className="text-muted">· {fmt(sh)} {section.heightMm===0?'automatic':''}</span></summary>
    <div className="cad-fields">
     <ConfigSelect label="Section type" value={section.type} onChange={v=>changeType(v as CabinetSection['type'])}>{[['open','Open space'],['shelf','Shelves'],['drawer','Drawers'],['hanging','Hanging space'],...(depth<3?[['divider','Side-by-side divider']]:[])].map(([id,label])=><option key={id} value={id}>{label}</option>)}</ConfigSelect>
     <Toggle label="Automatic height" checked={section.heightMm===0} onChange={auto=>updateSection(si,{heightMm:auto?0:sh})}/>
     {section.heightMm===0?<p className="config-summary">Calculated section height<br/>{fmt(sh)}</p>:<MeasurementInput label="Section height" value={String(section.heightMm)} onChange={v=>onChange({...comp,sections:editSectionHeight(comp.sections,si,parse(v)>0?parse(v):NaN,height,t,()=>sectionDefault(uid('section')))})}/>}
    </div>
    {section.type==='shelf'&&<div className="cad-fields mt-3"><ConfigNumber label="Section shelves" value={section.shelfCount} max={20} onChange={shelfCount=>updateSection(si,{shelfCount})}/><ConfigSelect label="Shelf support" value={section.shelfMode} onChange={v=>updateSection(si,{shelfMode:v as CabinetSection['shelfMode']})}><option value="fixed">Fixed</option><option value="adjustable">Adjustable</option></ConfigSelect><p className="config-summary col-span-2">Clear opening {fmt((sh-section.shelfCount*t)/(section.shelfCount+1))}. Adjustable shelves use shelf-side clearance.</p></div>}
    {section.type==='hanging'&&<div className="mt-3"><MeasurementInput label="Rod offset from top" value={String(section.rodOffsetMm)} onChange={v=>updateSection(si,{rodOffsetMm:parse(v)})}/><p className="cad-help">Rod center below section top. Diameter 25 mm; hardware only. Keep at least 12.5 mm from top and bottom.</p></div>}
    {section.type==='drawer'&&<>
     <div className="cad-fields mt-3"><Choice label="Drawer position" value={section.external?'outside':'inside'} items={[["inside","Behind doors"],["outside","External faces"]]} onChange={v=>updateSection(si,{external:v==='outside'})}/><MeasurementInput label="Drawer slide clearance per side" value={String(section.slideClearanceMm)} fixedMm onChange={v=>updateSection(si,{slideClearanceMm:parse(v)})}/><p className="config-summary">Calculated box width<br/>{fmt(comp.widthMm-2*section.slideClearanceMm)}</p></div>
     <p className="cad-help">Proposed side-mounted box. Match clearance to the selected hardware before manufacture.</p>
     <p className="config-summary" aria-live="polite">Drawers and supports {fmt(drawerUsed)} · Remaining {fmt(drawerRemaining)}</p>
     {drawers.map((drawer,di)=>{
      const patch=(p:Partial<typeof drawer>)=>updateSection(si,{drawers:drawers.map((d,i)=>i===di?{...d,...p}:d)});
      return <details key={drawer.id} open className="my-2 rounded border border-[var(--border)] p-2" aria-label={`Drawer ${di+1}`}><summary className="cursor-pointer py-2 text-xs">Drawer {di+1} · {fmt(drawer.heightMm)}</summary><div className="cad-fields"><MeasurementInput label="Drawer height" value={String(drawer.heightMm)} onChange={v=>patch({heightMm:parse(v)})}/><Toggle label="Automatic drawer depth" checked={drawer.depthMm===0} onChange={auto=>patch({depthMm:auto?0:cabinetDrawerDepth(input,section.external)})}/>{drawer.depthMm===0&&<p className="config-summary">Calculated depth<br/>{fmt(cabinetDrawerDepth(input,section.external))}</p>}{drawer.depthMm!==0&&<MeasurementInput label="Drawer depth" value={String(drawer.depthMm)} onChange={v=>patch({depthMm:parse(v)>0?parse(v):NaN})}/>}</div><button type="button" disabled={drawers.length<=1} className="mt-2" onClick={()=>updateSection(si,{drawers:drawers.filter((_,i)=>i!==di)})}>Remove drawer {di+1}</button></details>;
     })}
     {drawerRemaining<-.1&&<p className="cad-error" role="alert">Drawers exceed the section by {fmt(-drawerRemaining)}. Reduce drawer heights or enlarge this section.</p>}
     <div className="config-actions"><button type="button" disabled={drawers.length>=6||drawerRemaining<t+b+75.4} onClick={()=>updateSection(si,{drawers:[...drawers,{id:uid('drawer'),heightMm:Math.min(150,drawerRemaining-t),depthMm:0}]})}>Add drawer</button><button type="button" disabled={(sh-(drawers.length-1)*t)/drawers.length<b+75.4} onClick={()=>updateSection(si,{drawers:drawers.map(d=>({...d,heightMm:(sh-(drawers.length-1)*t)/drawers.length}))})}>Equal drawer heights</button></div>
    </>}
    {section.type==='divider'&&<div className="mt-3"><ConfigNumber label="Divider slots" value={section.children.length} min={2} max={6} onChange={n=>{if(!Number.isInteger(n)||n<2||n>6)return;updateSection(si,{children:equalWidths(Array.from({length:n},(_,i)=>section.children[i]??compartmentDefault(uid('slot'),0,0)),comp.widthMm,t)});}}/>{section.children.map((child,ci)=><Compartment key={child.id} comp={child} index={ci} depth={depth+1} height={sh} input={input} manual={false} onChange={next=>updateSection(si,{children:section.children.map((c,i)=>i===ci?next:c)})}/>)}</div>}
    <div className="config-actions"><button type="button" disabled={!canAppend({...section,heightMm:0})} onClick={()=>onChange({...comp,sections:[...comp.sections,{...structuredClone(section),id:uid('section'),heightMm:0}]})}>Duplicate with automatic height</button><button type="button" disabled={comp.sections.length<=1} onClick={()=>onChange({...comp,sections:comp.sections.filter((_,i)=>i!==si).map((s,i,all)=>i===all.length-1&&!all.some(s=>s.heightMm===0)?{...s,heightMm:0}:s)})}>Remove section {si+1}</button><button type="button" disabled={si===0} onClick={()=>{const sections=[...comp.sections];[sections[si-1],sections[si]]=[sections[si],sections[si-1]];onChange({...comp,sections});}}>Move down</button><button type="button" disabled={si===comp.sections.length-1} onClick={()=>{const sections=[...comp.sections];[sections[si+1],sections[si]]=[sections[si],sections[si+1]];onChange({...comp,sections});}}>Move up</button></div>
   </details>;
  })}
  <div className="config-actions"><button type="button" disabled={!canAdd} onClick={()=>onChange({...comp,sections:[...comp.sections,sectionDefault(uid('section'))]})}>Add section</button>{onRemove&&<button type="button" onClick={onRemove}>Remove compartment {index+1}</button>}</div>
  {!canAdd&&comp.sections.length<8&&<p className="cad-help">To add a section, release enough height using Automatic height. Reserve a divider and at least 50 mm per section.</p>}
 </details>;
}

export function CabinetConfig({input,onChange,disabled,onApply,onCancel,error}:{input:CabinetInput;onChange:(value:CabinetInput)=>void;disabled:boolean;onApply:()=>void;onCancel:()=>void;error?:string}){
 const [notice,setNotice]=useState(''),{unit}=useMeasurementUnit();
 const layout=cabinetCompartments(input),inner=cabinetInterior(input),t=input.bodyThicknessMm;
 const unassigned=calculateCabinet({...input,panelOverrides:undefined});
 const removable=unassigned.blockingErrors.length?[]:Object.keys(input.panelOverrides??{}).filter(id=>!unassigned.panels.some(panel=>panel.panelId===id));
 const change=(patch:Partial<CabinetInput>)=>onChange({...input,...patch});
 const length=(label:string,key:keyof CabinetInput,fixedMm=false)=><MeasurementInput key={key} label={label} value={String(input[key])} fixedMm={fixedMm} onChange={value=>{
  const next={...input,[key]:parse(value)};
  if(input.compartmentMode==='manual'&&['widthMm','bodyThicknessMm'].includes(key)&&Number.isFinite(parse(value))){const width=cabinetInterior(next).width,old=layout.reduce((sum,c)=>sum+c.widthMm,0),clear=width-(layout.length-1)*next.bodyThicknessMm;next.compartments=layout.map(c=>({...c,widthMm:c.widthMm*clear/old}));}
  if(input.compartmentMode&&['widthMm','bodyThicknessMm'].includes(key)&&Number.isFinite(parse(value)))next.compartments=cabinetCompartments(next).map(c=>fitNestedWidths(c,next.bodyThicknessMm));
  change(next);
 }}/>;
 function enable(){const tree=cabinetCompartments({...input,compartmentMode:'auto'}).map(c=>({...c,sections:[{...sectionDefault('section-1'),type:input.shelfCount?'shelf' as const:'open' as const,shelfCount:input.shelfCount}]}));change({compartmentMode:'auto',compartments:tree});}
 function update(index:number,comp:CabinetCompartment){const next=layout.map((c,i)=>i===index?comp:c);if(comp.widthMm!==layout[index].widthMm&&next.length>1){const other=index===next.length-1?index-1:next.length-1;next[other]={...next[other],widthMm:next[other].widthMm+layout[index].widthMm-comp.widthMm};}change({compartments:next.map(c=>fitNestedWidths(c,t))});}
 return <form className="cabinet-config" onSubmit={e=>{e.preventDefault();if(!error&&!disabled)onApply();}}><fieldset disabled={disabled}>
  <h3 className="cad-section-title">Size</h3><p className="cad-help">Carcass dimensions. Display units convert measurements without changing physical sizes.</p><div className="cad-fields">{length('Width','widthMm')}{length('Height','heightMm')}{length('Depth','depthMm')}<UnitSelect/></div>
  <details open className="mt-5"><summary className="cad-section-title cursor-pointer">Construction</summary><div className="cad-fields mt-3"><Choice label="Door position" value={input.doorPosition??'inset'} items={[["inset","Inside opening"],["overlay","Outside carcass"]]} onChange={v=>change({doorPosition:v as CabinetInput['doorPosition']})}/><Choice label="Back position" value={input.backPosition} items={[["inset","Inset back"],["outside","Outside back"]]} onChange={v=>change({backPosition:v as CabinetInput['backPosition']})}/>{length('Raised bottom','skirtingHeightMm')}{length('Body thickness','bodyThicknessMm',true)}{length('Back thickness','backThicknessMm',true)}{length('Door thickness','doorThicknessMm',true)}{length('Door gap','doorGapMm',true)}{length('Shelf side clearance','shelfSideClearanceMm',true)}</div><p className="cad-help">Thickness, door gap, shelf-side clearance and drawer-slide clearance always use millimeters. Proposed construction requires manufacturing review.</p></details>
  {!input.compartmentMode&&<div className="config-empty"><div className="cad-fields"><ConfigNumber label="Shelves" value={input.shelfCount} max={20} onChange={shelfCount=>change({shelfCount})}/><ConfigSelect label="Doors" value={input.doorCount} onChange={v=>change({doorCount:Number(v)})}>{[0,1,2].map(n=><option key={n}>{n}</option>)}</ConfigSelect></div><p className="cad-help">This saved cabinet uses a single opening. Enable compartments for independent shelves, drawers, hanging and dividers.</p><button className="cad-primary" type="button" onClick={enable}>Enable compartments</button></div>}
  {input.compartmentMode&&<><h3 className="cad-section-title">Compartments</h3><div className="cad-fields"><Choice label="Layout mode" value={input.compartmentMode} items={[["auto","Automatic"],["manual","Manual"]]} onChange={v=>{change({compartmentMode:v as CabinetInput['compartmentMode'],compartments:layout});setNotice('Configurations retained. Automatic mode adjusts widths; manual mode lets you balance adjacent widths.');}}/></div><p className="cad-help">Clear width {formatMeasurement(inner.width,unit)} · {Math.max(0,layout.length-1)} partitions × {t} mm. Automatic widths retain configured compartments when the cabinet shrinks.</p>{notice&&<p role="status" className="cad-help">{notice}</p>}
   {layout.map((comp,i)=><Compartment key={comp.id} comp={comp} index={i} height={inner.height} input={input} manual={input.compartmentMode==='manual'} onChange={next=>update(i,next)} onRemove={input.compartmentMode==='manual'&&layout.length>1?()=>change({compartments:equalWidths(layout.filter((_,j)=>j!==i),inner.width,t)}):undefined}/>)}
   <div className="config-actions"><button type="button" disabled={input.compartmentMode!=='manual'||layout.length>=6||inner.width-(layout.length*t)<(layout.length+1)*50} onClick={()=>change({compartments:equalWidths([...layout,compartmentDefault(uid('comp'),0)],inner.width,t)})}>Add compartment</button><button type="button" disabled={input.compartmentMode!=='manual'} onClick={()=>change({compartments:equalWidths(layout,inner.width,t)})}>Equal widths</button></div>
  </>}
 </fieldset>{error&&<p className="cad-error" role="alert">{error}</p>}{removable.length>0&&<div className="my-3"><p className="cad-help">This layout removes {removable.length} assigned panels. Surviving panel assignments are retained.</p><button type="button" disabled={disabled} onClick={()=>{const overrides={...input.panelOverrides};for(const id of removable)delete overrides[id];change({panelOverrides:overrides});}}>Clear materials for removed panels</button></div>}<div className="cad-dialog-actions"><button type="button" onClick={onCancel}>Cancel</button><button type="submit" className="cad-primary" disabled={disabled||Boolean(error)}>Apply measurements</button></div></form>;
}


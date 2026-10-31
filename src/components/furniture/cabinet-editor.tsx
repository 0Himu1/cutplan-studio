'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import {ThemeToggle} from '@/components/theme-toggle';
import {MeasurementInput} from '@/components/measurement/measurement-input';
import {UnitSelect,useMeasurementUnit} from '@/components/measurement/unit-provider';
import {MaterialsWorkspace} from './materials-workspace';
import {DoorFinishPicker} from './door-finish-picker';
import {CabinetConfig} from './cabinet-config';
import { materialAssignments,validateMaterials, type MaterialCatalog } from '@/lib/furniture/materials';
import Link from 'next/link';
import { ArrowLeft, Box, Check, FileText, ImagePlus, Expand, DoorOpen, DoorClosed, PanelTop, Palette, Eye, FolderOpen, Layers, SwatchBook, MousePointer2, Redo2, Ruler, Save, Undo2, ZoomIn, ZoomOut } from 'lucide-react';
import { EditorDialog } from './editor-dialog';
import {ViewGizmo,type GizmoAxes} from './view-gizmo';
import { SheetPreview } from './sheet-preview';
import { CabinetDrawing } from './cabinet-drawing';
import { defaultFurniture, familyLabel, familyOf, type SupportedFamily } from '@/lib/furniture/families';
import { calculateFurniture as calculateCabinet, type FurnitureInput as CabinetInput } from '@/lib/furniture/families';
import { configurationKey, edit, initialHistory, parseRecovery, redo, undo } from '@/lib/furniture/editor';

const AssemblyWorkflow=dynamic(()=>import('./assembly-workflow').then(module=>module.AssemblyWorkflow),{ssr:false});
const CommandWorkflow=dynamic(()=>import('./command-workflow').then(module=>module.CommandWorkflow),{ssr:false});
const PhotoWorkflow=dynamic(()=>import('../photos/photo-workflow').then(module=>module.PhotoWorkflow),{ssr:false});
const QuoteWorkflow=dynamic(()=>import('../commerce/quote-workflow').then(module=>module.QuoteWorkflow),{ssr:false});
const CabinetViewport=dynamic(()=>import('./cabinet-viewport').then(module=>module.CabinetViewport),{ssr:false});

type SaveResult = { ok: true; version: number } | { ok: false; error: string };
type Props = {
  commerce?:{projectId:string;revisionId?:string}; family?: SupportedFamily; projectName?: string; projectTools?: ReactNode;
  initial?: CabinetInput; version: number; recoveryKey: string; readOnly?: boolean; disabled?: boolean;
  saveLabel: string; onSave: (input: CabinetInput, expectedVersion: number) => Promise<SaveResult>;
};
const labels = { widthMm:'Width', heightMm:'Height', depthMm:'Depth', bodyThicknessMm:'Body thickness', backThicknessMm:'Back thickness', doorThicknessMm:'Door thickness', skirtingHeightMm:'Raised bottom' } as const;
type LengthKey = keyof typeof labels;
const lengths = Object.keys(labels) as LengthKey[];
const fields = (input: CabinetInput) => Object.fromEntries(lengths.map(key=>[key,String(input[key])])) as Record<LengthKey,string>;
export function CabinetEditor({ commerce, family='cabinet', projectName='Furniture project', projectTools, initial, version, recoveryKey, readOnly=false, disabled=false, saveLabel, onSave }: Props) {
  const id=useId();
  const [selectedPanel,setSelectedPanel]=useState('');
  const [catalog,setCatalog]=useState<MaterialCatalog>({items:[],compatibility:[]});
  const [catalogError,setCatalogError]=useState('');
  const [catalogLoading,setCatalogLoading]=useState(true);
  const [catalogAttempt,setCatalogAttempt]=useState(0);
  useEffect(()=>{const controller=new AbortController();void fetch('/api/catalog',{signal:controller.signal,cache:'no-store'}).then(async response=>{if(!response.ok)throw new Error();const data=await response.json();if(!Array.isArray(data.items)||!Array.isArray(data.compatibility))throw new Error();setCatalog(data);setCatalogError('');}).catch(()=>{if(!controller.signal.aborted)setCatalogError('Materials could not load.');}).finally(()=>{if(!controller.signal.aborted)setCatalogLoading(false);});return ()=>controller.abort();},[catalogAttempt]);
  const start=initial??defaultFurniture(family);
  const title=familyLabel(family);
  const [history,setHistory]=useState(()=>initialHistory(start));
  const {unit}=useMeasurementUnit();
  const [raw,setRaw]=useState(()=>fields(start));
  const [view,setView]=useState<'front'|'floor'|'right'>('front');
  const [cuttingSettingsOpen,setCuttingSettingsOpen]=useState(false);
  const [mode,setMode]=useState<'3d'|'2d'|'sheets'>('3d');
  const [webglUnavailable,setWebglUnavailable]=useState(false);
  const unavailable=useCallback(()=>{setWebglUnavailable(true);setMode('2d');},[]);
  const [task,setTask]=useState<null|'dimensions'|'construction'|'materials'|'finishings'|'panels'|'project'|'cutlist'|'recovery'|'quote'|'photo'|'commands'|'assembly'>(null);
  const [step,setStep]=useState(0);
  const [draft,setDraft]=useState<CabinetInput|null>(null);
  const [context,setContext]=useState<{x:number;y:number}|null>(null);
  const panelContext=useCallback((panelId:string,position:{x:number;y:number})=>{setSelectedPanel(panelId);setPanelMode(true);setContext({x:Math.min(position.x,window.innerWidth-230),y:Math.min(position.y,window.innerHeight-390)});},[]);
  const [panelMode,setPanelMode]=useState(false);
  const [exploded,setExploded]=useState(false);
  const [doorsOpen,setDoorsOpen]=useState(false);
  const [showDimensions,setShowDimensions]=useState(false);
  const [xray,setXray]=useState(false);
  const [hideDoors,setHideDoors]=useState(false),[hideBack,setHideBack]=useState(false);
  const gizmoAxes=useRef<GizmoAxes>({x:[.77,-.3,.5],y:[0,.88,.4],z:[-.64,-.36,.6]});
  const cameraStore=useRef<{position:number[];target:number[]}|null>(null);
    const [camera,setCamera]=useState({view:'iso',serial:0,zoom:0});
  const [drawingZoom,setDrawingZoom]=useState(1);
  const [closingTask,setClosingTask]=useState(false);
  const closeTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  useEffect(()=>()=>{if(closeTimer.current)clearTimeout(closeTimer.current);},[]);
  function openTask(next:NonNullable<typeof task>){if(task===next&&!closingTask)return;if(closeTimer.current)clearTimeout(closeTimer.current);setClosingTask(false);setCuttingSettingsOpen(false);setContext(null);setStep(0);setDraft(structuredClone(history.present));setRaw(fields(history.present));setTask(next);}
  function dismissTask(input:CabinetInput){if(closingTask)return;setClosingTask(true);closeTimer.current=setTimeout(()=>{setTask(null);setDraft(null);setRaw(fields(input));setMessage('');setClosingTask(false);},window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:260);}
  function closeTask(){dismissTask(history.present);}

  const [baseVersion,setBaseVersion]=useState(version);
  const [savedKey,setSavedKey]=useState(initial?configurationKey(initial):'');
  const [ready,setReady]=useState(readOnly);
  const [recoveryProblem,setRecoveryProblem]=useState('');
  const [recoveryRaw,setRecoveryRaw]=useState<string|null>(null);
  const [storageKey,setStorageKey]=useState(recoveryKey);
  const [message,setMessage]=useState('');
  const [working,setWorking]=useState(false);
  useEffect(()=>{
    if(readOnly)return;
    let active=true;
    queueMicrotask(()=>{
    if(!active)return;
    try {
      let tabId=sessionStorage.getItem('cutplan.editor.tab-id');
      if(!tabId){tabId=crypto.randomUUID();sessionStorage.setItem('cutplan.editor.tab-id',tabId);}
      const scopedKey=`${recoveryKey}.${tabId}`;
      setStorageKey(scopedKey);
      const stored=localStorage.getItem(scopedKey);
      const recovered=parseRecovery(stored);
      if(stored&&!recovered){setRecoveryRaw(stored);setRecoveryProblem('The editor recovery record is unreadable or from a newer version. Download it or reset this editor recovery before editing.');}
      if(recovered&&familyOf(recovered.input)!==family){setRecoveryRaw(stored);setRecoveryProblem('Recovery belongs to another furniture family. Download or reset it before editing.');}
      if(recovered&&familyOf(recovered.input)===family){setHistory(initialHistory(recovered.input));setRaw(fields(recovered.input));setBaseVersion(configurationKey(recovered.input)===configurationKey(start)?version:recovered.baseVersion);}
    } catch {setStorageKey(`${recoveryKey}.${crypto.randomUUID()}`);setRecoveryProblem('Browser recovery is unavailable. Keep this page open and enable site storage before saving.');}
    setReady(true);
    });
    return ()=>{active=false;};
    // A project/revision identity is mounted separately. External changes must not overwrite local edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[recoveryKey,readOnly]);
  useEffect(()=>{
    if(!ready||readOnly||recoveryRaw!==null)return;
    try {localStorage.setItem(storageKey,JSON.stringify({schemaVersion:1,baseVersion,input:history.present}));}
    catch {queueMicrotask(()=>setRecoveryProblem('Browser recovery could not be saved. Your design is still on this page; free storage and retry.'));}
  },[history.present,baseVersion,ready,readOnly,storageKey,recoveryRaw]);
  const current=history.present;
  const candidate=useMemo(()=>{const next={...(draft??current)};for(const key of lengths)if(raw[key]!==String(current[key]))next[key]=raw[key].trim()===''?NaN:Number(raw[key]);return next;},[draft,current,raw]);
  const validation=useMemo(()=>calculateCabinet(candidate),[candidate]);
  const invalid=validation.blockingErrors.length>0;
  const preview=draft&&!invalid&&configurationKey(candidate)!==configurationKey(current)?candidate:current;
  const calculation=calculateCabinet(preview);
  const dirty=configurationKey(current)!==savedKey;
  const locked=readOnly||disabled||working||!ready||recoveryRaw!==null||closingTask;

  function commit(input:CabinetInput){
    const errors=calculateCabinet(input).blockingErrors;
    if(errors.length){setMessage(errors.map(error=>error.message).join(' '));return;}
    setHistory(previous=>edit(previous,input));setRaw(fields(input));setMessage('');
  }
  function travel(direction:'undo'|'redo'){
    const next=(direction==='undo'?undo:redo)(history);
    setHistory(next);setRaw(fields(next.present));setMessage('');
  }
  function keyboard(event:KeyboardEvent<HTMLElement>){
    const target=event.target as HTMLElement;
    if(target.closest('input,select,textarea,[contenteditable=true],dialog')||locked)return;
    if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='z'){
      event.preventDefault();travel(event.shiftKey?'redo':'undo');
    }
    if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='s'){event.preventDefault();void save();}
  }
  async function save(){
    if(locked||invalid||task)return;
    const materialErrors=validateMaterials(materialAssignments(candidate,validation.panels),catalog);
    if(materialErrors.length){setMessage(materialErrors.join(' '));return;}
    commit(candidate);setWorking(true);setMessage('');
    try {
      const result=await onSave(candidate,baseVersion);
      if(result.ok){setBaseVersion(result.version);setSavedKey(configurationKey(candidate));setMessage('Design saved.');}
      else setMessage(result.error);
    } catch {setMessage('The save did not finish. Your design is still here. Retry this save.');}
    finally {setWorking(false);}
  }
  function download(){
    const text=recoveryRaw??JSON.stringify({schemaVersion:1,baseVersion,input:current},null,2);
    const url=URL.createObjectURL(new Blob([text],{type:'application/json'}));
    const link=document.createElement('a');link.href=url;link.download='cabinet-editor-recovery.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function resetRecovery(){
    try{localStorage.removeItem(storageKey);setRecoveryRaw(null);setRecoveryProblem('');setHistory(initialHistory(start));setRaw(fields(start));setBaseVersion(version);setMessage('Editor recovery reset to the saved project.');}
    catch{setMessage('Recovery could not be reset. Allow site storage and retry.');}
  }

  const active=calculateCabinet(preview).panels.find(panel=>panel.panelId===selectedPanel);
  const taskTitle=task==='finishings'?'Select Finishings':task==='assembly'?'Assembly documents':task==='commands'?'Editor commands':task==='photo'?'Photo suggestions':task==='quote'?'Quote and order':task==='dimensions'?'Edit dimensions':task==='construction'?'Construction':task==='materials'?'Panel materials':task==='panels'?'Select a panel':task==='cutlist'?'Current cut list':task==='recovery'?'Recovery and save status':'Project and history';
  function apply(){
    if(invalid)return;
    const errors=validateMaterials(materialAssignments(candidate,validation.panels),catalog);
    if(errors.length&&(task==='materials'||task==='finishings'||candidate.materialDefaults)){setMessage(errors.join(' '));return;}
    commit(candidate);dismissTask(candidate);
  }
  function orient(next:'front'|'floor'|'right'|'iso'){
    if(next==='iso'){if(webglUnavailable)return;setMode('3d');setCamera(previous=>({view:next,serial:previous.serial+1,zoom:0}));}
    else {setView(next);if(mode==='3d')setCamera(previous=>({view:next,serial:previous.serial+1,zoom:0}));setDrawingZoom(1);}
  }
  function zoom(direction:number){setDrawingZoom(value=>Math.max(.5,Math.min(3,value+direction*.15)));setCamera(previous=>({...previous,serial:previous.serial+1,zoom:direction}));}
  const rail=(label:string,Icon:typeof Box,action:()=>void,pressed=false)=><button className="cad-tool" type="button" aria-label={label} aria-pressed={pressed} onClick={action}><Icon size={18} aria-hidden="true"/><span className="cad-tool-tip" aria-hidden="true">{label}</span></button>;
  return <section className="cad-workspace" aria-label={`${title} editor`} onKeyDown={keyboard} onContextMenu={event=>{if((event.target as HTMLElement).closest('dialog'))return;event.preventDefault();setContext({x:Math.min(event.clientX,window.innerWidth-230),y:Math.min(event.clientY,window.innerHeight-390)});}}>
    <header className="cad-commandbar">
      <Link href="/projects" aria-label="All projects" title="All projects"><ArrowLeft size={18}/><span className="cad-brand">CutPlan <b>Studio</b></span></Link>
      <span className="cad-separator"/>
      <h1 title={projectName}>{projectName}</h1>
      <span className="cad-save-state"><Check size={14}/>{readOnly?'Read-only revision':dirty?'Unsaved changes':'Saved'}</span>
      <div className="cad-command-actions">
        <ThemeToggle/>
        <button type="button" aria-label={`Undo ${title.toLowerCase()} change`} title="Undo" disabled={locked||Boolean(task)||!history.past.length} onClick={()=>travel('undo')}><Undo2 size={18}/><span>Undo</span></button>
        <button type="button" aria-label={`Redo ${title.toLowerCase()} change`} title="Redo" disabled={locked||Boolean(task)||!history.future.length} onClick={()=>travel('redo')}><Redo2 size={18}/><span>Redo</span></button>
        {!readOnly&&<button type="button" className="cad-primary" title={saveLabel} disabled={locked||Boolean(task)||(!dirty&&Boolean(initial))} onClick={()=>void save()}><Save size={17}/><span>{working?'Saving…':saveLabel}</span></button>}
        <button type="button" aria-label="Photo suggestions" title="Photo suggestions" onClick={()=>openTask('photo')}><ImagePlus size={19}/></button>
        <button type="button" aria-label="Quote and order" title="Quote and order" onClick={()=>openTask('quote')}><FileText size={19}/></button>
        <button type="button" aria-label="Project and history" title="Project and history" onClick={()=>openTask('project')}><FolderOpen size={19}/></button>
      </div>
    </header>
    <div className="cad-stage">
      <div className={`cad-canvas cad-mode-${mode}`} onWheel={event=>{if(mode==='2d')setDrawingZoom(value=>Math.max(.5,Math.min(3,value+(event.deltaY<0?.1:-.1))));}} onClick={()=>setContext(null)} onKeyDown={event=>{if(event.key==='Escape')setContext(null);if(event.key==='ContextMenu'||(event.shiftKey&&event.key==='F10')){event.preventDefault();setContext({x:Math.min(240,window.innerWidth-230),y:150});}}} tabIndex={0} aria-label={`${title} canvas`}>
      <nav className="cad-rail cad-left" aria-label="Model tools">
        {rail('Dimensions',Ruler,()=>openTask('dimensions'),!closingTask&&(task==='dimensions'||(family==='cabinet'&&task==='construction')))}
        {family!=='cabinet'&&rail('Build',Box,()=>openTask('construction'),!closingTask&&task==='construction')}
        {rail('Materials',SwatchBook,()=>{setPanelMode(true);openTask('materials');},!closingTask&&task==='materials')}
        {rail('Select',MousePointer2,()=>{setPanelMode(false);setSelectedPanel('');},!panelMode)}
        {rail('Panels',Layers,()=>{setPanelMode(true);openTask('panels');},panelMode)}
        {active?.role==='door'&&rail('Select Finishings',Palette,()=>openTask('finishings'),!closingTask&&task==='finishings')}
      </nav>
      <nav className="cad-rail cad-right" aria-label={`${title} tools`}>
        {rail('Explode',Expand,()=>setExploded(value=>!value),exploded)}
        {calculation.panels.some(panel=>panel.role==='door')&&rail('Open doors',DoorOpen,()=>setDoorsOpen(value=>!value),doorsOpen)}
        {rail('Show dimensions',Ruler,()=>setShowDimensions(value=>!value),showDimensions)}
        {rail('X-ray',Eye,()=>setXray(value=>!value),xray)}
        {mode==='3d'&&calculation.panels.some(panel=>panel.role==='door')&&rail('Hide doors',DoorClosed,()=>{setHideDoors(value=>!value);if(!hideDoors&&calculation.panels.some(panel=>panel.panelId===selectedPanel&&panel.role==='door'))setSelectedPanel('');},hideDoors)}
        {mode==='3d'&&calculation.panels.some(panel=>panel.role==='back')&&rail('Hide back',PanelTop,()=>{setHideBack(value=>!value);if(!hideBack&&calculation.panels.some(panel=>panel.panelId===selectedPanel&&panel.role==='back'))setSelectedPanel('');},hideBack)}
      </nav>
        {webglUnavailable&&<p className="cad-texture-note" role="status">3D unavailable on this device. Measured 2D remains available.</p>}
        <div className="cad-mode" role="group" aria-label="Preview mode">{(['3d','2d','sheets'] as const).map(value=><button type="button" key={value} disabled={value==='3d'&&webglUnavailable} aria-pressed={mode===value} onClick={()=>{setMode(value);setCuttingSettingsOpen(false);}}>{value.toUpperCase()}</button>)}</div>
        {!ready?<p className="cad-center" role="status">Loading cabinet editor…</p>:readOnly&&!initial?<p className="cad-center">This revision has no saved furniture dimensions.</p>:mode==='sheets'?<SheetPreview catalog={catalog} settingsOpen={cuttingSettingsOpen} onSettingsOpen={setCuttingSettingsOpen} jobKey={recoveryKey} input={preview} selected={selectedPanel} onSelect={setSelectedPanel}/>:mode==='3d'?<CabinetViewport onPanelContext={panelContext} axes={gizmoAxes} input={preview} selected={selectedPanel} onSelect={setSelectedPanel} catalog={catalog} embedded hideDoors={hideDoors} hideBack={hideBack} doorsOpen={doorsOpen} showDimensions={showDimensions} xray={xray} exploded={exploded} memory={cameraStore} cameraCommand={camera} onUnavailable={unavailable}/>:<CabinetDrawing input={preview} view={view} selected={selectedPanel} onSelect={setSelectedPanel} zoom={drawingZoom}/>}
        <div className="cad-selection pointer-events-none inline-flex min-h-11 items-center rounded-md px-3 text-xs">{panelMode?(active?.label??'Choose a panel'):title}</div>
        {mode!=='sheets'&&<ViewGizmo axes={gizmoAxes} view={mode==='2d'?view:camera.view} onView={orient}/>}
        <div className="cad-zoom"><button type="button" aria-label="Zoom out" onClick={()=>zoom(-1)}><ZoomOut size={18}/></button><button type="button" aria-label="Fit model" onClick={()=>{setDrawingZoom(1);setCamera(previous=>({...previous,serial:previous.serial+1,zoom:0}));}}><Expand size={18}/></button><button type="button" aria-label="Zoom in" onClick={()=>zoom(1)}><ZoomIn size={18}/></button></div>
      </div>

    </div>
    <footer className="cad-status"><button type="button" onClick={()=>openTask('recovery')}>{message||recoveryProblem||(!readOnly&&baseVersion!==version?'Saved project changed — review recovery':readOnly?'Saved revision — read-only':dirty?'Design has unsaved changes.':'Design matches the saved project.')}</button><span>Proposed construction · {unit==='mm'?'mm':'inch/suta'}</span><span className="cad-size">W {current.widthMm} · H {current.heightMm} · D {current.depthMm}</span></footer>
    {context&&<EditorDialog anchor={context} title={active&&panelMode?active.label:`${title} actions`} onClose={()=>setContext(null)}><div className="cad-context" role="group" aria-label="Cabinet context actions">{active?.role==='door'&&<button type="button" onClick={()=>openTask('finishings')}>Select Finishings</button>}{(['dimensions','construction','materials','cutlist','commands','assembly'] as const).filter(value=>family!=='cabinet'||value!=='construction').map(value=><button type="button" key={value} onClick={()=>openTask(value)}>{value==='dimensions'?'Edit dimensions':value==='construction'?'Construction':value==='materials'?'Panel materials':value==='commands'?'Editor commands':value==='assembly'?'Assembly documents':'Cut list'}</button>)}</div></EditorDialog>}
    {task&&<EditorDialog docked closing={closingTask} title={taskTitle} onClose={closeTask}>
      {family==='cabinet'&&(task==='dimensions'||task==='construction')&&<CabinetConfig catalog={catalog} catalogLoading={catalogLoading} catalogError={catalogError} retryCatalog={()=>{setCatalogLoading(true);setCatalogAttempt(value=>value+1);}} input={candidate} disabled={locked} onChange={input=>{setDraft(input);setRaw(fields(input));}} onApply={apply} onCancel={closeTask} error={validation.blockingErrors[0]?.message}/>}
      {family!=='cabinet'&&(task==='dimensions'||task==='construction')&&<form aria-label="Cabinet parameters" onSubmit={event=>{event.preventDefault();apply();}}>
        <p className="cad-help">{task==='dimensions'?'8 suta = 1 inch. Units apply across all projects; preview, then apply once.':family==='bookshelf'?'Floor models need anti-tip fixing. Wall preview: max 900 × 1200 × 350 mm, assessed substrate and fixing notes. No approved load rating.':'Proposed construction; manufacturing approval pending.'}</p>
        <fieldset disabled={locked} className="cad-fields">
          {(task==='dimensions'?['widthMm','heightMm','depthMm'] as LengthKey[]:(family==='table'?['bodyThicknessMm']:family==='bookshelf'?['bodyThicknessMm','backThicknessMm','skirtingHeightMm']:['bodyThicknessMm','backThicknessMm','doorThicknessMm','skirtingHeightMm']) as LengthKey[]).map(key=><MeasurementInput fixedMm={key.includes("Thickness")} key={key} label={labels[key]} id={`${id}-${key}`} value={raw[key]} autoFocus={key===(task==='dimensions'?'widthMm':step===0?'bodyThicknessMm':'skirtingHeightMm')} invalid={!Number.isFinite(candidate[key])||validation.blockingErrors.some(error=>error.field===key)} onChange={value=>setRaw(previous=>({...previous,[key]:value}))}/>)}
          {task==='construction'&&family==='bookshelf'&&<><label>Mounting<select aria-label="Mounting" value={candidate.mounting} onChange={event=>setDraft({...candidate,mounting:event.target.value as CabinetInput['mounting'],skirtingHeightMm:0})}><option value="floor">Floor-standing</option><option value="wall">Wall preview</option></select></label><label>Shelf support<select aria-label="Shelf support" value={candidate.shelfMode} onChange={event=>setDraft({...candidate,shelfMode:event.target.value as CabinetInput['shelfMode'],shelfSideClearanceMm:event.target.value==='fixed'?0:2})}><option value="fixed">Fixed shelves</option><option value="adjustable">Adjustable shelves</option></select></label><label>Wall substrate<select aria-label="Wall substrate" value={candidate.wallSubstrate} onChange={event=>setDraft({...candidate,wallSubstrate:event.target.value as CabinetInput['wallSubstrate']})}><option value="unknown">Not assessed</option><option value="masonry">Masonry</option><option value="concrete">Concrete</option><option value="stud">Stud wall</option></select></label><label>Fixing requirements<input maxLength={240} value={candidate.fixingNotes} onChange={event=>setDraft({...candidate,fixingNotes:event.target.value})}/></label></>}
          {task==='dimensions'&&<UnitSelect/>}
          {task==='construction'&&family==='table'&&<label>Table type<select aria-label="Table type" value={candidate.tableKind} onChange={event=>{const tableKind=event.target.value as CabinetInput['tableKind'];const size=tableKind==='side'?{widthMm:600,heightMm:500,depthMm:500}:tableKind==='dining'?{widthMm:1500,heightMm:750,depthMm:800}:{widthMm:1200,heightMm:750,depthMm:600};const next={...candidate,...size,tableKind};setDraft(next);setRaw(fields(next));}}><option value="study">Study</option><option value="dining">Dining</option><option value="side">Side</option></select></label>}
          {task==='construction'&&family!=='table'&&<><label>Shelves<input type="number" min={0} max={20} value={candidate.shelfCount} onChange={event=>setDraft({...candidate,shelfCount:Number(event.target.value)})}/></label>{family!=='bookshelf'&&<label>Inset doors<select aria-label="Inset doors" value={candidate.doorCount} onChange={event=>setDraft({...candidate,doorCount:Number(event.target.value)})}>{[0,1,2].map(n=><option key={n}>{n}</option>)}</select></label>}<label>Back position<select aria-label="Back position" value={candidate.backPosition} onChange={event=>setDraft({...candidate,backPosition:event.target.value as CabinetInput['backPosition']})}><option value="inset">Inset</option><option value="outside">Outside</option></select></label></>}
        </fieldset>
        {invalid&&<p role="alert" className="cad-error">{validation.blockingErrors[0]?.message}</p>}
        <div className="cad-dialog-actions"><button type="button" onClick={closeTask}>Cancel</button><button type="submit" className="cad-primary" disabled={locked||invalid}>Apply measurements</button></div>
      </form>}
      {task==='finishings'&&<><DoorFinishPicker input={draft??current} selected={selectedPanel} onSelect={setSelectedPanel} onChange={input=>{setDraft(input);setRaw(fields(input));}} catalog={catalog} loading={catalogLoading} error={catalogError} retry={()=>{setCatalogLoading(true);setCatalogAttempt(value=>value+1);}} disabled={locked}/>{(invalid||message)&&<p role="alert" className="cad-error">{message||validation.blockingErrors[0]?.message}</p>}<div className="cad-dialog-actions"><button onClick={closeTask}>Cancel</button><button className="cad-primary" disabled={locked||invalid||catalogLoading||Boolean(catalogError)} onClick={apply}>Apply finishing</button></div></>}
      {task==='materials'&&<><MaterialsWorkspace family={family} input={draft??current} selected={selectedPanel} onSelect={setSelectedPanel} onChange={input=>{setDraft(input);setRaw(fields(input));}} catalog={catalog} loading={catalogLoading} error={catalogError} retry={()=>{setCatalogLoading(true);setCatalogAttempt(value=>value+1);}} disabled={locked}/>{(invalid||message)&&<p role="alert" className="cad-error">{message||validation.blockingErrors[0]?.message}</p>}<div className="cad-dialog-actions"><button onClick={closeTask}>Cancel</button><button className="cad-primary" disabled={locked||invalid} onClick={apply}>Apply materials</button></div></>}
      {(task==='panels'||task==='cutlist')&&<><ul className="cad-panel-list">{calculation.panels.map(panel=><li key={panel.panelId}><button aria-pressed={selectedPanel===panel.panelId} onClick={()=>{setSelectedPanel(panel.panelId);setPanelMode(true);if(task==='panels')closeTask();}}><span>{panel.label}</span><small>{panel.widthMm} × {panel.heightMm} × {panel.thicknessMm} mm</small></button></li>)}</ul></>}
      {task==='assembly'&&<AssemblyWorkflow input={current} disabled={!ready||disabled}/>}
      {task==='commands'&&<CommandWorkflow input={current} disabled={locked} onApply={input=>{commit(input);dismissTask(input);}}/>}
      {task==='photo'&&<PhotoWorkflow input={current} disabled={locked} onApply={input=>{if(familyOf(input)!==family)return;commit(input);dismissTask(input);}}/>}
      {task==='quote'&&<QuoteWorkflow projectId={commerce?.projectId} revisionId={commerce?.revisionId} dirty={dirty||readOnly}/>}
      {task==='project'&&<div className="cad-project-tools">{projectTools??<p>Project tools are unavailable.</p>}</div>}
      {task==='recovery'&&<><p>{recoveryProblem||message||(baseVersion!==version?'The project changed since these edits began. Download your design before reloading.':'Browser recovery is active. Manufacturing approval is pending; quotations and machine output are unavailable.')}</p><ul className="cad-panel-list">{calculation.warnings.map((warning,i)=><li key={i}><p className="cad-help">{warning}</p></li>)}</ul><div className="cad-dialog-actions"><button onClick={download}>Download editor recovery</button><button onClick={()=>setStep(1)}>Replace local edits</button></div>{step===1&&<><p className="cad-error">Discard local editor changes and reload the saved project?</p><button onClick={()=>{resetRecovery();window.location.reload();}}>Discard and reload</button></>}</>}
    </EditorDialog>}
  </section>;
}

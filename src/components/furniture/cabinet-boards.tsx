'use client';
import {useState} from 'react';
import {Layers,Info} from 'lucide-react';
import type {CabinetInput} from '@/lib/furniture/cabinet';
import {compatibleFinishes,type MaterialCatalog,type MaterialDefault,type MaterialSlot} from '@/lib/furniture/materials';
import {materialThicknessKey,selectGroupBoard,setGroupThickness} from '@/lib/furniture/material-defaults';
import {ConfigSelect} from '@/components/ui/config-fields';
import {ConfigHint} from '@/components/ui/config-hint';
import {BoardPicker} from '@/components/catalog/board-picker';
import {MeasurementInput} from '@/components/measurement/measurement-input';
export function CabinetBoards({input,onChange,catalog,loading,error,retry}:{input:CabinetInput;onChange:(input:CabinetInput)=>void;catalog:MaterialCatalog;loading:boolean;error:string;retry:()=>void}){
 const [activeSlot,setActiveSlot]=useState<MaterialSlot>('body');
 const slots=[['body','Body'],['back','Back'],['front','Door']] as const;
 const boards=catalog.items.filter(item=>item.kind==='board');
 const update=(slot:MaterialSlot,next:MaterialDefault)=>onChange({...input,materialDefaults:{...input.materialDefaults,[slot]:next}});
 return <section className="mt-3" aria-label="Board defaults"><div className="flex items-center gap-1"><h4 className="text-xs font-semibold">Cabinet boards</h4><ConfigHint label="Board defaults help" icon={Info}>Choose a board for each group. Thickness, stock size and grain come from its specification. New parts inherit the choice. Changing a board replaces individual assignments in that group. Preview colors do not specify a purchasable finish.</ConfigHint></div>
 {loading&&<p className="cad-help" role="status">Loading boards…</p>}{error&&<p className="cad-help" role="status">Boards unavailable. <button type="button" onClick={retry}>Retry catalog</button></p>}
 {!loading&&!error&&!boards.length&&<p className="cad-help">No published boards available. Set thickness and preview colors below; publish reviewed stock in the material catalog.</p>}
 <div role="group" aria-label="Cabinet board groups" className="mt-3 grid grid-cols-3 gap-2">{slots.map(([slot,label])=>{const value=input.materialDefaults?.[slot],board=boards.find(item=>item.id===value?.boardId),color=String(board?.board_skus?.color_code??value?.previewColor??'#bda382');return <button type="button" key={slot} aria-label={`Edit ${label} material`} aria-pressed={activeSlot===slot} onClick={()=>setActiveSlot(slot)} className="min-h-16 min-w-0 rounded-md border border-[var(--border)] bg-base p-2 text-left text-xs transition-colors hover:bg-surface aria-pressed:border-[var(--accent-text)] aria-pressed:bg-accent-soft"><span className="flex items-center justify-between gap-1"><span className="font-medium">{slot==='front'?'Doors':label}</span><span className="size-3 shrink-0 rounded-sm border border-[var(--border)]" style={{backgroundColor:color}} aria-hidden="true"/></span><span className="mt-1 block text-muted">{input[materialThicknessKey[slot]]} mm</span></button>;})}</div>
 {slots.filter(([slot])=>slot===activeSlot).map(([slot,label])=>{
  const value=input.materialDefaults?.[slot]??{},key=materialThicknessKey[slot],board=boards.find(item=>item.id===value.boardId),finishes=compatibleFinishes(catalog,value.boardId);
  const boardColor=typeof board?.board_skus?.color_code==='string'?board.board_skus.color_code:undefined;
  const finishId=value.frontFinishId??'',color=String(catalog.items.find(item=>item.id===finishId)?.finish_skus?.color_code??boardColor??value.previewColor??'#bda382');
  return <div key={slot} className="mt-4" role="group" aria-label={`${label} material`}><div className="mb-2 flex items-center gap-2 text-xs font-medium"><Layers size={14} aria-hidden="true"/><span>{slot==='front'?'Doors and drawer faces':label}</span><span className="ml-auto size-4 rounded-sm border border-[var(--border)]" style={{backgroundColor:color}} aria-hidden="true"/></div><div className="cad-fields">
   <BoardPicker items={catalog.items} label={`${label} board`} value={value.boardId??''} thickness={input[key]} disabled={loading} empty="Manual thickness / no board" onChange={id=>onChange(selectGroupBoard(input,slot,id,catalog))}/>
   {!value.boardId&&<MeasurementInput label={`${slot==='front'?'Door':label} thickness`} fixedMm value={String(input[key])} onChange={raw=>onChange(setGroupThickness(input,slot,raw.trim()===''?NaN:Number(raw)))}/>}
   <label className="config-field"><span className="config-field-label">{label} preview color</span><input aria-label={`${label} preview color`} type="color" value={/^#[0-9a-f]{6}$/i.test(color)?color:'#bda382'} disabled={Boolean(finishId||boardColor)} title={boardColor?'Change this board color in the material catalog.':finishId?'Selected finish controls the color. Choose Preview color only to customize it.':'Preview color only; not a purchasable finish.'} onChange={event=>update(slot,{...value,previewColor:event.target.value})} className="min-h-8 w-full cursor-pointer rounded-md border border-[var(--border)] bg-base p-1!"/></label>
   {(finishes.length>0||finishId)&&<div className="col-span-2"><ConfigSelect label={`${label} finish`} value={finishId} disabled={!board} onChange={id=>{const next={...value};delete next.frontFinishId;delete next.backFinishId;if(id){next.frontFinishId=id;next.backFinishId=id;}update(slot,next);}}><option value="">Preview color only / no finish</option>{finishId&&!finishes.some(item=>item.id===finishId)&&<option value={finishId}>Unavailable finish — replace it</option>}{finishes.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</ConfigSelect></div>}
  </div>{board&&<p className="mt-3 text-xs tabular-nums text-muted">{String(board.board_skus?.sheet_width_mm)} × {String(board.board_skus?.sheet_height_mm)} mm stock{board.price?` · BDT ${Number(board.price.price_bdt).toLocaleString('en-BD')} / sheet`:''}{boardColor?' · Color from catalog':''}</p>}</div>;
 })}</section>;
}

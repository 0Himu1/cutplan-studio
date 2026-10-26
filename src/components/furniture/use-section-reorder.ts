'use client';

import {useCallback,useEffect,useRef,useState,type PointerEvent,type KeyboardEvent} from 'react';
import {moveSection} from '@/lib/furniture/cabinet-allocation';

type Drag={id:string;pointer:number;startX:number;startY:number;x:number;y:number;active:boolean;to:number|null;button:HTMLButtonElement};
type Marker={id:string;before:string|null;end:boolean};

/** Handle-only pointer capture supports mouse, pen and touch without stealing form scrolling. */
export function useSectionReorder<T extends {id:string}>(items:T[],onReorder:(items:T[])=>void){
 const containerRef=useRef<HTMLDetailsElement>(null),latest=useRef({items,onReorder}),drag=useRef<Drag|null>(null),frame=useRef<number|null>(null);
 const [marker,setMarker]=useState<Marker|null>(null),[announcement,setAnnouncement]=useState('');
 const setContainer=useCallback((node:HTMLDetailsElement|null)=>{containerRef.current=node;},[]);
 useEffect(()=>{latest.current={items,onReorder};},[items,onReorder]);
 function clear(){
  if(frame.current!==null)cancelAnimationFrame(frame.current);frame.current=null;
  const current=drag.current;drag.current=null;
  if(current?.button.hasPointerCapture(current.pointer))current.button.releasePointerCapture(current.pointer);
  setMarker(null);
 }
 function destination(current:Drag){
  const container=containerRef.current;if(!container)return null;
  const scroll=container.closest('.cad-inspector-scroll'),bounds=container.getBoundingClientRect(),viewport=scroll?.getBoundingClientRect();
  const inside=current.x>=bounds.left&&current.x<=bounds.right&&current.y>=Math.max(bounds.top,viewport?.top??0)-12&&current.y<=Math.min(bounds.bottom,viewport?.bottom??innerHeight)+12;
  const rows=Array.from(container.children).filter((node):node is HTMLElement=>node instanceof HTMLElement&&node.hasAttribute('data-section-id')&&node.dataset.sectionId!==current.id);
  const index=inside?rows.findIndex(row=>{const rect=row.getBoundingClientRect();return current.y<rect.top+rect.height/2;}):-1;
  return {scroll,viewport,inside,to:inside?(index<0?rows.length:index):null,before:inside&&index>=0?rows[index].dataset.sectionId??null:null,end:inside&&index<0};
 }
 function tick(){
  const current=drag.current,container=containerRef.current;if(!current||!container)return;
  if(!current.active&&Math.hypot(current.x-current.startX,current.y-current.startY)>6)current.active=true;
  if(current.active){
   const target=destination(current);if(!target)return;
   const {scroll,viewport,inside,before,end}=target;current.to=target.to;
   setMarker(previous=>previous?.id===current.id&&previous.before===before&&previous.end===end?previous:{id:current.id,before,end});
   // Read geometry first, then scroll. The next frame computes the new target after scrolling.
   if(inside&&scroll&&viewport){const edge=48,speed=current.y<viewport.top+edge?-Math.min(14,(viewport.top+edge-current.y)/3):current.y>viewport.bottom-edge?Math.min(14,(current.y-viewport.bottom+edge)/3):0;if(speed)scroll.scrollTop+=speed;}
  }
  frame.current=requestAnimationFrame(tick);
 }
 function down(event:PointerEvent<HTMLButtonElement>,id:string){
  if(event.button!==0||!event.isPrimary||latest.current.items.length<2||drag.current)return;
  event.preventDefault();event.stopPropagation();event.currentTarget.focus();event.currentTarget.setPointerCapture(event.pointerId);
  drag.current={id,pointer:event.pointerId,startX:event.clientX,startY:event.clientY,x:event.clientX,y:event.clientY,active:false,to:null,button:event.currentTarget};
  frame.current=requestAnimationFrame(tick);
 }
 function finish(event:PointerEvent<HTMLButtonElement>){
  const current=drag.current;if(!current||current.pointer!==event.pointerId)return;
  current.x=event.clientX;current.y=event.clientY;
  current.active=current.active||Math.hypot(current.x-current.startX,current.y-current.startY)>6;
  if(current.active)current.to=destination(current)?.to??null;
  const {items,onReorder}=latest.current;
  if(current.active&&current.to!==null){const next=moveSection(items,current.id,current.to);if(next!==items){onReorder(next);setAnnouncement(`Section moved to position ${current.to+1} of ${items.length}. Positions run top to bottom.`);}}
  clear();
 }
 function key(event:KeyboardEvent<HTMLButtonElement>,id:string){
  if(drag.current)return;
  const {items,onReorder}=latest.current,index=items.findIndex(item=>item.id===id),to=event.key==='ArrowUp'?index-1:event.key==='ArrowDown'?index+1:event.key==='Home'?0:event.key==='End'?items.length-1:null;
  if(to===null)return;event.preventDefault();event.stopPropagation();
  const next=moveSection(items,id,to);if(next!==items){onReorder(next);setAnnouncement(`Section moved to position ${to+1} of ${items.length}. Positions run top to bottom.`);}
 }
 useEffect(()=>{
  const escape=(event:globalThis.KeyboardEvent)=>{if(event.key==='Escape'&&drag.current){event.preventDefault();event.stopPropagation();const current=drag.current;drag.current=null;if(frame.current!==null)cancelAnimationFrame(frame.current);frame.current=null;if(current.button.hasPointerCapture(current.pointer))current.button.releasePointerCapture(current.pointer);setMarker(null);setAnnouncement('Section move cancelled.');}};
  document.addEventListener('keydown',escape,true);
  return()=>{document.removeEventListener('keydown',escape,true);if(frame.current!==null)cancelAnimationFrame(frame.current);};
 },[]);
 return {setContainer,marker,announcement,handle:(id:string,index:number)=>({
  type:'button' as const,disabled:items.length<2,'aria-label':`Reorder section ${index+1}`,title:'Drag to reorder. Use Arrow Up/Down, Home or End with keyboard. First position is the cabinet top.',
  onPointerDown:(event:PointerEvent<HTMLButtonElement>)=>down(event,id),
  onPointerMove:(event:PointerEvent<HTMLButtonElement>)=>{if(drag.current?.pointer===event.pointerId){drag.current.x=event.clientX;drag.current.y=event.clientY;}},
  onPointerUp:finish,onPointerCancel:clear,onLostPointerCapture:()=>{if(drag.current)clear();},
  onKeyDown:(event:KeyboardEvent<HTMLButtonElement>)=>key(event,id),onClick:(event:React.MouseEvent<HTMLButtonElement>)=>{event.preventDefault();event.stopPropagation();},
 })};
}

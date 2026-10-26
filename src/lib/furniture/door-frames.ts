import type {CabinetCompartment} from './compartments.ts';
import {allocateHeight} from './cabinet-allocation.ts';
export const DOOR_FRAME_DEPTH_MM=76.2;
export type DoorSpan={bottom:number;top:number};
/** Continuous door coverage, excluding external drawer allocations and their separators. */
export function compartmentDoorSpans(comp:CabinetCompartment,y:number,h:number,t:number,g:number,low=y,high=y+h):DoorSpan[]{
 if(!comp.doorCount)return [];
 const allocation=allocateHeight(comp.sections.map(s=>s.heightMm),h,t);
 if(!allocation.valid)return [];
 let sy=y+allocation.empty,bottom=low;const spans:DoorSpan[]=[];
 comp.sections.forEach((sec,i)=>{
  const sh=allocation.resolved[i];
  if(sec.type==='drawer'&&sec.external){
   const start=i===0&&allocation.empty===0?low:sy-t,end=i===comp.sections.length-1?high:sy+sh+t;
   if(start-bottom>2*g)spans.push({bottom,top:start});
   bottom=Math.max(bottom,end);
  }
  sy+=sh+t;
 });
 if(high-bottom>2*g)spans.push({bottom,top:high});
 return spans;
}
/** Legacy hinge booking: an occupied shared partition gets one parallel body-board strip. */
export function doorFrameLayout(comps:CabinetCompartment[],height:number,t:number,g:number){
 const active=comps.map(comp=>compartmentDoorSpans(comp,0,height,t,g).length>0);
 const left=comps.map((comp,i)=>active[i]&&(comp.doorCount===2||i<comps.length-1));
 const right=comps.map((comp,i)=>active[i]&&(comp.doorCount===2||i===comps.length-1));
 return comps.map((_,i)=>({
  leftFrame:i>0&&left[i]&&right[i-1],
  rightFrame:i+1<comps.length&&right[i]&&left[i+1],
  leftSource:i===0?'side':left[i]&&right[i-1]?'frame':'partition',
  rightSource:i===comps.length-1?'side':'partition',
 } as const));
}
/** Stored widths retain their allocation; a centered double-board support reserves half a board each side. */
export function frameClearWidth(width:number,t:number,leftFrame:boolean,rightFrame:boolean){return width-(Number(leftFrame)+Number(rightFrame))*t/2;}

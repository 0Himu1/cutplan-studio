'use client';
import {useEffect,useRef,type RefObject} from 'react';

export type GizmoAxes=Record<'x'|'y'|'z',[number,number,number]>;
export function ViewGizmo({axes,view,onView}:{axes:RefObject<GizmoAxes>;view:string;onView:(view:'front'|'floor'|'right'|'iso')=>void}){
 const svg=useRef<SVGSVGElement>(null);
 useEffect(()=>{let frame=0;const paint=()=>{for(const axis of ['x','y','z'] as const){const [x,y,z]=axes.current[axis],group=svg.current?.querySelector(`[data-axis=${axis}]`),line=group?.querySelector('line'),node=group?.querySelector('g');line?.setAttribute('x2',String(56+x*36));line?.setAttribute('y2',String(56-y*36));node?.setAttribute('transform',`translate(${56+x*36} ${56-y*36})`);group?.setAttribute('opacity',z<0?'.65':'1');}frame=requestAnimationFrame(paint);};paint();return()=>cancelAnimationFrame(frame);},[axes]);
 const choose=(event:React.KeyboardEvent<SVGGElement>,target:'front'|'floor'|'right'|'iso')=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();onView(target);}};
 return <div className="cad-gizmo" role="group" aria-label="View navigator"><svg ref={svg} viewBox="0 0 112 112" aria-label="X Y Z orientation gizmo">
  <circle cx="56" cy="56" r="45" className="cad-gizmo-ring"/>
  {([['x','right','Right'],['y','floor','Top'],['z','front','Front']] as const).map(([axis,target,label])=><g key={axis} data-axis={axis} className={`cad-axis cad-axis-${axis}`}><line x1="56" y1="56" x2="56" y2="56"/><g role="button" tabIndex={0} aria-label={label} aria-pressed={view===target} onClick={()=>onView(target)} onKeyDown={e=>choose(e,target)}><circle r="12"/><text dy="4" textAnchor="middle">{axis.toUpperCase()}</text><title>{label} view</title></g></g>)}
  <g role="button" tabIndex={0} aria-label="Iso" aria-pressed={view==='iso'} onClick={()=>onView('iso')} onKeyDown={e=>choose(e,'iso')} className="cad-gizmo-home" transform="translate(40 40)"><circle cx="56" cy="56" r="10"/><path d="m50 54 6-3 6 3v6l-6 3-6-3z m0 0 6 3 6-3 m-6 3v6"/><title>Isometric view</title></g>
 </svg></div>;
}

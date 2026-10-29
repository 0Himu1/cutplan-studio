'use client';

import {useEffect,useId,useRef,useState} from 'react';
import {Expand,Minimize2,ArrowUpRight} from 'lucide-react';
import {gsap} from 'gsap';
import {calculateFurniture,defaultFurniture} from '@/lib/furniture/families';
import {panelBounds} from '@/lib/furniture/editor';

// Illustration and studio share the same proposed geometry.
const input={...defaultFurniture('cabinet'),doorCount:0};
const panels=calculateFurniture(input).panels;
const scale=310/Math.max(input.widthMm,input.heightMm,input.depthMm);
const point=(x:number,y:number,z:number)=>`${240+(x-z)*scale*.74},${440-y*scale-(x+z)*scale*.22}`;

export function Blueprint(){
 const [exploded,setExploded]=useState(false);
 const root=useRef<HTMLElement>(null);
 const timeline=useRef<gsap.core.Timeline|null>(null);
 const desired=useRef(false);
 const firstRun=useRef(true);
 const grid=useId();
 useEffect(()=>{
  const element=root.current;
  if(!element)return;
  const media=gsap.matchMedia();
  media.add({motion:'(prefers-reduced-motion: no-preference)',reduce:'(prefers-reduced-motion: reduce)'},context=>{
   const pieces=element.querySelectorAll<SVGGElement>('[data-cabinet-piece]');
   const tl=gsap.timeline({paused:true,onReverseComplete:()=>{firstRun.current=false;}}).to(pieces,{
    x:(_,piece:SVGGElement)=>Number(piece.dataset.explodeX),
    y:(_,piece:SVGGElement)=>Number(piece.dataset.explodeY),
    duration:.7,stagger:.035,ease:'power3.inOut',
   });
   timeline.current=tl;
   if(context.conditions?.reduce){tl.progress(desired.current?1:0).pause();firstRun.current=false;}
   else if(firstRun.current&&!desired.current)tl.progress(1).reverse();
   else tl.progress(desired.current?1:0).pause();
   element.dataset.motionReady='true';
   return()=>{timeline.current=null;delete element.dataset.motionReady;};
  },element);
  return()=>media.revert();
 },[]);
 function toggle(){
  const next=!desired.current;
  desired.current=next;setExploded(next);
  const tl=timeline.current;
  if(!tl)return;
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)tl.progress(next?1:0).pause();
  else if(next)tl.play();else tl.reverse();
 }
 const Icon=exploded?Minimize2:Expand;
 return <figure ref={root} className="relative min-w-0 overflow-hidden rounded-2xl border border-[var(--border)] bg-surface" aria-label="Interactive cabinet study">
  <div className="relative z-10 flex items-start justify-between gap-4 border-b border-[var(--border)] px-5 py-4 sm:px-6">
   <div><p className="text-[10px] font-semibold uppercase tracking-[.18em] text-muted">Inside the design</p><p className="mt-1.5 text-sm font-medium">A place for every panel.</p></div>
   <span className="rounded-full border border-[var(--border)] px-2.5 py-1 text-[10px] tabular-nums text-muted">01 / CABINET</span>
  </div>
  <div className="relative">
   <svg viewBox="0 0 620 515" role="img" aria-label={exploded?'Exploded cabinet panel schematic':'Assembled cabinet panel schematic'} className="h-auto w-full text-accent-ink">
    <defs><pattern id={grid} width="32" height="32" patternUnits="userSpaceOnUse"><path d="M 32 0 L 0 0 0 32" fill="none" stroke="currentColor" strokeWidth=".4" opacity=".13"/></pattern></defs>
    <rect width="620" height="515" fill={`url(#${grid})`}/>
    <ellipse cx="315" cy="448" rx="170" ry="22" fill="currentColor" opacity=".045"/>
    <g aria-hidden="true" stroke="currentColor" strokeWidth=".7" opacity=".4" fill="none">
     <path d="M 110 128 V 440 M 104 128 H 116 M 104 440 H 116"/>
     <path d="M 205 475 H 400 M 205 469 V 481 M 400 469 V 481"/>
    </g>
    <g aria-hidden="true" fill="var(--text-muted)" fontSize="10" fontFamily="inherit" letterSpacing="1">
     <text x="90" y="288" textAnchor="middle" transform="rotate(-90 90 288)">{input.heightMm} MM</text>
     <text x="302" y="496" textAnchor="middle">{input.widthMm} MM</text>
    </g>
    {[...panels].sort((a,b)=>a.pose.positionMm[2]-b.pose.positionMm[2]||b.pose.positionMm[0]-a.pose.positionMm[0]).map(panel=>{
     const b=panelBounds(panel),[x,y,z]=b.min,[X,Y,Z]=b.max;
     const cx=panel.pose.positionMm[0]-input.widthMm/2,cy=panel.pose.positionMm[1]-input.heightMm/2,cz=panel.pose.positionMm[2]-input.depthMm/2;
     return <g key={panel.panelId} data-cabinet-piece="" data-explode-x={(cx-cz)*.1} data-explode-y={-cy*.075-cz*.025} stroke="var(--accent-text)" strokeWidth=".9" strokeLinejoin="round">
      <polygon points={[point(x,y,Z),point(X,y,Z),point(X,Y,Z),point(x,Y,Z)].join(' ')} fill="color-mix(in srgb, var(--bg-surface) 92%, var(--accent-text))"/>
      <polygon points={[point(X,y,z),point(X,y,Z),point(X,Y,Z),point(X,Y,z)].join(' ')} fill="color-mix(in srgb, var(--bg-surface) 82%, var(--accent-text))"/>
      <polygon points={[point(x,Y,z),point(X,Y,z),point(X,Y,Z),point(x,Y,Z)].join(' ')} fill="color-mix(in srgb, var(--bg-surface) 95%, var(--accent-text))"/>
      <title>{`${panel.label}: ${panel.widthMm} × ${panel.heightMm} × ${panel.thicknessMm} mm`}</title>
     </g>;
    })}
   </svg>
   <button type="button" className="absolute bottom-5 right-5 inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--border)] bg-surface px-4 text-xs font-medium text-ink transition-colors hover:border-[var(--accent-text)] hover:text-accent-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-400" aria-pressed={exploded} onClick={toggle}><Icon size={14} aria-hidden="true"/>{exploded?'Assemble cabinet':'Explode cabinet'}</button>
  </div>
  <figcaption className="flex items-center justify-between gap-4 border-t border-[var(--border)] px-5 py-4 text-[11px] text-muted sm:px-6">
   <span><span className="mr-2 inline-block size-1.5 rounded-full bg-accent-ink"/>{panels.length} calculated panels · proposed construction</span><ArrowUpRight size={15} aria-hidden="true"/>
  </figcaption>
 </figure>;
}

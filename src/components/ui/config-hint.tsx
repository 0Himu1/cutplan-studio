'use client';

import {useEffect,useId,useRef,useState,useSyncExternalStore,type ReactNode} from 'react';
import {createPortal} from 'react-dom';
import {Info,type LucideIcon} from 'lucide-react';

export type HintTone='info'|'available'|'warning'|'danger'|'muted';
const tones:Record<HintTone,string>={
 info:'text-[var(--accent-text)]',
 available:'text-[var(--config-available)]',
 warning:'text-[var(--config-warning)]',
 danger:'text-[var(--danger-text)]',
 muted:'text-[var(--text-muted)]',
};
const subscribe=()=>()=>{};

/** Native top-layer popovers escape the scrolling inspector. Help works on hover, focus and touch. */
export function ConfigHint({label,children,icon:Icon=Info,tone='info',onClick,disabled=false,reason}: {label:string;children:ReactNode;icon?:LucideIcon;tone?:HintTone;onClick?:()=>void;disabled?:boolean;reason?:string}){
 const id=useId(),popup=useRef<HTMLDivElement>(null),trigger=useRef<HTMLSpanElement>(null),timer=useRef<ReturnType<typeof setTimeout>|null>(null),[open,setOpen]=useState(false);
 const mounted=useSyncExternalStore(subscribe,()=>true,()=>false);
 function cancel(){if(timer.current)clearTimeout(timer.current);}
 function close(){cancel();popup.current?.hidePopover();setOpen(false);}
 function show(){
  cancel();const tip=popup.current,anchor=trigger.current;if(!tip||!anchor)return;
  const theme=getComputedStyle(anchor);for(const name of ['--config-available','--config-warning'])tip.style.setProperty(name,theme.getPropertyValue(name));
  tip.showPopover();const a=anchor.getBoundingClientRect(),b=tip.getBoundingClientRect();
  tip.style.left=`${Math.max(12,Math.min(a.left,window.innerWidth-b.width-12))}px`;
  tip.style.top=`${a.bottom+b.height+20<window.innerHeight?a.bottom+6:Math.max(12,a.top-b.height-6)}px`;setOpen(true);
 }
 function leave(){cancel();timer.current=setTimeout(close,160);}
 useEffect(()=>()=>{if(timer.current)clearTimeout(timer.current);},[]);
 useEffect(()=>{
  if(!open)return;
  const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();popup.current?.hidePopover();setOpen(false);}};
  const outside=(event:PointerEvent)=>{if(!trigger.current?.contains(event.target as Node)&&!popup.current?.contains(event.target as Node)){popup.current?.hidePopover();setOpen(false);}};
  const moved=()=>{popup.current?.hidePopover();setOpen(false);};
  document.addEventListener('keydown',escape,true);document.addEventListener('pointerdown',outside);
  document.addEventListener('scroll',moved,true);window.addEventListener('resize',moved);
  return()=>{document.removeEventListener('keydown',escape,true);document.removeEventListener('pointerdown',outside);document.removeEventListener('scroll',moved,true);window.removeEventListener('resize',moved);};
 },[open]);
 return <span ref={trigger} className={`inline-flex shrink-0 align-middle ${tones[tone]}`} onPointerEnter={e=>{if(e.pointerType==='mouse')show();}} onPointerLeave={leave} onFocus={show} onBlur={close} tabIndex={disabled?0:undefined} aria-label={disabled?`${label} unavailable`:undefined} aria-describedby={open?id:undefined}>
  <button type="button" aria-label={label} aria-describedby={open?id:undefined} disabled={disabled} onClick={()=>{if(onClick){close();onClick();}else show();}} className={`config-icon inline-flex size-8 shrink-0 items-center justify-center rounded-md p-0! transition-colors hover:bg-[var(--accent-soft)] motion-reduce:transition-none disabled:opacity-40 max-[600px]:size-11 ${tones[tone]}`}><Icon size={16} strokeWidth={1.5} className="shrink-0" aria-hidden="true"/></button>
  {mounted&&createPortal(<div ref={popup} id={id} popover="manual" role="tooltip" onPointerEnter={cancel} onPointerLeave={leave} className="config-tooltip fixed inset-auto m-0 max-w-[min(288px,calc(100vw-24px))] rounded-md border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 text-xs font-normal leading-relaxed text-[var(--text-primary)]"><strong className={`mb-1 block font-medium ${tones[tone]}`}>{label}</strong>{disabled&&reason?reason:children}</div>,document.body)}
 </span>;
}

export function SpaceValue({label,value,description,icon,tone='info'}:{label:string;value:string;description:string;icon:LucideIcon;tone?:HintTone}){
 return <div className={`flex min-w-0 items-center gap-1 ${tones[tone]}`} data-space-tone={tone}>
  <ConfigHint label={`${label} explained`} icon={icon} tone={tone}>{description}</ConfigHint><div className="min-w-0"><span className="block text-xs font-normal">{label}</span><span className="block break-words text-xs font-medium tabular-nums">{value}</span></div>
 </div>;
}

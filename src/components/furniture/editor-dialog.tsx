'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

export function EditorDialog({title,onClose,children,anchor,docked=false,closing=false}:{title:string;onClose:()=>void;children:ReactNode;anchor?:{x:number;y:number};docked?:boolean;closing?:boolean}) {
  const ref=useRef<HTMLDialogElement>(null);
  const closeRef=useRef(onClose);
  useEffect(()=>{closeRef.current=onClose;},[onClose]);
  useEffect(()=>{const dialog=ref.current;const trigger=document.activeElement as HTMLElement|null;if(docked)dialog?.show();else dialog?.showModal();const escape=(event:KeyboardEvent)=>{if(docked&&event.key==='Escape'&&!document.querySelector('dialog:modal')){event.preventDefault();closeRef.current();}};document.addEventListener('keydown',escape);return ()=>{document.removeEventListener('keydown',escape);dialog?.close();if(trigger?.isConnected)trigger.focus();};},[docked]);
  return <dialog ref={ref} data-closing={closing} className={`cad-dialog ${anchor?'cad-context-dialog':''} ${docked?'cad-dock':''}`} style={anchor?{left:Math.max(8,anchor.x),top:Math.max(8,anchor.y),margin:0}:undefined} aria-label={title} onClick={event=>{if(anchor&&event.target===event.currentTarget)onClose();}} onCancel={event=>{if(event.target!==event.currentTarget)return;event.preventDefault();event.stopPropagation();onClose();}}>
    <header><h2>{title}</h2><button type="button" aria-label={`Close ${title}`} onClick={onClose}><X size={18}/></button></header>
    {docked?<div className="cad-inspector-scroll">{children}</div>:children}
  </dialog>;
}

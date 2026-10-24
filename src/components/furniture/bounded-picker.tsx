'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { EditorDialog } from './editor-dialog';

/** Search and page choices instead of introducing a scrolling dropdown into the canvas. */
export function BoundedPicker({label,value,options,onChange,disabled=false}:{label:string;value:string;options:{value:string;label:string}[];onChange:(value:string)=>void;disabled?:boolean}){
  const [open,setOpen]=useState(false),[query,setQuery]=useState(''),[page,setPage]=useState(0);
  const matches=options.filter(option=>option.label.toLowerCase().includes(query.toLowerCase()));
  const pages=Math.max(1,Math.ceil(matches.length/3));
  return <><button className="cad-picker-trigger" type="button" aria-label={`Choose ${label}`} disabled={disabled} onClick={()=>{setQuery('');setPage(0);setOpen(true);}}>{options.find(option=>option.value===value)?.label??'Choose…'}</button>{open&&createPortal(<EditorDialog title={`Choose ${label}`} onClose={()=>setOpen(false)}><label>Search {label.toLowerCase()}<input autoFocus value={query} onChange={event=>{setQuery(event.target.value);setPage(0);}}/></label><ul className="cad-panel-list">{matches.slice(page*3,page*3+3).map(option=><li key={option.value}><button type="button" aria-pressed={value===option.value} onClick={()=>{onChange(option.value);setOpen(false);}}>{option.label}</button></li>)}</ul>{!matches.length&&<p>No matching choices.</p>}<div className="cad-pagination"><button type="button" disabled={!page} onClick={()=>setPage(previous=>previous-1)}>Previous</button><span>{page+1} / {pages}</span><button type="button" disabled={page+1>=pages} onClick={()=>setPage(previous=>previous+1)}>Next</button></div></EditorDialog>,document.body)}</>;
}

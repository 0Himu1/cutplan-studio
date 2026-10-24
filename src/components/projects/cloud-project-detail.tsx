'use client';

import { RotateCw } from 'lucide-react';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { CabinetEditor } from '@/components/furniture/cabinet-editor';
import type { FurnitureInput as CabinetInput } from '@/lib/furniture/families';
import { furnitureSnapshot, snapshotFurniture } from '@/lib/projects/contracts';
import { validateName } from '@/lib/guest-drafts/model';
import type { SaveInput } from '@/lib/projects/contracts';
import { ClientProjectError, pendingSaveKey, projectRequest, readPendingSave, type ProjectRevisionResponse } from '@/lib/projects/client';

export function CloudProjectDetail({id}:{id:string}) {
  const {status,user,signIn}=useAuth();
  const userId=user?.id;
  const [data,setData]=useState<ProjectRevisionResponse|null>(null);
  const [state,setState]=useState<'loading'|'ready'|'error'>('loading');
  const [message,setMessage]=useState('');
  const [name,setName]=useState('');
  const [working,setWorking]=useState(false);
  const [pending,setPending]=useState<SaveInput|null>(null);
  const [viewingCurrent,setViewingCurrent]=useState(true);
  const [projectTab,setProjectTab]=useState<'details'|'history'|'recovery'>('details');
  const key=user?pendingSaveKey(user.id,id):'';
  const load=useCallback(async(revisionId?:string,replaceName=false)=>{
    if(!userId)return;setState('loading');setMessage('');
    try { const next=await projectRequest<ProjectRevisionResponse>(`/api/projects/${id}${revisionId?`?revision=${revisionId}`:''}`);setData(next);setViewingCurrent(!revisionId);if(replaceName)setName(next.project.name);setState('ready'); }
    catch(error){setMessage(error instanceof Error?error.message:'This account project is unavailable.');setState('error');}
  },[userId,id]);
  // Session checks return fresh objects even when the signed-in account is unchanged.
  // Only an account or project change should replace the open editor.
  useEffect(()=>{ if(userId)queueMicrotask(()=>{setPending(readPendingSave(pendingSaveKey(userId,id)));void load(undefined,true);}); },[userId,id,load]);
  async function save(event?:FormEvent){event?.preventDefault();if(!data||!user)return;const nameError=validateName(name);if(nameError){setMessage(nameError);return;}setWorking(true);setMessage('');
    const request=pending??{operationId:crypto.randomUUID(),sourceDraftId:data.project.source_draft_id,projectId:id,expectedVersion:data.project.version,snapshot:data.revision?.snapshot ? {...data.revision.snapshot,name:name.trim()} : {schemaVersion:1,name:name.trim(),furnitureType:data.project.furniture_type,stage:'project-shell'}} as SaveInput;
    try{window.localStorage.setItem(key,JSON.stringify(request));setPending(request);}catch{setMessage('This browser cannot keep a safe retry record, so the save did not start. Allow site storage and try again.');setWorking(false);return;}
    try{await projectRequest('/api/projects',{method:'POST',body:JSON.stringify(request)});window.localStorage.removeItem(key);setPending(null);await load(undefined,true);setMessage('Saved as a new revision.');}
    catch(error){setMessage(error instanceof ClientProjectError?error.message:'The save could not finish. Retry it.');}
    finally{setWorking(false);}
  }
  async function saveDesign(input:CabinetInput,expectedVersion:number):Promise<{ok:true;version:number}|{ok:false;error:string}>{
    if(!data||!user||pending)return {ok:false,error:'Finish the pending account save before saving another design.'};
    setWorking(true);setMessage('');
    const request:SaveInput={operationId:crypto.randomUUID(),sourceDraftId:data.project.source_draft_id,projectId:id,expectedVersion,snapshot:furnitureSnapshot(data.project.name,input)};
    try{
      window.localStorage.setItem(key,JSON.stringify(request));setPending(request);
      await projectRequest('/api/projects',{method:'POST',body:JSON.stringify(request)});
      window.localStorage.removeItem(key);setPending(null);
      const next=await projectRequest<ProjectRevisionResponse>(`/api/projects/${id}`);setData(next);
      return {ok:true,version:next.project.version};
    } catch(error){return {ok:false,error:error instanceof Error?error.message:'The design could not be saved. Retry the original save.'};}
    finally{setWorking(false);}
  }
  async function recover(){setWorking(true);setMessage('');try{await projectRequest(`/api/projects/${id}/recover`,{method:'POST'});if(key)window.localStorage.removeItem(key);setPending(null);await load(undefined,true);setMessage('The interrupted save is complete.');}catch(error){setMessage(error instanceof Error?error.message:'The interrupted save still needs attention.');}finally{setWorking(false);}}
  if(status==='loading')return <div className="mx-auto w-full max-w-330 px-12 py-12 [@media(width<=760px)]:px-6 [@media(width<=760px)]:py-[30px]"><div className="h-8 w-56 animate-pulse rounded-[7px] bg-surface"/><div className="mt-8 h-80 animate-pulse rounded-[12px] bg-surface"/></div>;
  if(!user)return <div className="mx-auto w-full max-w-220 px-12 py-12 [@media(width<=760px)]:px-6"><h1 className="text-[length:27px] font-[580] tracking-[-.035em]">Sign in to open this project</h1><p className="mt-3 max-w-[50ch] text-[length:13px] leading-[1.7] text-muted">Account projects are private to the Google account that saved them.</p><button className="mt-6 min-h-10 rounded-[7px] border-0 bg-accent-button px-4 text-[length:12px] font-[550] text-white hover:bg-button-hover" onClick={()=>signIn(`/projects/cloud/${id}`)}>Sign in</button></div>;
  if(state==='loading')return <div className="mx-auto w-full max-w-330 px-12 py-12 [@media(width<=760px)]:px-6 [@media(width<=760px)]:py-[30px]"><div className="h-8 w-56 animate-pulse rounded-[7px] bg-surface"/><div className="mt-8 h-80 animate-pulse rounded-[12px] bg-surface"/></div>;
  if(state==='error'||!data)return <div className="mx-auto w-full max-w-220 px-12 py-12 [@media(width<=760px)]:px-6"><h1 className="text-[length:27px] font-[580] tracking-[-.035em]">Project unavailable</h1><p className="mt-3 text-[length:13px] text-danger-ink" role="alert">{message}</p><button className="mt-6 inline-flex min-h-10 items-center gap-2 rounded-[7px] border border-[var(--border)] bg-surface px-4 text-[length:12px] font-[550]" onClick={()=>void load(undefined,true)}><RotateCw size={15} aria-hidden="true"/>Retry</button></div>;
  const shown=data.revision?.snapshot;
  return <CabinetEditor commerce={{projectId:id,revisionId:data.revision?.id}} key={user.id+id+(viewingCurrent?'current':data.revision?.id)} projectName={data.project.name} family={data.project.furniture_type} initial={snapshotFurniture(shown)} version={data.revision?.number??data.project.version} recoveryKey={'cutplan.editor.cloud.'+user.id+'.'+id} readOnly={!viewingCurrent} disabled={working||Boolean(pending)||data.project.sync_status!=='ready'} saveLabel="Save design revision" onSave={saveDesign} projectTools={<>
    <div className="cad-pagination">{(['details','history','recovery'] as const).map(tab=><button key={tab} aria-pressed={tab===projectTab} onClick={()=>setProjectTab(tab)}>{tab==='details'?'Project':tab==='history'?'History':'Save status'}</button>)}</div>
    {projectTab==='details'&&<><p>Account project · Revision {data.revision?.number??'pending'}</p>{viewingCurrent?<form onSubmit={save}><label htmlFor="cloud-project-name">Project name</label><input id="cloud-project-name" value={name} maxLength={120} disabled={working} onChange={event=>setName(event.target.value)}/><button className="cad-primary" disabled={working||Boolean(pending)||data.project.sync_status!=='ready'}>Save as new revision</button></form>:<button onClick={()=>void load(undefined,true)}>Return to current revision</button>}</>}
    {projectTab==='history'&&<><h3>Revision history</h3><p>Saved versions are read-only.</p><ol className="cad-panel-list">{data.history.map(item=><li key={item.id}><button onClick={()=>void load(item.id,false)}>Revision {item.revision_number}<small>{new Date(item.created_at).toLocaleDateString('en-GB')}</small></button></li>)}</ol>{data.hasMoreHistory&&<p>Latest 100 revisions shown.</p>}</>}
    {projectTab==='recovery'&&<><p>{pending||data.project.sync_status==='pending'?'An account save needs to finish.':'Account save is complete.'}</p>{pending&&<button disabled={working} onClick={()=>void save()}>Retry original save</button>}{(pending||data.project.sync_status==='pending')&&<button disabled={working} onClick={()=>void recover()}>Recover saved operation</button>}</>}
    {message&&<p role="status">{message}</p>}{message.includes('another tab')&&<button onClick={()=>void load(undefined,true)}>Reload latest project</button>}
  </>}/>;
}

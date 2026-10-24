'use client';

import Link from 'next/link';
import { Cloud, RotateCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { FurnitureDiagram } from '@/components/furniture-diagram';
import { TYPE_LABELS } from '@/lib/guest-drafts/model';
import type { CloudProject } from '@/lib/projects/contracts';
import { projectRequest } from '@/lib/projects/client';

export function AccountProjects() {
  const {user,status}=useAuth();
  const [state,setState]=useState<{kind:'loading'|'ready'|'error';projects:CloudProject[];configured:boolean;hasMore:boolean;message?:string}>({kind:'loading',projects:[],configured:true,hasMore:false});
  const load=useCallback(async()=>{ if(!user)return; setState(current=>({...current,kind:'loading'})); try { const data=await projectRequest<{projects:CloudProject[];configured:boolean;hasMore:boolean}>('/api/projects');setState({kind:'ready',...data}); } catch(error){setState({kind:'error',projects:[],configured:true,hasMore:false,message:error instanceof Error?error.message:'Account projects are unavailable.'});}},[user]);
  useEffect(()=>{if(user)queueMicrotask(()=>{void load();});},[user,load]);
  if(status==='loading'||!user)return null;
  return <section className="mb-11" aria-labelledby="account-projects-title"><div className="mb-5 flex items-center justify-between gap-4"><div><h2 id="account-projects-title" className="text-[length:15px] font-[550] tracking-[-.02em]">Account projects</h2><p className="mt-2 text-[length:12px] text-muted">Versioned copies available after you sign in.</p></div>{state.kind==='error'&&<button type="button" className="inline-flex min-h-10 items-center gap-2 rounded-[7px] border border-[var(--border)] bg-surface px-3 text-[length:12px] font-[550] hover:bg-elevated" onClick={()=>void load()}><RotateCw size={14} aria-hidden="true"/>Retry</button>}</div>
    {state.kind==='loading'&&<div className="grid grid-cols-3 gap-[22px] [@media(width<=540px)]:grid-cols-1 [@media(540px<width<=1100px)]:grid-cols-2" aria-label="Loading account projects"><span className="h-54 animate-pulse rounded-[12px] bg-surface"/><span className="h-54 animate-pulse rounded-[12px] bg-surface"/><span className="h-54 animate-pulse rounded-[12px] bg-surface"/></div>}
    {state.kind==='error'&&<p className="rounded-[10px] border border-[var(--border)] bg-surface px-5 py-4 text-[length:13px] text-danger-ink" role="alert">{state.message}</p>}
    {state.kind==='ready'&&!state.configured&&<p className="rounded-[10px] border border-[var(--border)] bg-surface px-5 py-4 text-[length:13px] leading-[1.6] text-muted" role="status">Account project storage is being connected. Browser drafts remain available and no account save will be marked complete yet.</p>}
    {state.kind==='ready'&&state.configured&&!state.projects.length&&<div className="flex items-center gap-4 rounded-[10px] border border-dashed border-[var(--border)] px-6 py-5"><Cloud className="shrink-0 text-diagram" size={22} aria-hidden="true"/><div><h3 className="text-[length:13px] font-[550]">No account projects yet.</h3><p className="mt-1 text-[length:12px] text-muted">Open a browser draft and choose Save to account.</p></div></div>}
    {state.kind==='ready'&&state.projects.length>0&&<><div className="grid grid-cols-3 gap-[22px] [@media(width<=540px)]:grid-cols-1 [@media(540px<width<=1100px)]:grid-cols-2">{state.projects.map(project=><article key={project.id} className="min-w-0 overflow-clip rounded-[12px] border border-[var(--border)]"><Link href={`/projects/cloud/${project.id}`} className="block focus-visible:outline-offset-[-4px]" aria-label={`Open account project ${project.name}`}><div className="bg-surface px-6 pb-[18px] pt-3 text-center [&_.furniture-diagram]:h-[130px] [&_.furniture-diagram]:max-w-[220px]"><FurnitureDiagram type={project.furniture_type}/></div><div className="px-5 py-5"><h3 className="wrap-anywhere text-[length:16px] font-[550] leading-[1.45]">{project.name}</h3><p className="mt-[7px] text-[length:12px] text-muted">{TYPE_LABELS[project.furniture_type]}<span aria-hidden="true"> / </span>Revision {project.version}</p><p className={`mt-3 text-[length:12px] ${project.sync_status==='ready'?'text-accent-ink':'text-danger-ink'}`}>{project.sync_status==='ready'?'Saved to account':'Save needs attention'}</p></div></Link></article>)}</div>{state.hasMore&&<p className="mt-4 text-[length:12px] text-muted">Showing the 100 most recently updated account projects.</p>}</>}
  </section>;
}

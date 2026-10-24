'use client';

import Link from 'next/link';
import { Cloud, RotateCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import type { GuestDraft } from '@/lib/guest-drafts/model';
import type { CloudProject, SaveInput } from '@/lib/projects/contracts';
import { designSnapshot, furnitureSnapshot } from '@/lib/projects/contracts';
import { ClientProjectError, pendingSaveKey, projectRequest, readPendingSave } from '@/lib/projects/client';

export function SaveToAccount({draft}:{draft:GuestDraft}) {
  const {user}=useAuth();
  const router=useRouter();
  const [pending,setPending]=useState<SaveInput|null>(null);
  const [working,setWorking]=useState(false);
  const [project,setProject]=useState<CloudProject|null>(null);
  const [error,setError]=useState('');
  const [storageError,setStorageError]=useState(false);
  const key=user?pendingSaveKey(user.id,draft.id):'';
  useEffect(()=>{ if(user) queueMicrotask(()=>setPending(readPendingSave(pendingSaveKey(user.id,draft.id)))); },[user,draft.id]);
  if (!user) return null;
  async function save() {
    setWorking(true);setError('');setStorageError(false);
    let request=pending;
    if (!request) request={operationId:crypto.randomUUID(),sourceDraftId:draft.id,expectedVersion:0,snapshot:draft.design?furnitureSnapshot(draft.name,draft.design):draft.cabinet?designSnapshot(draft.name,draft.cabinet):{schemaVersion:1,name:draft.name,furnitureType:draft.furnitureType,stage:'project-shell'}};
    try {
      window.localStorage.setItem(key,JSON.stringify(request)); setPending(request);
    } catch { setStorageError(true);setWorking(false);return; }
    try {
      const result=await projectRequest<{project:CloudProject;alreadyClaimed:boolean}>('/api/projects',{method:'POST',body:JSON.stringify(request)});
      window.localStorage.removeItem(key);setPending(null);setProject(result.project);router.refresh();
    } catch(cause) { setError(cause instanceof ClientProjectError?cause.message:'Account saving is unavailable. Retry this save.'); }
    finally { setWorking(false); }
  }
  return <section className="mt-6 [border-top:1px_solid_var(--border)] pt-6" aria-labelledby="account-save-title">
    <div className="flex items-start gap-3"><Cloud className="mt-[2px] shrink-0 text-accent-ink" size={18} strokeWidth={1.7} aria-hidden="true"/><div className="min-w-0"><h3 id="account-save-title" className="text-[length:14px] font-[550]">Save an account copy</h3><p className="mt-2 max-w-[52ch] text-[length:12px] leading-[1.7] text-muted">Keep this browser draft here and create a versioned copy you can open after signing in elsewhere.</p></div></div>
    {project ? <p className="mt-4 text-[length:13px] text-accent-ink" role="status">Account copy saved. <Link className="font-[550] underline underline-offset-4" href={`/projects/cloud/${project.id}`}>Open account project</Link></p> : <button type="button" className="button primary mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-[7px] border-0 bg-accent-button px-4 py-[10px] text-[length:12px] font-[550] text-white transition-colors hover:bg-button-hover disabled:bg-elevated disabled:text-muted [@media(width<=760px)]:min-h-11" onClick={()=>void save()} disabled={working}>{pending&&<RotateCw size={15} aria-hidden="true"/>}{working?'Saving…':pending?'Retry account save':'Save to account'}</button>}
    {storageError&&<p className="mt-3 text-[length:13px] text-danger-ink" role="alert">This browser cannot keep a safe retry record, so the account save did not start. Allow site storage and try again.</p>}
    {error&&<p className="mt-3 max-w-[54ch] text-[length:13px] leading-[1.6] text-danger-ink" role="alert">{error}</p>}
  </section>;
}

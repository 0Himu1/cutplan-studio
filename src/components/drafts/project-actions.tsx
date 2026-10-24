'use client';

import { useEffect, useRef, useState, type FormEvent, type RefObject } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2 } from 'lucide-react';
import { MAX_NAME_LENGTH, type GuestDraft } from '@/lib/guest-drafts/model';
import { deleteDraft, renameDraft } from '@/lib/guest-drafts/store';
import { ConfirmAction } from './confirm-action';

function RenameForm({ draft, onDone }: { draft: GuestDraft; onDone: () => void }) {
  const [name, setName] = useState(draft.name);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const input = useRef<HTMLInputElement>(null);
  useEffectFocus(input);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    const result = await renameDraft(draft.id, name, draft.version);
    if (result.ok) onDone();
    else { setError(result.error); setPending(false); input.current?.focus(); }
  }
  return <form className="rename-form [&_label]:block [&_label]:text-[length:14px] [&_label]:font-[550] [&_label]:mb-3 [&_input]:w-full [&_input]:min-h-[46px] [&_input]:[border:1px_solid_var(--border)] [&_input]:rounded-[7px] [&_input]:pt-[10px] [&_input]:pr-3 [&_input]:pb-[10px] [&_input]:pl-3 [&_input]:bg-base [&_input]:text-ink [&_input]:caret-accent-ink [&_input]:text-[length:14px] [@media(width<=760px)]:[&_input]:text-[length:16px] pt-[18px] pr-5 pb-[22px] pl-5 [border-top:1px_solid_var(--border)] [&_.form-actions]:mt-4" onSubmit={submit} noValidate>
    <label htmlFor={`rename-${draft.id}`}>Project name</label>
    <input ref={input} id={`rename-${draft.id}`} name="projectName" value={name} onChange={event => setName(event.target.value)} maxLength={MAX_NAME_LENGTH} autoComplete="off" className="aria-invalid:border-danger-ink" aria-invalid={Boolean(error)} aria-describedby={error ? `rename-error-${draft.id}` : undefined} />
    {error && <p id={`rename-error-${draft.id}`} className="form-error text-danger-ink text-[length:13px] mt-[10px] wrap-anywhere" role="alert">{error}</p>}
    <div className="form-actions flex justify-end flex-wrap gap-[10px] mt-6"><button type="button" className="button inline-flex items-center justify-center min-h-10 gap-2 rounded-[7px] pt-[10px] pr-4 pb-[10px] pl-4 text-[length:12px] font-[550] whitespace-nowrap [transition:background-color_150ms,_color_150ms] [@media(width<=760px)]:min-h-11 [&:disabled]:opacity-[.75] secondary bg-surface text-ink [border:1px_solid_var(--border)] [&:hover]:bg-elevated" onClick={onDone} disabled={pending}>Cancel</button><button type="submit" className="button inline-flex items-center justify-center min-h-10 gap-2 [border:0] rounded-[7px] pt-[10px] pr-4 pb-[10px] pl-4 text-[length:12px] font-[550] whitespace-nowrap [transition:background-color_150ms,_color_150ms] [@media(width<=760px)]:min-h-11 [&:disabled]:opacity-[.75] primary bg-accent-button text-white [&:hover:not(:disabled)]:bg-button-hover [&:disabled]:bg-elevated [&:disabled]:text-muted" disabled={pending}>{pending ? 'Saving…' : 'Save name'}</button></div>
  </form>;
}

function useEffectFocus(input: RefObject<HTMLInputElement | null>) {
  useEffect(() => { input.current?.focus(); input.current?.select(); }, [input]);
}

export function ProjectActions({ draft, detail = false }: { draft: GuestDraft; detail?: boolean }) {
  const router = useRouter();
  const [renaming, setRenaming] = useState<GuestDraft | null>(null);
  const [deleting, setDeleting] = useState<GuestDraft | null>(null);
  const renameButton = useRef<HTMLButtonElement>(null);
  function finishRename() { setRenaming(null); requestAnimationFrame(() => renameButton.current?.focus()); }
  return <div className="project-actions-area min-w-0">
    <div className="project-actions flex items-center gap-3"><button ref={renameButton} className="quiet-button [&:hover]:text-accent-ink inline-flex items-center gap-[6px] min-h-11 [border:0] bg-transparent text-muted text-[length:12px] pt-2 pr-2 pb-2 pl-2 rounded-[6px]" type="button" aria-label={`Rename ${draft.name}`} onClick={() => setRenaming({ ...draft })} disabled={Boolean(renaming)}><Pencil size={14} aria-hidden="true" />Rename</button><button className="quiet-button inline-flex items-center gap-[6px] min-h-11 [border:0] bg-transparent text-muted text-[length:12px] pt-2 pr-2 pb-2 pl-2 rounded-[6px] delete-action [&:hover]:text-danger-ink" type="button" aria-label={`Delete ${draft.name}`} onClick={() => setDeleting({ ...draft })} disabled={Boolean(renaming)}><Trash2 size={14} aria-hidden="true" />Delete</button></div>
    {renaming && <RenameForm draft={renaming} onDone={finishRename} />}
    {deleting && <ConfirmAction title="Delete this draft?" description={`“${deleting.name}” will be removed from this browser. This cannot be undone.`} confirmLabel="Delete draft" onCancel={() => setDeleting(null)} onConfirm={async () => { const result = await deleteDraft(deleting.id, deleting.version); if (result.ok && detail) router.push('/projects'); return result; }} />}
  </div>;
}

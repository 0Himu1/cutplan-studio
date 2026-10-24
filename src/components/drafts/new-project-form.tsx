'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState, type FormEvent } from 'react';
import { ArrowLeft } from 'lucide-react';
import { FURNITURE_TYPES, MAX_NAME_LENGTH, TYPE_LABELS, validateName, type FurnitureType } from '@/lib/guest-drafts/model';
import { createDraft, defaultDraftName, useGuestDrafts } from '@/lib/guest-drafts/store';
import { FurnitureDiagram } from '@/components/furniture-diagram';
import { StorageNotice } from './storage-notice';

const descriptions: Record<FurnitureType, string> = { cabinet: 'Storage made for your space', shoe_rack: 'A tidy place to step inside', bookshelf: 'Room for books and more', table: 'A place to work or gather' };

export function NewProjectForm({ initialType }: { initialType: FurnitureType }) {
  const state = useGuestDrafts();
  const router = useRouter();
  const [type, setType] = useState(initialType);
  const [name, setName] = useState(defaultDraftName(initialType));
  const [pending, setPending] = useState(false);
  const [nameError, setNameError] = useState('');
  const [saveError, setSaveError] = useState('');
  const input = useRef<HTMLInputElement>(null);
  function selectType(next: FurnitureType) {
    if (name === defaultDraftName(type)) setName(defaultDraftName(next));
    setType(next);
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    const error = validateName(name);
    setNameError(error ?? '');
    if (error) { input.current?.focus(); return; }
    setPending(true);
    setSaveError('');
    const result = await createDraft(name, type);
    if (result.ok && result.draft) router.push(`/projects/${result.draft.id}`);
    else { setSaveError(result.ok ? 'The draft could not be opened. Check Projects before trying again.' : result.error); setPending(false); }
  }
  return <div className="page-content mt-0 mr-auto mb-0 ml-auto pt-12 pr-12 pb-8 pl-12 w-full [@media(width<=760px)]:pt-[30px] [@media(760px<width<=1100px)]:pt-8 [@media(width>=1600px)]:pt-16 [@media(width<=420px)]:pr-5 [@media(420px<width<=760px)]:pr-6 [@media(760px<width<=1100px)]:pr-7 [@media(width<=760px)]:pb-[30px] [@media(width<=420px)]:pl-5 [@media(420px<width<=760px)]:pl-6 [@media(760px<width<=1100px)]:pl-7 new-project-page max-w-260"><Link className="back-link inline-flex items-center gap-2 min-h-11 mb-5 text-muted text-[length:12px] [&:hover]:text-accent-ink" href="/projects"><ArrowLeft size={16} aria-hidden="true" />All projects</Link><section className="page-heading flex items-center justify-between gap-6 mb-[34px] [@media(width<=760px)]:items-start [@media(width<=420px)]:gap-[18px] [@media(width<=760px)]:mb-[26px] [@media(width<=420px)]:flex-col [&_h1]:text-[length:27px] [&_h1]:leading-[1.25] [&_h1]:font-[580] [&_h1]:tracking-[-.035em] [@media(width<=760px)]:[&_h1]:text-[length:24px] [&_p]:text-muted [&_p]:mt-2 [&_p]:text-[length:13px] [@media(width<=760px)]:[&_p]:text-[length:12px] [@media(width<=760px)]:[&_p]:max-w-[30ch] [@media(width<=760px)]:[&_.button]:min-h-11 [@media(width<=760px)]:[&_.button]:pt-[10px] [@media(width<=760px)]:[&_.button]:pr-3 [@media(width<=760px)]:[&_.button]:pb-[10px] [@media(width<=760px)]:[&_.button]:pl-3"><div><h1>Make room for something new.</h1><p>Choose a furniture type and name your project.</p></div></section><StorageNotice status={state.status} />
    <form className="new-project-form [&_>_.form-actions]:justify-start [&_>_.form-actions]:mt-[30px]" onSubmit={submit} noValidate>
      <fieldset disabled={pending || state.status !== 'ready'} className="type-picker [&_legend]:block [&_legend]:text-[length:14px] [&_legend]:font-[550] [&_legend]:mb-3 [border:0] pt-0 pr-0 pb-0 pl-0 mt-0 mr-0 mb-0 ml-0 [&:disabled_.type-choice]:cursor-not-allowed [&:disabled_.type-choice]:opacity-[.65]"><legend>What would you like to make?</legend><div className="type-choices grid grid-cols-[repeat(4,minmax(0,1fr))] gap-4 [@media(width<=1100px)]:grid-cols-[repeat(2,minmax(0,1fr))] [@media(width<=540px)]:gap-3">{FURNITURE_TYPES.map(value => <label key={value} className="type-choice relative [border:1px_solid_var(--border)] rounded-[10px] cursor-pointer pt-[18px] pr-[14px] pb-[18px] pl-[14px] min-w-0 [transition:border-color_150ms,_background-color_150ms] [@media(width<=540px)]:pr-3 [@media(width<=540px)]:pl-3 [&:has(input:checked)]:border-accent [&:has(input:checked)]:bg-accent-soft [&:focus-within]:[outline:2px_solid_var(--focus)] [&:focus-within]:[outline-offset:3px] [&_input]:absolute [&_input]:top-[14px] [&_input]:right-[14px] [&_input]:w-[17px] [&_input]:h-[17px] [&_input]:accent-accent-button [&_.furniture-diagram]:h-28 [&_.furniture-diagram]:w-full [&_.furniture-diagram]:mt-2 [@media(width<=760px)]:[&_.furniture-diagram]:h-24"><input type="radio" name="furnitureType" value={value} checked={type === value} onChange={() => selectType(value)} /><FurnitureDiagram type={value} compact /><span className="type-choice-title block text-[length:14px] font-[550]">{TYPE_LABELS[value]}</span><span className="type-choice-description block text-muted text-[length:12px] leading-[1.6] mt-[7px]">{descriptions[value]}</span></label>)}</div></fieldset>
      <div className="name-field [&_label]:block [&_label]:text-[length:14px] [&_label]:font-[550] [&_label]:mb-3 [&_input]:w-full [&_input]:min-h-[46px] [&_input]:[border:1px_solid_var(--border)] [&_input]:rounded-[7px] [&_input]:pt-[10px] [&_input]:pr-3 [&_input]:pb-[10px] [&_input]:pl-3 [&_input]:bg-base [&_input]:text-ink [&_input]:caret-accent-ink [&_input]:text-[length:14px] [@media(width<=760px)]:[&_input]:text-[length:16px] mt-8 mr-0 mb-[14px] ml-0 max-w-135"><label htmlFor="project-name">Project name</label><input ref={input} id="project-name" name="projectName" autoComplete="off" value={name} onChange={event => setName(event.target.value)} maxLength={MAX_NAME_LENGTH} className="aria-invalid:border-danger-ink" aria-invalid={Boolean(nameError)} aria-describedby={nameError ? 'name-error' : 'name-hint'} disabled={pending || state.status === 'loading'} /><p id="name-hint" className="field-hint text-[length:12px] text-muted mt-2">Something you will recognize, like “Hallway shoe rack”.</p>{nameError && <p id="name-error" className="form-error text-danger-ink text-[length:13px] mt-[10px] wrap-anywhere" role="alert">{nameError}</p>}</div>
      <p className="local-note text-muted text-[length:12px] leading-[1.7] mt-4">This guest draft stays on this browser. Furniture dimensions and materials will be added in the editor.</p>
      {saveError && <p className="form-error text-danger-ink text-[length:13px] mt-[10px] wrap-anywhere" role="alert">{saveError}</p>}
      <div className="form-actions flex justify-end flex-wrap gap-[10px] mt-6"><Link className="button inline-flex items-center justify-center min-h-10 gap-2 rounded-[7px] pt-[10px] pr-4 pb-[10px] pl-4 text-[length:12px] font-[550] whitespace-nowrap [transition:background-color_150ms,_color_150ms] [@media(width<=760px)]:min-h-11 [&:disabled]:opacity-[.75] secondary bg-surface text-ink [border:1px_solid_var(--border)] [&:hover]:bg-elevated" href="/projects">Cancel</Link><button type="submit" className="button inline-flex items-center justify-center min-h-10 gap-2 [border:0] rounded-[7px] pt-[10px] pr-4 pb-[10px] pl-4 text-[length:12px] font-[550] whitespace-nowrap [transition:background-color_150ms,_color_150ms] [@media(width<=760px)]:min-h-11 [&:disabled]:opacity-[.75] primary bg-accent-button text-white [&:hover:not(:disabled)]:bg-button-hover [&:disabled]:bg-elevated [&:disabled]:text-muted" disabled={pending || state.status !== 'ready'}>{pending ? 'Creating…' : 'Create draft'}</button></div>
    </form>
  </div>;
}

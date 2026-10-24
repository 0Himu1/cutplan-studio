'use client';

import { useEffect, useRef, useState } from 'react';
import type { DraftResult } from '@/lib/guest-drafts/store';

export function ConfirmAction({ title, description, confirmLabel, onConfirm, onCancel }: {
  title: string; description: string; confirmLabel: string;
  onConfirm: () => Promise<DraftResult>; onCancel: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const element = dialog.current;
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    element?.showModal();
    return () => {
      element?.close();
      requestAnimationFrame(() => { if (trigger?.isConnected) trigger.focus(); });
    };
  }, []);

  async function confirm() {
    setPending(true);
    setError('');
    const result = await onConfirm();
    if (result.ok) onCancel();
    else { setError(result.error); setPending(false); }
  }

  return <dialog ref={dialog} className="confirm-dialog w-[min(440px,calc(100vw_-_40px))] pt-7 pr-7 pb-7 pl-7 bg-surface text-ink [border:1px_solid_var(--border)] rounded-[12px] mt-auto mr-auto mb-auto ml-auto max-h-[calc(100dvh_-_40px)] overflow-y-auto overscroll-contain [@media(width<=540px)]:pt-6 [@media(width<=540px)]:pr-6 [@media(width<=540px)]:pb-6 [@media(width<=540px)]:pl-6 [&::backdrop]:bg-[rgb(0_0_0_/_65%)] [&_h2]:text-[length:21px] [&_h2]:font-[550] [&_>_p]:mt-[14px] [&_>_p]:text-muted [&_>_p]:text-[length:14px] [&_>_p]:wrap-anywhere [&_.form-error]:text-danger-ink" aria-labelledby="confirm-title" aria-describedby="confirm-description" onCancel={event => { event.preventDefault(); if (!pending) onCancel(); }}>
    <h2 id="confirm-title">{title}</h2>
    <p id="confirm-description">{description}</p>
    {error && <p className="form-error text-danger-ink text-[length:13px] mt-[10px] wrap-anywhere" role="alert">{error}</p>}
    <div className="form-actions flex justify-end flex-wrap gap-[10px] mt-6"><button type="button" className="button inline-flex items-center justify-center min-h-10 gap-2 rounded-[7px] pt-[10px] pr-4 pb-[10px] pl-4 text-[length:12px] font-[550] whitespace-nowrap [transition:background-color_150ms,_color_150ms] [@media(width<=760px)]:min-h-11 [&:disabled]:opacity-[.75] secondary bg-surface text-ink [border:1px_solid_var(--border)] [&:hover]:bg-elevated" onClick={onCancel} disabled={pending}>Cancel</button><button type="button" className="button inline-flex items-center justify-center min-h-10 gap-2 [border:0] rounded-[7px] pt-[10px] pr-4 pb-[10px] pl-4 text-[length:12px] font-[550] whitespace-nowrap [transition:background-color_150ms,_color_150ms] [@media(width<=760px)]:min-h-11 [&:disabled]:opacity-[.75] danger bg-danger-fill text-white [&:hover]:bg-[#991b1b]" onClick={confirm} disabled={pending}>{pending ? 'Removing…' : confirmLabel}</button></div>
  </dialog>;
}

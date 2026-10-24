'use client';

import { useState } from 'react';
import type { DraftState } from '@/lib/guest-drafts/model';
import { downloadRecovery, refreshDrafts, resetDrafts } from '@/lib/guest-drafts/store';
import { ConfirmAction } from './confirm-action';

export function StorageNotice({ status }: { status: DraftState['status'] }) {
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState('');
  if (status === 'ready' || status === 'loading') return null;
  const unavailable = status === 'unavailable';
  return <section className="storage-notice [border:1px_solid_var(--border)] rounded-[10px] pt-6 pr-6 pb-6 pl-6 mt-5 mr-0 mb-5 ml-0 [&_h2]:text-[length:17px] [&_h2]:font-[550] [&_>_p]:text-[length:13px] [&_>_p]:text-muted [&_>_p]:mt-2 [&_>_p]:max-w-[70ch]" aria-label="Browser draft recovery">
    <h2>{unavailable ? 'Browser storage is unavailable.' : status === 'newer-version' ? 'These drafts need a newer version of the app.' : 'Your saved drafts could not be read.'}</h2>
    <p>{unavailable ? 'Allow site storage in your browser, then retry. No changes will be marked as saved while storage is unavailable.' : 'The existing data has been left untouched. Download a recovery copy before choosing to reset it.'}</p>
    <div className="notice-actions flex gap-[10px] flex-wrap mt-[18px]"><button className="button inline-flex items-center justify-center min-h-10 gap-2 rounded-[7px] pt-[10px] pr-4 pb-[10px] pl-4 text-[length:12px] font-[550] whitespace-nowrap [transition:background-color_150ms,_color_150ms] [@media(width<=760px)]:min-h-11 [&:disabled]:opacity-[.75] secondary bg-surface text-ink [border:1px_solid_var(--border)] [&:hover]:bg-elevated" type="button" onClick={refreshDrafts}>Retry</button>{!unavailable && <><button className="button inline-flex items-center justify-center min-h-10 gap-2 rounded-[7px] pt-[10px] pr-4 pb-[10px] pl-4 text-[length:12px] font-[550] whitespace-nowrap [transition:background-color_150ms,_color_150ms] [@media(width<=760px)]:min-h-11 [&:disabled]:opacity-[.75] secondary bg-surface text-ink [border:1px_solid_var(--border)] [&:hover]:bg-elevated" type="button" onClick={() => { const result = downloadRecovery(); setError(result.ok ? '' : result.error); }}>Download recovery copy</button><button className="button inline-flex items-center justify-center min-h-10 gap-2 [border:0] rounded-[7px] pt-[10px] pr-4 pb-[10px] pl-4 text-[length:12px] font-[550] whitespace-nowrap [transition:background-color_150ms,_color_150ms] [@media(width<=760px)]:min-h-11 [&:disabled]:opacity-[.75] text-button bg-transparent text-muted" type="button" onClick={() => setResetting(true)}>Reset browser drafts</button></>}</div>
    {error && <p className="form-error text-danger-ink text-[length:13px] mt-[10px] wrap-anywhere" role="alert">{error}</p>}
    {resetting && <ConfirmAction title="Reset browser drafts?" description="This permanently removes CutPlan draft data from this browser. Download a recovery copy first if you want to keep it. Other site settings will not be removed." confirmLabel="Reset drafts" onConfirm={resetDrafts} onCancel={() => setResetting(false)} />}
  </section>;
}

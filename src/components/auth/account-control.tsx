'use client';

import Link from 'next/link';
import { useAuth } from './auth-provider';

export function AccountControl() {
  const auth = useAuth();
  if (auth.status === 'loading') return <span className="account-loading text-[length:12px] text-muted" role="status">Checking account…</span>;
  if (auth.status === 'unavailable') return <button className="button inline-flex items-center justify-center min-h-10 gap-2 rounded-[7px] pt-[10px] pr-4 pb-[10px] pl-4 text-[length:12px] font-[550] whitespace-nowrap [transition:background-color_150ms,_color_150ms] [@media(width<=760px)]:min-h-11 [&:disabled]:opacity-[.75] secondary bg-surface text-ink [border:1px_solid_var(--border)] [&:hover]:bg-elevated" onClick={() => void auth.refresh()}>Retry account</button>;
  return auth.user ? <Link className="button inline-flex items-center justify-center min-h-10 gap-2 rounded-[7px] pt-[10px] pr-4 pb-[10px] pl-4 text-[length:12px] font-[550] whitespace-nowrap [transition:background-color_150ms,_color_150ms] [@media(width<=760px)]:min-h-11 [&:disabled]:opacity-[.75] secondary bg-surface text-ink [border:1px_solid_var(--border)] [&:hover]:bg-elevated account-link" href="/account">My account</Link> : <button className="button inline-flex items-center justify-center min-h-10 gap-2 rounded-[7px] pt-[10px] pr-4 pb-[10px] pl-4 text-[length:12px] font-[550] whitespace-nowrap [transition:background-color_150ms,_color_150ms] [@media(width<=760px)]:min-h-11 [&:disabled]:opacity-[.75] secondary bg-surface text-ink [border:1px_solid_var(--border)] [&:hover]:bg-elevated" onClick={() => auth.signIn()}>Sign in</button>;
}

export function AccountSummary() {
  const auth = useAuth();
  return <div className="guest-profile mt-0 mr-[-12px] mb-0 ml-[-12px] pt-5 pr-2 pb-5 pl-2 [border-top:1px_solid_var(--border)] flex gap-[10px] items-center text-[length:12px] [&_small]:text-muted [&_small]:block [&_small]:mt-1 [&_small]:text-[length:12px]"><span className="guest-avatar w-8 h-8 rounded-full bg-elevated grid place-items-center font-[550] text-muted" aria-hidden="true">{auth.user ? auth.user.email.slice(0, 1).toUpperCase() : 'G'}</span><span>{auth.user ? 'Your account' : 'Guest workspace'}<small>{auth.user ? 'Account and local projects' : 'Local drafts only'}</small></span></div>;
}

export function DraftSignIn() {
  const auth = useAuth();
  return <div className="draft-auth flex gap-4 items-center flex-wrap [border-bottom:1px_solid_var(--border)] pb-5 mb-6 [&_.local-note]:flex-[1] [&_.local-note]:min-w-50"><p className="local-note text-muted text-[length:12px] leading-[1.7] mt-4">{auth.user ? 'You are signed in. This draft is still stored only on this browser.' : 'You can sign in and return to this draft without losing your place.'}</p>{auth.status === 'ready' && !auth.user && <button className="button inline-flex items-center justify-center min-h-10 gap-2 rounded-[7px] pt-[10px] pr-4 pb-[10px] pl-4 text-[length:12px] font-[550] whitespace-nowrap [transition:background-color_150ms,_color_150ms] [@media(width<=760px)]:min-h-11 [&:disabled]:opacity-[.75] secondary bg-surface text-ink [border:1px_solid_var(--border)] [&:hover]:bg-elevated" onClick={() => auth.signIn()}>Sign in and continue</button>}</div>;
}

'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { authRequest, useAuth } from './auth-provider';
import { safeReturnPath, validCode, validEmail } from '@/lib/auth/validation';

function maskedEmail(email: string) { const [name, domain] = email.split('@'); return `${name.slice(0, 1)}${'•'.repeat(Math.min(5, Math.max(2, name.length - 1)))}@${domain}`; }

function EmailCodeForm({ returnTo, onCancel }: { returnTo: string; onCancel: () => void }) {
  const { changed, otpEnabled, status } = useAuth();
  const router = useRouter();
  const id = useId();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [deadline, setDeadline] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const field = useRef<HTMLInputElement>(null);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => { field.current?.focus(); }, [step]);
  useEffect(() => {
    const tick = () => setRemaining(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    tick(); const interval = window.setInterval(tick, 1000); return () => window.clearInterval(interval);
  }, [deadline]);
  async function send() {
    if (!validEmail(email.trim())) { setError('Enter a valid email address.'); field.current?.focus(); return; }
    setPending(true); setError(''); setNotice('');
    const result = await authRequest('request', { email: email.trim() });
    if (!mounted.current) return;
    setPending(false); setDeadline(Date.now() + 60_000);
    if (result.ok) { setStep('code'); setCode(''); setNotice('A new code was requested. Check your inbox and spam folder.'); }
    else setError(result.error);
  }
  async function verify() {
    if (!validCode(code.trim())) { setError('Enter the six-digit code from your email.'); field.current?.focus(); return; }
    setPending(true); setError('');
    const result = await authRequest('verify', { email: email.trim(), code: code.trim() });
    if (!mounted.current) return;
    setPending(false);
    if (!result.ok) { setError(result.error); field.current?.focus(); return; }
    changed(); onCancel(); router.push(safeReturnPath(returnTo)); router.refresh();
  }
  const unavailable = status === 'ready' && !otpEnabled;
  return <form className="auth-form [&_.name-field]:mt-6 [&_.local-note]:mt-5" noValidate aria-busy={pending} onSubmit={event => { event.preventDefault(); if (!pending && !unavailable && status === 'ready') void (step === 'email' ? send() : verify()); }}>
    <p className="auth-intro text-muted text-[length:14px] mt-4">{step === 'email' ? 'Use your email to sign in or create an account. Your drafts stay on this browser.' : `Enter the six-digit code sent to ${maskedEmail(email.trim())}.`}</p>
    {unavailable && <p className="auth-notice bg-accent-soft pt-4 pr-4 pb-4 pl-4 rounded-[7px] text-[length:13px] mt-5 text-accent-ink" role="status">Email code sign-in is not enabled yet. You can continue as a guest; your browser drafts are still available.</p>}
    {status === 'unavailable' && <p className="form-error text-danger-ink text-[length:13px] mt-[10px] wrap-anywhere" role="alert">Account status is unavailable. Close this dialog and retry from the account control.</p>}
    <div className="name-field [&_label]:block [&_label]:text-[length:14px] [&_label]:font-[550] [&_label]:mb-3 [&_input]:w-full [&_input]:min-h-[46px] [&_input]:[border:1px_solid_var(--border)] [&_input]:rounded-[7px] [&_input]:pt-[10px] [&_input]:pr-3 [&_input]:pb-[10px] [&_input]:pl-3 [&_input]:bg-base [&_input]:text-ink [&_input]:caret-accent-ink [&_input]:text-[length:14px] [@media(width<=760px)]:[&_input]:text-[length:16px] mt-8 mr-0 mb-[14px] ml-0 max-w-135"><label htmlFor={`${id}-field`}>{step === 'email' ? 'Email address' : 'Verification code'}</label><input ref={field} id={`${id}-field`} type={step === 'email' ? 'email' : 'text'} inputMode={step === 'email' ? 'email' : 'numeric'} autoComplete={step === 'email' ? 'email' : 'one-time-code'} maxLength={step === 'email' ? 254 : 6} value={step === 'email' ? email : code} onChange={event => { if (step === 'email') setEmail(event.target.value); else setCode(event.target.value.replace(/\s/g, '')); setError(''); }} disabled={pending || unavailable} className="aria-invalid:border-danger-ink" aria-invalid={Boolean(error)} aria-describedby={`${id}-hint${error ? ` ${id}-error` : ''}`} /><p id={`${id}-hint`} className="field-hint text-[length:12px] text-muted mt-2">{step === 'email' ? 'No password needed.' : 'Paste the complete code. Each code can only be used once.'}</p></div>
    {error && <p id={`${id}-error`} className="form-error text-danger-ink text-[length:13px] mt-[10px] wrap-anywhere" role="alert">{error}</p>}
    {notice && <p className="auth-feedback text-[length:13px] text-muted mt-3" role="status">{notice}</p>}
    {step === 'code' && <div className="auth-code-actions flex gap-[14px] flex-wrap mt-[10px] [&_.quiet-action:disabled]:cursor-not-allowed [&_.quiet-action:disabled]:text-muted"><button type="button" className="quiet-action" disabled={pending || remaining > 0} onClick={() => void send()}>{remaining > 0 ? `Resend in ${remaining}s` : 'Resend code'}</button><button type="button" className="quiet-action" disabled={pending} onClick={() => { setStep('email'); setCode(''); setError(''); setNotice(''); }}>Change email</button></div>}
    <p className="local-note text-muted text-[length:12px] leading-[1.7] mt-4">Signing in does not upload drafts automatically. Open a browser draft and choose Save to account.</p>
    <div className="form-actions flex justify-end flex-wrap gap-[10px] mt-6"><button type="button" className="button inline-flex items-center justify-center min-h-10 gap-2 rounded-[7px] pt-[10px] pr-4 pb-[10px] pl-4 text-[length:12px] font-[550] whitespace-nowrap [transition:background-color_150ms,_color_150ms] [@media(width<=760px)]:min-h-11 [&:disabled]:opacity-[.75] secondary bg-surface text-ink [border:1px_solid_var(--border)] [&:hover]:bg-elevated" onClick={onCancel} disabled={pending}>Cancel</button><button type="submit" className="button inline-flex items-center justify-center min-h-10 gap-2 [border:0] rounded-[7px] pt-[10px] pr-4 pb-[10px] pl-4 text-[length:12px] font-[550] whitespace-nowrap [transition:background-color_150ms,_color_150ms] [@media(width<=760px)]:min-h-11 [&:disabled]:opacity-[.75] primary bg-accent-button text-white [&:hover:not(:disabled)]:bg-button-hover [&:disabled]:bg-elevated [&:disabled]:text-muted" disabled={pending || unavailable || status !== 'ready' || (step === 'email' && remaining > 0)}>{pending ? (step === 'email' ? 'Sending…' : 'Verifying…') : step === 'email' ? (remaining > 0 ? `Send again in ${remaining}s` : 'Send code') : 'Verify and continue'}</button></div>
  </form>;
}

export function SignInForm({ returnTo, onCancel, errorMessage = '' }: { returnTo: string; onCancel: () => void; errorMessage?: string }) {
  const { googleEnabled, otpEnabled, status } = useAuth();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(errorMessage);
  async function google() {
    setPending(true); setError('');
    try {
      const response = await fetch('/api/auth/google', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ returnTo: safeReturnPath(returnTo) }), cache: 'no-store', signal: AbortSignal.timeout(15_000) });
      const data = await response.json();
      if (!response.ok || typeof data.url !== 'string') throw new Error(data.error || 'Google sign-in could not be started. Try again.');
      window.location.assign(data.url);
    } catch (error) { setError(error instanceof Error && error.name !== 'TimeoutError' ? error.message : 'Could not connect to Google sign-in. Try again.'); setPending(false); }
  }
  if (otpEnabled && !googleEnabled) return <EmailCodeForm returnTo={returnTo} onCancel={onCancel} />;
  return <div className="auth-form [&_.name-field]:mt-6 [&_.local-note]:mt-5" aria-busy={pending}>
    <p className="auth-intro text-muted text-[length:14px] mt-4">Use your Google account to sign in or create an account. Your furniture drafts stay on this browser.</p>
    {status === 'ready' && !googleEnabled && <p className="auth-notice bg-accent-soft pt-4 pr-4 pb-4 pl-4 rounded-[7px] text-[length:13px] mt-5 text-accent-ink" role="status">Google sign-in is being set up. You can continue as a guest; your browser drafts are still available.</p>}
    {status === 'unavailable' && <p className="form-error text-danger-ink text-[length:13px] mt-[10px] wrap-anywhere" role="alert">Account status is unavailable. Close this dialog and retry from the account control.</p>}
    <div className="google-sign-in mt-6"><button type="button" className="google-button bg-transparent [border:0] pt-[2px] pr-0 pb-[2px] pl-0 min-h-11 inline-flex items-center cursor-pointer rounded-[4px] [&_img]:w-45 [&_img]:h-10 [&:disabled]:cursor-not-allowed [&:disabled]:opacity-[.65]" aria-label="Sign in with Google" disabled={pending || !googleEnabled || status !== 'ready'} onClick={() => void google()}><Image src="/brand/google-sign-in.svg" alt="" aria-hidden="true" width={180} height={40} unoptimized /></button></div>
    {pending && <p className="auth-feedback text-[length:13px] text-muted mt-3" role="status">Opening Google sign-in…</p>}
    {error && <p className="form-error text-danger-ink text-[length:13px] mt-[10px] wrap-anywhere" role="alert">{error}</p>}
    <p className="local-note text-muted text-[length:12px] leading-[1.7] mt-4">Signing in does not upload drafts automatically. Open a browser draft and choose Save to account.</p>
    <div className="form-actions flex justify-end flex-wrap gap-[10px] mt-6"><button type="button" className="button inline-flex items-center justify-center min-h-10 gap-2 rounded-[7px] pt-[10px] pr-4 pb-[10px] pl-4 text-[length:12px] font-[550] whitespace-nowrap [transition:background-color_150ms,_color_150ms] [@media(width<=760px)]:min-h-11 [&:disabled]:opacity-[.75] secondary bg-surface text-ink [border:1px_solid_var(--border)] [&:hover]:bg-elevated" onClick={onCancel} disabled={pending || status === 'loading'}>Cancel</button></div>
  </div>;
}

export function SignInDialog({ returnTo, onClose }: { returnTo: string; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => {
    const element = dialog.current;
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    element?.showModal();
    return () => { element?.close(); requestAnimationFrame(() => { if (trigger?.isConnected) trigger.focus(); }); };
  }, []);
  return <dialog ref={dialog} className="confirm-dialog pt-7 pr-7 pb-7 pl-7 bg-surface text-ink [border:1px_solid_var(--border)] rounded-[12px] mt-auto mr-auto mb-auto ml-auto max-h-[calc(100dvh_-_40px)] overflow-y-auto overscroll-contain [@media(width<=540px)]:pt-6 [@media(width<=540px)]:pr-6 [@media(width<=540px)]:pb-6 [@media(width<=540px)]:pl-6 [&::backdrop]:bg-[rgb(0_0_0_/_65%)] [&_h2]:text-[length:21px] [&_h2]:font-[550] [&_>_p]:mt-[14px] [&_>_p]:text-muted [&_>_p]:text-[length:14px] [&_>_p]:wrap-anywhere [&_.form-error]:text-danger-ink auth-dialog w-[min(480px,calc(100vw_-_40px))]" aria-labelledby={id} onCancel={event => { event.preventDefault(); if (!dialog.current?.querySelector('[aria-busy="true"]')) onClose(); }}><h2 id={id}>Sign in to your workspace</h2><SignInForm returnTo={returnTo} onCancel={onClose} /></dialog>;
}

export function SignInPage({ returnTo, errorMessage = '' }: { returnTo: string; errorMessage?: string }) {
  const router = useRouter();
  return <div className="page-content mt-0 mr-auto mb-0 pt-12 pr-12 pb-8 pl-12 w-full [@media(width<=760px)]:pt-[30px] [@media(760px<width<=1100px)]:pt-8 [@media(width>=1600px)]:pt-16 [@media(width<=420px)]:pr-5 [@media(420px<width<=760px)]:pr-6 [@media(760px<width<=1100px)]:pr-7 [@media(width<=760px)]:pb-[30px] [@media(width<=420px)]:pl-5 [@media(420px<width<=760px)]:pl-6 [@media(760px<width<=1100px)]:pl-7 account-page max-w-170 ml-0 [&_h2]:text-[length:17px] [&_h2]:font-[550] [&_.form-actions]:justify-start"><section className="page-heading flex items-center justify-between gap-6 mb-[34px] [@media(width<=760px)]:items-start [@media(width<=420px)]:gap-[18px] [@media(width<=760px)]:mb-[26px] [@media(width<=420px)]:flex-col [&_h1]:text-[length:27px] [&_h1]:leading-[1.25] [&_h1]:font-[580] [&_h1]:tracking-[-.035em] [@media(width<=760px)]:[&_h1]:text-[length:24px] [&_p]:text-muted [&_p]:mt-2 [&_p]:text-[length:13px] [@media(width<=760px)]:[&_p]:text-[length:12px] [@media(width<=760px)]:[&_p]:max-w-[30ch] [@media(width<=760px)]:[&_.button]:min-h-11 [@media(width<=760px)]:[&_.button]:pt-[10px] [@media(width<=760px)]:[&_.button]:pr-3 [@media(width<=760px)]:[&_.button]:pb-[10px] [@media(width<=760px)]:[&_.button]:pl-3"><div><h1>Sign in to your workspace</h1><p>Continue with your Google account.</p></div></section><SignInForm returnTo={returnTo} errorMessage={errorMessage} onCancel={() => router.push(safeReturnPath(returnTo) === '/account' ? '/projects' : safeReturnPath(returnTo))} /></div>;
}

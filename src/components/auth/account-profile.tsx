'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authRequest, useAuth } from './auth-provider';

export function AccountProfile({ email }: { email: string }) {
  const auth = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<'loading' | 'ready' | 'unavailable'>('loading');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const alive = useRef(true);
  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/profile', { cache: 'no-store' });
      const data = await response.json();
      if (!alive.current) return;
      if (!response.ok) throw new Error(data.error || 'Your profile is unavailable. Try again.');
      setName(data.profile.display_name); setPhone(data.profile.phone ?? ''); setStatus('ready');
    } catch (error) { if (alive.current) { setStatus('unavailable'); setError(error instanceof Error ? error.message : 'Your profile is unavailable. Try again.'); } }
  }, []);
  useEffect(() => { alive.current = true; queueMicrotask(() => { if (alive.current) void load(); }); return () => { alive.current = false; }; }, [load]);
  async function save() {
    setPending(true); setError(''); setNotice('');
    try {
      const response = await fetch('/api/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ display_name: name, phone }), cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Your profile could not be saved. Try again.');
      setName(data.profile.display_name); setPhone(data.profile.phone ?? ''); setNotice('Profile saved.');
    } catch (error) { setError(error instanceof Error ? error.message : 'Could not connect. Your changes are still in the form.'); }
    finally { setPending(false); }
  }
  async function signOut() {
    setPending(true); setError(''); setNotice('');
    const result = await authRequest('signout');
    setPending(false);
    if (!result.ok) { setError(result.error); return; }
    auth.changed(false); router.replace('/projects');
  }
  return <div className="page-content mt-0 mr-auto mb-0 pt-12 pr-12 pb-8 pl-12 w-full [@media(width<=760px)]:pt-[30px] [@media(760px<width<=1100px)]:pt-8 [@media(width>=1600px)]:pt-16 [@media(width<=420px)]:pr-5 [@media(420px<width<=760px)]:pr-6 [@media(760px<width<=1100px)]:pr-7 [@media(width<=760px)]:pb-[30px] [@media(width<=420px)]:pl-5 [@media(420px<width<=760px)]:pl-6 [@media(760px<width<=1100px)]:pl-7 account-page max-w-170 ml-0 [&_h2]:text-[length:17px] [&_h2]:font-[550] [&_.form-actions]:justify-start"><section className="page-heading flex items-center justify-between gap-6 mb-[34px] [@media(width<=760px)]:items-start [@media(width<=420px)]:gap-[18px] [@media(width<=760px)]:mb-[26px] [@media(width<=420px)]:flex-col [&_h1]:text-[length:27px] [&_h1]:leading-[1.25] [&_h1]:font-[580] [&_h1]:tracking-[-.035em] [@media(width<=760px)]:[&_h1]:text-[length:24px] [&_p]:text-muted [&_p]:mt-2 [&_p]:text-[length:13px] [@media(width<=760px)]:[&_p]:text-[length:12px] [@media(width<=760px)]:[&_p]:max-w-[30ch] [@media(width<=760px)]:[&_.button]:min-h-11 [@media(width<=760px)]:[&_.button]:pt-[10px] [@media(width<=760px)]:[&_.button]:pr-3 [@media(width<=760px)]:[&_.button]:pb-[10px] [@media(width<=760px)]:[&_.button]:pl-3"><div><h1>Your account</h1><p>Manage your contact details.</p></div></section><div className="account-identity [border-bottom:1px_solid_var(--border)] pb-6 mb-6 [&_p]:mt-[10px] [&_p]:mr-0 [&_p]:mb-[10px] [&_p]:ml-0 [&_p]:wrap-anywhere"><h2>Email address</h2><p>{email}</p><span className="field-hint text-[length:12px] text-muted mt-2">Managed by your sign-in provider. Contact details below do not change your login.</span></div>
    {status === 'loading' && <p role="status" className="local-note text-muted text-[length:12px] leading-[1.7] mt-4">Loading your profile…</p>}
    {status === 'unavailable' && <button className="button inline-flex items-center justify-center min-h-10 gap-2 rounded-[7px] pt-[10px] pr-4 pb-[10px] pl-4 text-[length:12px] font-[550] whitespace-nowrap [transition:background-color_150ms,_color_150ms] [@media(width<=760px)]:min-h-11 [&:disabled]:opacity-[.75] secondary bg-surface text-ink [border:1px_solid_var(--border)] [&:hover]:bg-elevated" onClick={() => { setStatus('loading'); setError(''); void load(); }}>Retry profile</button>}
    {status === 'ready' && <form onSubmit={event => { event.preventDefault(); if (!pending) void save(); }} aria-busy={pending}><div className="name-field [&_label]:block [&_label]:text-[length:14px] [&_label]:font-[550] [&_label]:mb-3 [&_input]:w-full [&_input]:min-h-[46px] [&_input]:[border:1px_solid_var(--border)] [&_input]:rounded-[7px] [&_input]:pt-[10px] [&_input]:pr-3 [&_input]:pb-[10px] [&_input]:pl-3 [&_input]:bg-base [&_input]:text-ink [&_input]:caret-accent-ink [&_input]:text-[length:14px] [@media(width<=760px)]:[&_input]:text-[length:16px] mt-8 mr-0 mb-[14px] ml-0 max-w-135"><label htmlFor="display-name">Display name</label><input id="display-name" autoComplete="name" maxLength={80} value={name} onChange={event => setName(event.target.value)} disabled={pending} /></div><div className="name-field [&_label]:block [&_label]:text-[length:14px] [&_label]:font-[550] [&_label]:mb-3 [&_input]:w-full [&_input]:min-h-[46px] [&_input]:[border:1px_solid_var(--border)] [&_input]:rounded-[7px] [&_input]:pt-[10px] [&_input]:pr-3 [&_input]:pb-[10px] [&_input]:pl-3 [&_input]:bg-base [&_input]:text-ink [&_input]:caret-accent-ink [&_input]:text-[length:14px] [@media(width<=760px)]:[&_input]:text-[length:16px] mt-8 mr-0 mb-[14px] ml-0 max-w-135"><label htmlFor="profile-phone">Phone number (optional)</label><input id="profile-phone" type="tel" autoComplete="tel" maxLength={25} value={phone} onChange={event => setPhone(event.target.value)} disabled={pending} /><p className="field-hint text-[length:12px] text-muted mt-2">A contact number, not a verified sign-in method.</p></div><div className="form-actions flex justify-end flex-wrap gap-[10px] mt-6"><button className="button inline-flex items-center justify-center min-h-10 gap-2 [border:0] rounded-[7px] pt-[10px] pr-4 pb-[10px] pl-4 text-[length:12px] font-[550] whitespace-nowrap [transition:background-color_150ms,_color_150ms] [@media(width<=760px)]:min-h-11 [&:disabled]:opacity-[.75] primary bg-accent-button text-white [&:hover:not(:disabled)]:bg-button-hover [&:disabled]:bg-elevated [&:disabled]:text-muted" type="submit" disabled={pending}>{pending ? 'Working…' : 'Save profile'}</button></div></form>}
    {error && <p className="form-error text-danger-ink text-[length:13px] mt-[10px] wrap-anywhere" role="alert">{error}</p>}{notice && <p className="auth-feedback text-[length:13px] text-muted mt-3" role="status">{notice}</p>}
    <section className="account-session mt-9 [border-top:1px_solid_var(--border)] pt-6 [&_>_p]:mt-3 [&_>_p]:mr-0 [&_>_p]:mb-5 [&_>_p]:ml-0"><h2>This browser session</h2><p className="local-note text-muted text-[length:12px] leading-[1.7] mt-4">Signing out leaves your local furniture drafts on this browser. On a shared computer, delete them separately when you are finished. Only projects you explicitly save to your account are available across browsers.</p><button className="button inline-flex items-center justify-center min-h-10 gap-2 rounded-[7px] pt-[10px] pr-4 pb-[10px] pl-4 text-[length:12px] font-[550] whitespace-nowrap [transition:background-color_150ms,_color_150ms] [@media(width<=760px)]:min-h-11 [&:disabled]:opacity-[.75] secondary bg-surface text-ink [border:1px_solid_var(--border)] [&:hover]:bg-elevated" onClick={() => void signOut()} disabled={pending}>Sign out of this browser</button></section>
  </div>;
}

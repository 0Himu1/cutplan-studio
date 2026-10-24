'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { SignInDialog } from './sign-in-form';
import { safeReturnPath } from '@/lib/auth/validation';

type Identity = { id: string; email: string };
type AccountState = { status: 'loading' | 'ready' | 'unavailable'; user: Identity | null; otpEnabled: boolean; googleEnabled: boolean };
type AuthContext = AccountState & { refresh: () => Promise<void>; signIn: (returnTo?: string) => void; changed: (refreshRoute?: boolean) => void };
const Context = createContext<AuthContext | null>(null);

export async function authRequest(action: string, body: Record<string, string> = {}) {
  try {
    const response = await fetch(`/api/auth/${action}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), cache: 'no-store', signal: AbortSignal.timeout(15_000) });
    const result = await response.json();
    return response.ok ? { ok: true as const } : { ok: false as const, error: typeof result.error === 'string' ? result.error : 'This request could not be completed. Try again.' };
  } catch { return { ok: false as const, error: 'Could not connect. Check your connection and try again.' }; }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AccountState>({ status: 'loading', user: null, otpEnabled: false, googleEnabled: false });
  const [destination, setDestination] = useState<string | null>(null);
  const channel = useRef<BroadcastChannel | null>(null);
  const revision = useRef(0);
  const pathname = usePathname();
  const router = useRouter();
  const cancelPending = useCallback(() => { revision.current++; }, []);
  const refresh = useCallback(async () => {
    const requestVersion = ++revision.current;
    try {
      const response = await fetch('/api/auth/session', { cache: 'no-store' });
      if (!response.ok) throw new Error('Unavailable');
      const data = await response.json();
      if (requestVersion === revision.current) setState({ status: 'ready', user: data.user, otpEnabled: data.otpEnabled === true, googleEnabled: data.googleEnabled === true });
    } catch { if (requestVersion === revision.current) setState(previous => ({ ...previous, status: 'unavailable', user: null })); }
  }, []);
  useEffect(() => {
    const onFocus = () => { if (document.visibilityState === 'visible') { void refresh(); if (window.location.pathname === '/account') router.refresh(); } };
    if ('BroadcastChannel' in window) {
      channel.current = new BroadcastChannel('cutplan.auth');
      channel.current.onmessage = () => { void refresh(); if (window.location.pathname === '/account') router.refresh(); };
    }
    queueMicrotask(() => { void refresh(); });
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    const interval = window.setInterval(() => { if (document.visibilityState === 'visible') void refresh(); }, 60_000);
    const currentChannel = channel.current;
    return () => { cancelPending(); currentChannel?.close(); window.removeEventListener('focus', onFocus); document.removeEventListener('visibilitychange', onFocus); window.clearInterval(interval); };
  }, [refresh, router, cancelPending]);
  function changed(refreshRoute = true) { channel.current?.postMessage('changed'); void refresh(); if (refreshRoute) router.refresh(); }
  function signIn(returnTo?: string) { setDestination(safeReturnPath(returnTo ?? pathname)); }
  return <Context.Provider value={{ ...state, refresh, signIn, changed }}>{children}{destination !== null && <SignInDialog returnTo={destination} onClose={() => setDestination(null)} />}</Context.Provider>;
}

export function useAuth() {
  const value = useContext(Context);
  if (!value) throw new Error('AuthProvider is required.');
  return value;
}

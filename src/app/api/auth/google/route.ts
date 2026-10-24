import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseConfig } from '@/lib/supabase/config';
import { privateJson, readBody, sameOrigin } from '@/lib/auth/http';
import { safeReturnPath } from '@/lib/auth/validation';
import { OAUTH_RETURN_COOKIE } from '@/lib/auth/oauth';

export async function POST(request: Request) {
  if (!sameOrigin(request)) return privateJson({ error: 'This request must come from the studio.' }, 403);
  if (process.env.AUTH_GOOGLE_ENABLED !== 'true') return privateJson({ error: 'Google sign-in is being set up. Continue as a guest; your browser drafts are still available.' }, 503);
  const input = await readBody(request);
  if (!input || typeof input.returnTo !== 'string') return privateJson({ error: 'Choose where to continue and try signing in again.' }, 400);
  try {
    const origin = process.env.APP_ORIGIN;
    if (!origin) return privateJson({ error: 'Sign-in configuration is unavailable. Continue as a guest.' }, 503);
    const client = await createClient();
    const { data, error } = await client.auth.signInWithOAuth({ provider: 'google', options: {
      redirectTo: new URL('/auth/callback', origin).href,
      scopes: 'openid email profile', skipBrowserRedirect: true
    } });
    const providerUrl = data.url ? new URL(data.url) : null;
    if (error || !providerUrl || providerUrl.origin !== new URL(getSupabaseConfig().url).origin || providerUrl.pathname !== '/auth/v1/authorize') return privateJson({ error: 'Google sign-in could not be started. Try again.' }, 503);
    const jar = await cookies();
    jar.set(OAUTH_RETURN_COOKIE, safeReturnPath(input.returnTo), { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' && process.env.AUTH_COOKIE_SECURE !== 'false', path: '/', maxAge: 600 });
    return privateJson({ url: providerUrl.href });
  } catch { return privateJson({ error: 'Google sign-in could not be started. Try again.' }, 503); }
}

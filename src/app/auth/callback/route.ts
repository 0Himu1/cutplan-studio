import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { safeReturnPath } from '@/lib/auth/validation';
import { OAUTH_RETURN_COOKIE } from '@/lib/auth/oauth';

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams;
  const origin = process.env.APP_ORIGIN;
  if (!origin) return new Response('Sign-in configuration is unavailable.', { status: 503, headers: { 'Cache-Control': 'private, no-store' } });
  const jar = await cookies();
  const pendingReturn = jar.get(OAUTH_RETURN_COOKIE)?.value;
  const returnTo = safeReturnPath(pendingReturn);
  jar.delete(OAUTH_RETURN_COOKIE);
  function redirect(path: string) {
    const response = NextResponse.redirect(new URL(path, origin), 303);
    response.headers.set('Cache-Control', 'private, no-store');
    response.headers.set('Referrer-Policy', 'no-referrer');
    response.headers.set('Vary', 'Cookie');
    return response;
  }
  const failure = new URLSearchParams({ authError: query.get('error') === 'access_denied' ? 'canceled' : 'failed', returnTo });
  const failedPath = `/login?${failure}`;
  const code = query.get('code');
  if (process.env.AUTH_GOOGLE_ENABLED !== 'true' || !pendingReturn || query.has('error') || !code || code.length > 2048) return redirect(failedPath);
  try {
    const client = await createClient();
    // The SDK requires the browser's HttpOnly PKCE verifier; a URL code alone cannot sign a user in.
    const { data, error } = await client.auth.exchangeCodeForSession(code);
    if (error || !data.user || !data.session) return redirect(failedPath);
    return redirect(returnTo);
  } catch { return redirect(failedPath); }
}

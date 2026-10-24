import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseConfig } from './config';

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  // Guests have no session to refresh. Do not make an auth network call for every public page.
  const hasSession = request.cookies.getAll().some(({ name }) => /^sb-.+-auth-token(?:\.\d+)?$/.test(name));
  if (!hasSession) return response;

  const { url, publishableKey } = getSupabaseConfig();
  const client = createServerClient(url, publishableKey, {
    cookieOptions: { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' && process.env.AUTH_COOKIE_SECURE !== 'false' },
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      }
    }
  });
  // Refresh cookies here. Every protected page/API independently verifies the current user.
  try { await client.auth.getClaims(); } catch {
    // An Auth outage must not prevent public guest work. Protected resources fail closed separately.
  }
  response.headers.set('Cache-Control', 'private, no-store');
  response.headers.append('Vary', 'Cookie');
  return response;
}

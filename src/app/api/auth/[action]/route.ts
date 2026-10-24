import { createClient } from '@/lib/supabase/server';
import { authErrorMessage, validCode, validEmail } from '@/lib/auth/validation';
import { privateJson, readBody, sameOrigin } from '@/lib/auth/http';

export async function POST(request: Request, { params }: { params: Promise<{ action: string }> }) {
  if (!sameOrigin(request)) return privateJson({ error: 'This request must come from the studio.' }, 403);
  const { action } = await params;
  if (!['request', 'verify', 'signout'].includes(action)) return privateJson({ error: 'Unknown action.' }, 404);
  try {
    const client = await createClient();
    if (action === 'signout') {
      const { error } = await client.auth.signOut({ scope: 'local' });
      return error ? privateJson({ error: 'Sign-out could not be completed. Try again.' }, 503) : privateJson({ ok: true });
    }
    const input = await readBody(request);
    const email = typeof input?.email === 'string' ? input.email.trim() : '';
    if (!validEmail(email)) return privateJson({ error: 'Enter a valid email address.' }, 400);
    if (process.env.AUTH_EMAIL_OTP_ENABLED !== 'true') return privateJson({ error: 'Email code sign-in is not enabled yet. Continue as a guest; your browser drafts are still available.' }, 503);
    if (action === 'request') {
      const { error } = await client.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
      return error ? privateJson({ error: authErrorMessage(error.code, error.status) }, error.status === 429 ? 429 : 400) : privateJson({ ok: true });
    }
    if (!validCode(input?.code)) return privateJson({ error: 'Enter the six-digit code from your email.' }, 400);
    const { data, error } = await client.auth.verifyOtp({ email, token: input.code, type: 'email' });
    if (error || !data.user || !data.session) return privateJson({ error: authErrorMessage(error?.code, error?.status) }, error?.status === 429 ? 429 : 400);
    return privateJson({ ok: true });
  } catch { return privateJson({ error: 'Sign-in is temporarily unavailable. Try again.' }, 503); }
}

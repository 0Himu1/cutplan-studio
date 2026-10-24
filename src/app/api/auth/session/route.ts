import { createClient } from '@/lib/supabase/server';
import { privateJson } from '@/lib/auth/http';

export async function GET() {
  try {
    const client = await createClient();
    const { data, error } = await client.auth.getUser();
    if (error && error.name !== 'AuthSessionMissingError' && error.status !== 401 && error.status !== 403) return privateJson({ error: 'Account status is unavailable. Try again.' }, 503);
    return privateJson({ user: data.user ? { id: data.user.id, email: data.user.email ?? '' } : null, otpEnabled: process.env.AUTH_EMAIL_OTP_ENABLED === 'true', googleEnabled: process.env.AUTH_GOOGLE_ENABLED === 'true' });
  } catch { return privateJson({ error: 'Account status is unavailable. Try again.' }, 503); }
}

import { createClient } from '@/lib/supabase/server';
import { privateJson, readBody, sameOrigin } from '@/lib/auth/http';
import { profileInput } from '@/lib/auth/validation';

export async function GET() {
  try {
    const client = await createClient();
    const { data: { user }, error: authError } = await client.auth.getUser();
    if (authError || !user) return privateJson({ error: 'Sign in to view your profile.' }, 401);
    const { data, error } = await client.from('profiles').select('display_name,phone').eq('id', user.id).maybeSingle();
    if (error || !data) return privateJson({ error: 'Your profile is unavailable. Try again or contact the studio owner.' }, 503);
    return privateJson({ profile: data });
  } catch { return privateJson({ error: 'Your profile is unavailable. Try again.' }, 503); }
}

export async function PATCH(request: Request) {
  if (!sameOrigin(request)) return privateJson({ error: 'This request must come from the studio.' }, 403);
  try {
    const client = await createClient();
    const { data: { user }, error: authError } = await client.auth.getUser();
    if (authError || !user) return privateJson({ error: 'Your session has ended. Sign in again; your local drafts are still here.' }, 401);
    const input = profileInput(await readBody(request));
    if (!input) return privateJson({ error: 'Use a name of up to 80 characters and a valid phone number, or leave them blank.' }, 400);
    const { data, error } = await client.from('profiles').update(input).eq('id', user.id).select('display_name,phone').maybeSingle();
    return error || !data ? privateJson({ error: 'Your profile could not be saved. Your changes are still in the form.' }, 503) : privateJson({ profile: data });
  } catch { return privateJson({ error: 'Your profile could not be saved. Try again.' }, 503); }
}

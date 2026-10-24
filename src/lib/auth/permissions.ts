import 'server-only';
import { createClient } from '@/lib/supabase/server';

// Membership is database-controlled. Never authorize staff from user_metadata or a profile field.
export async function staffPermission(capability: 'catalog' | 'fulfillment') {
  const client = await createClient();
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError || !user) return false;
  const { data, error } = await client.from('staff_memberships').select('role,is_active').eq('user_id', user.id).maybeSingle();
  return !error && data?.is_active === true && (data.role === 'admin' || (capability === 'fulfillment' && data.role === 'operator'));
}

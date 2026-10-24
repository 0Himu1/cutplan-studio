import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AccountProfile } from '@/components/auth/account-profile';
import Link from 'next/link';
import { staffPermission } from '@/lib/auth/permissions';

export const metadata: Metadata = { title: 'Your account' };
export const dynamic = 'force-dynamic';
export default async function AccountPage() {
  const client = await createClient();
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) redirect('/login?returnTo=%2Faccount');
  return <>{await staffPermission('catalog')&&<div className="px-6 pt-6 lg:px-12"><Link href="/admin/catalog" className="inline-flex min-h-11 items-center text-sm text-accent-ink underline underline-offset-4">Manage material catalog</Link></div>}{await staffPermission('fulfillment')&&<div className="px-6 pt-3 lg:px-12"><Link href="/admin/operations" className="inline-flex min-h-11 items-center text-sm text-accent-ink underline underline-offset-4">Manage order operations</Link></div>}<AccountProfile email={user.email ?? ''} /></>;
}

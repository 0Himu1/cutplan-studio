import type { Metadata } from 'next';
import { SignInPage } from '@/components/auth/sign-in-form';
import { safeReturnPath } from '@/lib/auth/validation';
import { oauthFailureMessage } from '@/lib/auth/oauth';

export const metadata: Metadata = { title: 'Sign in' };
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ returnTo?: string; authError?: string }> }) {
  const params = await searchParams;
  return <SignInPage returnTo={safeReturnPath(params.returnTo)} errorMessage={oauthFailureMessage(params.authError)} />;
}

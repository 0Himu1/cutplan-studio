export const OAUTH_RETURN_COOKIE = 'cutplan.oauth.return';

export function oauthFailureMessage(value: unknown) {
  if (value === 'canceled') return 'Google sign-in was canceled. Your browser drafts are still here.';
  if (value === 'failed') return 'Google sign-in could not be completed. Try again in this browser, or continue as a guest.';
  return '';
}

# Google sign-in activation

This replaces email OTP as the active Phase 3 sign-in method at the owner's request. SMTP is not needed. Guest drafts remain available, and account project saving is still Phase 4.

## Prepared

- Google Cloud project: **CutPlan Studio**, project ID **cutplan-studio**, under the owner's signed-in Google account.
- Google Auth Platform app form: app name CutPlan Studio; support/developer contact `0himu1@gmail.com`; External audience in Testing mode. The owner completed policy review and OAuth app registration. The Web application client form is prepared; credentials and provider activation remain pending.
- App code: official Google sign-in button, same-origin start endpoint, PKCE code exchange, allowlisted draft return cookie, recoverable callback errors and unchanged guest storage.

## Owner steps

1. Completed: owner reviewed the policy and created the [Google Auth Platform app](https://console.cloud.google.com/auth/overview?project=cutplan-studio).
2. In Audience, add `0himu1@gmail.com` as a test user. Keep Testing mode until the public launch is deliberately configured.
3. In Clients, create an OAuth client of type **Web application**, named **CutPlan Studio web**. Configure these addresses:

| Setting | Value |
| --- | --- |
| Authorized JavaScript origin (local app) | `http://127.0.0.1:3100` |
| Authorized redirect URI in Google | `https://nhglxxgqalwxvlhgxgwc.supabase.co/auth/v1/callback` |
| Application callback allowed by Supabase | `http://127.0.0.1:3100/auth/callback` |

The Google redirect points to Supabase, not our Next.js callback. Supabase then redirects to our application. The application callback is constant; the pending draft destination is kept in an HttpOnly cookie rather than appended as an arbitrary redirect query.

4. Copy the client ID and client secret directly into **Supabase → Authentication → Sign In / Providers → Google**, then enable/save that provider. Keep the secret out of chat, source files, public environment variables and screenshots. Only basic identity scopes are requested: `openid email profile`.
5. In **Supabase → Authentication → URL Configuration**, set the local Site URL to `http://127.0.0.1:3100` and add the exact application callback above to Redirect URLs. Keep other intentionally configured URLs; no broad wildcard is necessary for this flow.
6. Review and apply `supabase/migrations/202610210001_profiles_and_memberships.sql` through a privileged process after checking for existing table/function collisions. It creates restricted profiles and memberships but grants no staff roles.
7. Set `AUTH_GOOGLE_ENABLED=true` in `.env.local`, leave `AUTH_EMAIL_OTP_ENABLED=false`, confirm `APP_ORIGIN=http://127.0.0.1:3100`, then restart the app. Production uses HTTPS and Secure cookies. `AUTH_COOKIE_SECURE=false` is permitted only for an HTTP loopback preview if the browser requires it.
8. From an existing disposable browser draft, choose Sign in with Google. Verify consent, return to the same draft, account/profile editing, reload and sign-out. Repeat with a second real test identity to verify hosted profile isolation. Canceling consent and failed exchanges must preserve local work.

For deployment, configure the real HTTPS application origin and callback in the corresponding Google/Supabase settings and `APP_ORIGIN`. Public consent branding, privacy/terms URLs and any verification required by Google are a separate launch checkpoint; do not invent published policy pages.

## Code and test boundary

Until the provider is configured, `AUTH_GOOGLE_ENABLED` defaults to false and both UI and server report setup is pending. Callback code does not accept an authorization code without the initiating browser's return cookie and SDK-managed PKCE verifier. It ignores arbitrary `next` URLs and untrusted forwarded hosts.

The local contract tests simulate only the provider's authorization/token endpoints and never contact Google. A passing contract is not a real Google login or hosted schema-policy acceptance.

References: [Supabase Google configuration](https://supabase.com/docs/guides/auth/social-login/auth-google), [Google button branding](https://developers.google.com/identity/branding-guidelines). The official button SVG and provenance are in `public/brand`.

## Current activation checkpoint

The owner created the OAuth client and saved its credentials directly in Supabase. Google is confirmed enabled by the dashboard and public Auth settings. The exact local Site URL and callback above were approved, saved and verified after reload. The rebuilt/restarted local app reports Google enabled and OTP disabled. Hosted profile tables are still absent, verified by read-only SQL; no migration was executed. Browser control disconnected while staging SQL, so editor contents require inspection after reconnection. Live login and account acceptance remain unverified.

## Live checkpoint — 2026-10-22

Supersedes earlier setup-pending records: the exact reviewed migration was applied with owner approval; hosted RLS/policy counts and anonymous denial were verified. Owner-approved basic Google consent completed successfully. The live account profile loaded, its display name saved and persisted after reload; sign-out was tested. No second real identity isolation check or Phase 4 work is claimed. See docs/delivery/phase-03-google-report.md for detailed evidence.

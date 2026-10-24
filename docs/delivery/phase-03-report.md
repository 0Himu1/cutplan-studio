# Phase 3: authentication foundation and deferred activation

Subsequent owner decision: Google sign-in replaces the active email OTP flow. See [the Google follow-up report](phase-03-google-report.md) and [activation steps](../integrations/google-sign-in-setup.md). The original OTP checkpoint below remains historical evidence; it is not the current customer sign-in interface.

Status: application implementation and final visual review complete (reviewer disposition: ship, no material fixes). The owner explicitly deferred the OTP setup step. Live authentication acceptance and applying the Supabase migration remain deferred, not passed. Phase 4 has not started.

## Scope delivered

- Header account control, native email/code sign-in dialog and protected account page. Inputs support paste/autofill, masked email, resend cooldown, Change email, pending/error states, Cancel/Escape and focus return.
- Server endpoints request/verify codes and sign out of this browser. Supabase tokens stay in HttpOnly, SameSite=Lax cookies. Production defaults to Secure cookies. Authentication responses use private/no-store caching and same-origin mutation checks against `APP_ORIGIN`.
- The proxy refreshes existing session cookies. Every protected page/API independently calls Supabase `getUser()`; browser account state never grants access. Account status refreshes on focus, visibility, interval and cross-tab notifications.
- Profile reads and updates derive the owner ID from the verified user. Only display name and optional contact phone are accepted; IDs, roles and extra fields are rejected. Profile failures preserve typed input. Staff capability checks use database membership, never user-editable metadata.
- A PostgreSQL migration creates profiles, restricted staff memberships, own-row policies, column grants, profile creation and update timestamps. It seeds no staff privileges. The exact migration is tested locally but **has not been applied to the hosted project**.
- The guest draft store remains independent of identity. Canceling sign-in, failed codes, signing in and signing out preserve the browser draft. Authentication does not claim/upload the draft; cloud claim/save is Phase 4.

## Owner-directed deferral

The Supabase dashboard showed email sign-in enabled, custom SMTP disabled and a default sign-in-link template. Editing the template required SMTP or a plan change. No provider credentials were configured. The owner then said “skip this otp step.” The unsaved SMTP form was canceled; no email, SMTP setting, provider account, plan or cloud data was changed.

`AUTH_EMAIL_OTP_ENABLED` therefore defaults to false. The actual preview explains that email codes are unavailable, disables sending and lets the visitor continue as a guest. Calling the request endpoint also rejects activation; this is not a client-only disabled button. There is no passwordless development bypass or demo identity in the real app.

## Verification evidence

| Check | Result | Actual scope |
| --- | --- | --- |
| Normal preview browser suite | Pass: 23 tests | Prior foundation/draft coverage plus guest account boundary, private cache headers, cross-origin rejection, malformed/oversized bodies, deferred OTP, canceled sign-in preservation, outage retry and responsive captures |
| Isolated authentication contract browser suite | Pass: 7 tests | Actual Next routes and Supabase SDK against a loopback test provider: code verification/errors, delivery/quota errors, cookie secrecy, session refresh, sign-out, owner filter, profile recovery and two identities |
| Unit and SQL suite | Pass: 10 tests | Draft/auth validation plus actual PostgreSQL execution through dev-only PGlite; existing/new identity profile creation, owner row isolation, column restrictions, no customer membership mutation/deletion, anonymous denial and contact constraints |
| TypeScript, ESLint, production build | Pass | New account/login/API routes compile; lint has no warnings |
| Runtime dependency audit | Pass | `npm audit --omit=dev` reports zero vulnerabilities |
| Hosted SMTP/code delivery | Deferred by owner | No real request or inbox verification performed |
| Hosted profile migration/RLS | Not applied | Local PostgreSQL evidence is not a claim about hosted policies |

Contract tests bind a separate Next dev server to 127.0.0.1:3101 and a synthetic provider to 127.0.0.1:3121. The regular preview remains at 127.0.0.1:3100 with the real project configuration and OTP disabled. Test identities use `example.test`; the production app has no test-provider route or special test email handling. Test-provider owner filtering is an API contract check; the independent PGlite check executes the migration and RLS itself.

The first contract run caught the distinction between the browser origin and Next's internal localhost URL. The app now uses an explicit external origin. A subsequent run caught competing redirects after sign-out; sign-out now updates account context and navigates once. The test provider also needed the actual Supabase API-version response header to represent structured error codes correctly. All seven contract scenarios passed after these fixes.

Eleven valid captures under ignored `.impeccable/review/phase-03` cover email/code/error/account at desktop and phone widths, plus the actual deferred state in dark desktop/mobile and light desktop. The eight activated-flow captures use the isolated test provider, not a live customer login. The detector returned 15 advisory metadata mismatches, largely pre-existing font/radius extraction omissions; it was run once and does not constitute an accessibility or security verdict.

The full npm audit retains five high-severity entries in the ESLint development dependency chain (`braces` through `micromatch`, `fast-glob` and Next's ESLint plugin). They are outside the runtime dependency tree; the suggested forced downgrade is not applied. Track an upstream compatible fix rather than replacing the framework toolchain during this phase.

## Owner review now

1. Open http://127.0.0.1:3100/projects and open/create a local draft.
2. Choose Sign in and continue. Confirm the email-unavailable notice; Cancel or press Escape.
3. Confirm the same draft remains, reload and reopen it.
4. Visit `/account` as a guest and confirm it routes to Sign in rather than exposing an account.
5. Check the dialog on a phone-width window and in both themes.

## Activation checkpoint, when requested

1. Configure SMTP in Supabase and a six-digit `{{ .Token }}` email template. Confirm the current OTP length/expiry and send limits. Do not disable email verification to make a test pass.
2. Apply `supabase/migrations/202610210001_profiles_and_memberships.sql` through a deliberate privileged process. Review existing schema first; the migration intentionally fails on collisions instead of altering unknown tables.
3. Set `APP_ORIGIN` to the deployed external origin and `AUTH_EMAIL_OTP_ENABLED=true`. Keep Secure cookies for HTTPS; `AUTH_COOKIE_SECURE=false` is only for an HTTP loopback preview. Restart the server after environment changes.
4. Use real test accounts to verify receipt, correct/wrong/expired codes, refresh/logout, profile ownership and direct API restrictions on the hosted project. A live request is not proof of delivery.
5. Complete the deferred Phase 3 acceptance before claiming production authentication or cross-device cloud saving.

Implementation references: [Supabase email OTP](https://supabase.com/docs/guides/auth/auth-email-passwordless), [server-side clients and session verification](https://supabase.com/docs/guides/auth/server-side/creating-a-client). The implementation uses the installed Next.js authentication, cookies and route-handler guides.

Owner review of this checkpoint: pending. Phase 2 was accepted by the owner before this phase began.

The independent visual reviewer inspected all eleven captures. The documentation helper was unavailable because of an account usage limit, so the scoped implementation record was finalized locally using the Impeccable fallback workflow. The incumbent DESIGN.md and sidecar were preserved; this ordinary extension introduces no approved global design-system change.

## Live activation update — 2026-10-22

The owner approved and applied the reviewed profile migration. Both hosted tables have RLS; anonymous requests are denied. Real Google sign-in, profile saving, reload persistence, sign-out and signed-out account-route protection passed. The initial OTP/setup-pending sections above remain historical. Current evidence and remaining owner/second-identity acceptance are in [the Google follow-up report](phase-03-google-report.md). Phase 4 has not started.

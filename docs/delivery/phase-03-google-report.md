# Phase 3 follow-up: Google sign-in

Status: application implementation and visual review complete. Google provider and exact local redirects are active; hosted migration and single-account live verification passed; owner acceptance and a second real identity check remain pending. This is Phase 3 work; Phase 4 has not started.

## Decision and implementation

The owner chose Google sign-in instead of activating email OTP, and requested a dedicated new Google Cloud project. Email OTP is retained behind its disabled flag and no longer appears in the ordinary sign-in interface.

- The Google Cloud project **CutPlan Studio** (`cutplan-studio`) was created in the owner's account. The owner completed the User Data Policy agreement and OAuth app registration with External/Testing audience and the owner's support/contact address. The owner created the Web OAuth client, transferred its credentials directly to Supabase and enabled Google. The provider list and public Auth settings both confirm Google is enabled. No plan/billing changed. The owner subsequently approved and applied the reviewed Phase 3 profile migration.
- The studio uses Google's unmodified official SVG sign-in button. The local asset's source is recorded in `public/brand/README.md`. No Google script or remote image request is needed to display it.
- A same-origin POST starts Supabase's Google PKCE flow. The callback URL comes from configured `APP_ORIGIN`, not untrusted forwarded headers. The generated provider URL must match the configured Supabase Auth origin/path.
- A ten-minute HttpOnly, SameSite=Lax cookie retains only an allowlisted destination. The callback exchanges the code with the SDK-managed browser PKCE verifier, deletes the return cookie, and redirects privately to the original draft. A code alone or arbitrary `next` URL cannot establish an account or redirect off-site.
- Canceled consent and failed exchanges return a controlled error with retry/guest continuation. Raw provider descriptions are never rendered. A callback does not claim that the draft was uploaded.
- Profile, refresh, sign-out, guest recovery and role restrictions retain the Phase 3 session contract. Account copy now names the sign-in provider rather than implying an email-code login.
- Guest window-focus and cross-tab updates refresh account status without unnecessarily refreshing public forms; protected Account pages still refresh their server view.

## Verification

| Check | Result | Scope |
| --- | --- | --- |
| Google OAuth browser contracts | 5 passed | Production Next/SDK PKCE round trip, original draft return, private session cookies, sign-out preservation, canceled consent, missing verifier/initiation, untrusted redirect rejection, same-origin/input checks and responsive states |
| Normal preview browsers | 23 passed | Prior foundation/draft checks plus updated Google setup-pending dialog, hidden inactive email fields, protected boundaries and guest preservation |
| Retained OTP regression contracts | 7 passed | Kept optional email implementation still passes in the isolated test mode; real email remains disabled |
| Unit/PostgreSQL checks | 10 passed | Existing validation, migration execution, own-profile RLS, column restrictions and no customer self-promotion |
| Type/lint/production build | Passed | Normal app and separate contract build compile; no lint warnings |
| Independent visual review | Ship, no material fixes | All ten desktop/mobile/theme captures inspected; no clipping or mismatch with inherited system |
| Live Google sign-in | Passed with owner-approved identity consent | Real Google login, hosted profile loading, name update, reload persistence and sign-out verified with the selected owner account |
| Hosted profile migration | Applied with explicit owner approval | Exact local SQL verified in editor; success confirmed; both tables have RLS with 2 profile and 1 membership policies; zero staff memberships |

The first development-server contract attempts encountered repeated reloads and compilation delays. The harness now builds into a fixed isolated `.next-auth-contract` directory and runs a production server on loopback 3101 against a synthetic provider on 3121. Generated contract output is also excluded from ESLint, after the final check exposed generated-code findings. This removes development reload interference and leaves the ordinary 3100 preview separate. There is no test-provider route, special test email or authentication bypass in the application itself. Run the two contract suites separately because they share those test ports and output directory.

A cancellation control could be clicked before client readiness; it now waits until account status resolves. Visual checks likewise wait for account readiness before changing themes. No production email was sent, no real Google account was used for automated authentication, and no customer data was seeded into the owner's browser.

Ten valid captures in ignored `.impeccable/review/phase-03-google` cover the active dialog, cancellation recovery and account at desktop/phone widths, light recovery, and the real preview's setup-pending state in desktop/phone/light. The active-flow captures use a synthetic `google-contract@example.test` identity. The detector ran once and returned 16 advisory font/radius metadata findings, mostly pre-existing; no zero-findings or hosted-security verdict is claimed.

## Activation and owner checkpoint

The exact addresses, provider settings, schema prerequisite and live acceptance steps are in [Google sign-in setup](../integrations/google-sign-in-setup.md). The owner completed Google policy review and credential setup. With action-time owner approval, Site URL `http://127.0.0.1:3100` and the single exact redirect `http://127.0.0.1:3100/auth/callback` were saved and verified after reload. Keep the client secret in Google/Supabase settings, not chat or public application configuration.

Local `AUTH_GOOGLE_ENABLED=true` and `AUTH_EMAIL_OTP_ENABLED=false` are verified through the restarted production preview. The activation build passed.

## Live activation evidence — 2026-10-22

Browser control reconnected. The incomplete editor text was replaced by a paste and compared exactly with the reviewed 3,022-character migration. After explicit owner approval, the SQL ran successfully. Hosted catalog inspection confirmed RLS on both tables, two profile policies and one membership policy, with zero staff memberships. Anonymous REST access to both tables returns HTTP 401 / PostgreSQL 42501 permission denied.

With explicit consent for basic Google identity, the selected `0himu1@gmail.com` account completed Google consent, returned to the local app and loaded its automatically created profile. Display name was saved as the owner's supplied alias Himu Nazmul, and persisted after a full page reload. Phone remained empty. Sign-out was exercised and verified in the browser, and opening `/account` afterward redirected to the login page. No SMTP, broad Google scopes, credentials in source, billing changes or staff-role grants were needed.

Evidence is saved in ignored `artifacts/setup/phase03-migration-applied.png`, `phase03-hosted-rls.png` and `phase03-live-account.png`. Earlier screenshots are historical setup states. Synthetic tests still cover return-to-draft, cancellation and cross-user policy behavior; two distinct real hosted identities have not yet been compared. Owner acceptance remains pending, and Phase 4 has not started.

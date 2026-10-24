---
version: 1
slug: "src-app-login-page-tsx"
primary_target: "src/app/login/page.tsx"
related_targets: ["src/components/auth","src/app/account/page.tsx","src/app/auth/callback/route.ts"]
---

# Google sign-in extension

Mode: Operate. Extend the existing authentication dialog and account/session contract. The owner selected a dedicated new Google Cloud project. Email OTP remains disabled and hidden in the normal preview.

## Direction contract

THESIS: A customer can use a familiar Google identity and return to the same local furniture idea without an email-delivery setup.

OWN-WORLD: Preserve the existing Inter, paired themes, flat dialog and compact controls. Use Google's unmodified official sign-in button artwork for the provider control.

STORY: Start Google sign-in, finish consent through Supabase, exchange the authorization code server-side and resume the original allowlisted draft route. Canceled/failed sign-in retains the local draft and offers retry or guest continuation.

FIRST VIEWPORT: The compact dialog contains a title, Google sign-in button, explicit browser-local saving explanation and Cancel. No disabled email fields. Setup-unavailable and provider-error states are readable in place. Account remains the inherited narrow form.

FORM: Extend the specified authentication interruption. seed: none (incumbent visual world and specified interaction). No new concept tournament or comp.

SIGNATURE: Returning from Google opens the same browser-local project; sign-in never claims a cloud save.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Shipped implementation record — 2026-10-21

Google replaces email OTP in the normal sign-in surface; disabled OTP fields remain hidden. The dialog and login page expose the official provider button, Cancel, explicit browser-local saving copy and readable setup/error feedback. Pending sign-in announces its state and prevents duplicate actions. The inherited account form distinguishes provider-managed email from editable contact details and explains that sign-out retains browser drafts.

The incumbent system agrees with the shipped source: Inter, paired themes, flat bordered surfaces, visible focus and responsive controls remain in use. The auth dialog has a 480px maximum width and the narrow account page a 680px cap. Google's unmodified 180×40 SVG has a 44px minimum control height; its artwork, outlined text and multicolor logo remain provider branding, not CutPlan typography or color tokens. Provenance is in `public/brand/README.md`. Root `DESIGN.md` and `.impeccable/design.json` are preserved because this is an ordinary extension with no approved durable system change.

The owner-requested dedicated `cutplan-studio` Google Cloud project exists. The owner completed policy review and app registration; the Web client is prepared for credential creation and provider activation; the real preview provider stays disabled. No live Google sign-in or hosted migration is proven. Five production-build Google PKCE contract browser tests, 23 regular preview browser tests, seven retained OTP contract tests and ten unit/SQL tests passed. The final normal documentation/unit/type/lint/production-build check passed after excluding generated contract output from ESLint.

The fresh reviewer returned **SHIP** with no material fixes. Ten valid screenshots in `.impeccable/review/phase-03-google/` cover desktop/mobile and dark/light: seven synthetic activated/error/account states and three real setup-pending states. The single detector run retained 16 advisory metadata mismatches, mostly pre-existing focus/skip-link radii and shell/empty-state/mobile font sizes. No detector rerun, old-drift repair or token canonization was performed. `PRODUCT.md` now records the owner-approved Google sign-in method and inactive OTP alternative.

## Live checkpoint — 2026-10-22

Supersedes earlier setup-pending records: the exact reviewed migration was applied with owner approval; hosted RLS/policy counts and anonymous denial were verified. Owner-approved basic Google consent completed successfully. The live account profile loaded, its display name saved and persisted after reload; sign-out was tested. No second real identity isolation check or Phase 4 work is claimed. See docs/delivery/phase-03-google-report.md for detailed evidence.

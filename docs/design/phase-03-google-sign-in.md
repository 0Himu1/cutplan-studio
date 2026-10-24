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

Google replaces email OTP in the normal sign-in surface. The retained OTP implementation is hidden while disabled. The dialog and login page show the official Google control, browser-local draft explanation, Cancel, and inline setup/error feedback. Pending sign-in announces its state and prevents duplicate actions; the account form keeps provider-managed email separate from editable contact details and explains that signing out leaves local drafts in this browser.

Incumbent agreement: the source preserves Inter, paired light/dark palettes, flat bordered surfaces, visible focus, existing responsive controls and the narrow account form. The auth dialog extends the inherited confirmation dialog to a maximum width of 480px; the account page stays capped at 680px. Google's unmodified 180×40 SVG sits in a control with a 44px minimum height. Its artwork, outlined lettering and logo colors are approved provider branding, not shared CutPlan tokens. `public/brand/README.md` records its official source. This ordinary extension makes no durable system change; root `DESIGN.md` and `.impeccable/design.json` remain unchanged.

The dedicated Google Cloud project `cutplan-studio` was created at the owner's request. The owner completed the policy agreement and OAuth app registration. The Web client form is prepared; credential creation and provider activation await owner completion. The real preview keeps Google disabled and honestly shows setup pending. No live Google sign-in or hosted migration is verified; the return-to-draft and PKCE behavior is supported by contract tests, not a completed provider consent session.

Finish evidence: the fresh reviewer returned **SHIP**, with no material fixes. `.impeccable/review/phase-03-google/` contains ten valid desktop/mobile and dark/light screenshots: seven synthetic activated/error/account captures and three real setup-pending captures. Five production-build Google PKCE contract browser tests, 23 regular preview browser tests, seven retained OTP contract tests and ten unit/SQL tests passed. The final normal documentation/unit/type/lint/production-build check passed after excluding generated contract output from ESLint.

The detector ran once and retained 16 advisory metadata mismatches, mostly pre-existing focus/skip-link radii and shell/empty-state/mobile typography drift. They were neither rerun, repaired nor promoted to shared tokens. `PRODUCT.md` now records the owner-approved Google sign-in method and inactive OTP alternative.

## Live checkpoint — 2026-10-22

Supersedes earlier setup-pending records: the exact reviewed migration was applied with owner approval; hosted RLS/policy counts and anonymous denial were verified. Owner-approved basic Google consent completed successfully. The live account profile loaded, its display name saved and persisted after reload; sign-out was tested. No second real identity isolation check or Phase 4 work is claimed. See docs/delivery/phase-03-google-report.md for detailed evidence.

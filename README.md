# CutPlan Studio

Customer furniture configuration and flat-pack ordering for Dhaka. The project is being built in [22 owner-reviewed phases](docs/delivery/PHASES.md).

## Current status

The 22 planned software/review increments are implemented. Launch remains **NOT READY** pending approvals and activation in the [current handoff](docs/delivery/HANDOFF.md). Latest work: [guided cabinet configuration](docs/delivery/guided-cabinet-followup.md) and the [cutting workspace](docs/delivery/cutting-workspace-followup.md).

Local source-snapshot ZIP files, generated review artifacts and credentials are excluded from Git. Documentation backup records remain in `project-records/`.

## Start locally

Requires Node.js 24 or newer and npm. This repository uses npm and package-lock.json; avoid mixing lockfiles. The unit checks use Node's built-in TypeScript support.

```powershell
npm ci
Copy-Item .env.example .env.local
# Fill in the Supabase URL and publishable key in .env.local.
npm run dev
```

The provided Supabase configuration has already been added to `.env.local` on this machine. Do not overwrite it with the example. Open http://127.0.0.1:3100. The server binds to loopback only.

## Verify

```powershell
npm run check
npm run check:supabase
npm run test:e2e
npm run test:auth-contract
npm run test:google-contract
npm run test:styles
```

`check` validates docs, draft/auth input rules, local PostgreSQL profile permissions, TypeScript, ESLint and the production build. `check:supabase` performs a read-only Auth API reachability check with the configured publishable key; it does not create tables/users, verify hosted RLS or prove a complete login flow.

`test:e2e` uses the installed Google Chrome channel to check navigation, themes, keyboard access, health headers, draft creation/rename/delete, local recovery and responsive layouts. It starts a local development server when port 3100 is free or reuses this project's running preview. Stop other applications on that port before testing.

`test:auth-contract` and `test:google-contract` build into `.next-auth-contract` and start isolated production/provider servers on loopback 3101/3121. They test the actual SDK, endpoints, cookies and UI against a synthetic provider. Run these suites separately; they share test ports and output. They send no email, contact no Google account and do not substitute for hosted acceptance. PGlite executes the profile migration and row-level policies locally.

## Structure

```text
docs/requirements/    Original master and five requirements
docs/delivery/        Phases, verification and owner checkpoints
docs/design/          Implementation design notes
docs/integrations/    Local owner integration note
src/app/             Next.js routes and global styles
src/components/      Shared interface components
src/lib/supabase/    Browser, server and proxy clients
public/              Self-hosted fonts and static assets
scripts/             Read-only verification tools
```

Phase 1 established the shell and connection helpers. Phase 2 adds real guest drafts: select a furniture type, create a named project, reopen/rename it, and confirm deletion. Phase 3 implements server-managed authentication, protected account/profile endpoints and guest continuation. **Email OTP remains disabled. Google sign-in and the reviewed profile migration are active; single-account live login/profile/reload/sign-out passed.** Phase 4 live SQL/Mongo account saving, immutable revisions and stale-tab conflicts are verified. Phase 5 catalog review is accepted. Phase 6 cabinet calculations and synthetic cut-list review examples are implemented; approved manufacturing fixtures remain pending. See the [Phase 4 checkpoint](docs/delivery/phase-04-report.md). Phase 7 adds supported cabinet parameters, front/floor projections, undo/redo and versioned geometry saves. Phases 8–9 add real 3D inspection and saved per-panel materials with compatibility and geometry checks. Manufacturing approval and drawers remain open; quotations and orders remain later work. See the [current handoff](docs/delivery/HANDOFF.md) and [Phase 9 checkpoint](docs/delivery/phase-09-report.md).

Authentication uses server-only HttpOnly cookies, not the unused browser Supabase client helper. Do not introduce browser SDK Auth calls alongside this session contract. Set `APP_ORIGIN` to the exact external origin; keep `AUTH_EMAIL_OTP_ENABLED=false` until code delivery is configured. Sign-in does not upload a browser draft or grant a staff role. A signed-in user must choose **Save to account**; the browser draft remains separate.

The owner selected Google as the active provider. Its flow is implemented, but `AUTH_GOOGLE_ENABLED` defaults to false until the Google Cloud OAuth client and Supabase provider/redirect settings are complete. Follow [the Google activation guide](docs/integrations/google-sign-in-setup.md). Client secrets belong in Supabase's Google provider settings, not this repository. This machine has completed Google setup and enabled the local flag; guest drafts remain browser-local.

Drafts use the versioned `cutplan.guest-drafts.v1` localStorage key and are limited to 100 per browser, with names up to 120 characters. Draft envelopes now write schema version 2; old version-1 shells remain readable. Cabinet drafts can also contain validated cabinet geometry. Editor recovery is separate and scoped to the project/account and tab session. Clearing browser site data removes them; links do not transfer them to another browser. Corrupt or newer-version records are preserved and offer a recovery download and explicit reset. Web Locks serialize writes on supported browsers; fallback browsers do not have the same cross-tab concurrency guarantee. Supabase is not used to save these Phase 2 drafts.

The requirements are linked from [the documentation index](docs/README.md). The existing cabinet project is referenced for deliberate reuse; it is not copied into this project wholesale.

## Styling

Use Tailwind utilities and the existing theme aliases for component styles. Global CSS is reserved for palette tokens, browser defaults and shared accessibility/reduced-motion rules. The appearance-preserving conversion and its 78-screen evidence are recorded in [the Tailwind migration note](docs/design/tailwind-migration.md). `npm run test:styles` uses the isolated contract server and must run separately from other contract suites. Its frozen legacy CSS fixture is test-only, never shipped by the app.

## Supabase CLI

The pinned project-local CLI is installed and linked on this machine. Use `npm run db:migrations`, `npm run db:plan` and `npm run db:query -- "select current_user;"`. The existing Phase 3 migration is registered as applied. See [CLI setup and workflow](docs/integrations/supabase-cli.md).





Phases 10–11 now add proposed shoe-rack and bookshelf templates to the Precision CAD workspace, with family-specific persistence, bookshelf fixing/span limits, animated explode/collapse and doors, on-panel dimensions and X-ray. See the current handoff and [combined checkpoint](docs/delivery/phase-11-report.md). Phases 12–13 add study/dining/side panel tables and a material-aware Sheets canvas with explicit unplaced panels, grain, spacing/margin controls and audited deterministic placement. Manufacturing qualification remains pending; the subsequent Phases 14–15 test workflow is described below. See the [combined checkpoint](docs/delivery/phase-13-report.md).


Phases 14–15 add exact versioned quote/order foundations and a labelled test-policy journey (Quote and order in the canvas command bar). Live quotes, real email and live confirmation remain blocked on owner instruction. Test PDFs and tab-only tracking create no commercial orders. See [current combined checkpoint](docs/delivery/phase-15-report.md). The subsequent Phase 16–17 checkpoint is described below.


Phases 16–17 add gated fulfillment foundations and a labelled photo-suggestion demo. Open Photo suggestions in a project; use `/review/operations` for synthetic assignment/status review. Live inference and commercial fulfillment remain disabled. Private-copy normalization, quotas, owner-only links and expiry are implemented; cleanup defaults to `npm run photos:cleanup` dry-run. See [current checkpoint](docs/delivery/phase-17-report.md). The later commands/CNC checkpoint is described below.

Phases 18–19 add Inspect → Editor commands and `/review/production`. Commands are a labelled offline grammar with proposal/Apply/Discard/Undo; live AI interpretation is pending. CNC reports contain synthetic per-sheet paths, frozen inputs and hashes only. Live machine generation/release and physical qualification are incomplete. The private job migration is applied to hosted Supabase on explicit owner instruction; no worker/queue or release is activated. See [current checkpoint](docs/delivery/phase-19-report.md). The later final-increment checkpoint is described below.

Phases 20–22 add Inspect → Assembly documents, owner-only accepted-design review PDFs, a new root marketing page, `/review/launch`, `npm run recovery:drill` and `npm run release:check`. The latter deliberately exits 2 while launch is not ready. See [final checkpoint](docs/delivery/phase-22-report.md) and [operational runbook](docs/delivery/OPERATIONS-RUNBOOK.md). The final numbered review increment is implemented; approved assembly/hardware, commercial/AI/CNC activation and production acceptance remain incomplete. No new hosted migration is required.

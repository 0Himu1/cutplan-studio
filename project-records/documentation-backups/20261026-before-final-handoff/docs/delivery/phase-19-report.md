# Phase 19 — CNC review foundation and release gate

Status: synthetic review software and durable-job foundation implemented, 23 October 2026. **Production CNC generation, qualification and machine release are incomplete and blocked.** There is no approved controller profile, physical trial or production worker. Passing software tests does not qualify a machine.

## Delivered software

- `/review/production` uses a clearly labelled synthetic study-table fixture. It creates no account order and connects to no machine.
- Frozen design, engine/template, revision identity and accepted nesting are audited without repacking. Coverage, material/stock groups, rotation, spacing, bounds, thickness and finite coordinates are checked.
- One deterministic `.simulation.txt` entry per sheet, inside a JSON review report. The report carries the frozen input/layout, explicit synthetic profile, per-file SHA-256 and input/nesting/profile/package hashes.
- The review-only postprocessor supports external rectangular profiles with multiple depth passes and 1 mm retained skin. Origin is bottom-left sheet XY and stock-top Z. No through-cut, pockets, drilling, tabs or arbitrary operations are supported.
- Synthetic values are visible: 3 mm tool, 1200 mm/min feed, 300 mm/min plunge, 12000 rpm, 4 mm maximum pass depth and 12 mm safe Z. These are test values, not approved cutting advice or live defaults.
- A separate strict motion parser checks modal setup, allowed instructions, finite coordinates, cutter bounds, safe rapid movements, feeds, spindle state, closed contours and final retract/stop. Exact reconstruction additionally audits coverage and pass geometry. This is not a controller simulator, collision model or independent manufacturing certification.
- Sheet/tool-center diagram, sheet selector, bounded instruction pages, hash inspection and simulation-report download. Changing the revision or machine test flags invalidates the previous result.
- `/admin/production` requires active fulfillment staff. `/api/admin/production` denies guests/nonstaff; admin POST remains blocked. There is no machine-file release endpoint, actual job enqueue API or machine download.
- Staff operations links to production qualification. Customer APIs expose no production jobs, internal bids or private manufacturing package.

## Durable-job migration — applied on owner instruction

[202610230006_production_jobs.sql](../../supabase/migrations/202610230006_production_jobs.sql) was tested in isolated PGlite, then **applied to hosted Supabase on the owner’s explicit follow-up instruction**. The linked project is CutPlan Studio (`nhglxxgqalwxvlhgxgwc`). All 13 local/remote migrations match and a subsequent dry run reports no pending migrations. It adds private jobs and a future-order trigger that freezes the accepted order snapshot into `awaiting_profile`. It does not backfill or mutate existing orders.

Unique indexes include order/revision/profile/engine/input fingerprint, with a separate null-profile index. The initial `input_hash` is the existing accepted-snapshot SHA-256, a conservative fingerprint including design, nesting and policy; it is not a second computation of the raw geometry hash. Accepted scope and snapshot cannot be updated.

Worker RPCs provide 60-second leases, token ownership, heartbeat, expired-lease recovery, three maximum attempts, terminal failure/cancellation and idempotent completion. Queued/running/succeeded jobs require a profile. Claim requires a qualified active partner/profile. The only supported completion manifest is explicitly simulation-only. No qualification, queue or production release RPC is supplied. Application roles cannot read/write jobs or call worker RPCs; service-role access remains private. A future qualified replacement creates a new immutable profile-scoped job rather than rewriting the null-profile scope.

## Verification and evidence

- `npm run check`: 57 unit/database tests, documentation links, typecheck, lint and production build passed.
- Seven new unit/SQL tests cover command protections, all-four-family deterministic CNC simulation, corrupted movement/feeds/modal setup, stale layouts, unsupported tooling/operations, job immutability, roles, leases, exhausted retries and duplicate completion.
- Three targeted browser tests pass for command flow/no-scroll, synthetic package/error/download flow, guest denial and cross-origin denial. They also passed again on the normal development server after the hosted migration. A missing local MongoDB package was restored from the existing pinned dependencies; package.json and package-lock.json remain byte-for-byte unchanged.
- Ten Google/account contract tests pass; they use a protocol double, not a new real hosted-account qualification.
- Full standard browser regression: 55 scenarios passed, including existing save/recovery/history, materials, animation, families, quotes/orders, operations/photos and responsive no-scroll tasks.
- Hosted follow-up: production-job RLS is enabled; anonymous/customer reads and worker-function execution are denied; service-role read/worker execution is granted. Both order-freeze and scope-immutability triggers are enabled. Hosted jobs, orders and machine profiles remain zero. Empty search paths and explicit schema names protect the new privileged functions. Direct hosted read-only role probes returned PostgreSQL 42501 for anonymous table access and authenticated worker-function execution, as expected.
- Desktop/mobile screenshots: `.impeccable/review/phases-18-19/production-{1366,390}.png`; command screenshots also cover tablet and short landscape. Visually inspected command landscape and production desktop screenshots.

## Qualification still required within Phase 19

Approve the actual machine/controller, postprocessor, coordinate mapping, tool library, material-specific feeds/plunges/spindle/pass limits, safe heights, fixtures/vacuum/clamps, tabs or skin, spoilboard allowance and supported operations. Validate exact accepted construction/nesting with manufacturer involvement. Complete independent controller simulation and a supervised physical stock trial. Record operator/admin approval and implement authenticated, audited release of an immutable hash-bound package. Database application is complete; worker/queue activation remains blocked pending the qualified production implementation. Do not remove the release gate to make the demonstration appear production-ready.

Live commerce/fulfillment, email and AI/photo inference remain disabled. No real order, qualification, photo, partner or machine data was seeded.

## Backup and next checkpoint

Pre-change source baseline: `project-records/source-baselines/20261023-121906-before-phases-18-19/source.zip`. SHA-256: `FC6677A5350A5CAE00D3B3E8150B78C99BAB91160ACD8B4C920B95552A204652`. Source, tests, scripts, docs, migrations, manifests and design context are preserved. Connection prompts, environment secrets, dependencies and build caches are excluded. Earlier documentation backups remain intact.

Open the simulation review, test incompatible machine and changed revision, run the valid synthetic case and inspect the downloaded JSON. Review commands in an editable project. The next numbered development phase is **20: labels, hardware lists and assembly PDF**. Phases 20–22 remain three unstarted phases; live activation and physical qualification gates above remain outstanding in their original phases. Phase 20 must consume the same frozen identities and cannot claim approved hardware/joints/assembly from synthetic CNC review.

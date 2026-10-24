# CutPlan Studio delivery phases

There are **22 implementation phases**. Each is a reviewable increment, not a deadline estimate. Scope is based on all five requirements in [../requirements](../requirements) and the original master. The owner requested a chance to try the app after every phase. Complete only the active phase, report its evidence and limits, and wait for owner feedback before starting the next.

## Working agreement

1. Implement the current phase and its stated boundary.
2. Run relevant unit/integration checks plus typecheck, lint and production build. Run browser checks for changed screens at desktop and mobile sizes.
3. Record actual results in a phase report; distinguish passing tests, manual review, missing external configuration and deferred work.
4. Provide a runnable local preview and a short owner checklist with concrete actions.
5. Stop at the checkpoint. Feedback fixes stay in the current phase. Advance when the owner asks to continue; do not treat silence as approval.

An external service prerequisite cannot be replaced by a convincing mock while claiming the phase is complete. Development fixtures must be labeled and isolated from live orders. A deployment, payment setup or physical machine trial is a separate concrete action within the relevant phase, not an automatic consequence of a passing build.

## Phase map

| Phase | Deliverable | Verification gate | Owner can try |
| --- | --- | --- | --- |
| 1 | Organized documentation, runnable Next.js foundation, app navigation, theme support, Supabase client helpers and read-only connectivity check | Documentation links, typecheck, lint, production build, route/header checks, desktop/mobile navigation and theme persistence | Open Home, Projects and Orders; switch themes; resize the window |
| 2 | Studio dashboard and guest project drafts with four-family picker, rename/delete and local recovery | Draft validation, refresh recovery, invalid storage handling, delete confirmation, real empty states | Create and rename a draft, refresh, reopen it and delete it |
| 3 | Supabase Google sign-in and guest continuation with profile permissions; email OTP retained but deferred | OAuth code exchange, denied/failed consent, canceled login preservation, session refresh/logout and protected-route checks with real test accounts | Sign in with Google, cancel sign-in, sign out and verify the draft survives |
| 4 | Durable cloud projects and immutable design revisions across SQL and MongoDB | Owner isolation with two users, optimistic conflicts, idempotent claim/save, partial-write recovery | Save on one browser, reopen on another, test a two-tab conflict |
| 5 | Material catalog and staff CRUD for board SKUs, finishes, edging, price versions and compatibility | Admin-only access, catalog validation, non-overlapping prices, retirement rather than destructive historical changes | Staff add/edit materials; customer sees only sellable fields |
| 6 | Approved cabinet panel calculation package extracted from legacy code with corrected contracts | Manufacturing-approved fixtures, exact quantities/dimensions/transforms, thickness and clearance boundaries | Inspect the cabinet cut list and compare it with expected drawings |
| 7 | Cabinet parameter editor and 2D elevation/floor views with undo/redo | One calculation source, valid input preservation, unit round trips, revision invalidation and keyboard controls | Change W/H/D, shelf/door/drawer options and undo the changes |
| 8 | Interactive 3D furniture viewer and panel selection | 2D/3D agreement, orbit/pan/zoom/explode, WebGL fallback, performance on a reference design | Inspect all sides, select panels, explode/reset and compare dimensions |
| 9 | Per-panel material/finish/liner/edge/grain assignment with visual textures | Compatibility, stable overrides, texture fallback, thickness-triggered recalculation and undo | Change a panel's faces/edges and verify neighbors and selections |
| 10 | Shoe-rack template and manufacturing fixtures | Correct the master example with owner/manufacturer sign-off; test shelves, doors, skirting and stock limits | Build a shoe rack with your measured dimensions |
| 11 | Bookshelf templates and supported construction limits | Shelf spans, thickness, fixed/adjustable shelves, floor/wall variants and required fixing information | Try a floor and supported wall bookshelf; review warnings |
| 12 | Panel-based study/dining/side table templates | Approved supports/joints, load/span constraints, panel generation and visualization | Configure each supported table construction |
| 13 | Material-aware sheet nesting and cut-plan preview | Every panel placed once or explicitly unplaced, no overlaps, usable margins, per-panel grain and deterministic results | Compare sheet layouts, material groups and waste; test an oversized panel |
| 14 | Versioned quotation engine, seven-day validity, PDF and requested email | Exact BDT arithmetic, full-sheet costs, inclusion/margin policy, stale/expired quotes and retry-safe PDF/email | Generate/download/email a quote; change a design and re-quote |
| 15 | Order confirmation, Dhaka address validation and customer tracking | One order per accepted quote, duplicate-click/network retry, expiry and ownership checks; no implied payment | Confirm a test order and inspect its immutable details |
| 16 | Admin order operations, manufacturer bids and qualified machine-profile assignment | Role access, permitted status changes, cost privacy, eligible bid selection and audit | Assign a partner and advance a test order through the four statuses |
| 17 | Photo-assisted furniture suggestions for spaces and product references | Private uploads, size/format limits, validated structured output, low-confidence fallback, measurement confirmation | Upload both image types and choose an editable supported suggestion |
| 18 | Controlled AI editor commands | Allowlisted operations, proposal-before-apply, stale-response rejection, invalid command handling and undo | Ask to add a shelf or resize; apply/discard/undo the proposal |
| 19 | Qualified CNC generation and production file release | Per-sheet files, exact accepted revision, material/tool/machine bounds, operation ordering, parser/simulator and supervised physical qualification | Staff inspect/download a test manufacturing package for an approved machine |
| 20 | Part labels, hardware lists and approved assembly PDF | Part/fastener identity, assembly sequence, same accepted revision, file access and retry-safe generation | Follow the guide for a representative manufactured design |
| 21 | Marketing landing page and final cross-surface content | Honest Dhaka offer, Try It Out flow, reduced-motion particle treatment, SEO and responsive accessibility | Arrive as a new buyer and enter the studio from the landing page |
| 22 | End-to-end launch qualification and operational handover | All-four-family customer-to-production journeys, security, backups/restore, failure recovery, performance, policy and release checks | Complete acceptance scenarios and decide whether the product is ready to launch |

## Dependencies and decisions

- Phase 1 uses the provided Supabase URL and publishable key without migrations or user creation. API reachability does not prove database policies or login delivery.
- Phase 3 now uses Google sign-in at the owner's request. It requires Google OAuth client credentials, basic identity scopes, Supabase provider/redirect configuration and real test accounts. SMTP/email OTP remains optional and deferred. See ../integrations/google-sign-in-setup.md.
- Phase 4 needs MongoDB connection configuration and a deliberate way to apply reviewed Supabase SQL migrations. A publishable key cannot administer schema or bypass RLS.
- Phase 5 needs real catalog values and pricing ownership. Phase 6 and Phases 10–12 require approved construction drawings; the master's shelf/door arithmetic is not a production fixture.
- Phase 14 needs margin/inclusion/tax/discount decisions and email-provider credentials. Do not invent commercial prices for customers.
- Phase 15 needs allowed Dhaka areas, payment wording, cancellation and delivery policies. It creates orders, not a payment-success claim.
- Phase 17 needs the AI provider key and approved photo retention policy. A photo is not a measurement instrument.
- Phase 19 requires machine profiles, manufacturer involvement, test stock and supervised safety qualification. A simulated pass is distinct from physical acceptance.
- Phase 22 requires a deployment target, operational owners, backup plans and approved customer-facing terms. Hosting/publishing is not part of Phase 1.

## Progress

| Phase | Implementation | Automated checks | Owner review |
| --- | --- | --- | --- |
| 1 | Complete for defined scope | Passed; see phase report | Owner requested Phase 2 |
| 2 | Complete for defined scope; final design review passed | 18 browser tests and 5 unit checks passed | Accepted; owner requested Phase 3 |
| 3 | Google sign-in configured; hosted migration applied; real owner login/profile/reload/sign-out verified. OTP deferred | 23 preview + 5 Google + 7 retained OTP browser tests; 10 unit/SQL tests passed. Single-account hosted login verified; second real identity check pending | Pending |
| 4 | Live SQL/Mongo account saving, revision history and two-tab conflict verified | 23 preview + 6 Google/account + 7 retained OTP + 7 styling browser tests; 15 unit/SQL tests passed | Owner requested Phase 5; hosted second identity check remains unverified |
| 5 | Staff catalog, versioned prices, compatibility, publication and retirement implemented; imported candidates remain unpublished | 17 unit/SQL checks plus lint, types and build passed; live staff create/two-price history verified | Accepted 2026-10-22; owner requested Phase 6 |
| 6 | Cabinet calculation module and review examples implemented; manufacturing approval pending | 23 unit/database + 26 preview browser + 6 Google/account checks; docs/types/lint/build passed | Owner requested Phase 7; drawing/fixture sign-off still pending |
| 7 | Supported cabinet parameter editor, measured front/floor views, undo/redo and geometry persistence implemented | 28 unit/database + 31 preview browser + 7 Google/account contracts; docs/types/lint/build passed | Ready for owner review; manufacturing approval and unsupported drawers remain open |
| 8 | 3D viewport with orbit/pan/zoom, reset, explode, panel picking and keyboard panel list; WebGL fallback | Rendered browser evidence; shared calculator transforms | Combined 8–9 review checkpoint |
| 9 | Panel board/face/liner/edge/grain overrides, catalog compatibility, texture fallback, neighbor recalculation, history and persistence | 31 unit/database checks, material browser lifecycle and seven account contracts; types/lint/build passed | Ready for owner review; manufacturing approval remains open |
| 10–22 | Not started | Not run | Not requested |

Detailed results are in [phase-01-report.md](phase-01-report.md), [phase-02-report.md](phase-02-report.md), [phase-03-report.md](phase-03-report.md) and the [Phase 4 checkpoint](phase-04-report.md), [Phase 5 report](phase-05-report.md) and [Phase 6 report](phase-06-report.md) and [Phase 7 report](phase-07-report.md) and active [Phase 9 report](phase-09-report.md). The [current handoff](HANDOFF.md) consolidates the latest state. Later reports use the same pattern: implemented scope, checks with evidence, known limits, owner checklist, feedback and next phase boundary.

Google activation checkpoint: provider and exact local redirect are saved and verified; hosted migration and single-account login/profile/reload/sign-out passed. Phase 4 live SQL/Mongo saving and revision/conflict verification passed. Second real identity isolation remains unverified. Phase 5 owner review is accepted; The owner requested Phase 7 while construction approval remains pending. Phases 8–9 now provide the material-aware viewport/editor, ready for owner review; Phase 10 has not started.




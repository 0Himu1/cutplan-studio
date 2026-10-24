# Current handoff — 24 October 2026

## Latest UX follow-up

24 October 2026: Cabinet configuration now uses nested compartment/section/drawer accordions, explicit automatic height and depth, shared divider-aware space calculations, mode-preserving resizing and millimeter-only fit clearances. Door/back placement is grouped under Construction. Sourcebook conflicts and manufacturer-specific hardware boundaries are documented. See the [guided cabinet follow-up](guided-cabinet-followup.md). No phase renumbering, database permissions or release gates changed.

24 October 2026: Left inspector bodies now scroll and their former structural pagination is removed. Cabinet/material forms show their fields continuously. The top-right X/Y/Z gizmo replaces the bottom-left navigator; zoom stays bottom right. Sheets is a separate scrollable grid/table workspace with the legacy nesting algorithms, stock controls, worksheet edits, per-sheet/group/all-sheet NC/ZIP and CSV exports, G-code explorer and additional circle/groove/notch/single-cut/frame/SVG operations. Programs are explicitly unqualified; frozen production release and original phase gates remain unchanged. See the [cutting workspace follow-up and parity audit](cutting-workspace-followup.md). This supersedes earlier no-scroll rules only for inspector bodies and Sheets content.

24 October 2026: The fixed CAD workspace now follows the global light/dark theme across floating controls, inspectors, context/material dialogs, 3D grid and X-ray, 2D drawings and Sheets. Light mode uses pale drafting surfaces, thin icons/borders and quieter shadows. Theme switching preserves the live renderer, camera and unfinished form inputs. A theme button is available in the command bar. See the [workspace theme follow-up](workspace-theme-followup.md).

24 October 2026: Editor task forms now use an animated left inspector that reserves approximately one-third of a desktop viewport and leaves the model interactive. Apply/Cancel/Close/Escape animate its dismissal; reduced motion disables the transitions. Narrow/short layouts widen the inspector for usable forms. 3D labels now use transparent backgrounds with white outlined text, showing only panel name, width and height in global units. Thickness data and calculations remain unchanged. See the [docked editor follow-up](docked-editor-followup.md); it supersedes the previous centered-dialog and light-background label choices.

24 October 2026: Cabinet size/build editing is combined into the Dimensions form, with compact Size, Construction, Compartments and Sections pages. Both inset and exterior overlay doors, automatic/manual compartments, nested dividers, shelves, drawers and hanging rods are implemented in the shared geometry and persistence paths. Thickness always remains in mm. 3D panel labels have lighter backgrounds and follow global units for width/height, retaining metric thickness. The approved Supabase migration and strict Mongo validator updates are applied. See the [cabinet follow-up](cabinet-compartments-followup.md) for operation, limits, live storage checks and verification. The original phase numbering and release gates remain unchanged.

24 October 2026: Simplified preview controls. Removed Inspect, Cut list and Measure toolbar buttons, the duplicate Project shortcut and duplicate orientation cube. The cabinet/panel label is now informational; dedicated Dimensions and Materials buttons open those forms. Unique Select and Panels actions remain. Cut list, editor commands and assembly documents remain accessible through the canvas context menu. Updated browser journeys use those retained entry points. All 25 affected browser scenarios, TypeScript and targeted lint passed.

24 October 2026: Removed the CAD sidebar surfaces and reserved columns. Tool groups now float inside the full-width preview. Dimensions, Build and Materials lead the left group; Explode moves to the right group. Hover labels, active states and existing actions are preserved. Short viewports use two-column tool groups with separate space for the cabinet selector and orientation controls. Five workspace scenarios, TypeScript and targeted lint passed; desktop and compact screenshots were reviewed.

24 October 2026: Both CAD sidebars now use compact icon-only controls inspired by the legacy cabinet preview: 38 px bordered buttons, 18 px icons, filled active states, hover shadows, press feedback and inward-facing hover/keyboard labels. Touch pointers use 44 px targets and reduced-motion preferences disable button transitions. Desktop rails shrink to 54 px, leaving more model space. Existing actions and model animations remain unchanged. Five workspace browser scenarios passed, including six viewport sizes, transactional edits, keyboard focus, saves/recovery and panel context actions; targeted lint passed. Desktop and phone screenshots were visually reviewed.

24 October 2026: Fixed repeated loading while an account project is open. Project loading now depends on the account ID rather than the session response object. Routine 60-second and tab-focus authentication checks keep the editor and unfinished form inputs mounted without re-fetching project geometry. Explicit saves, history navigation, retries and account changes retain their existing loading behavior. Verified with the account cabinet browser contract (focus and timed session checks preserve an unfinished width input with no additional project reads, followed by save, rename, reopen and revision-history checks), TypeScript and targeted lint.

Global millimeter/inch-suta inputs are implemented. Select Dimensions → Display units → Inch + suta. Existing dimension, construction, Sheets, photo and catalog measurement values convert in both directions. The preference survives navigation/reloads and synchronizes tabs. Storage and calculations remain canonical mm; unit-only changes create no revision or Undo step. See [unit follow-up](inch-suta-followup.md) for the legacy comparison, precision rules, verification and preserved originals. The original phase numbering and release gates are unchanged. Verification: 65 unit/database tests, 65 standard browser scenarios, 11 account contracts and three final normal-preview unit-input scenarios passed.

## Current checkpoint

The owner requested the final **Phases 20–22 together**. Part/assembly review documents, a distinct root marketing page, local qualification/recovery tools and operational handover are implemented. **Release decision: NOT READY.** The numbered plan ends at 22; no Phase 23 is introduced. Missing approvals and remaining live integration/release work are carried in their original phases, not silently declared complete.

Start with [Phase 20](phase-20-report.md), [Phase 21](phase-21-report.md), [Phase 22](phase-22-report.md), the [operational runbook](OPERATIONS-RUNBOOK.md) and the [22-phase plan](PHASES.md). Earlier reports preserve historical evidence; their old setup-pending or “not started” statements do not override this file and later reports.

## Implemented software

| Phases | Current software state | Remaining acceptance |
| --- | --- | --- |
| 1–5 | Studio/navigation, guest drafts, Google sign-in, SQL/Mongo immutable account revisions and reviewed catalog workflows | Second real hosted identity, supplier/catalog approval per item and retained operational follow-ups |
| 6–9 | Proposed cabinet calculator, measured 2D, 3D selection/inspection, panel materials and fixed Precision CAD workspace | Approved construction and manual geometry/material acceptance |
| 10–13 | Shoe rack, floor/wall-preview bookshelf, panel-trestle tables, material-aware deterministic Sheets preview | Manufacturer-approved joints/load/fixing fixtures and production nesting qualification |
| 14–16 | Exact-money quotation/order foundations, isolated test-policy flow, private staff operations and audited assignment/status foundations | Commercial/service-area policies, real email and live staff/partner qualification; live commerce/fulfillment disabled |
| 17–18 | Private photo infrastructure, measured labelled photo demo, offline command proposals and one-edit Apply/Undo | Genuine provider integration/evaluation, privacy/budget/abuse controls and approved activation; live inference disabled |
| 19 | Frozen per-sheet synthetic CNC review, strict parser, hashes, diagrams and hosted private job/lease schema | Qualified controller postprocessor, workholding/material/tool trials, supervised physical qualification and audited production release |
| 20 | Labels, stable part list, frozen cut-plan PDF, hardware checklist/planning sequence and owner-only accepted-design review route | Approved hardware quantities, joints, drilling, installation and assembly guide release |
| 21 | Responsive dark/light root marketing page, calculated interactive cabinet, sparse reduced-motion-aware particles, metadata and guest entry | Owner visual acceptance and approved publication/domain/indexing |
| 22 | All-family local qualification, recovery drill, explicit launch ledger and operational handover | Hosted identity/restore, deployment/support/monitoring ownership, advisory review and explicit launch acceptance |

The project editor remains one fixed viewport. 3D/2D/Sheets, left/right tools, contextual editing, bounded dialogs, measured panel labels, explode/door animation and X-ray remain available. Presentation state never changes geometry, saved revisions or Undo. Root/admin/review pages are normal documents and may scroll.

## What to try

- Open `/` for the new introduction, switch themes, Explode/Assemble the schematic and choose Try it out.
- Create or reopen any furniture family. Inspect → Assembly documents offers Parts, Hardware and Steps plus a labelled review PDF. Hardware quantities remain explicitly unapproved.
- Inspect → Editor commands supports reviewed local shelf/dimension grammar. Photo suggestions remains a measured demonstration; it does not analyze photos or infer scale.
- `/review/operations` and `/review/production` use synthetic fixtures only. `/review/launch` shows the current missing acceptance evidence.
- Existing local/account saving, history, material assignment, test quotation and tab-only test orders remain available. Live quotes, orders, fulfillment, email, AI and machine release remain blocked.

Normal preview: `http://127.0.0.1:3100`. Final normal-development smoke: all eight selected document/landing/readiness/navigation checks passed after a clean preview restart.

## Verification

Current unit/database total is 65 passing tests following the unit-input follow-up. Types, lint, documentation links and production build pass. Four review PDFs contain 29 rendered/text-checked pages; representative table and bookshelf pages were visually inspected. All-family identity tests preserve the same revision and nesting through test pricing, CNC simulation and assembly review.

Current standard browser suite: 65 passed following the inch/suta follow-up. Google/account contracts: 11 passed following the catalog unit-input test. Detailed results are recorded in [Phase 22](phase-22-report.md). Contract tests are loopback doubles, not a second real hosted identity qualification. Runtime dependency audit is clean; five existing high development-tool advisories remain for a compatible maintenance decision.

The 23 October local recovery evidence restores 13 SQL migrations, four synthetic projects and four serialized design documents, verifies ready revision hashes and rechecks owner/private-production access. The pre-change 218-file source archive also round-trips with matching hashes. Neither exercise proves a hosted Supabase/Atlas/private-photo restore or a production recovery-time objective.

## Storage and preservation

All 14 Supabase migrations through `202610240001_cabinet_compartments.sql` are applied; local and remote migration lists match. Read-only inspection confirms RLS on all 26 public application tables; RLS alone does not replace the existing owner/role tests. No hosted migration was required for Phases 20–22; the cabinet follow-up adds the fourteenth migration. Mongo validators cover all four supported families, panel overrides and the new cabinet compartment trees; existing ready revisions/hashes are preserved.

Production-job migration was applied on the owner's explicit Phase 19 follow-up. It freezes future accepted orders into awaiting-profile jobs; no real worker/queue/release is activated. Photo storage remains private, normalized WebP only and size-limited. Cleanup scheduling, privacy terms and hosted photo acceptance remain open. No catalog, role, provider, approval or commercial data was seeded by this increment.

Before final changes, source/tests/scripts/docs/migrations and selected root context/manifests were archived at `project-records/source-baselines/20261023-before-phases-20-22/source.zip`. SHA-256: `7cb87b15afadd39e9e2e2de7ae095a639388f876d53b74ea5bbe9effb92b494c`. Environment secrets, the connection prompt, dependencies and build caches are excluded. This is a source/context archive, not a complete deployed-system backup or hosted database backup.

The original 39-file documentation preservation remains at [backup manifest](../../project-records/documentation-backups/20261023-001117-before-canvas-overhaul/MANIFEST.csv). Earlier source baselines and phase reports are retained. The pre-Phase-18 archive remains `project-records/source-baselines/20261023-121906-before-phases-18-19/source.zip`, SHA-256 `FC6677A5350A5CAE00D3B3E8150B78C99BAB91160ACD8B4C920B95552A204652`.

## Next acceptance checkpoint

Review the final local increment, then supply and validate the missing construction/hardware, commercial, AI/privacy, CNC, hosted identity/recovery and production deployment evidence. Completing the review build is not permission to enable transactions, publish a production site or release machine files. Actual provider/postprocessor/approved-guide integrations that are still absent require implementation and evaluation after their approved contracts are supplied. See the runbook for ownership, failure handling, backups and release gates.

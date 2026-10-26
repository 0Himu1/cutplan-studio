# Project documentation

**Current entrypoint: [Final implementation handoff — 26 October 2026](handoff-final/README.md).** This reconciles Phase 22 with subsequent requests, current code, migrations and operational limits. Read it before the chronological records below.

Implementation scope is closed; Phase 22 remains the final numbered phase, separate from launch approval. Current board model: six families, 39 active thickness variants. See [current catalog/publication state](handoff-final/05-materials-catalog.md).

## Historical documentation index

The prior index below is preserved as history. Its “latest” labels are not current precedence; the original brand/product import is superseded.

Latest catalog data: [20 Akij/Superboard board entries](../project-records/catalog-imports/2026-10-25-akij-superboard/report.md).

Latest UI: [Compact material catalog grid and editor](delivery/catalog-ui-followup.md).

Latest materials: [Board defaults and role colors](delivery/board-defaults-followup.md).

Latest calculation: [Corner notches and 1-inch shelf setback](delivery/corner-notch-followup.md).

Latest calculation: [Partition door frames](delivery/door-frame-followup.md), following [drawer materials and continuous doors](delivery/drawer-door-followup.md).

Latest UI: [Cabinet field alignment](delivery/form-alignment-followup.md).

Previous UI: [Compact top-down sections and deliberate empty space](delivery/top-down-sections-followup.md).

Previous UI: [Drag-and-drop section ordering](delivery/section-reorder-followup.md).

Latest UI: [Compact help icons and colored space summaries](delivery/config-hints-followup.md).

Latest fix: [Dimension editing and stock-fit warnings](delivery/dimension-stock-followup.md).

Latest UI: [Guided cabinet configuration](delivery/guided-cabinet-followup.md), including the [sourcebook calculation review](design/cabinet-sourcebook-review.md).

Previous UI: [Scrollable inspectors, axis gizmo and full cutting workspace](delivery/cutting-workspace-followup.md).

Previous UI: [Complete light/dark workspace support](delivery/workspace-theme-followup.md).

Previous UI: [Docked editor forms and transparent panel labels](delivery/docked-editor-followup.md).

Latest: [Cabinet configuration, compartments and 3D labels](delivery/cabinet-compartments-followup.md) — 24 October 2026.

Start with the [current handoff](delivery/HANDOFF.md), [global inch/suta follow-up](delivery/inch-suta-followup.md), [Phase 20 documents](delivery/phase-20-report.md), [Phase 21 landing](delivery/phase-21-report.md), [Phase 22 qualification](delivery/phase-22-report.md) and [operational runbook](delivery/OPERATIONS-RUNBOOK.md). The final numbered software/review increment is implemented. Launch remains **NOT READY**; missing real-world approvals and activation work remain explicit. No Phase 23 is invented.

- [Pre-overhaul documentation backup manifest](../project-records/documentation-backups/20261023-001117-before-canvas-overhaul/MANIFEST.csv): 39 copied files verified with SHA-256 before the current planning edits.

- [Requirements](requirements/01_PRD.md): original master plus PRD, TRD, design specification, user flows and database design. These are planning requirements, not claims of completed code.
- [Delivery plan](delivery/PHASES.md): 22 small implementation phases and owner checkpoints.
- [Phase 1 report](delivery/phase-01-report.md): implementation evidence and owner review checklist.
- [Phase 2 report](delivery/phase-02-report.md): guest drafts, storage recovery and owner review checklist.
- [Phase 3 report](delivery/phase-03-report.md): authentication implementation, isolated checks and owner-deferred live activation.
- [Phase 3 Google follow-up](delivery/phase-03-google-report.md): implemented OAuth flow, verification and remaining external activation.
- [Phase 4 checkpoint](delivery/phase-04-report.md): cloud-project implementation, applied Supabase migration, automated evidence and pending Atlas activation.
- [Phase 4 design direction](design/phase-04-cloud-projects.md): explicit account copies, immutable revision history, conflict and recovery states.
- [Phase 5 checkpoint](delivery/phase-05-report.md): staff catalog, imported candidates, pricing history, publication and retirement.
- [Phase 5 design direction](design/phase-05-catalog.md): material review workspace within the existing studio design.
- [Authentication design direction](design/phase-03-authentication.md): scoped email/code dialog and account form.
- [Google sign-in setup](integrations/google-sign-in-setup.md): active provider decision and exact local Google/Supabase callback configuration; no credentials stored here.
- [Google sign-in design direction](design/phase-03-google-sign-in.md): scoped provider-button and callback recovery extension.
- [Foundation design direction](design/phase-01-foundation.md): scoped application of the supplied interface requirements.
- [Guest draft design direction](design/phase-02-guest-drafts.md): creation, cards, rename and destructive confirmation within the existing studio identity.
- `integrations/database-connection-prompt`: the owner's original Supabase setup note, kept locally and excluded from version control because it contains project configuration.

The source application lives under `src/`, static assets under `public/`, and local configuration in `.env.local`. The root PRODUCT.md and DESIGN.md are short context files used by design tooling; the full requirements live here.

- [Tailwind migration](design/tailwind-migration.md): utility-first component styling with preserved appearance and regression evidence.

- [Tailwind migration report](delivery/tailwind-migration-report.md): visual preservation and behavioral test results.
- [Supabase CLI connection](integrations/supabase-cli.md): linked project, verified migration history and terminal commands.

- [Phase 6 calculation checkpoint](delivery/phase-06-report.md): proposed construction rules, exact panel fixtures, verification and approval gate.
- [Phase 6 design direction](design/phase-06-cabinet-calculation.md): cabinet cut-list review within project details.


- [Phase 7 editor checkpoint](delivery/phase-07-report.md): parameters, measured 2D views, undo/redo, geometry persistence and remaining acceptance.
- [Phase 7 design direction](design/phase-07-cabinet-editor.md): scoped cabinet editor within project details.


- [Phase 9 material checkpoint](delivery/phase-09-report.md): saved per-panel materials, compatibility, geometry and 3D verification.
- [Phase 9 design record](design/phase-09-panel-materials.md): material inspector and viewport extension.


- [Final design decisions](design/phases-20-22-documents-launch.md): bounded assembly tasks, marketing identity, PDF layout and honest qualification states.

- [Board category and thickness variants](delivery/board-category-variants-followup.md): six selected families, fixed physical variants, independent sheet prices, applied migration and remaining supplier review.

- [Board catalog colors](delivery/board-colors-followup.md): color creation/editing, 3D inheritance, migration and legacy fallback.

- [Materials inspector](delivery/materials-inspector-followup.md): cabinet boards moved from Dimensions, compact role selection, individual overrides and verification.

- [Collision inspection](delivery/collision-inspection-followup.md): notch-aware X-ray overlap regions, assembled inspection, limitations and verification.

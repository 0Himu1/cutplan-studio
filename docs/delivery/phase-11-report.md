# Phase 11 — bookshelf variants and combined checkpoint

23 October 2026. Software implementation delivered together with Phase 10. **Owner acceptance and manufacturer/installer qualification remain pending.** Tables, nesting, quotations and production release are not implemented by this increment.

## Delivered

- Open bookshelf family with its own template/panel identity, floor-standing and bounded wall-preview variants, fixed/adjustable shelves and material-sensitive construction limits.
- Explicit anti-tip requirement for floor models; wall substrate and fixing notes required for wall previews. Notes do not approve hardware or load capacity. No doors or drawers inherited from the cabinet controls.
- Proposed span/thickness envelope, bounded wall dimensions, 32 mm adjustable-shelf presentation positions and rechecked clear openings. See [design decisions and exact limits](../design/phases-10-11-casework.md).
- Same no-scroll canvas, short forms, selection, material compatibility, 2D/3D views, local/account saving and immutable read-only revisions as the cabinet/shoe rack.
- Shared explode/collapse animation, panel dimension labels and X-ray. Door animation is available on supported door-bearing families; the open bookshelf does not expose a fictitious door action.

## Verification

- Unit/database checks: 36 passed, including exact shoe-rack arithmetic, bookshelf limits, family namespace rejection, history/recovery/snapshot hashes, hinge-pivot preservation, reduced-motion endpoints, executable SQL extension, engine revision metadata and restricted validator access.
- Six new browser journeys passed on the development server: shoe-rack editing/reload, adjustable wall-book preview with fixing requirements, presentation-only animation/X-ray/labels, no-scroll responsive workspace/tasks, family material recalculation and reduced motion.
- Full regression: **43 browser checks passed** against the production preview with test-only authentication flags. **Nine Google/account contracts passed**, including both new families: material preservation, save/reopen, rename and historical read-only revisions. Strict types, lint, documentation checks and the production build passed.
- Nested Escape regression fixed: canceling a delete confirmation or searchable material picker leaves its parent editor task open and restores focus.
- No-scroll workspace/task checks include desktop, phone and compact 720 × 450 viewports; actual physical phone keyboard/zoom acceptance remains separate.
- Final normal-development smoke: shoe-rack editing/save/reload and animation/X-ray/dimension inspection both passed after restoring the real preview settings. Only the development preview on port 3100 remains running.
- Actual captures: `.impeccable/review/phases-10-11/`. Generated concept images are not verification evidence.

SQL migration `202610230001_casework_families` and additive Mongo validators are applied. Historical cabinet records retain their schema and hashes. Old local envelopes remain readable; new design envelopes use version 3, and future schemas cannot be silently overwritten. Contract account tests use an isolated identity provider and routed project fixtures; they do not replace manual hosted owner acceptance or a second hosted identity exercise.

## Remaining acceptance and next phase

Review both families together. For a wall preview, first set dimensions within its stated envelope, then Build → Structure → Structure to choose mounting/shelf support and record substrate/fixing requirements. Save/reopen, inspect materials and confirm a historical account revision stays read-only.

Approved construction drawings, structural/load testing, hardware/anchor selection and physical installation qualification remain external acceptance gates. No fixture is marked manufacturing-approved. Manual live signed-in family/material acceptance, physical phone keyboard/browser zoom and second hosted identity isolation remain unverified where not covered by automated contracts.

Next: **Phase 12, supported table templates**, after owner review/request. Phases 12–22 keep their original IDs and gates; do not implement them as part of this combined checkpoint.

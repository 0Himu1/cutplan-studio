# Phase 12 — panel table templates

2026-10-23. Software implemented with Phase 13 on owner instruction. Proposed construction, awaiting owner review and manufacturing qualification.

Study, dining and side tables now enter the same fixed Precision CAD workspace as the other families. Build → Structure selects the variant and proposes suitable dimensions; Dimensions and per-panel Materials remain transactional. All four table parts support 3D/2D, selection, explode/collapse, labels, X-ray, cut lists, undo/recovery, browser saves and versioned account saves. No door controls appear on tables.

The separate `table-panel-trestle-v1` calculator generates a rectangular top, two inset panel supports and rear stretcher. It shares rendering/persistence infrastructure, not cabinet carcass mathematics. Drawers, round tops, four-leg frames and other constructions are rejected. The [rules record](../design/phases-12-13-tables-nesting.md) defines proposed bounds and exact dimensions. These are editor envelopes, not approved joints or load ratings.

Storage extension `202610230002_panel_tables.sql` and additive Mongo validators are applied; linked dry run is up to date. Table designs use the existing `furniture-design` snapshot and `casework-review-1.0.0` engine with their own template and stable `table/` IDs. Browser envelopes write version 4 and read versions 1–4. Existing cabinet and casework snapshots/hashes are preserved. Catalog, roles and provider settings were not changed.

Source/docs/tests baseline: `project-records/source-baselines/20261023-before-phases-12-13/source.zip` (not a database backup).

Verification is recorded in the [combined Phase 13 checkpoint](phase-13-report.md). Review by creating a Table, choosing each variant in Build → Structure, editing dimensions/materials, inspecting its four panels and saving/reopening it. Physical supports, joints, fasteners, stability and load approval remain pending; quote/manufacturing eligibility stays false.

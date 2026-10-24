# Phase 13 — material-aware sheet preview

2026-10-23. Combined Phases 12–13 software checkpoint, ready for owner review. Phase 14 is next; the original phase IDs and manufacturing gates are preserved.

## Delivered behavior

Choose Sheets beside 3D/2D in any furniture workspace. Finished panels appear on stock sheets in the same fixed canvas. Navigate sheets, select a panel, adjust proposed panel spacing/outer margins, or inspect the bounded Unplaced list. No new below-canvas sections or permanent scrolling panels were introduced. Model navigation overlays are replaced in sheet mode to leave room for stock.

Deterministic rectangular packing groups by board SKU, actual thickness, stock dimensions, ordered face finishes and grain. Each physical panel appears once in placement or explicitly unplaced with a reason. Rotations respect each panel's allowed orientations. An independent audit checks quantities, duplicates, dimensions, grain orientation, material/stock compatibility, containment and inter-panel spacing. Utilization uses purchased full-sheet area; non-panel area includes margins and spacing and is not claimed as reusable offcut. No global optimality is claimed.

Tables from [Phase 12](phase-12-report.md) share selection, materials, labels, X-ray, animation and save/history behavior. The [rules/design record](../design/phases-12-13-tables-nesting.md) contains the proposed table envelopes, fixture dimensions, algorithm/output version and future quote integration boundary.

## Verification

- 40 unit/database tests passed: exact table cuts/transformed bounds, non-intersection, variants/unsupported inputs, strict snapshots, old-format compatibility, executable SQL validation/permissions, all-family deterministic nesting and conservation, grain/oversize cases, spacing/margin boundaries, deliberately corrupted stock/collision/accounting outputs.
- 45 standard browser scenarios verified: existing cabinet/casework workflows retained; table variant/save/reload, sheet mode, explicit grain-locked unplaced panels and margin adjustment; no page or sheet-panel scroll at 1366×768, 390×844 and 720×450. The new two-scenario suite passed again after final sheet copy/layout changes. Existing auth/delete tests were updated for the table canvas and nested dialogs.
- 10 isolated Google/account contracts passed, including table board preservation, immutable geometry/rename history and stale-tab conflict recovery. Seven optional isolated OTP regression scenarios also passed (six in the full run and the corrected nested-dialog scenario in a focused rerun). Hosted OTP remains disabled. Contract identities/data are synthetic; this does not claim a second hosted real-account exercise or a real account table acceptance trial.
- Strict typecheck, lint and production build passed. Documentation link/fence validation passed after updating this checkpoint.
- Mongo additive table validators applied. SQL migration `202610230002_panel_tables.sql` applied; final linked dry run reports up to date. No provider, role or catalog edits.
- Visual review captures: `.impeccable/review/phases-12-13/sheets-{1366,390,720}.png`. Source/docs/tests archive: `project-records/source-baselines/20261023-before-phases-12-13/source.zip`, SHA-256 `605666A49D5B529BE0F96F6EE6F3B7D1728883AD9E1DF818B5634D5A2139B37C`.

## Review and next checkpoint

Open the local preview at `http://127.0.0.1:3100/projects`. Create a Table; use Build → Structure to try Study, Dining and Side. Inspect dimensions, individual materials, exploded panels and X-ray; save and reopen. Switch to Sheets, compare sheet/material groups and utilization, adjust margins/spacing and inspect Unplaced. Existing model edits and explicit local/account save boundaries are preserved.

These are proposed software previews. Table drawings, joints/fasteners, load/stability qualification, installation assessment and manufacturing fixtures remain unapproved. Nesting has no accepted machine profile, compensated toolpath, commercial release or reusable-offcut guarantee. Preview settings/results are temporary and not persisted as accepted plans. All quote/manufacturing eligibility remains false.

Phase 14 must bind quotes to exact validated design, catalog/price versions, accepted nesting/capability inputs and validity; design edits invalidate quotes. Phase 19 retains machine/toolpath simulation and physical qualification. The next nine phases remain 14–22. Owner review is the current checkpoint.

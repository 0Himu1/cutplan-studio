# Verification and limitations

## Fresh audit checks — 26 October 2026

Application code was not changed. Checks apply to the current local working tree, which includes previous uncommitted implementation.

| Check | Result | Evidence |
| --- | --- | --- |
| Full unit/database suite | **117 passed; zero failed/skipped** | [Output](../../project-records/handoff-audits/20261026/unit-results.txt) |
| TypeScript | Passed | [Output](../../project-records/handoff-audits/20261026/typecheck-results.txt) |
| ESLint | Passed | [Output](../../project-records/handoff-audits/20261026/lint-results.txt) |
| Documentation links/fences | Passed after generation | [Output](../../project-records/handoff-audits/20261026/docs-results.txt) |
| Release | Expected exit **2**, `not_ready`, release disabled | [Output](../../project-records/handoff-audits/20261026/release-results.txt) |
| Linked migrations | All **17** match remote | [Output](../../project-records/handoff-audits/20261026/migrations-results.txt) |
| Hosted catalog | 39 active/23 retired boards; 9 published Gorjon; one color; no active finishes | [Inventory](../../project-records/handoff-audits/20261026/catalog-inventory.json) |
| Git | Local/remote first-commit hashes match; later changes local | [Operations](06-persistence-security-operations.md) |
| Pre-edit docs preservation | 80 hash-verified files | [Manifest](../../project-records/documentation-backups/20261026-before-final-handoff/MANIFEST.json) |

[Audit receipt](../../project-records/handoff-audits/20261026/audit-receipt.json) and [source inventory](../../project-records/handoff-audits/20261026/source-inventory.json) bind the record to checked bytes. Link checking is not semantic proof of every sentence.

## Historical implementation evidence

Counts below describe earlier checkpoints, not a fresh browser run or numbers to add together.

| Area | Recorded coverage | Source |
| --- | --- | --- |
| Phase 22 | 63 unit/database, 62 browser, 10 account contracts; build/PDF/local recovery | [Report](../delivery/phase-22-report.md) |
| Units/loading | Conversion/canonical precision, fixed-mm fields, session refresh preserving open edits | [Units](../delivery/inch-suta-followup.md), [guided form](../delivery/guided-cabinet-followup.md) |
| Guided form | Allocation, conditional settings, units, nesting, cancellation, local/cloud contracts | [Report](../delivery/guided-cabinet-followup.md) |
| Sections | Drag identities, reversed UI/data order, deliberate empty height/no filler | [Reorder](../delivery/section-reorder-followup.md), [top-down](../delivery/top-down-sections-followup.md) |
| Frames/notches | Geometry/clearance, ray-through-cutout, contours, nesting/G-code/persistence | [Frames](../delivery/door-frame-followup.md), [notches](../delivery/corner-notch-followup.md) |
| Catalog | Isolated SQL import/idempotency/grants, independent price/color, responsive save/grid workflows | [Variants](../delivery/board-category-variants-followup.md), [colors](../delivery/board-colors-followup.md) |
| Materials | Ten targeted unit checks and 15 relevant browser cases, including isolated account contracts | [Report](../delivery/materials-inspector-followup.md) |
| Collision | Six new collision cases plus six notch checks; two browser workflows | [Report](../delivery/collision-inspection-followup.md) |
| Root partition correction | Current source and notch tests distinguish full-depth root from shortened nested partitions | [Construction](03-cabinet-construction.md) |

Screenshots/fixtures remain under `artifacts/review/` and `tests/`. This docs-only audit did **not** rerun full browser suites, production build, real cloud revision save, two hosted identities, restore drills or physical machine trials. Historical success is not a fresh live certification.

## Implementation limits to retain

1. Browser draft deletion exists; complete account-project cross-store deletion/retention does not.
2. Construction/hardware/joints/load remain proposed. No certified fastening/hinge drilling schedule or legacy tall-cabinet splitting system is claimed.
3. Impossible shrinking/manual allocations need correction. Automatic height is explicit; manual empty space is valid and warned.
4. Saved geometry may not fit selected stock/grain. Downstream manufacturing checks remain necessary.
5. Notches are orthogonal corner contours; nesting reserves rectangular envelopes. Frozen rectangle-only production rejects them.
6. Collision covers supported right-angle assembled solids, not arbitrary holes/curves or swept motion. The 1 mm threshold is not machining qualification.
7. Thirteen variants lack price history; supplier dimensions/core/species/grain need review. This audit observed, but did not certify, nine published variants.
8. Turbopack's reload issue had a local Webpack workaround; package script remains unchanged. Local preview is not deployment.
9. Final implementation is not pushed to GitHub; preserve the working tree.
10. All 68 recovered messages are covered; undocumented manual actions or unavailable conversations cannot be reconstructed.

## Existing acceptance gates, not new phases

The owner's final-scope statement does not supply missing external approvals:

- Manufacturer-signed representative construction, hardware, installation and load evidence.
- Commercial margins/inclusions, delivery areas/charges, tax/discount, payment/cancellation/email policies and hosted staff acceptance. Test policies remain active; live commerce blocked.
- Approved AI provider/model, privacy/retention, evaluation/budget/abuse controls and cleanup scheduling. Photo inference stays demo/disabled; commands local.
- Qualified controller/postprocessor/tool/material/workholding, supervised stock trials and exact package-hash release. `.unqualified.nc` is not released machine work.
- Two real hosted identities proving project/order/photo/document isolation.
- Coordinated hosted SQL/Auth, Atlas and private-photo restore with approved recovery objectives/retention/incident owners.
- Development-tool advisory disposition; deployment/environment separation, monitoring/support and written launch acceptance.

The ledger exposes eight gate IDs: construction, commercial, machine, identity, inference, recovery, maintenance and deployment. Do not turn absent evidence into passes. No Phase 23 is introduced.

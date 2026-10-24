# Phase 9 — panel materials and 3D inspection

2026-10-23. Status: implemented for the supported cabinet template; owner review checkpoint. Manufacturing drawings, structural approval and drawers remain pending. Phase 10 has not started.

This supersedes the incomplete Phase 8–9 progress note. The earlier viewport now has rendered browser evidence, and material assignments are connected to the saved design rather than temporary viewer colors.

## Delivered

- Published material catalog lookup with board/finish pairings and current public prices. Only published, nonretired, currently priced items are returned; supplier provenance and audit details remain private. Public compatibility rows are filtered to those returned IDs.
- Selected physical panel shared by mesh picking, native viewer selector and material inspector. Selection updates mesh emphasis without reconstructing the scene/camera. Touch orbit/pan/zoom, camera reset and exploded presentation remain available. WebGL loss/init failure falls back to the existing measured drawings and cut list.
- Independent board, front-face finish, back-face/liner, four local edges and grain assignments. New board choices explicitly clear dependent finishes/edges. Finish options are restricted to approved board pairs; edging options must cover board thickness; directional stock locks grain. No unavailable assignment silently becomes a different SKU.
- Explicit Apply to N body/back/front panels and Clear selected panel materials. Batch application creates one ordinary undo step and revalidates complete geometry.
- Per-panel overrides live in the canonical cabinet configuration. Browser saves, recovery, immutable account revisions, rename and design hashing preserve them. Complete-input undo/redo restores geometry and assignments together. Unknown panel identities, malformed IDs, invalid dimensions and unknown fields are rejected.
- Thickness-driven neighbor calculation: unequal left/right sides change internal width and center; independent top/bottom/back/shelf/door/plinth thicknesses affect openings, transforms, door reserve and depth. Stock-fit/grain checks use each selected board’s dimensions. Both measured views and Three.js consume these same physical panels.
- Removed panels with assignments block the structural change with an explicit explanation; clear those assignments first or undo. Surviving stable IDs retain their overrides; nothing is reassigned to an unrelated panel.
- Staff catalog finish editing supports optional public HTTPS texture URLs. Front/back textures map to local panel faces and respect grain orientation; failed textures leave the named color visible with a status notice. Edge assignments have an illustrative brown visualization; they are material identities, not a claim of measured product color.

## Storage and authorization

Migration `202610220006_panel_materials.sql` passed local PostgreSQL tests and a linked dry run, then was applied successfully. It adds the optional finish texture field, preserves staff-only catalog mutation, validates bounded panel-override shape in the privileged save boundary and raises its bounded payload allowance for full assignments. Existing immutable revisions are not rewritten. Mongo validators were expanded successfully with `npm run db:mongo:setup`; shell and older design snapshots remain supported.

New account save operations check the current public catalog on the server: valid published IDs, board thickness/stock agreement, compatible front/back finishes, grain restrictions and edging coverage. A failed check preserves local edits. Retrying an existing operation uses its original durable payload and does not reinterpret an already-reserved historical snapshot after catalog changes. Quotation-time material availability remains future Phase 14 work.

No catalog candidate, fixture material, staff role or customer record was published or modified to make these tests pass. The existing live public catalog was read; its contents are owner-managed. Synthetic test catalog data is routed inside isolated browser tests only. No hosted sign-in consent or live customer account save was performed for this checkpoint.

## Verification

- 31 unit/database checks passed: strict assignments/IDs, compatibility, stale specs, grain/stock fitting, asymmetric neighbor sizes, undo/redo and snapshot hashing. The catalog integration test executes migrations through 006, verifies valid/forged override envelopes, and retains the earlier staff-denial, version conflict, immutable price and retirement checks.
- Browser coverage includes assignment of board, two faces, edge and grain, undo/redo, explicit browser save/reload, shared panel selection, camera reset/explode, failed texture color fallback, phone no-overflow, catalog outage/retry and empty catalog. The first complete run passed 32/33; one old selector matched new panel options as well as its cut-list row. Narrowing that selector to the row made all five affected editor tests pass; the final complete rerun passed all 33 browser tests.
- All seven account/OAuth contracts passed and cover material-bearing geometry revisions, rename preservation, reload and read-only history, plus existing authentication/conflict flows. These use synthetic OAuth and routed project responses; they are not a live SQL-to-Mongo material acceptance trial.
- Strict TypeScript, ESLint and production build passed. Documentation links are checked again after final records.
- Four valid rendered captures under ignored `.impeccable/review/phase-09/` cover full editor desktop, phone inspector/3D and light-theme inspector. The independent finish reviewer returned **ship** for the scoped UI, with no actionable visual findings. One mechanical detector run reported only the illustrative edging color `#65513d` as outside shared interface tokens; it is documented as scene material, not promoted to the brand palette.

## Owner review

1. Open a Cabinet editor and select a side in the model or Panel to edit list.
2. Choose a published board. Check the new cut thickness, neighboring cut-list dimensions, measured views and 3D model.
3. Add compatible face finishes, liner and edging where published pairs exist; verify grain restrictions. A missing compatible option requires staff catalog review, not a fabricated substitute.
4. Try Undo/Redo, Apply to the explicitly counted role group, and clear selected assignments.
5. Save the browser design, reopen it, then save an account copy. Save another material revision and inspect older history without editing it. A manual live signed-in account acceptance trial remains an owner exercise.

## Limits and next phase

This is the proposed rectangular cabinet construction, not qualified manufacturing. Finishes and edging currently carry identity/visual assignment; unapproved laminate buildup or edge cut allowances are not invented as structural engineering. Browser texture availability/CORS and source rights remain the staff publisher’s responsibility; color fallback keeps the material identity. Empty/unpaired catalogs honestly limit available choices. Frame, joinery, hardware, drawers, CNC and production pricing remain outside this increment.

Next planned phase: **Phase 10 — shoe-rack template and manufacturing fixtures**, after owner review and instruction to proceed. All project/test servers are stopped after verification, as requested.


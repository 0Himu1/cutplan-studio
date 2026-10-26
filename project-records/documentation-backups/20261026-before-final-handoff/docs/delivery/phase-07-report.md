# Phase 7 — cabinet parameters and measured 2D views

2026-10-22. Status: supported cabinet editor implemented and available for owner review. The owner explicitly requested advancing from Phase 6; **manufacturing approval is still pending**, not inferred from that request. Drawer configuration remains unsupported until its construction rules are defined. Phase 8 has not started.

## Delivered scope

- Cabinet project details now contain a real parameter editor, separate from the retained synthetic Phase 6 review examples.
- Width, height and depth support typed numbers and sliders. Body/back/door thickness and raised-bottom height are editable. Shelf count, inset-door count and back position use native selectors. Unsupported drawer construction is explained instead of exposing a working-looking control.
- Front elevation and floor plan project all eight transformed vertices of every physical panel from the same Phase 6 calculator. Both show overall dimensions and expose a textual cut list; there is no independent drawing-only dimension formula.
- Canonical geometry remains mm. Changing mm/in display does not change stored values or introduce undo steps. The drawing always labels its dimensions in mm; the cut list follows the selected display unit.
- Valid numeric changes commit on blur, Enter or Apply measurements. Invalid text remains editable, cannot be saved, and leaves the last valid model visible. Construction selectors do not silently discard invalid numeric input. A slider previews while being moved and commits one history action on release; keyboard range changes commit on key release.
- Undo/redo restores the complete supported construction input, with a bounded 100-command history. Ctrl/Cmd+Z, Shift+Z and Save shortcuts are scoped to the editor; text inputs keep their native editing shortcuts.
- Explicit Save browser design persists geometry with the existing local-draft version check. Save design revision creates an immutable account snapshot using the existing durable save ledger. Renaming an account project preserves its current geometry.
- Old project shells remain readable. Historical cabinet snapshots show disabled fields and no save action. A historical shell says that it contains no saved cabinet dimensions, rather than showing defaults as historical fact.

## Persistence and recovery

Browser draft envelopes now write schema version 2 under the existing storage key. Readers accept old version-1 shells, validate cabinet inputs strictly, and preserve unknown newer envelopes as unsupported. Older app builds will therefore refuse version-2 records rather than silently dropping cabinet fields. Existing name/type/timestamp/version fields are retained.

Project snapshots retain envelope schema version 1 and add the discriminated `cabinet-design` stage with exact engine/template version and canonical cabinet configuration. Shell hashes remain byte-compatible with the original hash representation. Design hashes include every configuration field, engine version and template key in canonical order.

Editor recovery is separate from the committed project, scoped to project/account and the browser tab's session-storage identity. It stores the last valid configuration and expected base version. Reload recovers unsaved valid edits. Concurrent project saves reject stale versions; the losing tab retains its design, including after reload. Corrupt/newer recovery data is retained and editing is blocked until download/reset. Recovery replacement is an explicit disclosure action. Storage failures never report success. Undo history is session-local and is not restored by page reload.

The initial creation of an account copy includes the saved browser geometry. Unsaved editor changes must first be saved to the browser draft; Save to account does not silently commit an unrelated editor state. Subsequent account changes create ordinary immutable revisions. There are no issued quotes yet; dirty state explains that future quotation must use a new saved revision rather than reusing an older design's quote.

## Hosted changes and evidence boundary

Reviewed migration `202610220005_cabinet_designs.sql` was the only pending migration in the linked dry run and was applied successfully. Local/remote migration history now matches through `202610220005`. It extends the privileged save function with strict shell/design envelope validation and records the proper engine version. Existing ready revision contents are not rewritten, and browser roles still cannot call the save function.

`npm run db:mongo:setup` successfully installed the expanded shell/design validators in `cutplan_studio` while retaining strict validation and existing indexes. No customer project, staff role, catalog price or auth-provider setting was changed to perform this setup.

Account browser tests use the existing synthetic OAuth provider and routed project persistence fixtures. Together with local PostgreSQL tests they verify application contracts and actual SQL execution, but **they are not a new live signed-in Supabase-to-Mongo geometry acceptance trial**. A manual owner check of real account geometry saving remains part of this checkpoint.

## Verification

| Check | Result and scope |
| --- | --- |
| Unit/database | 28 passed, including five editor/schema tests and the six Phase 6 calculation tests |
| Editor history/units/projection | Complete-input undo/redo, redo invalidation, bounded history, mm/in round trips and actual panel bounds |
| Storage/schema/hash | Old local shells, new geometry, corrupt/future rejection, strict recovery, canonical design hashes and unchanged legacy shell hashes |
| PostgreSQL | Old ready shell retained across the new migration; design save/retry, engine metadata, immutable revisions, unknown fields and direct-customer RPC denial |
| Normal production-preview browser suite | 31 passed; parameter updates, front/floor agreement, invalid preservation, cut-list update, save/reload, unit stability, slider/shortcuts, failed writes and two-tab recovery |
| Google/account contracts | Seven passed; new geometry revision, name-change preservation, reload and read-only historical geometry plus prior auth/project regressions |
| Documentation, strict TypeScript, lint, build | Passed; final documentation check repeated after handoff updates |
| Responsive/visual | Seven captures at desktop 1440, tablet 768 and phone 390 px; front/floor, error, expanded cut list and paired themes; no horizontal overflow |
| Mechanical detector | Once across four changed UI files; no findings |
| Fresh finish reviewer | Ship, no actionable UI finding or recapture required; scoped to the supplied editor captures |

The first browser run found that implicit labels around a select included option text in its accessible name. The three selectors now have explicit labels and IDs; the complete suite then passed. Initial phone inspection prompted larger dimension lettering. Recovery records were scoped to tab sessions so another tab cannot replace the losing tab's refresh recovery in the tested independent-tab flow. A final acceptance assertion also verifies that choosing a construction option cannot discard an invalid numeric field.

Review evidence is ignored under `.impeccable/review/phase-07/`; no raster asset ships. The independent reviewer recorded pre-existing design-sidecar staleness as maintenance context; shared tokens and the sidecar were not repaired as a side effect.

## Owner checkpoint

1. Open Projects on the local preview, create or reopen a Cabinet, then scroll to Cabinet editor.
2. Change W/H/D and shelf/door/back/raised-bottom options. Compare Front elevation, Floor plan and Current cut list.
3. Enter an invalid width. Confirm the typed value remains, the drawing stays at its last valid shape, and saving is disabled. Correct it.
4. Try sliders, Undo/Redo and mm/in switching. Save browser design, reload and reopen it.
5. Sign in with Google and create an account copy of the saved browser design. Save a dimension change as a new account revision, reopen it in another signed-in browser, rename it and confirm geometry remains. Open an older revision and confirm it cannot be edited.
6. Use two tabs to confirm that a stale save is rejected and the losing tab's design remains recoverable. Download recovery before explicitly discarding local edits.

## Limits and next phase

The proposed Phase 6 construction still needs an approved drawing and manufacturing fixture. Drawers, joints, hardware rules, wall fixing and structural qualification are not invented here. Material identities/overrides arrive in Phase 9; current body/back/front roles do not imply a real catalog assignment. There is no 3D, nesting, quote generation, order acceptance or machine output in this phase.

Per-tab recovery uses session storage; blocked storage, closed-tab/session cleanup and browser data removal can prevent recovery. Duplicated browser tabs may inherit a session-storage identity, so the tested independent-tab recovery guarantee should not be generalized to every browser duplication mechanism. Project version checks still reject stale committed saves.

Next planned increment is **Phase 8: interactive 3D viewer and panel selection**, after owner review and instruction to proceed. The manufacturing approval and unsupported drawer work remain explicitly open; do not label the complete cabinet/manufacturing scope accepted.

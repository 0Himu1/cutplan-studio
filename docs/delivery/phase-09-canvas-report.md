# Phase 9 revision — Precision CAD workspace

23 October 2026. Owner-selected reference A; combined implementation authorized as a revision of Phase 9. Owner acceptance is pending. Phases 10–22 retain their numbers and original deliverables.

## Implemented

- **9A, internal workspace task:** cabinet project opens directly into a dark, fixed viewport with a compact project bar and left/right tool rails. Studio dashboard navigation/footer stay outside the editor. Non-cabinet families retain their existing project-shell scope.
- **9B, internal interaction task:** physical panel picking, cabinet actions beside selection, anchored right-click actions with keyboard equivalent, dimensions/construction/material tasks, explicit Apply/Cancel, one undo step per applied task. Material choices use searchable paginated dialogs; panel/cut-list/history use bounded pages. Changes are not committed on blur.
- **9C, internal views task:** one active 3D/2D viewport; front/top/right measured projections from shared physical panel bounds; functional named orientation controls, Fit, zoom and explode. Middle-drag pans instead of conflicting with right-click. Camera position/target survives material/geometry renderer rebuilds and 2D/3D switches; resizing fits the viewport. WebGL failure opens measured 2D with an explanation.
- **9D, internal parity task:** retained local recovery/download/reset, explicit browser/account saves, retry/conflict and historical read-only behavior. Account name/history/save-status are short project tasks. Synthetic engineering examples live at `/review/cabinet` rather than beneath the model. Responsive rails compact to icons with accessible names on smaller screens.

The reference's open hinged door, photorealistic wood grain and illustrative menu tools do not establish approved geometry or authorize new features. The build renders actual calculated cabinet panels and approved material data; unassigned panels use a neutral preview color. No invented manufacturing hardware or speculative CNC/nesting/quote controls were added.

## Plan integration

The [integrated plan](CANVAS-EDITOR-OVERHAUL.md) maps every remaining phase into this workspace. New furniture families reuse the interaction shell through an adapter when the second family is implemented. Nesting becomes a sheet mode; quotes/AI/photos use bounded task flows; orders, marketing and staff operations retain their separate surfaces. Existing construction, pricing, ownership and physical qualification gates remain unchanged. This revision does not begin any future phase.

## Verification

Final verification completed: Historical runs are not owner acceptance. Browser tests use synthetic fixtures where stated; they do not constitute a new hosted account/manufacturing trial.

- Unit/database checks: 31 passed; calculator, overrides, snapshots, retry protocol and RLS unchanged.
- Documentation, typecheck, lint and production build: passed.
- All 36 normal browser checks passed against the production preview with test-only authentication flags. All seven Google/account contracts passed against the isolated identity provider, including cabinet material persistence, rename and historical read-only state. A focused context-menu capture also passed.
- After the final pointer-target adjustment, all five canvas checks passed on the normal development server, including right-click selection of the actual physical panel, transactional edits, save/recovery, no-scroll viewport/task states and focus restoration.
- Visual evidence: `.impeccable/review/precision-cad/`, including desktop/tablet/phone and compact viewport states. These are actual application captures, distinct from generated concept references.

## Preserved limits

Manufacturing drawing/fixture approval, unsupported drawers, manual live signed-in material acceptance and a second hosted identity exercise remain pending. Automated no-scroll checks covered 1440×900, 1366×768, 1024×768, 768×1024, 390×844 and 720×450 (compact/zoom-equivalent) workspaces and task dialogs. Physical phone keyboard and browser zoom acceptance remain distinct from viewport simulation. The editor uses the selected dark CAD treatment; the surrounding studio retains its paired themes.

No SQL/Mongo schema, catalog records, staff roles, provider credentials or deployment changed. A source archive was created before edits at `project-records/source-baselines/20261023-before-precision-cad/source.zip` (SHA-256 `965971D53919E4182B793E70389CFEA79FCBB070E23F71CA1F653DE131B15475`). The earlier 39-file documentation backup and manifest remain intact.

The development preview initially hit a stale-cache HMR hash-mismatch reload loop after build/test switching. Its generated `.next/dev` directory was archived to `C:/Users/0himu/.codex/cache/cutplan-studio/20261023-dev-before-hmr-reset` outside the application source tree and regenerated. The five development-server checks then passed; a separate browser probe confirmed editable project creation and zero hash-mismatch reloads. The normal development preview is running on port 3100; contract services on 3101/3121 are stopped.

## Owner review

Open a Cabinet project; inspect its immediate 3D model, then right-click it and edit dimensions. Apply, undo and redo; repeat with Cancel. Switch 2D and choose Front/Top/Right; return to Iso, fit and zoom. Select a panel, change a published material and save/reopen. Review account history as read-only. Confirm this composition matches reference A before requesting Phase 10.

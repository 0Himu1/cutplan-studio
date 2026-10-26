# Canvas-first project editor overhaul

**Later checkpoint:** The owner advanced to combined Phases 10–11. Their [casework/inspection record](../design/phases-10-11-casework.md) and [Phase 11 report](phase-11-report.md) extend this implemented workspace. Phase 12 is next. The original 9A–9D labels below remain internal Phase 9 history, not extra phases.

Implementation plan — 23 October 2026. The owner selected reference A and explicitly requested implementation as a revision to Phase 9. The earlier planning-only restriction is superseded by that request.

**Visual selection checkpoint complete:** the owner selected **A — Precision CAD** from the [three canvas editor directions](../design/canvas-editor-visual-directions.md). Use its dark technical canvas, narrow labelled toolbars on both sides, contextual menu and corner navigation. Implementation is authorized and underway as a Phase 9 revision.

## Decision and current state

The owner rejects the current vertically stacked project UI. Opening a project must open a fixed, model-focused workspace: most of the screen is the preview; 3D and measured 2D occupy the same space; selection opens contextual actions and short overlay forms; a corner navigation widget controls orientation. Ordinary selection and editing must not require page or panel scrolling.

The implementation through Phase 9 provides useful functionality, but its layout is not accepted. Passing the earlier tests and visual reviews does not override this owner feedback. This is an interaction/composition overhaul, not a request to replace the studio's brand or rebuild its working backend.

Keep this overhaul **inside Phase 9**. Labels 9A–9D below identify internal work packages, not four new delivery phases. The owner requested their combined implementation now. Keep original phases 10–22 and their scope/IDs intact: 13 phases remain after Phase 9 acceptance. This request authorizes the cabinet workspace revision only, not implementation of later furniture, commerce or manufacturing features.

## Backup and rollback record

Before any plan/handoff edits, 39 files were copied into `project-records/documentation-backups/20261023-001117-before-canvas-overhaul/` relative to the project root. Scope: all documentation `.md`/`.docx` files, root README/PRODUCT/DESIGN, and persisted editor/surface briefs. Each copy was compared with its source SHA-256; [the manifest](../../project-records/documentation-backups/20261023-001117-before-canvas-overhaul/MANIFEST.csv) records relative paths, lengths and hashes.

This is a documentation snapshot, not a source-code/database/environment backup. Secret configuration and the ignored integration credential note are excluded. Before code implementation, record a source baseline separately; the existing checkout has many untracked files, so a Git label alone must not be assumed to preserve them. Do not reset the worktree or overwrite current work to create that baseline.

Historical reports stay historical. Restore documents by comparing and copying explicitly selected snapshot files, retaining any subsequent accepted decisions. Restoring a plan does not roll back application code or hosted migrations.

## Target workspace

```text
+--------------------------------------------------------------------+
| Projects | Project name | save state | Undo Redo | Save | Project menu|
+-----+--------------------------------------------------------------+
|Tools|                         3D / 2D                              |
|     |                                                              |
|     |                                                              |
|     |                    Furniture viewport                        |
|     |                 (one active model/view)                      |
|     |                                                              |
|     |        [context actions beside selection when requested]      |
|     |                                                              |
|     | [corner view navigator]                      [Fit] [Zoom - +] |
+-----+--------------------------------------------------------------+
| Selected object/panel | units | brief validation/recovery status     |
+--------------------------------------------------------------------+
```

The viewer itself is the focal point. No project-information hero, schematic, long parameter column, material table, cut list, duplicate camera toolbar or Phase 6 demonstration block above/below it. Opening an editor route replaces the dashboard sidebar/footer with compact editor chrome; Home/Projects/Orders/catalog pages retain their ordinary layouts.

Use the existing local-draft and account URLs, or preserve them through an explicit route mapping so saved links still work. Browser draft and account copy must remain visibly distinct. A project menu opens rename, account-copy/save information, immutable history and diagnostics as bounded overlays. Ordered/production features remain unavailable until their phases exist.

### Visual contract

Preserve the accepted system: dark base `#0F0F1A`, surface `#1A1A2E`, primary text `#F9FAFB`, muted text `#9CA3AF`, indigo `#6366F1`, border `#2D2D4E`, and existing light counterparts/accessibility derivatives. Inter stays the UI font; compact sentence-case labels, tabular measurements, Lucide icons and visible focus remain. Do not introduce a new typeface, neon CAD costume, decorative grid or repeated cards.

Desktop proposal: 56 px command bar, 48–56 px tool rail, 28 px status strip. Canvas surface occupies at least 80% of the usable editor area with overlays closed at 1440×900 and 1366×768. Chrome collapses into a compact menu at smaller sizes. These measurements are implementation targets to verify, not shipped values.

Left-align commands/forms and keep the model centered by camera framing. Use one responsive canvas region, not two stacked viewers. Tooltips explain unfamiliar icons; frequent actions have concise visible labels where space permits.

### No-scroll contract

- Project workspace fits the available dynamic viewport; neither the document nor permanent editor regions scroll vertically or horizontally.
- Normal editing forms also require no scrolling. Split dimensions, construction, material faces and edging into short tabs/steps when needed. Large panel/catalog/history collections use search and pagination, not an endlessly scrolling drawer or native long dropdown as the only route to an item.
- At a supported viewport, all fields, errors, Apply, Cancel and navigation for the active step remain reachable simultaneously. Never hide overflow to conceal inaccessible controls.
- Support 1440×900, 1366×768, 1024×768, 768×1024 and 390×844; additionally test 200% zoom and the visible viewport with a phone keyboard open. Responsive forms become shorter step flows; they do not shrink text/buttons to fit.
- Preserve browser zoom. Browser-owned UI and assistive navigation are not disabled. Any viewport/zoom combination that cannot satisfy the no-scroll contract must be documented and resolved during 9D, not silently clipped or claimed as supported.
- Wheel/pinch over the canvas zooms the view. It never scrolls the project page; form interaction does not accidentally move the camera.

## Interaction rules

### Selection and editing

Provide explicit **Cabinet** and **Panels** selection modes. Cabinet mode selects the assembly and exposes Dimensions and Construction. Panel mode selects a stable physical panel and exposes Board, Front finish, Back/liner, Edges and Grain. Selection is visual and textual and survives view/camera changes when the same identity exists.

Left-click/tap selects. A compact contextual toolbar or More control reveals the actions; stationary right-click opens the same anchored menu. Keyboard activation and touch More must expose every action, so right-click is optional. Empty-space click clears selection; Escape closes the current menu/form before clearing selection. Context menus stay inside the visible viewport.

Resolve the existing right-drag pan conflict explicitly: middle-drag or the Pan tool pans; Orbit tool/drag handles orbit; a moved right-button gesture must not open a context menu. Dragging must not accidentally select a panel or edit a field. Provide visible/keyboard-operable orbit, pan, zoom and Fit alternatives, not mouse-only gestures.

Actions open a **single task-focused form over the viewport**. Dimensions contains W/H/D and units; Construction contains supported shelf/door/back/plinth settings; Materials uses separate short board/faces/edges/grain steps. No modal stack and no giant dialog containing today's complete page. The model remains visible around the form and cannot receive pointer edits behind an active modal.

Form values are draft edits. A valid change may preview in the model; **Apply** creates one undoable command, **Cancel/Escape** restores the state from before opening. Invalid text remains visible with a nearby reason and keeps the last valid preview. Closing must not accidentally commit a blur event. Changing units without edits must not drift canonical mm values. An invalid or unsupported assignment does not replace the current design.

Apply is a design edit, not a storage promise: it updates dirty state. **Save** remains the explicit persistence action. One user's local draft never silently becomes an account copy. Leaving with changes and resolving conflicts must preserve recovery/export options.

### 3D, 2D and corner navigation

Default to 3D on opening a supported furniture project. The 3D/2D toggle replaces the active view in the same viewport. 2D uses orthographic Front/Back/Left/Right/Top/Floor views only where their meanings are implemented and correct; do not expose inert view buttons. Dimensions reflect the current calculated revision and chosen display units. Switching mode never changes furniture geometry, materials or undo history.

Define the mini-map as a functional **view navigator**, not a decorative thumbnail. Anchor it bottom-left, repositioning only when safe-area/overlay geometry requires it. In 3D, an orientation control shows the current direction and offers named standard views/isometric. In 2D, a small overview shows model extents and the active viewport rectangle; click-to-recenter and Fit help after pan/zoom. Labels and pressed/current states expose the same choices to keyboard and screen-reader users. Keep it clear of selection actions and zoom controls.

Persist separate 3D and 2D camera positions during the session. Preserve selection across transitions. Reset/Fit is explicit; selecting a panel, changing a finish or switching UI forms must not reset the camera. Explode is presentation-only and does not affect measured dimensions or saved manufacturing poses. Use one camera command system and one set of controls.

If WebGL fails, open the same canvas workspace in usable 2D with a brief explanation and disable unavailable 3D actions. Never send the user back to the rejected scrolling layout as the fallback.

### Accessibility and constrained screens

Use semantic menu/dialog controls, visible focus, predictable Tab order, focus containment for modal forms and return to the invoking cabinet/panel action. Do not trap keys in the canvas. Error text associates with its field; reduced motion removes camera tweening without changing the view result. Keep touch targets at least 44×44 px, safe-area insets respected, and selected/invalid states understandable without color alone.

On phones, use a compact toolbar and a bounded stepped overlay; keep the model visible when the keyboard is closed. Search results and panel/history pages must be limited to the available height. Long names wrap or truncate with an accessible full-name action; they must not push essential commands offscreen.

## Preserve and relocate the existing progress

| Existing capability | Keep | New location / work required |
| --- | --- | --- |
| Guest/project identity and local/account distinction | Current ownership and storage semantics | Compact command bar / project menu |
| Shared cabinet calculator and physical panel IDs | Engine and approved/proposed boundary | One shared editor state driving both views |
| Materials/compatibility and texture fallback | Published IDs, server checks, warnings | Panel context form and short selection steps |
| Thickness-driven neighbor calculation | Existing geometry invariants | Preview/Apply transaction, one undo step |
| Undo/redo and invalid-input preservation | Supported behavior and history bounds | Command bar; modal transaction semantics replace blur-driven commits |
| Recovery, version checks and pending-save ledger | Safe retries, conflicts, old snapshots | Status action + bounded recovery overlay |
| Account revision history | Immutable read-only snapshots | Paginated history overlay; historical view disables mutation |
| Phase 6 review examples and verbose diagnostics | Retain for engineering review | Separate explicit help/developer entry; never default project content |
| 3D viewer and measured projections | Physical poses and material identities | Extract viewport-only renderers from stacked UI components |
| Project lists, staff catalog, auth and future commerce | Preserve current scope | Keep outside editor-specific scroll/layout rules |

Relevant current targets: `studio-shell.tsx`, draft/account detail components, `cabinet-editor.tsx`, `cabinet-viewport.tsx`, `panel-materials.tsx` and the drawing renderer currently nested in the editor. Read the actual sources before implementation; preserve server contracts unless a specific reviewed need arises. No schema/provider/deployment change is assumed for this layout overhaul.

## Internal Phase 9 work packages

| Checkpoint | Deliverable | Verification gate / owner can try |
| --- | --- | --- |
| **9A — Fixed canvas workspace** | Dedicated editor shell on local/account project open; viewer fills available viewport; compact project/save/history actions; existing read-only and loading/error states fit. Extract renderer from page sections; stop rendering the long overview/Phase 6 examples in the main workspace. | No page/permanent-region scroll at the desktop targets; default model visible immediately; Back, save and undo remain reachable; local/account links still work. Owner evaluates composition before forms expand. |
| **9B — Selection and overlay editing** | Cabinet/panel selection modes; anchored contextual actions; touch/keyboard alternatives; short dimension/construction/material overlays; explicit preview/Apply/Cancel transactions; paginated/searchable lists. | Perform configuration and material edits without scrolling; Cancel restores exact previous geometry/overrides; Apply is one undo step; invalid input stays editable; no pointer edits leak behind a modal; right-click and drag do not conflict. |
| **9C — Unified views and corner navigator** | Same-space 3D/orthographic 2D toggle, correct dimensions/elevations, functional corner view navigator, shared Fit/zoom controls, per-mode camera memory and robust 2D WebGL fallback. | Select, edit, switch modes/elevations, pan/zoom/recenter and return without losing selection or resetting geometry; compare panel poses/dimensions; all view commands have keyboard/touch paths. |
| **9D — Parity, responsive acceptance and handoff** | Move remaining project/history/recovery/cut-list workflows into bounded overlays; finish phone/tablet/keyboard/zoom behavior; remove default long-page remnants; update design/flows/tests and current handoff. | Full local → account → material edit → undo/redo → save → reload → historical revision and conflict journeys; no scroll/overflow/focus loss; target viewport/zoom/keyboard matrix; owner acceptance before Phase 10. |

The owner requested combined implementation of these internal Phase 9 work packages. Report the evidence for each distinctly, then pause for review before Phase 10. Visual selection is not acceptance of the resulting build.

## Test strategy and completion criteria

- Keep calculator, material compatibility, hashing, SQL/RLS and recovery tests. They certify behavior/data, not acceptance of the old layout.
- Replace old tests whose expected journey is “scroll down to editor/3D/materials.” New browser journeys start from project open, select an object, open a contextual task, Apply or Cancel, and save without scrolling.
- Assert document scroll height/width matches its viewport within rounding tolerance; assert menu/forms/active step actions fit; exercise wheel gestures and verify camera changes rather than page position. Do not satisfy these checks by hiding clipped content.
- Verify actual rendered canvases and all menu/dialog/loading/error states on both themes. Inspect camera/model visuals, orthographic dimensions, navigator state and focus behavior; do not infer success from text presence alone.
- Repeat save/retry/conflict/historical read-only checks with materials. UI reorganization must not change accepted snapshots, local/account ownership or server authorization.
- Test genuine WebGL failure as well as supported rendering. Bound/clean up render loops, observers, controls and textures when switching views or leaving a project. Inactive views must not create duplicate continuously rendering canvases.
- Record automated and manual evidence separately, including any unverified live account trial. No new numerical performance claim without a reference device/design and measurement.
- Completion requires owner approval of the canvas workflow. Earlier “ship” reviews of the stacked layout are historical and insufficient for this gate.

## Historical planning guidance and brief review

Frontend-design planning pass: retain the product-specific furniture linework, existing palette/type and a single dominant canvas. Discard the generic parameter-dashboard composition; cabinet/panel selection and short forms are the organizing mechanism. No code or new token system is generated in this planning turn.

UI/UX Pro Max local searches were run with the bundled Python runtime after the Windows `python` alias proved unavailable. `focus management modal --domain ux` returned verified focus-visibility and web stacking guidance; these support visible focus and a deliberate overlay layer order. The concrete focus-trap/Cancel transaction policy above is the project plan, not a claim that the search returned that policy. `camera controls selection --stack threejs` returned model-viewer OrbitControls guidance, which fits the installed Three.js/Next.js stack. Its example package version is reference metadata, not a dependency-change instruction. No palette, new global design system, scroll-driven animation or package downgrade is adopted.

Check against the owner brief: one fixed workspace, model-dominant default, same-space 3D/2D, cabinet/panel contextual edits over the viewport, functional corner navigation, preserved engineering progress and staged owner review. No implementation, server start, public deployment or data migration occurred during this planning pass.

## Integration with the remaining 13 phases

These constraints adapt the existing deliverables to the new workspace. They do not authorize later features or change their verification gates.

| Existing phase | Workspace integration | Preserved boundary |
| --- | --- | --- |
| 10 — Shoe rack | Reuse canvas, selection, view commands and short family-specific forms; extract a family adapter when implementing the second real family. | Approved fixtures; never substitute cabinet geometry. |
| 11 — Bookshelf | Same workspace and contextual tasks; bounded span/fixing warnings. | Supported constructions and manufacturer approval. |
| 12 — Tables | Same shell and short support/joint tasks. | Approved geometry, supports and load limits. |
| 13 — Nesting | Sheet-layout mode in the same workspace, paginated group/sheet selectors, return to model without losing design. | Deterministic grain/material placement and explicit unplaced parts. |
| 14 — Quotes | Bounded stepped quote task, PDF/download actions and stale-design status. | Versioned BDT prices, validity, requested email; edits invalidate quotes. |
| 15 — Orders | Short confirmation steps; tracking remains a separate ordinary page. | Accepted quote, ownership, idempotency, address and payment wording. |
| 16 — Admin | Separate staff workspace linked to read-only accepted model snapshots. | Customer editor exposes no costs, bids or machine assignment. |
| 17 — Photos | Short upload/proposal flow; confirmed supported proposal enters model workspace. | Private uploads, uncertainty and explicit measurement confirmation. |
| 18 — AI commands | Bounded proposal, Apply/Discard and the existing edit transaction/undo. | Allowlist and stale-response checks; no automatic mutation. |
| 19 — CNC | Qualified staff release flow linked to exact accepted revision. | No premature export; simulation and physical qualification stay separate. |
| 20 — Assembly | Read-only accepted model with paginated steps/labels and approved PDF. | Exact revision, approved fasteners and sequence. |
| 21 — Marketing | Outside editor shell; Try It Out leads into model after project creation. | Editor no-scroll rule does not apply to marketing pages. |
| 22 — Launch | Add workspace/overlay, resize/zoom, selection and save/recovery journeys across all four families. | Full security, restore, production and owner acceptance gates. |

Canonical millimeters, physical panel IDs, compatibility and immutable revisions remain authoritative. Add future tools only when their original phase implements real behavior; no speculative screenshot buttons. Keep project lists, account/admin and commerce outside editor-specific layout rules.

Source baseline: `project-records/source-baselines/20261023-before-precision-cad/source.zip`, containing source/docs/tests/scripts and package manifests. It is not a database/environment backup.


## Phases 12–13 delivered extension — 23 October 2026

Owner requested both phases together. All four families now enter this workspace. Tables use a separate proposed panel-trestle calculator with study/dining/side variants. Sheets is a third canvas mode with bounded sheet/unplaced navigation, material/grain grouping and editable preview spacing/margins. Model overlays are hidden in Sheets to leave room for stock. No new below-canvas sections were added. See [combined checkpoint](phase-13-report.md) and [rules](../design/phases-12-13-tables-nesting.md). Phase 14 must freeze a validated revision and nesting/capability/pricing inputs before quotes; the temporary preview does not authorize manufacturing.


## Phases 14–15 delivered test workflow — 23 October 2026

Quote and order is a command-bar task over the canvas, with paginated quote lines and short delivery/review/confirmation steps. Tracking remains an ordinary separate page. No permanent scroll panel or below-canvas section was added. On explicit owner instruction, the review uses a separate synthetic table/policy and tab-only test orders; live quotes, email and confirmation are server-blocked. See [combined checkpoint](phase-15-report.md) and [commerce rules](../design/phases-14-15-commerce.md). Phase 16 operations must retain these gates.


## Phases 16–17 delivered gated/demo extension — 23 October 2026

Admin operations remains separate from customer editing; authorized staff can inspect the immutable accepted model in read-only CAD. The synthetic operations review contains no real bids or orders. Photo suggestions adds short choose/measure/review tasks to the same canvas; applying a demo proposal is one undoable edit. Live inference is disabled on explicit owner instruction, with no photo recognition claim. Tablet command actions compact earlier to keep every menu reachable. See [combined checkpoint](phase-17-report.md) and [rules](../design/phases-16-17-operations-photos.md). Phase 18 must retain bounded proposal-before-apply behavior.

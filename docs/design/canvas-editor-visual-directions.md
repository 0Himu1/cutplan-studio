# Canvas editor visual directions

**Selected by the owner: A — Precision CAD.** Use its dark technical canvas, narrow labelled left/right toolbars, selected-model context menu and corner navigation as the visual reference. The owner subsequently requested implementation as a Phase 9 revision. Generated geometry and speculative tools do not expand the approved feature scope.

Visual direction record — 23 October 2026. Reference A is selected; the owner authorized implementation. Follow the [integrated Phase 9 plan](../delivery/CANVAS-EDITOR-OVERHAUL.md). Generated references remain conceptual; the build must use actual calculated geometry.

## Shared layout contract

- Opening a project immediately shows its model centered in a viewport filling the workspace. No stacked project overview, editor, drawings or preview sections.
- Compact left toolbar: selection, navigation, measurement and panel selection. Compact right toolbar: dimensions, construction, materials and history. Both stay visible.
- One compact project command bar: back, name, save state, undo/redo and Save. One 3D/2D switch controls the same canvas.
- Right-click selects its target and opens a short contextual menu. Selection plus a visible actions button, keyboard and touch provide equivalent access. Right-click is not also the pan gesture.
- Short overlay forms edit one task at a time. Apply creates one undo step; Cancel restores the previous values. No scrolling forms, hidden controls or overflowing inspectors. Split longer tasks into short steps; search and paginate catalogs/history.
- Corner navigator changes actual orientation/projection; Fit and zoom act on the model. Wheel/pinch may zoom the canvas, but never scroll the document or tool panels.
- No page, toolbar, menu, form or list scrolling in supported editing layouts. Do not simulate success by clipping unreachable controls. Verify viewport sizes and browser zoom before accepting the implementation; resolve constraints explicitly.

## References to choose from

| Direction | Composition | Editing reference | Tradeoff |
| --- | --- | --- | --- |
| A — Precision CAD | Dark technical grid; docked narrow rails; view cube and corner view controls | Selected cabinet with right-click menu | Strongest engineering feel; more visible technical detail |
| B — Minimal Studio | Quiet charcoal canvas; floating rails; restrained floor reference | Short dimensions overlay beside the selected model | Calmer and most model-focused; fewer tools labelled at once |
| C — Drafting Workbench | Light drafting canvas; dark rails; dimension-led technical view | Context menu and compact selection toolbar | Strongest drawing clarity; greater contrast between canvas and chrome |

All three retain cabinet-first composition and the existing indigo accent. The generated images communicate layout and mood; their model geometry, dimensions, icon details and text are illustrative and are not manufacturing evidence. Exact measurable 2D views must come from the shared calculator in implementation. A direction may be combined with a specific interaction from another reference after owner selection.

## Internal Phase 9 delivery sequence

1. Lock the chosen composition, toolbar actions, resting state, selected state and one editing overlay. Record a source baseline before code changes.
2. **9A:** Replace the project-detail composition with the fixed workspace and immediate model preview; preserve back/save/undo.
3. **9B:** Connect cabinet/panel selection, context menu and short transactional forms to existing calculations/materials.
4. **9C:** Unify measured 2D and 3D; connect view navigator, Fit, camera memory and fallback.
5. **9D:** Verify no scrolling and reachability, keyboard/touch, resize/zoom, save/recovery/history and existing behavior. Owner reviews before Phase 10.

The original visual planning pass changed no application source. The subsequent owner request authorizes the combined Phase 9 implementation; choosing an image alone was not build acceptance. Phases 10–22 retain their existing scope and IDs.

## Guidance used

UI/UX Pro Max design-system search for CAD returned a generic landing-page pattern, which is unsuitable and was rejected. Context-menu search returned general layering guidance only. A narrower keyboard-navigation search matched complete keyboard access and visible focus; apply that outcome without copying its custom tab-order example. CAD composition and interaction proposals above come from the owner's requirements and design judgment, not a claimed CAD-specific database match. Existing Next.js/React/Three.js implementation and studio palette remain the starting point.

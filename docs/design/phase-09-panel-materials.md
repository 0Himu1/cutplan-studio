# Panel materials and 3D inspection

Mode: Operate. Extend the cabinet editor within its existing paired themes and Inter typography. The owner requested completing Phase 9 after the combined 8–9 increment was left unfinished.

## Direction contract

THESIS: A selected physical panel carries explicit material identities that survive editing, saving and history.

OWN-WORLD: Existing flat borders, indigo actions, neutral surfaces, native fields, visible focus and restrained geometry. No visual-world replacement.

STORY: Select a panel in the model or native list, choose a published board, compatible front/back finishes, covering edging and grain, inspect recalculated geometry, undo or save.

FIRST VIEWPORT: Existing parameter/drawing composition stays fixed. Below the measured drawing, 3D inspection precedes the material inspector; narrow layouts stack fields and keep selection and recovery messages readable.

FORM: Scoped extension, code-led; seed: none (established editor). Preserve shared palette and typography. Board changes clear dependent finishes/edges explicitly. Batch apply names the affected material role and panel count.

SIGNATURE: A left-side board thickness change adjusts internal width, neighboring panels and the shared 2D/3D geometry, rather than merely making one mesh look thicker.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Boundaries

Unpublished catalog candidates are unavailable for selection. Tests route an explicitly synthetic catalog; they never publish it to the hosted database. Texture URLs are optional staff-approved public HTTPS assets with a named color fallback. No image asset is generated or bundled by this increment. Manufacturing approval, joint qualification and CNC remain unavailable.

## Implementation record

The editor stores per-panel board, front finish, back finish / liner, local top/bottom/left/right edging and grain assignments in `CabinetInput.panelOverrides`. These assignments participate in canonical configuration identity, undo/redo, browser recovery, local saving and account revision snapshots. Panel IDs connect the native selection controls and model picking. Board specifications affect calculated thickness and stock constraints; an asymmetric side thickness recalculates adjacent parts and the shared 2D/3D geometry.

Only the published public catalog supplies selectable materials. Board changes clear dependent finishes and edging. New account saves validate the current catalog, item identities, board specifications and grain, board/finish compatibility and edge-width coverage on the server. Existing pending operations retain their original request body for retry. Synthetic QA records are explicitly labelled and were not inserted into the hosted catalog.

The viewport provides orbit, pan, zoom, reset camera, exploded inspection and a native panel-selection alternative. Front/back finishes and four edges map to six local mesh faces. Optional staff-managed public HTTPS texture URLs preserve finish-color fallback and report load failures. WebGL failure directs users to measured drawings and the cut list. No new raster product files ship; review screenshots remain ignored QA artifacts.

## Finish record

The independent review in `.impeccable/review/phase-09/finish-review.md` found no actionable visual findings across `desktop.png`, `mobile-inspector.png`, `mobile-3d.png` and `mobile-light.png` in the same review directory. The disposition is scoped to the existing editor extension; it does not qualify manufacturing. The detector ran once and returned one advisory for the illustrative `#65513d` edging color inside the model. That material depiction is not a shared UI brand token and requires no palette expansion.

Validation reported at this documentation checkpoint: 31 unit/database checks passed. The first normal browser suite passed 32 of 33 checks; after narrowing an old text selector to the cut-list `li`, five affected checks reran green. Expanded account material-persistence contracts are still in progress at this checkpoint, so this record does not claim a final full-suite pass. The parent phase record owns final aggregate validation results.

The scoped component behavior is appended under Components in `DESIGN.md`; its normative frontmatter, design sidecar and `PRODUCT.md` remain unchanged. Manufacturing approval, joint qualification, drawers, quotations and machine output remain pending.

Final account verification update: all seven Google/account contract checks passed, including material-bearing geometry saves, rename/reload preservation and read-only history. These remain synthetic-provider/routed-storage tests; no live account acceptance claim is made.


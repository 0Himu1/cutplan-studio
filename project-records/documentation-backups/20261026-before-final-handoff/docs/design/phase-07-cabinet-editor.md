# Cabinet parameter editor

Mode: Operate. Extend cabinet project detail in the existing studio. The owner requested Phase 7 on 2026-10-22; the earlier manufacturing-drawing gate stays open.

## Direction contract

THESIS: A customer adjusts a cabinet while retaining a trustworthy last-valid drawing and a recoverable save state.

OWN-WORLD: Preserve Inter, dark base #0F0F1A, surface #1A1A2E, text #F9FAFB, muted #9CA3AF, indigo #6366F1 and the existing light counterpart. Flat linework and theme focus colors carry the work.

STORY: Edit width/height/depth and shelf/door/back/plinth options; inspect front and floor projections; undo/redo; save explicitly to the project. Invalid text remains visible without destroying the last valid geometry. Read-only history cannot be edited.

FIRST VIEWPORT: A scoped section within project details: title and save/history actions, approval boundary, then parameters at left and measured front/floor view at right. On small screens controls precede the drawing. A compact physical-panel cut list follows.

FORM: Scoped extension, code-led; seed: none (fixed existing composition). Wireframe: editor title/actions / approval note / [parameters | view controls + geometric canvas] / cut list. Do not introduce a new visual identity or metric-card grid.

SIGNATURE: Both views project the exact calculated panel vertices, and a rejected input leaves that same last-valid model visible with an explicit explanation.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Scope decisions

Proceed using proposed Phase 6 construction, not manufacturing approval. Drawers remain unsupported and are explained in the editor. Unit changes are presentation-only; no round trip can change canonical mm geometry. Save recovery and optimistic versions cover geometry as well as names. Existing immutable snapshots remain readable. Keep the Phase 6 examples as a separate review surface; they never initialize or mutate a user's saved design implicitly.

## Implemented surface

Phase 7 extends cabinet browser drafts and account project details with the same editor component. It reads saved cabinet parameters, offers explicit local design saves or immutable account geometry revisions, and leaves older revisions read-only. Existing project-shell snapshots remain readable without invented saved dimensions. The separate Phase 6 example review remains available and never initializes saved geometry implicitly.

Dimensions, panel thicknesses, shelf count, inset doors, back position and raised bottom feed the shared cabinet calculation. Numeric inputs and dimension sliders expose keyboard alternatives; mm/in changes affect presentation while canonical measurements remain mm. Front and floor drawings project the calculated physical-panel vertices, and the cut list uses that same result. Drawing annotations explicitly remain mm. Invalid text retains the last-valid drawing and panel list, blocks saving and unit changes, and survives rejected construction selections. Undo/redo operates on valid model history; shortcuts are scoped to the editor outside fields.

Recovery uses browser-draft identity or account user/project identity plus a per-tab session ID. Unreadable or newer recovery data is retained for download and explicit reset. Version conflicts preserve the local design, and account saves retain the original pending request for retry. Save failures do not replace the working model. These recovery controls do not confer manufacturing approval. Drawers remain unsupported pending construction rules; no 3D, pricing, quotation or machine output is shipped.

## Finish and verification evidence

The independent finish review at `.impeccable/review/phase-07/finish-review.md` returned **Ship**, with no material visual findings or requested UI changes/recaptures. It inspected seven scoped captures: `desktop.png`, `tablet.png`, `mobile.png`, `mobile-floor.png`, `mobile-error.png`, `mobile-light.png`, and `desktop-light.png`. They cover the desktop split, stacked tablet/mobile controls, both projections, last-valid error behavior, both themes and the expanded cut list. They are ignored QA evidence under `.impeccable/review/phase-07/`, not shipping product rasters. Their provenance is the implemented editor rendered for this review; no generated or external raster asset entered the product. Capture-only suppression of an offscreen fixed skip-link artifact limits this review to the editor section and does not establish production skip-link behavior.

The implementation owner supplied passing results for 28 unit/SQL checks, 31 browser checks and seven Google/account contract checks. The reviewer did not rerun them. The parent subsequently completed the final functional acceptance rerun: all 31 browser checks passed, including preservation of invalid numeric input when another construction option is selected. One supplied detector run returned `[]`; this records that run only. Static captures do not independently prove persistence, keyboard behavior, screen-reader announcements or manufacturing correctness.

The root DESIGN.md now records this scoped component under Components. Its token frontmatter, PRODUCT.md and `.impeccable/design.json` remain unchanged. The existing sidecar stale notice is pre-existing documentation maintenance and was reported without repair. The finish verdict concerns the proposed-construction editor; the manufacturing approval gate remains pending.


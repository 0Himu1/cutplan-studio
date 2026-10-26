# Phase 6 — cabinet calculation review

2026-10-22. Status: calculation implementation and automated engineering checks passed; proposed construction is available for owner/manufacturer review. **The manufacturing-approved fixture gate remains open.** Phase 7 has not started.

The owner completed Phase 5 review and requested Phase 6, then explicitly authorized: “Proceed with proposed rules for review.” This authorizes a review implementation; it does not certify drawings, joints, hardware or structural limits.

## Delivered

- Pure TypeScript calculation module at `src/lib/furniture/cabinet.ts`, shared-importable by client and server without renderer, browser or database dependencies.
- Versioned, strictly validated cabinet inputs; stable physical panel/component IDs; mm face dimensions and thickness; center positions in mm and rotations in radians; material roles and grain/rotation restrictions. Invalid configurations return blocking reasons and no partial panel list.
- Full-height sides, between-side top/bottom, inset or outside back, zero to twenty shelves, zero to two inset doors, optional raised bottom with recessed front plinth.
- Four explicitly synthetic review examples: inset back/two doors, outside back/raised bottom, open cabinet, oversized validation failure.
- Cabinet-only review section on browser and account project details. Each individual panel expands to its identity, material role and transform. Example changes do not modify a saved project, local draft, immutable revision or historical account snapshot.
- Existing project editing, saving, ownership, sign-in and non-cabinet workflows preserved. No migration, provider configuration or hosted data mutation is required.

## Legacy extraction and corrections

The reusable source was inspected in the legacy application's `lib/nesting/cabinet-calculation/body-structure-calculator.ts`, `door-calculator.ts`, `section-calculator/shelf-calculator.ts` and `lib/nesting/panel-calculator.ts`. The new module adapts their panel/pose approach rather than importing the React/application dependency graph.

The legacy mixes wall/base top-overlap rules, implicit 25.4 mm shelf setbacks, toe-kick offsets and grouped identities dependent on dimensions. The review template replaces these with one explicit construction contract: full-height sides, between-side top/bottom, declared clearances, reserved door depth, stable component IDs and individual physical parts. It does not claim to preserve every legacy cabinet variant.

Canonical axes: X left-to-right, Y bottom-to-top, Z rear-to-front. Each unrotated panel has width along local X, height along local Y and thickness along local Z. Overall depth includes an outside back and inset doors.

## Proposed rules and reference measurements

For width W, height H, depth D, body thickness t, back thickness b, door thickness f, raised-bottom height s, shelf side clearance c and door gap g:

- Internal width = W − 2t; internal height = H − s − 2t.
- Outside-back carcass depth = D − b; inset-back carcass depth = D.
- Inset back = internal width × internal height; outside back = W × H.
- Shelf width = internal width − 2c. Shelf depth = D − b − (f + g when doors exist).
- For n shelves, clear opening = (internal height − nt)/(n + 1); all openings are equal and shelf thickness is counted.
- For k inset doors, door width = (internal width − (k + 1)g)/k; door height = internal height − 2g. No zero-gap door construction is accepted.
- Raised bottoms use one internal-width front plinth of height s; its front face is recessed by the specified setback. Further supports and fixings need manufacturing review.
- Cut faces must be at least 50 mm, including the plinth; board thickness is exempt. Positive stock margins reduce usable dimensions on both sides. Unrestricted grain permits 0/90 degree fitting; directional grain locks the stored cut orientation. This is individual panel fit, not nesting.

The first example is 800 × 1200 × 400 mm with 18 mm body/doors, 6 mm back, two shelves, two doors, 2 mm shelf-side clearances and door gaps, no raised bottom. Its **nine individual panels** are:

| Part | Count | Cut width × height × thickness (mm) |
| --- | --- | --- |
| Sides | 2 | 400 × 1200 × 18 |
| Top and bottom | 2 | 764 × 400 × 18 |
| Back | 1 | 764 × 1164 × 6 |
| Shelves | 2 | 760 × 374 × 18 |
| Doors | 2 | 379 × 1160 × 18 |

Each example uses illustrative 1219 × 2438 mm stock with 10 mm margins, not supplier availability or an approved catalog assignment. The master shoe-rack worked example is not reused as an approved cabinet fixture.

## Verification evidence

| Check | Result and scope |
| --- | --- |
| Unit/database suite | 23 passed, including six cabinet tests |
| Exact reference fixtures | Inset nine-panel dimensions/poses and outside-back/plinth ten-panel expectations verified |
| Independent physical checks | Vertex transforms, overall bounds and no intersections across 108 thickness/back/shelf/door/plinth combinations |
| Validation boundaries | Nonfinite and unsupported input, shelf/count/clearance limits, minimum cut faces, thin backs, exact usable-stock edge, allowed rotation and grain lock |
| Identity/determinism | Resizing preserves existing panel IDs; no input mutation; repeat calculations identical |
| Normal production-preview browsers | 26 passed, including three new cabinet review checks |
| Google/account contracts | Six passed, including account save, revisions and stale-tab conflict; synthetic provider, not a new live Google acceptance |
| Documentation/types/lint/build | Passed |
| Mechanical design detector | Ran once on changed UI targets; returned no findings |
| Responsive/interaction evidence | Desktop 1440, phone 390 and tablet 768 px; both themes, expanded rows/rules, invalid stock, long project name and keyboard activation |

The first stock-boundary test supplied stock too narrow for the back even after rotation. The test fixture was corrected to accommodate every part; no engine validation was weakened. Component screenshot capture initially included an offscreen fixed skip-link artifact; capture-only styling removed that artifact. The real skip link remains unchanged and its browser check passed. Final targeted cabinet recapture/check: three passed.

Captures and the independent visual-review result are in ignored `.impeccable/review/phase-06/`. The fresh reviewer inspected all ten captures and returned **ship**, with no visual fixes or recapture required. The requested scoped component documentation is included in the design handoff. This verdict covers the UI extension only; engineering and visual checks do not imply manufacturing approval.

## Owner/manufacturer checkpoint

1. Open a cabinet draft from Projects at the local preview and scroll to **Cabinet panel review**. Account cabinet details expose the same independent examples.
2. Inspect the default nine physical panels; expand a side, shelf and door to check positions and rotations.
3. Select the outside-back/raised-bottom example and review the ten parts and construction disclosure.
4. Select the oversized example and confirm it blocks the entire cut list. Return to a valid example.
5. Compare the stated rules and measurements with a reviewed cabinet drawing. Record revisions needed for joinery, back mounting, shelf/door clearance, plinth supports, material thickness and hardware.

To close the Phase 6 manufacturing gate, record who approved the drawing, its version/reference and the independently expected panel dimensions/poses, then update fixtures and tests if those rules differ. No approval metadata can be inferred from a passing test.

## Limits and next phase

This is one proposed rectangular cabinet construction. Drawers, multiple compartments, overlay doors, wall mounting, structural/load qualification, joinery and machining operations are unsupported. No real material SKU is assigned. All calculation results explicitly return `manufacturingApproved: false` and `eligibleForQuote: false`.

Editable project geometry, parameter controls, front/floor drawings and undo/redo belong to **Phase 7**. 3D is Phase 8, panel materials Phase 9, nesting Phase 13 and qualified CNC Phase 19. Do not advance or call Phase 6 fully accepted until the owner checkpoint and manufacturing fixture gate are resolved.

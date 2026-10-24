# Phases 12–13 — tables and sheet canvas

The accepted Precision CAD direction remains authoritative: a fixed viewport with contextual tasks. Tables use the existing workspace; Sheets is a third preview mode inside the canvas. Sheet mode replaces model navigation overlays with bounded sheet/unplaced navigation. Ordinary project/account pages retain their separate layout.

## Proposed table rules

One rectangular panel-trestle construction supports study, dining and side variants. Overall dimensions include a full-width/full-depth tabletop. Left/right supports sit 50 mm in from the outer width and depth edges. Their height is overall height minus actual tabletop thickness. A rear stretcher fits between the actual inner support faces, ends at the tabletop underside, sits 50 mm from the rear edge, and is min(200 mm, support height − 100 mm) high. All panels use actual per-panel thickness (18–40 mm). Top clear span (width − 150 mm) is limited to min(1650 mm, 60 × top thickness), a proposed preview envelope only.

| Variant | Width mm | Depth mm | Height mm | Initial dimensions W × H × D |
| --- | --- | --- | --- | --- |
| Study | 800–1600 | 450–800 | 650–850 | 1200 × 750 × 600 |
| Dining | 900–1800 | 600–1000 | 700–800 | 1500 × 750 × 800 |
| Side | 300–800 | 300–800 | 350–750 | 600 × 500 × 500 |

Default thickness is 25 mm. Study fixture produces top 1200 × 600 × 25, supports 500 × 725 × 25 each, and stretcher 1050 × 200 × 25 mm. Parts touch at intended support faces without intersecting. Stable IDs: `table/top`, `table/side-left`, `table/side-right`, `table/back` (rear stretcher). Body material batching covers all four; individual panel assignments remain available. Inactive casework parameters retain canonical defaults and never generate table parts. No drawers, doors, shelves, curved tops or freestanding leg frames. Manufacturing joint/fastener/edge treatment, load and stability qualification are pending.

## Nesting contract

`nestFurniture` takes a validated furniture configuration plus proposed panel spacing and outer margin. Output schema 1 records the canonical input key, algorithm `shelf-first-fit-1`, settings, material group keys, sheet IDs, placements, rotation, explicit unplaced panel IDs/reasons, utilization and non-panel area. It never grants manufacturing approval. Inputs and geometry are not mutated.

Groups distinguish board SKU (or explicitly unassigned stock), thickness, stock dimensions, ordered front/back finishes and per-panel grain. Finished rectangular panels may rotate only through their allowed 0/90 orientations. Panels sort by area then stable ID; groups sort by key. First-fit shelf rows use one spacing gap between finished rectangles and outer margins once. Oversized/grain-locked parts remain unplaced. A separate audit checks conservation, duplicates, stock compatibility, dimensions, permitted rotations, containment and pair separation. This is deterministic packing, not a global optimum or CNC toolpath.

Utilization = placed panel area / purchased full-sheet area. Non-panel area includes spacing, margins and other unused area; it is not claimed as reusable offcut. Unplaced parts are excluded from both purchased-sheet utilization and placement totals, but always explicitly accounted for. Unassigned stock is illustrative; real catalog compatibility is validated separately by existing save/material controls.

Sheet preview settings are local, temporary inspection settings and are not written into immutable designs or quotes. Switching to model preserves the applied furniture design and selection; leaving Sheets resets its settings. No packing result is accepted for commerce or production. Phase 14 must freeze a validated revision, catalog/price versions, nesting settings/result, and manufacturing capability envelope before making a quote eligible. Phase 19 must qualify compensated toolpaths, cutter diameter, hold-down and machine limits; preview spacing is not tool-radius compensation. Reject incompatible assignments rather than silently repacking an accepted quote.

## Evidence

Pure tests cover exact transforms, unsupported inputs, all-family conservation, deterministic output, grain-boundary unplaced parts, spacing/margin boundaries and deliberately corrupted audit results. Browser checks cover table saving/reload, sheet controls, explicit unplaced panels and fixed layouts at desktop, phone and compact landscape sizes. Synthetic account contracts cover table material preservation, rename and immutable history; these are not a hosted second-identity or physical fabrication claim.

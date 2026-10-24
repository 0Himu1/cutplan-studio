# Shoe racks, bookshelves and shared 3D inspection

23 October 2026. Owner requested Phases 10 and 11 together, then added animated explode/collapse, door movement, on-panel dimension labels and X-ray. Retain the selected Precision CAD layout; no stacked sections beneath the canvas.

## Family adapter and persistence

`src/lib/furniture/families.ts` discriminates cabinet, shoe rack and bookshelf configurations. The existing between-sides carcass mathematics is a shared primitive, not an assertion that a cabinet is a qualified shoe rack/bookshelf. New families have their own template keys, `casework-review-1.0.0` engine, physical panel namespaces and strict supported-option checks. Tables remain unsupported until Phase 12.

Cabinet records/hashes stay unchanged. New local designs use `design` in a version-3 envelope; versions 1 and 2 remain readable, and newer schemas remain protected. New account snapshots use `stage: furniture-design`, matching `furnitureType`, and canonical `configuration`. SQL and Mongo validators retain existing shell/cabinet formats and extend to the new families. Ownership, immutable revisions, optimistic versions, retry ledgers and material compatibility remain authoritative.

## Proposed shoe-rack fixture

Default: 813 W × 1000 H × 350 D mm, 18 mm body/doors, 6 mm inset back, three shelves, two inset doors, 80 mm raised bottom. This is a synthetic review fixture, not an approved manufacturing drawing or supplier offer.

- Internal width: 813 − 18 − 18 = 777 mm.
- Shelves: 777 − 2 − 2 = **773 mm** wide with 2 mm clearance per side; closed-door shelf depth is 350 − 6 − 18 − 2 = **324 mm**.
- Two inset doors with 2 mm perimeter/meeting gaps: (777 − 3 × 2) / 2 = **385.5 mm** wide each. The master's 759 mm shelf and two 389 mm doors are not reused.
- Back policy, zero/one/two doors, shelf count, raised bottom, physical transforms, per-panel thickness/grain and usable stock checks follow the explicitly proposed carcass rule. Removed-panel material assignments block structural changes instead of disappearing silently.

All calculations remain manufacturing-unapproved and ineligible for quotation or CNC release.

## Proposed bookshelf envelope

Default: open floor case, 600 W × 1800 H × 300 D mm, 18 mm body, 6 mm back and four fixed shelves. No doors/drawers. Fixed shelves have zero side clearance; adjustable shelves have 2 mm per side and center heights rounded to a 32 mm presentation pitch. Recheck clear openings after snapping. No pin-hole pattern, joint or support hardware is qualified.

Body panels require at least 18 mm thickness. Horizontal body spans are bounded by `min(900 mm, 40 × actual panel thickness)`; floor preview is bounded to 2400 mm high and 500 mm deep. These are conservative **editor limits proposed for review, not structural/load ratings**. Material-driven thickness changes rerun the same checks.

Wall preview is bounded to 900 W × 1200 H × 350 D mm, with no plinth. A known wall substrate and at least 12 characters of fixing requirements are mandatory to apply/save it. Notes are recorded requirements, not approval. A qualified installer/manufacturer must assess anchors, substrate, hardware and loads. Floor models carry an explicit anti-tip anchoring requirement. Wall/floor coordinates remain local model coordinates; no installation elevation or drilling layout is claimed.

## Animation and inspection

Reference inspected: `D:/himu/EaseIT/v0-cabinet-cutting-generator/components/cabinet-3d-view.tsx`, especially its spring target positions, edge hinge pivot, largest-face text and transparent material settings. Adapt the behavior to the existing plain Three.js renderer; do not add a second rendering framework.

- Explode/collapse interpolates panel offsets from the model center. Doors hinge outward around their actual left/right edge; explode temporarily closes them and collapse restores the open setting. Camera distance adapts without changing its orientation. Reduced motion snaps to the same endpoint.
- Show dimensions renders panel name and cut width × height × thickness, explicitly in mm, on both cut-face sides. Text follows animated panel poses and has a screen-reader equivalent. Occluded/internal labels can be inspected using explode, orbit or X-ray.
- X-ray uses pale transparent panels, disabled depth writes, double-sided rendering and clear edges; original material colors/textures return in solid mode. Labels can be seen through panels in this inspection mode. X-ray does not certify collisions or fixing clearance.
- These are presentation states, never geometry mutations, material edits, undo steps, saved fields or manufacturing poses. Frame loops, labels, textures and controls are disposed with the viewport.

Short construction/material tasks and bounded selectors remain the editing pattern. Expose only implemented controls, preserve keyboard/touch alternatives, and keep inspection options available through the rail and Inspect task.

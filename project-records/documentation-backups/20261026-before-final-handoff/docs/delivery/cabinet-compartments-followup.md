# Cabinet configuration and panel labels — 24 October 2026

Later UI revision: Main editor forms are now docked on the left, with coordinated preview movement. Panel labels now have transparent backgrounds, white outlined text and no thickness line. The [docked editor follow-up](docked-editor-followup.md) supersedes the original popup and label styling described below.

## Current behavior

Cabinets now have one **Dimensions** entry point for size and construction. Its compact pages are **Size**, **Construction**, **Compartments** and **Sections**. The separate cabinet Build button and duplicate context-menu construction entry were removed. Other furniture families retain their existing construction forms.

Body, back, door and catalog material thickness inputs always display millimeters. Width, height, depth, section/compartment sizes and drawer measurements follow the global millimeter or inch/suta preference. Stored dimensions and all calculations remain millimeters. Changing units does not change geometry, the saved revision or Undo history.

Size means carcass size. Inset doors occupy the front of the internal opening. Overlay doors sit beyond the carcass depth, with the configured gap, and cover the outer side/top/bottom zone. Existing saved cabinets without a door-position option keep their original inset geometry. Measured floor/right projections include the actual closed door/drawer depth when it extends beyond the carcass.

### Compartments and sections

- Enable compartments to convert the simple shelf arrangement into a section layout. Existing projects remain in simple mode until this action is taken.
- Automatic layout follows the legacy grouping of doors in pairs, targeting a maximum leaf width of 457.2 mm (18 inches). Carcass/partition thickness is deducted from clear widths. Existing section settings survive automatic resizing.
- Manual layout supports adding/removing compartments, equalizing widths and assigning zero, one or two doors to each top-level compartment. Clear widths plus partitions must fill the internal carcass width. Width changes are validated rather than silently clamped.
- Sections stack from bottom to top with physical horizontal separators. Set a section height to zero to share the remaining height. Explicit heights and separator thickness must fit the available height. Sections can be added, removed and reordered.
- Conditional section types are open space, fixed/adjustable shelves, hanging space, drawer space and nested side-by-side dividers. Nested slots have independent section settings and widths. Doors belong to top-level compartments.
- Drawers have individual allocation height and optional depth. Depth zero calculates a fitting depth. Internal drawers sit behind the doors; external drawer sections replace the doors over that section. Boxes generate bottoms, sides, backs, recessed inner fronts and separate faces. The legacy 25.4 mm top clearance, 12.7 mm slide space per side, reduced inner fronts and supports between stacked drawers are represented as proposed construction rules.
- Hanging rods are rendered as 25 mm hardware with editable top offset. They never become rectangular sheet parts. Assembly reviews identify rod/support and drawer-slide hardware as requiring approval.

All sheet parts, poses, 2D projections, panel selection, materials, dimension labels and nesting use the same calculator. Advanced doors carry an explicit hinge side so animation remains correct across multiple compartments. Apply creates one history edit. Cancel discards the entire form transaction. Undo/Redo, browser recovery, local saves, account saves and immutable revision history preserve the nested configuration.

## Forms and labels

Reusable `ConfigSelect`, `ConfigNumber` and `ConfigTabs` controls were added under `src/components/ui`; the existing measurement input was extended with a fixed-millimeter option. CAD forms use smaller labelled controls, adaptive columns and conditional pages. Compact landscape layouts use four columns where needed; phone layouts retain two. The tested forms fit the viewport without internal scrolling.

The 3D **Show dimensions** labels now have a light translucent background, a restrained border and dark text. Width and height follow the global unit. Inch labels show separate W/H lines in inches and suta; thickness always shows mm. Unit changes repaint the existing textures instead of rebuilding the canvas. Labels remain attached to the panel faces and work with X-ray and the existing presentation animations. Screen-reader dimension text uses the same formatter. PDFs, nesting and machine-review outputs retain explicit millimeters.

## Storage changes and evidence

The owner approved `202610240001_cabinet_compartments.sql` after its dry run and isolated PostgreSQL tests. It is applied to the linked Supabase database. All 14 local migrations match the remote list. The migration extends cabinet snapshot/assignment validation and raises the transactional save envelope to 128 KB. It preserves ownership checks, idempotency, immutable revisions and the existing RLS policies. The API accepts the same 128 KB limit; browser recovery accepts up to 100,000 characters.

Read-only hosted checks accepted legacy cabinet, shoe-rack, bookshelf and table snapshots plus the new compartment envelope. The new compartment validator is executable by the service role; anonymous and authenticated roles cannot call it. All 26 public application tables still have RLS enabled. No user project or revision was modified by these checks.

Mongo snapshot validators were extended for bounded cabinet trees and stable nested part identifiers, without adding those options to the other families. Both application collections retain strict/error validation. An isolated temporary collection accepted four old-family snapshots and a new nested snapshot, rejected an unsupported door mode, and was removed. `scripts/check-compartment-storage.mjs` supports repeating the read-only schema inspection or the explicitly isolated synthetic write probe. No existing application document was written during that probe.

## Verification

- 75 unique unit/database cases are covered, including geometry golden fixtures, nested drawers/shelves/rods, physical non-intersection, malformed trees, stock conservation, history/recovery, canonical snapshots, SQL privacy and immutable revisions.
- 69 standard browser scenarios are covered successfully. The broad run passed 63; six cases were rerun successfully after updating obsolete label expectations and running deferred-auth cases against an isolated provider-disabled preview. The normal signed-in preview configuration was preserved.
- All 11 account/Google contracts passed, including compartment/overlay preservation through save, rename, reload and old revision viewing; routine session checks still preserve unfinished edits.
- TypeScript, full lint and the production contract build passed. Final targeted cabinet tests cover mm/inch forms at 1440 × 900, 390 × 844 and 720 × 450, hardware rendering, nested controls, invalid widths, Cancel, save/reopen and unit-only label changes without canvas replacement.
- Screenshots under `artifacts/review/cabinet-config/` were visually inspected, including phone/short-landscape drawer controls and inch-mode panel labels.

## Explicit boundaries

This ports the requested compartment/section behavior into the existing frameless review engine; it is not an import of every legacy construction template. Face-frame hinge notches, pocket backs, automatic splitting of oversized cabinets and legacy transform/project management are not introduced. Existing stock-fit checks still reject unsupported oversized parts.

The tree is bounded to six compartments per level, eight sections per compartment, three nested divider levels and 64 compartment/section nodes. Geometry is capped at 256 sheet parts. Assembly document review retains its existing 100-part limit. A nested external drawer requires its parent compartment to be open, so it cannot collide with a full parent door. Otherwise use an internal drawer.

Structural layout-part board assignments must match the effective body, back or door thickness used by the configuration. A mismatched assignment or an assignment on a deleted panel blocks Apply rather than silently changing its geometry; remove or reassign it before changing the layout. Joints, slide/hinge drilling, hardware selection, load ratings and manufacture remain unapproved. Live commerce, inference and machine release remain disabled. No real-user hosted save/sign-out acceptance was performed in this follow-up; account tests use the existing synthetic contract environment, alongside the separately verified hosted storage boundaries.

The 22-phase plan and launch gates are unchanged. This is a cabinet/UI follow-up, not a new numbered phase or launch approval.

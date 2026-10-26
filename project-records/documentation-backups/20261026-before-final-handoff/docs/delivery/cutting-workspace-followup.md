# Scrollable inspectors and cutting workspace — 24 October 2026

## Owner request

Replace pagination inherited from centered modals with scrollable left inspectors. Keep 3D and measured 2D fixed. Replace the bottom-left view buttons with a familiar X/Y/Z orientation gizmo, keep zoom and fit together at the bottom right, and show every sheet in a scrollable grid. Bring the legacy nesting and export tools into Sheets with uniform, compact styling.

## Workspace behavior

Inspector bodies now scroll independently beneath their fixed title and close control. Panel and cut lists show every row. Cabinet size, construction, compartment and conditional section fields share one continuous form. Other families show all construction fields together. Materials, revision history, warning notes, quote charges and assembly lists no longer paginate. Checkout and photo confirmation steps retain their meaningful review actions; material-search popups retain bounded results because they are still small modal pickers.

The X/Y/Z sphere-style gizmo sits at the top right. X selects Right, Y selects Top and Z selects Front; the small home control selects Iso. It follows camera orientation while orbiting and supports keyboard activation. Bottom-right zoom out, fit and zoom in remain grouped. The previous bottom-left navigator is removed. On small screens the open inspector takes priority; the preview and document never become a scrolling page.

Sheets alone has a scrollable grid and an optional horizontally scrollable parts table. All sheet cards appear together, with stock details, selection, per-sheet G-code exploration and explicit local completion. Parts can be sorted, resized, renamed, omitted through quantity zero, or supplemented with additional worksheet parts. These edits do not change cabinet geometry, undo history, account revisions, quotes or accepted production data. Core worksheet settings and extra-operation inputs remain in session storage for that project; changing the source design discards incompatible part/stock overrides.

## Legacy parity audit

Source: D:/himu/EaseIT/v0-cabinet-cutting-generator. Pure engine modules were brought across under src/lib/cutting/legacy/ with typed adapters; Redux/UI infrastructure was not copied.

| Legacy source / capability | Current implementation |
| --- | --- |
| board-settings.tsx and multi-board-selector.tsx: dimensions, thickness, material, spacing, padding, rotation, units | Scrollable Nesting settings, compatible published stock choices and per-category/material specification overrides. Body/front/back, finish pairs, thickness and grain remain distinct groups. Thickness/tool diameter stay metric; lengths use global mm or inch/suta. |
| nesting-engine.ts: MaxRects, Guillotine and multi-strategy Optimized; basic shelf helper | All four modes selectable. Independent conservation, stock-bound, dimension/rotation and spacing checks run on every generated layout. Grain restrictions override global rotation. Grooves/notches lock part rotation. |
| nesting-preview.tsx: layout/table, row sorting/editing, quantity, re-nesting, usage/waste, feed percentage, cut length/time/electricity estimates | All-sheet grid, sortable editable worksheet, live re-nesting, explicit unplaced list, usage summary, feed override and configurable power/electricity estimates. Estimates clearly exclude non-profile time. |
| export-panel.tsx: four cut orders, horizontal/vertical orientation, passes, safe Z, feed/depth, sheet selection | Nearest neighbor, 2-Opt, Scan line and One by one; XY swap, passes, safe Z, tool diameter, feed/plunge/spindle/depth fields, selected-sheet explorer and program download. Settings changes invalidate stale programs. |
| export-panel.tsx: per-sheet, all-sheet and category exports; panel CSV | Individual .unqualified.nc files; all-sheet and per-group ZIP containing separate programs, panel CSV in selected units, and complete worksheet JSON. Different sheets are never concatenated into one uninterrupted machine program. |
| export-panel.tsx: mark sheet done | Explicit confirmation records local worksheet completion only. Layout/settings changes invalidate the mark. No fabricated server production/order completion. |
| engraving-generator.ts and panel notches | Parts table includes groove edge, width/depth, offset, end gaps and up to four corner notches. Notches require One by one order; invalid tool/geometry combinations fail visibly. |
| circle-nesting-engine.ts and circular G-code | Separate circle worksheets with diameter, count, depth, outside/inside/pocket, hexagonal/tangent or rectangular packing and multi-sheet ZIP. |
| cuts-gcode-generator.ts | Separate single-cut worksheets with distance, direction, reference edge and quantity, using shared tool parameters. |
| generateGlassFrameGCode | Separate glass-frame opening with door size and four frame widths, tool and shared machining settings. |
| vector-gcode route | Local-only SVG conversion with scale, source units, XY offsets, on-line/outside/inside profiles, holes and shared machining settings. Files are never uploaded or rendered as HTML. Invalid offsets and oversized/unsupported SVGs fail explicitly. |
| G-code inspection | Program text, toolpath drawing, play/pause, progress scrubber and rapid-move visibility for generated sheet and extra-operation programs. |

## Corrections made during the port

Basic packing omitted inter-row spacing and could grow a shelf into the following row. MaxRects did not reserve spacing on the left/top of a newly split free area. Both are corrected and independently audited, including randomized fixtures. Groove edge names now select the matching physical edge. Circular pocket repositioning uses a feed move rather than a rapid move through stock. Programs retract before spindle start. SVG offsetting applies scale before cutter compensation, retains all resulting contours, processes holes before outer boundaries and retracts between passes instead of returning through stock. Invalid offsets never silently fall back to uncompensated paths.

## Production boundary

These are actual generated metric programs from the manual cutting worksheet, labelled unqualified. They do not constitute controller, hold-down, tooling, construction or physical-machine qualification. The existing frozen simulation, immutable accepted-design records, release guards and Phase 19 production qualification remain separate and unchanged. Production release is still disabled. No database migration or phase renumbering is required.

## Verification

Automated evidence covers all four families and all four packers, all four cut orders, randomized separation/conservation, grain locks, unplaced accounting, source immutability, tool/depth rejection, groove coordinates, safe circle repositioning, CSV escaping and ZIP directory structure. Browser journeys cover independent inspector scrolling, axis views, all-sheet grids, real NC/ZIP downloads, stale-program invalidation, extra operations, worksheet persistence and compact layouts. Screenshots are retained under artifacts/review/cutting-workspace/.

Follow-up verification: the complete cutting workspace journeys also passed in the broader standard browser run. The later guided cabinet follow-up records the current aggregate test results. See [guided cabinet configuration](guided-cabinet-followup.md).

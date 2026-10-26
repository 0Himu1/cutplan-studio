# Final workspace UI, interaction and inspection

This is the current interface addendum to root DESIGN.md. It preserves the established system while resolving post-22 decisions; it does not introduce another visual direction.

## Canvas, dock and density

Opening a project presents centered furniture in a dominant preview, a compact command bar and 3D / 2D / Sheets modes. Floating tools sit inside the preview, not full-height sidebar rails. The 3D/2D page fits the viewport. A nonmodal left inspector takes approximately one third of desktop width, shifting/resizing the preview; closing reverses the transition.

The original no-scroll request was refined: **dock contents and Sheets may scroll**. The outer 3D/2D page stays fixed. Remove pagination inherited only from old modal constraints. Meaningful checkout/photo steps and genuinely bounded search tasks remain separate cases.

Keep the dock action footer reachable. On narrow screens the inspector takes priority without horizontal overflow. Shared compact fields use consistent labels, aligned inch/suta sublabels, two columns when space permits and a single-column fallback. Calculated values look distinct from editable inputs.

## Final tool inventory

| Position | Actions | Rule |
| --- | --- | --- |
| Left floating stack | Dimensions/combined cabinet configuration, distinct family Build, Materials, Select, Panels | Cabinet Size/Build share one form; avoid duplicate launchers. Materials uses SwatchBook. |
| Right floating stack | Explode/collapse, Open/close doors and drawers, Show dimensions, X-ray, Hide Doors, Hide Back | Hides moved right by R062; earlier left placement is obsolete. |
| Top right | Orbit-aware XYZ sphere-style gizmo and isometric/home action | X→Right, Y→Top, Z→Front; follows camera orientation. |
| Bottom right | Zoom out, fit, zoom in | Standard navigation grouping. |
| Context/project actions | Relevant configuration, remaining panel/project/document/command tasks | Do not restore redundant Inspect, Measure or Cut list toolbar buttons. |

The old bottom-left Front/Top/Right/Iso row and duplicate camera controls are superseded. Inapplicable controls use deliberate disabled states. Icon-only tools are approximately 38 px desktop with 18 px glyphs and 44 px touch targets where needed. Every icon needs an accessible name, hover/focus/tap explanation and visible keyboard focus. Selected/toggle states use semantic accent treatment and appropriate pressed state.

## Theme and explanatory color

Use existing semantic surface/elevated/border/text/muted/accent/danger/success tokens and Tailwind utilities. Preserve the indigo/violet action accent. Light mode covers canvas/grid, forms, controls, 2D, Sheets, tooltips and context menus; avoid dark-only colors.

Compact hints replace repeated paragraphs. Detailed help belongs in tooltips/disclosure. Available/allocated/divider/automatic values use meaningful accent colors **and labels**, not color alone. Unallocated empty height is a red advisory; genuine overflow/minimum failures remain errors. Use thin borders, restrained spacing and consistent control geometry. Compartments collapse; sections remain open.

## Motion, visibility and dimensions

Dock entry/exit uses the established approximately 260 ms transition with reduced-motion support. Explode/collapse and door/drawer opening animate; drawer boxes/faces extend together. State and animation endpoints stay consistent. These actions do not update manufacturing dimensions, quotes or account revisions.

Hide Doors and Hide Back filter only the viewer. Hide Back targets cabinet back panels, **not drawer-box backs**. Hidden panels cannot be picked or labelled/inspected, but remain in physical calculations/cut lists/saved input. Visibility is not deletion.

Show dimensions uses transparent textures: panel name, width and height, white text with legibility outline, **no filled rectangle or repeated thickness**. Labels follow global mm/inch-suta mode. Check contrast against board colors in future regressions.

## 2D and Sheets

2D retains measured orthographic views and selection without a scrollable page. Floor plans use actual notch outlines. Sheets displays all sheets as cards in a scrollable grid with stock/material grouping, usage and unplaced parts. The editable table may scroll horizontally. Single-sheet Previous/Next pagination is obsolete. Worksheet changes are separate from cabinet geometry, Undo history, account revisions, quotes and accepted production records.

### Legacy cutting capabilities brought forward (R021)

| Capability | Current behavior |
| --- | --- |
| Stock | Dimensions, material/thickness groups, spacing/padding/margin, rotation and grain locks. Global length units; metric thickness/tool diameter. |
| Packing | Basic, MaxRects, Guillotine and Optimized; independent conservation/bounds/spacing/rotation audits. |
| Parts | Sorting, rename/resize, quantity-zero omission, extra parts and live re-nesting. |
| Estimates | Utilization, cut length/time, feed override and power/electricity; non-profile time excluded. |
| Program settings | Tool diameter, feed/plunge/spindle, passes/depth, safe Z, XY orientation and sheet selection; changes invalidate stale programs. |
| Ordering | Nearest neighbor, 2-Opt, Scan line and One by one, with explicit notch/groove restrictions. |
| Exports | Individual `.unqualified.nc`, per-group/all-sheet ZIP of separate programs, unit-aware CSV and worksheet JSON. Never concatenate sheets into one uninterrupted run. |
| Extra operations | Grooves/corner notches, circle packing/cutting (inside/outside/pocket), single cuts, glass-frame openings and local SVG conversion. |
| Explorer | Program text/toolpath, play/pause, scrub and rapid visibility. |
| Completion | Confirmed local sheet-done mark, invalidated by layout/settings changes; not server order completion. |

SVG files remain local and are not trusted HTML. Scale precedes cutter compensation, holes precede outer boundaries and passes retract safely. Invalid offsets do not silently fall back to uncompensated cuts. Packer spacing, groove coordinates and circle-pocket repositioning corrections are recorded in [the cutting follow-up](../delivery/cutting-workspace-followup.md).

Manual worksheet outputs are actual generated metric **unqualified programs**. Frozen production simulation remains a separate gated path; neither establishes qualified machine operation.

## Notch-aware X-ray collision inspection (R063–R066)

The old enclosing-box approach could color removed notch space. Current inspection uses the actual orthogonal panel contour:

1. Split solid profiles into disjoint rectangular pieces, excluding notches; merge adjacent rectangular cells.
2. Broad-phase world boxes identify candidate pairs.
3. Supported right-angle poses intersect actual solid boxes.
4. Merge overlap boxes before filtering so subdivision seams cannot hide real interference.
5. Display translucent emissive red volumes with panel IDs/names. Ignore contact and overlap **no greater than 1 mm in any axis**.

Only visible, closed, assembled panels are checked. Markers pause while opening/exploding and through closing/collapse animation; status explains the required view. Markers are not pickable, and replaced resources are disposed.

The 1 mm threshold is visual, not machining clearance. Arbitrary poses are reported unchecked; there is no misleading AABB fallback. Current cutouts are rectangular corner notches, not arbitrary curves/internal holes. Swept motion collisions are not tested. The overlay changes no design/material/stock/approval data.

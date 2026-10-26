# Corner notches and shelf front setback — 25 October 2026

## Behavior

Cabinet shelves, horizontal section separators and side-by-side compartment partitions (including nested partitions) now stop 25.4 mm (1 inch) behind their previous front plane, while staying aligned to the back. This includes the original single-opening cabinet, compartment shelves, adjustable shelves and nested divider layouts. The separate shoe-rack/bookshelf family templates retain their prior depth rules. Drawer boxes and drawer-support strips retain their existing fit rules.

A shelf beside a door-frame strip now keeps its rear width up to the actual partition face, instead of losing that width for its full depth. Its front-left corner receives a through-notch where the strip projects into the opening. With an 18 mm body and a 76.2 mm frame, the fixed shelf notch is 18 × 50.8 mm. Adjustable shelf side clearance reduces the required notch width. Nested leftmost slots inherit the frame intrusion. Front drawer clearance remains based on the narrower opening.

## Shared geometry and cutting

- One panel contour feeds the real extruded 3D mesh, floor-plan polygon and Sheets outline. Ray selection passes through the removed corner.
- Derived notch dimensions are included in the CSV and travel with generated parts into nesting and the existing legacy contour postprocessor. Notched parts retain orientation; nesting continues to reserve their full rectangular stock envelopes.
- Sheets offers a direct One by one cut-order action when notches are present. Other cut orders retain their explicit validation restriction.
- Assembly review data includes notches, the PDF adds a millimeter notch schedule, and frozen sheet diagrams show finished outlines.
- The separate frozen rectangular-only production reviewer refuses notched parts rather than generating incomplete rectangular cuts. Its existing release restrictions remain unchanged.
- Stored cabinet input and database permissions do not change. The derived geometry recalculates from existing dimensions; previously saved cabinet shelves therefore adopt the requested setback when opened with this calculator.

## Verification

101 unit tests pass, including exact setback/back alignment in inset and overlay configurations, restored shelf widths, fixed/adjustable notch dimensions, section separator profiles, 3D triangle area and raycasting, physical frame clearance, nested layouts, nesting conservation and contour G-code generation. Updated golden dimensions reflect the requested setback. TypeScript and ESLint checks pass.

Seven browser scenarios passed. Browser coverage checks 3D, floor-plan cutouts, Sheets contours and cut-order recovery, save/reload, units, nested forms and existing frame behavior. Visual evidence is stored in `artifacts/review/corner-notches/`.

This supersedes the rectangular-shelf limitation in the previous door-frame follow-up. Phase numbering and approval gates are unchanged.

Follow-up: side-by-side partitions now share the 25.4 mm front setback; their back alignment and height remain unchanged. Door-frame strips retain their original 76.2 mm depth and front position. Root/nested, inset/overlay, shallow-depth validation and cutting-data checks cover this change.

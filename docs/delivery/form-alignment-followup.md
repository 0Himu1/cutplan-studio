# Cabinet form alignment — 25 October 2026

The inspector now uses shared field-label and control regions. Within a row, labels share a top edge and controls share a baseline even when the neighboring inch/suta field has an extra unit-label row. Inch/suta columns are equal width, with the same 8 px column gap as the containing form grid. Full-width rod inputs therefore align with the two main field columns.

Editable and calculated controls share a 32 px desktop / 44 px narrow-or-coarse-input height token. Read-only Width, Height, Box width and Depth values use a reusable ConfigValue output with a quiet surface, so they align with editable controls while remaining visibly distinct. Display units uses the same field structure. Existing field names, IDs and accessible labels are preserved.

Hanging-rod help is placed alongside its field label with reserved label space and a non-overlapping hit area. Drawer hardware help sits beside Drawer position, replacing its detached icon row. Section header actions keep their existing compact aligned layout. The form retains Inter, existing light/dark surfaces and indigo/status colors. No measurement conversion, allocation, ordering or persistence logic changed.

Verification: the initial ten targeted browser journeys passed for cabinet configuration, global inch/suta behavior, persistence and compact top-down sections. The expanded alignment scenario and top-down flow passed again after checking the unit selector and calculated compartment width. Pixel-bound checks cover label tops, control positions/heights, equal fraction columns, rod-column edges and help-icon centers at 1440 px and 390 px, in mm and inch/suta. Light/dark screenshots were inspected under artifacts/review/form-alignment/. TypeScript and ESLint pass.

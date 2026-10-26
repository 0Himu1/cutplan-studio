# Board defaults and role colors — 25 October 2026

## Behavior

Cabinet Construction now offers separate Body, Back and Door board selectors. Selecting a published board sets the group's physical thickness, stock dimensions and grain from its SKU. Body changes proportionally refit compartment widths and nested slots. Thickness remains in millimeters. Manual thickness remains available when no board is chosen.

Defaults apply to existing and newly generated parts: body includes shelves, partitions, frames and drawer box fronts/sides; back includes cabinet backs, drawer backs and drawer bottoms; door includes doors and drawer faces. Choosing a group board clears explicit assignments for that group. Individual panel overrides remain available afterward.

Compatible published finishes can be selected per group, on both faces. Their catalog colors and textures take priority on those faces. Each group also has a stored custom preview color; it does not select, publish or price a real finish. Preview-only designs still need actual boards/finishes and existing commercial approvals before ordering. The current global catalog already supports finish colors, textures and board compatibility, so no catalog publication rules were changed.

## Implementation and persistence

Optional `materialDefaults` are part of canonical cabinet snapshots, recovery, Undo/Redo and revision hashes. Old snapshots without defaults retain their existing representation. A shared material resolver drives 3D faces, panel editing, stock-fit warnings, both nesting paths, quotation validation/pricing and assembly material IDs. Separate board overrides replace inherited board/finish data; partial grain/edge overrides can inherit defaults. Invalid or unavailable board defaults provide a visible replacement/manual recovery path.

Applied `202610250001_cabinet_material_defaults.sql` to the linked database. It replaces the snapshot-validator body without changing grants, policies, owner checks or save limits. Updated MongoDB collection validators using the existing setup script. No project documents or catalog items were created for testing.

## Verification

- 107 unit tests pass, including role inheritance for new frames/drawers, geometry resizing, compatible finishes, preview color precedence, stale/invalid specifications, canonical persistence, SQL acceptance/denial and unchanged SQL function privileges.
- TypeScript and ESLint checks pass.
- Browser checks cover role selection, colors, compatible finishes, save/reload, global units, empty catalog/manual fallback, responsive alignment and existing cabinet workflows. Two cold/concurrent runs exceeded the 30-second test limit; both passed on a warm sequential rerun without changing assertions or timeouts.
- Screenshots in `artifacts/review/board-defaults/` show distinct body/back/door appearances and desktop/mobile controls in light/dark themes.
- Linked migration dry-run reports no pending migrations. A live read-only SQL check accepts role defaults and reports anonymous/authenticated validator access false, service-role access true.
- A collectionless MongoDB schema probe using the installed live validator accepts an ephemeral default-color snapshot with zero writes. No new real-user login or hosted revision was created in this follow-up.

Phase numbering, catalog review requirements, and disabled live commercial/production gates remain unchanged.

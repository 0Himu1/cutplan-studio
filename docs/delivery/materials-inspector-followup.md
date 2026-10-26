# Materials inspector — 26 October 2026

## Result

Cabinet board selection moved from Dimensions/Construction into the Materials inspector. A swatch-book toolbar icon distinguishes Materials from the panel list. The Dimensions form retains a compact read-only body/back/door thickness summary, while all cabinet board choices and manual thickness controls live in Materials.

The inspector has two clearly labelled scopes: Cabinet boards and Individual panel. Cabinet boards uses compact Body, Back and Doors group controls, showing one group at a time. Its category and fixed thickness selectors reuse the shared board picker, with stock dimensions, per-sheet price, catalog color, compatible finishes and the existing manual preview fallback. Board thickness remains millimeters regardless of global display units. Group changes use the existing atomic reflow and inheritance logic.

Individual panel uses a direct panel selector without a nested modal or pagination. A compact summary distinguishes inherited defaults from local overrides. Board category, fixed thickness, catalog color, stock and grain remain visible; face finishes and edge banding use collapsible groups only when available or already assigned. Use cabinet default removes the local override. Copy to matching panels preserves the existing bulk-copy capability. Choosing the default option now correctly restores inherited material data rather than creating an empty override that immediately re-inherited a board.

Draft changes preview before Apply materials. Cancel discards them; Undo/Redo, local and account persistence, existing panel IDs and downstream material calculations are preserved. Stock-fit warnings remain advisory during design editing. Catalog failures disable editing, preserve current choices and provide Retry outside the disabled fieldset. Catalog publication, prices, database schemas and permissions were not changed.

## Design and verification

Used UI/UX Pro Max form-label and feedback guidance, the existing shared controls and semantic theme tokens. Its disclosure search did not identify a matching pattern; the two-scope split uses general form/accessibility guidance. Verified dense desktop layout, mobile layout, light/dark themes, visible Apply/Cancel actions and no inspector horizontal overflow. Screenshots are in artifacts/review/materials-workspace/.

Ten targeted unit checks passed for inherited boards, physical reflow, stock, color and finish priority, validation and saved material data. Browser coverage includes role board selection, fixed thickness and units, catalog colors, save/reload, manual fallback, group/panel changes, compatible finishes, default reset, cancellation, recovery, stock warnings, other furniture families and existing cabinet forms. An isolated production-built account workflow checks revision saves and read-only history; it does not use a real hosted login. TypeScript and ESLint pass.

Fifteen relevant browser cases passed across the affected suites. Native-selector transaction checks include finishes, edging, cancellation, Undo/Redo and persistence.

Phase numbering and launch approval gates are unchanged.

# Board categories and thickness variants — 25 October 2026

## Result

The owner selected six board families: Plain MDF, plain wood-chip particle board, MR-grade plywood (explicitly confirmed), Gorjon plywood, marine-grade plywood and veneered board. Melamine, HPL, UV high gloss and acrylic remain surface finishes and were not added. Jute board and other researched categories were not selected.

The staff grid shows one card per category code. Opening a category provides a fixed thickness selector, with separate Details, Pricing, Finishes and Availability for the selected physical variant. Category cards show their thicknesses, price range and publication count. Saves return to the grid. Retired records no longer appear as active choices.

Cabinet Body, Back and Door board selectors and individual panel board controls now select category first, then a fixed physical thickness. Matching thickness is preserved when changing category; otherwise the closest available thickness is selected. Thickness always remains in millimeters. Physical variant UUIDs still identify material assignments, prices, nesting stock and downstream calculations; existing saved references are unchanged.

## Data and migration

Applied `202610250002_board_category_variants.sql`. It adds a category code to existing catalog items and extends the existing catalog transaction to validate the selected category/thickness and prevent duplicate active variants. Existing function grants, RLS policies, project schemas and immutable price history are unchanged. Legacy uncategorized records remain readable and editable under their existing rules.

Imported 39 active variants across six categories: MDF 7, wood-chip particle board 7, MR plywood 6, Gorjon 9, marine plywood 6 and veneer 4. There are 26 independently sourced draft sheet prices and 13 missing prices. No prices were fabricated or set to zero. All 39 variants remain unpublished pending supplier verification. No finish entries were created. The previous 23 boards and one finish remain retired with their historical references and price records preserved.

Evidence, source captures, idempotent import SQL and live receipt are in [the category import record](../../project-records/catalog-imports/2026-10-25-board-categories/variants.json). Vendor prices are examples for specific suppliers/grades, not universal category prices. Missing quotes are MDF 3/9/25 mm, all MR plywood variants and all veneered variants. Veneer core/species, exact nominal sheet dimensions and directional grain restrictions still require review before publication. Feet-only dimensions use exact foot conversion; metric-published veneer stock retains 1220 × 2440 mm.

## Verification

- 109 unit tests passed, including category grouping, fixed thickness validation, duplicate rejection, isolated price histories, retirement, legacy references and unchanged SQL function privileges.
- The import was executed twice in isolated PostgreSQL: six categories, 39 variants, 26 price rows, zero publications and no duplicates.
- Four staff catalog browser tests passed on an isolated authenticated contract server, including per-thickness pricing, category cards, fixed choices, creation, save-return behavior and mobile layout. That server performs a production build separately from the normal preview.
- Three cabinet board browser tests passed, including physical recalculation, category/variant selection, canonical millimeter thickness, local save/reload and existing manual fallback.
- TypeScript and ESLint passed. Screenshots are under `artifacts/review/board-categories/`.
- A live read verified every imported category, thickness, dimension, source URL and price. The normal preview health and public catalog endpoints return 200; an unauthenticated staff catalog request returns 403. No new live user sign-in or hosted project revision was created for verification.

## Next action

Review each variant's supplier specification and price in the staff catalog, complete missing quotes, and publish only verified stock. Surface-finish catalog work remains deferred. Phase numbering and launch approval gates are unchanged.

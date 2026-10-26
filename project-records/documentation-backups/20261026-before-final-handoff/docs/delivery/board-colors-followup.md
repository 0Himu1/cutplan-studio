# Board catalog colors — 25 October 2026

Board creation and editing now include a native color picker and validated six-digit hex input. Color is stored on the physical board/thickness variant, appears as its catalog swatch, and is inherited when selecting that board in a cabinet or individual panel. No separate finish entry is needed.

The 3D preview resolves appearance in this order: assigned face finish, catalog board color, existing project preview color, default beige. Edges use the board color unless separately edged. The cabinet color field displays the catalog color and directs users to edit it in the catalog. Legacy boards without a catalog color retain their existing preview behavior. Existing stock was not assigned invented colors.

Applied migration 202610250003_board_colors.sql. It adds nullable, hex-validated board color storage and extends the existing catalog create/edit transaction. Grants, RLS, stock dimensions, saved board IDs and prices remain unchanged. Editing a board color unpublishes that variant through the normal details-review workflow. Other thickness variants keep their own colors.

Verification: 11 targeted unit/database tests passed, including color persistence, invalid hex rejection, separate variant colors, unchanged price history and privileges, preview precedence and legacy fallback. Four staff catalog browser tests passed on the production-built isolated contract server, covering color creation and saved payloads on desktop/mobile. The linked database exposes the new column and preserves all 62 existing board rows with null colors. Three cabinet browser checks passed after the Webpack restart, including board-color selection, switching thicknesses, millimeter-only thickness and local save/reload. The initial Turbopack run failed during repeated page reloads before form readiness. Screenshots are under artifacts/review/board-categories/.

The local Turbopack preview encountered repeated reloads during browser checks. The preview was restarted with Webpack; this is a local server invocation, not a change to the project dev script.

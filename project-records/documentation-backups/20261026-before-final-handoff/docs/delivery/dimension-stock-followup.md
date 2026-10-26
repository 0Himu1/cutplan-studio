# Dimension editing and stock-fit follow-up — 24 October 2026

The cabinet calculator previously treated a panel exceeding selected sheet dimensions or grain orientation as invalid design geometry. This disabled Apply measurements and prevented persistence even when the cabinet itself was geometrically valid. The result depended on the final dimensions, not which dimension was edited first.

Stock-fit problems are now structured `stockIssues` and readable warnings. The calculator still returns all valid panel dimensions and poses, allowing live preview, Apply, undo, recovery and browser/account saving. Dimension limits, invalid numbers, impossible construction, unusable margins and stale material assignments remain blocking errors.

The Dimensions inspector shows the affected panel, its dimensions, usable sheet dimensions and grain restriction, with guidance to select suitable stock in Sheets or Materials. The app does not silently enlarge purchased stock, rotate grain-locked panels or invent joints to split a large back. Shared shoe-rack/bookshelf calculations propagate stock warnings; family-specific structural envelopes remain enforced.

Nesting retains oversized parts as unplaced. Quote pricing and frozen production review still reject incomplete nesting. Manufacturing approval and release gates are unchanged. No database migration is required.

Measurements recalculate immediately as inputs change. Apply measurements commits the form edit; Save browser design / Save design revision persists it. This change does not introduce automatic cloud writes while typing.

Verification: 87 unit/database checks passed; 10 cabinet/cutting browser scenarios passed, including width-first and height-first large designs, changed depth, persistence/reload and explicit unplaced parts. The signed-in cabinet save/history contract passed with a 2600 mm design and an existing material assignment. Production compilation, TypeScript and ESLint passed. The account contract uses an isolated provider/API test double, not a live database migration or hosted-service approval.

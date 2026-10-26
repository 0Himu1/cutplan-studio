# Compact material catalog — 25 October 2026

## Flow

The catalog now starts as a searchable grid of boards, finishes and edging. Cards show specification, current price and publication state. Category filters and a clear-filter empty state help locate stock.

Selecting a card hides the grid and opens one compact editor. Creating, editing, pricing, saving finish pairings, publishing, unpublishing or retiring returns to the grid after success. Back and Close return without saving. A failed save keeps the form and typed values available.

Details, Pricing, Finishes (boards only) and Availability separate tasks instead of stacking every form into one long page. Details reuse the cabinet configurator's fields, paired inch/suta inputs, fixed-mm thickness, segmented choices and help icons. The finish editor includes a color picker and an optional texture group. Draft fields survive switching between sections. The editor measures available viewport height so its action footer stays visible; longer fields scroll inside the editor.

## Safeguards and scope

Existing staff authorization, request validation, catalog transactions, price history, publication review and retirement confirmation remain in force. New prices/details still unpublish stock. Boards use sheet prices and edging uses meter prices. Finish pairings are staged and saved explicitly, with each change using the refreshed material version; partially completed batches remain visible for review and retry.

No database or production catalog data was changed for this redesign. Tests use an isolated sign-in/staff protocol double and intercepted catalog responses. Existing source links, availability controls and price history remain accessible. Only the user's accepted grid/form layout was implemented; the earlier proposed simultaneous list/editor layout was superseded.

## Verification

- Four browser journeys cover grid/search/category behavior, grid replacement and save return, board/finish creation, retained form drafts, price validation, publication review, retirement, multiple finish pairings with current versions, failed-save recovery and exact mm/inch/suta submission.
- Desktop and 390 px phone screenshots in both themes are under `artifacts/review/catalog-ui/`. Tests check horizontal overflow, visible Save actions and 44 px phone inputs.
- Both catalog unit tests pass, including database-controlled authorization, stale versions and preserved price history.
- TypeScript and full ESLint checks pass.

Phase numbering, catalog publication gates and project handoff scope remain unchanged.

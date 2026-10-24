# Phase 5 — material catalog

Status: implementation and hosted migration applied; owner review accepted 2026-10-22. Owner requested Phase 6.

## Implemented

- Staff-only `/admin/catalog`, linked from the approved administrator's account page.
- Board, finish and edging creation and specification editing, search, source review, publish/unpublish, explicit retirement confirmation and preserved price history.
- Explicit board/finish compatibility controls.
- Transactional, authenticated staff mutations with parent-row locking, optimistic version checks and actor/action audit events.
- Immediate price replacement closes the previous effective interval and inserts a new historical version; existing amounts cannot be edited or deleted.
- Publishing requires explicit specification/unit/availability review and a positive current price. Editing details or prices unpublishes the item.
- Customer `/api/catalog` exposes published, nonretired materials with current prices and no supplier sources or internal audit fields.
- Imported records remain unpublished. The imported edge-banding unit is not approved; staff must enter a verified per-meter price before it can be published.

## Validation

17 unit/database checks passed, including staff denial, stale version rejection, price history preservation, compatibility, retirement and direct-customer write denial. TypeScript, ESLint and the production build passed. All 23 existing browser regressions passed against the production preview. The Impeccable detector returned no findings for the catalog component.

The first development-server regression run exposed a startup input race in the existing draft-name field. The field now stays disabled while browser storage loads. The final complete production-preview regression passed, including named draft creation and canceled sign-in preservation.

Live browser verification confirmed the four imported candidates load with source links and correct specifications. A clearly labelled, unpublished verification finish was created and given two synthetic price versions; both remain visible in history. Publishing was not exercised on supplier candidates because their review is the owner's task. The anonymous staff API returned 403 and the customer catalog returned zero published materials. Desktop and 390px mobile captures are in `artifacts/phase-05/`; mobile content does not overflow horizontally.

## Owner checkpoint

Open My account → Manage material catalog. Review an imported material, inspect its source, edit specifications, enter a verified price, then publish it. Add a finish and pair it with a board. Use a disposable material to verify retirement and retained price history. No imported item is automatically approved for sale.

## Limits

Supplier availability, technical suitability and selling prices require owner review. Price versions take effect immediately; scheduled future pricing is not exposed. Existing projects do not consume catalog assignments until the panel/material editor phase. Account-project deletion feedback remains recorded separately from catalog retirement.

## Pricing-form follow-up and owner acceptance — 2026-10-22

The existing PVC/edging pricing-form follow-up is now recorded: the form shows the currently saved price, restricts edging's new price to meters, explains why an imported non-meter unit cannot be published, requires a positive BDT amount and change reason, and tells staff to save a price before verification/publication. The price/publish editors are keyed by material identity and version so switching or refreshing an item resets their local form state. These behaviors were inspected in `src/components/catalog/workspace.tsx` during the Phase 6 handoff update; no new live PVC price mutation or dedicated pricing-form browser test was performed in Phase 6.

The owner confirmed review complete and requested the next phase. Phase 5 is accepted; this does not certify every imported supplier record or publish any item automatically.


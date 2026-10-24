# Phase 18 — controlled editor commands

Status: offline command-review software implemented, 23 October 2026. Live AI interpretation is not implemented or enabled. This is a deterministic local demonstration of the proposed AI command contract, not an inference claim.

## Delivered

- Open a project, choose Inspect, then Editor commands. Right-click/context keyboard actions offer the same task. No extra permanent toolbar or scrolling panel was introduced.
- Supported grammar: add a shelf, remove a shelf, and set width/height/depth to an explicit number with mm, cm or in. Join up to four operations with a semicolon.
- Strict operation/field allowlists reconstruct a candidate. Family rules and the current geometry calculator reject invalid results, unsupported table shelves, unknown actions and no-op changes.
- Review displays before/after values. Discard preserves the design. Apply commits the entire proposal once; one Undo restores it. Saving remains explicit.
- Proposals bind to the canonical current configuration. Stale or malformed output cannot apply. Pricing, roles, orders, exports and arbitrary code are outside the contract.
- Existing material assignments are preserved; removing an assigned panel is rejected by existing geometry validation rather than silently dropping its assignment.

## Verification

Seven new command/production unit and executable SQL tests pass; 57 total unit/database tests pass. Typecheck, lint and production build pass. Targeted browser checks cover invalid input, proposal/discard/apply/undo, restored shelf count, and zero canvas/dialog scrolling at 1366×768, 768×1024, 390×844 and 720×450. Full-suite results are recorded in the combined Phase 19 checkpoint.

Screenshots: `.impeccable/review/phases-18-19/commands-{1366,768,390,720}.png`.

## Owner checkpoint and remaining gate

Create a bookshelf. Inspect → Editor commands: enter `add a shelf; set width to 700 mm`, review, apply and Undo. Try an unsupported order or price command.

A future live provider requires explicit provider/model configuration, server-side output validation using an expanded versioned source contract, abuse/budget controls and genuine inference evaluation. The current adapter intentionally accepts only `local_command_demo`; changing a source label cannot activate an AI provider. These are outstanding Phase 18 activation items, not completed work.

The owner requested Phase 19 in the same increment. See [Phase 19](phase-19-report.md).

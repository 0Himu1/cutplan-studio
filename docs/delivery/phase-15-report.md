# Phase 15 — confirmation and tracking, combined test-mode checkpoint

2026-10-23. Phases 14–15 implemented for owner review with test policies, as explicitly requested. **Phase 16 is next; Phases 16–22 remain seven numbered phases.** This is not a live commercial launch.

## Delivered

- Quote review, canonical PDF download, explicit no-send test email feedback, delivery/contact validation, order review, one test confirmation and reloadable test tracking in the existing canvas workflow.
- Clearly separated synthetic table/prices/areas and tab-only test orders. Test samples never enter account orders, payments or manufacturing. Personal drafts remain unchanged.
- Authoritative server engine and account API foundations for immutable versioned quotes, exact money, complete stock quantities, per-line half-up rounding, policy/inclusion checks, quote expiry/staleness and a frozen accepted design/price/nesting snapshot.
- Transactional order confirmation with quote/project locks, owner/revision/expiry/service-area validation, one order per quote, same-operation conflict protection, event and outbox creation. Confirmed never means paid.
- Owner-only order metadata/events; private cost-policy snapshots are protected. Tracking presents all four defined stages with timestamps only for events that exist; Phase 16 owns authorized progression.
- Optional gated email adapter with durable unique requests, bounded retries, leases and provider idempotency. No real email dispatch or provider acceptance test is claimed.

## Verification

45 unit/database tests and 48 standard browser scenarios passed, with strict types, lint and production build. New checks cover exact totals/rounding, unapproved/missing inputs, immutable policy clones, canonical PDF metadata, private-field exclusion, normalized and bounded addresses, executable SQL expiry/staleness/ownership/idempotency, immutable records and one outbox/event per order. RLS tests include two local identities and protected private columns.

Ten Google/account contract scenarios passed. A focused signed-in check also verifies quote, order and email endpoints return `live_commerce_disabled`; no commercial data is created. Existing cabinet/casework/table saves, history, material editing, auth boundaries and canvas layouts remain covered. A synthetic provider is not a hosted real-identity or real-email claim.

The test flow downloads PDF, validates delivery, handles double-click confirmation, reloads tracking and leaves the source draft unchanged. Quote/delivery tasks fit 1366×768, 390×844 and 720×450 without scrolling. A final three-scenario development-server smoke run also passed after adding the frozen furniture summary. The PDF was rendered and visually reviewed; text extraction verifies its BDT 11300.00 total and non-commercial label. Captures/PDF: `.impeccable/review/phases-14-15/`.

Additive migration `202610230003_quotes_orders.sql` applied; final linked dry run is up to date. No policy/quote/order seeds, catalog edits, provider credentials or staff-role edits were made. Runtime dependency audit reports zero vulnerabilities; the existing Next/ESLint development dependency chain reports five high advisories and is carried to maintenance/launch qualification rather than forcing an unrelated framework downgrade.

Source/docs/tests baseline: `project-records/source-baselines/20261023-before-phases-14-15/source.zip`, SHA-256 `C9A889A31975D999377E8ECBD2A8511E5C5B8D825B125BE17D2AC7876DF1CFA3`. This is not a database/environment backup.

## Owner review and remaining gates

At `http://127.0.0.1:3100/projects`, open a project, choose Quote and order in the command bar, then Try test quote and order. Review charges, download the test PDF, check no-send feedback, enter test contact/address, confirm and follow Test tracking. Test records live only in that browser tab.

Live quotes, real email and live confirmation are explicitly blocked. Activation still needs approved fixtures/capabilities, commercial inclusions and rates, tax/discount/cancellation/payment wording, real Dhaka areas, delivery commitment, provider setup and hosted acceptance. Future UI/server gate changes must be deliberate and reviewed; credentials alone are insufficient. No CNC or manufacturing release is introduced. See the [design/rules record](../design/phases-14-15-commerce.md).

Phase 16 admin/bids/qualified profile assignment is next on owner instruction. Phase 19 retains toolpath/physical qualification. Original phase IDs and acceptance gates are unchanged.

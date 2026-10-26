# Phases 14–15 — quote and order integrity

## Owner-approved implementation boundary

On 23 October 2026 the owner explicitly requested the full workflow with clearly labelled test policies while keeping live quotations and order confirmation blocked. No commercial policy, construction approval, service-area coverage or provider delivery approval is inferred. `LIVE_COMMERCE_ENABLED=false` is a server-side gate on quote issuance, confirmation and real email. No approved policy or commercial quote/order is seeded in the linked database.

## Customer workflow

The command bar adds Quote and order, opening short tasks over the existing viewport. A local or unsaved design cannot obtain a live quote; account readiness uses the saved revision. Try test quote and order uses a separate synthetic rectangular table, board SKU and policy. It never substitutes a priced result for the customer's project. Quote review pages contain three charges, then delivery/contact fields, review and confirmation. PDF is visibly TEST ONLY / NO COMMERCIAL VALUE. Email explicitly reports that nothing was sent. Test orders are bounded to 20 records in this tab's sessionStorage; they survive reload, are shown in Test tracking, and never enter account orders, payments or manufacturing.

The sample prices are not a business offer: one full sheet at BDT 8000 before a synthetic 10% materials markup, BDT 1500 fixed labor and BDT 1000 delivery, zero tax/discount, free assembly guide; total BDT 11300. Areas marked `(test)` are synthetic choices, not coverage claims.

## Authoritative engine

Money uses BigInt minor units. Decimal catalog prices accept at most two BDT decimal places. Finish quantities use exact micrometer-derived area and edging quantities use micrometer-derived length; no binary floating-point monetary calculation. Each materials charge is rounded half-up to two BDT decimal places after quantity and materials markup. Fixed labor/delivery are selling charges, then rounded subtotal tax and fixed discount produce total. Store formula and rounding versions. Full board sheets are charged once; waste is not multiplied again. A finish priced per sheet is blocked until a separate finish-sheet allocation rule exists; supported separately priced finishes use square meters. Hardware must be explicitly included pending an approved schedule; do not omit an unpriced hardware cost silently.

Policies freeze approved template/engine references, stock capability envelope, spacing/margins, inclusions, selling rates, allowed areas and version. Generation blocks invalid geometry, unassigned/retired/incompatible materials, unsupported capability, missing prices and unplaced panels. Immutable quote payloads retain revision hash, design snapshot, price-version IDs and nesting result. Existing Mongo revisions must verify before SQL issuance. A failed transaction leaves the existing revision reusable; this phase creates no new Mongo body during quoting.

Customer serializers and column grants exclude the private payload, internal markup/base-unit pricing and approval internals. Customer lines expose quantities and selling amounts, total, policy version, material/price provenance and validity. PDF reads the same frozen customer projection, uses canonical English charge labels and identifiers, and never recalculates catalog prices. No private delivery address is placed in a quote PDF.

## SQL and retries

`202610230003_quotes_orders.sql` adds immutable versioned policies, quotations, orders, events and outbox records. Issuance locks the project and checks current ready revision/hash. A quote operation UUID plus owner/request hash returns the original quote on retry; issuance and exact seven-day UTC expiry use database time. Confirmation locks the quote and project, validates owner, expiry, unchanged revision and allowed service area/contact, then inserts one order, accepts the quote and appends event/outbox in one transaction. Unique quotation reference prevents double orders across distinct operation IDs. Reusing an operation with a different address or quote conflicts. A retry after confirmed acceptance returns its immutable order, even after expiry or later project changes.

Accepted snapshot/price/address cannot be edited. Payment status is not_collected. Statuses are Confirmed, In Production, Ready for Delivery and Delivered; only the first is created here. Phase 16 must provide audited authorized transitions before updates are allowed. Customers cannot advance status. RLS scopes metadata/events to their owner; detailed privileged snapshots are unavailable through customer column grants.

## Requested email and future activation

The optional Resend adapter accepts an explicit authenticated request to send the quote to that user's verified email. Durable unique outbox rows, a compare-and-set lease, stable quote idempotency key, bounded attempts and a 23-hour retry window protect against duplicates/uncertain delivery. Provider acceptance is not delivery proof. Beyond the safe retry window, manual review is required. Failed PDF/provider/status persistence preserves the saved quote and retry record. There is no background email dispatcher in this checkpoint; retries are explicit. Real email remains blocked by the server gate regardless of environment credentials.

Provider reference: [Resend idempotency keys](https://resend.com/changelog/idempotency-keys). Future setup requires an approved provider, verified sender and ignored server-only `RESEND_API_KEY` / `QUOTE_EMAIL_FROM` configuration. No credentials were added and no real messages were sent.

Activation requires approved commercial/tax/discount/inclusion/delivery/cancellation rules, construction fixtures and capabilities, provider setup, hosted owner acceptance and an explicit reviewed change to the gates/UI. Merely adding credentials does not activate commerce. Phase 16 remains admin operations; Phase 19 remains qualified production release.

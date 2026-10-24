# Phase 16 — fulfillment operations, gated review checkpoint

2026-10-23. Implemented together with Phase 17 while preserving the owner's live-commerce block.

Added staff-only order operations, read-only accepted design inspection, protected manufacturer/profile/bid records and registration RPC, exact-scope qualified assignment, optimistic versions, idempotent operations and atomic audit/status events. Admins register/select; operators may progress assigned orders. Accepted design, price, address and payment state stay immutable. Private operational data is unavailable to customer APIs/roles.

`/review/operations` is an isolated synthetic review: enter a test bid/reason, reject expired/incompatible choices, assign a synthetic partner, then progress through all four statuses. It creates no account order or actual qualification. `/admin/operations` is the protected account surface; live setup/assignment/progression remains blocked. Authorized staff can reach it from their account page.

The [combined Phase 17 report](phase-17-report.md) records checks and applied migrations. The [design/rules record](../design/phases-16-17-operations-photos.md) defines exact scope/capability checks, privacy and future activation limits. No real partners, bids or profiles were seeded; no role changes were made. Hosted staff acceptance and physical qualification remain pending.

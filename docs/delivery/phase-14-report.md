# Phase 14 — versioned quotes and PDF, test-mode checkpoint

2026-10-23. Implemented together with Phase 15 under the owner's explicit test-policy instruction. Live quote issuance, real email and commercial orders remain server-blocked.

Implemented exact BDT arithmetic, full-sheet material costing, inclusions/markup/tax/discount policy versioning, approved template/capability checks, frozen revision/design/price/nesting snapshots, seven-day server validity and idempotent quote operations. Customer-facing projections and database column grants keep private pricing internals separate. PDF uses the immutable customer quote, not a new catalog calculation. Download/retry failure preserves the quote.

Quote and order is a bounded canvas task. Try test quote and order uses a clearly labelled separate synthetic table and policy; it leaves the user's project untouched. Its PDF is marked TEST ONLY / NO COMMERCIAL VALUE. The email action explicitly sends nothing during review. A gated provider adapter and durable explicit-retry outbox exist for future approved activation; actual provider delivery remains unverified and no messages were sent.

See the [combined Phase 15 report](phase-15-report.md) for verification and [commerce design record](../design/phases-14-15-commerce.md) for exact rules and limitations. Commercial decisions, real coverage/rates, manufacturing qualification and provider activation are still pending; no test prices are approved customer prices.

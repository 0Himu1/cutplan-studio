# Phases 16–17 — fulfillment operations and photo review

## Explicit owner boundary

On 23 October 2026 the owner advanced both phases together. Existing instructions keep live commerce/fulfillment blocked. For photos the owner selected: “Use a labelled demo; keep live inference disabled.” There is no provider/model activation, image interpretation claim, live partner assignment or manufacturing release.

## Fulfillment

`/admin/operations` requires an active database-controlled admin/operator membership. Catalog-only access is not inferred from profile metadata. Its API checks staff on every request. Actual records are read-only while commerce is blocked; manufacturer/profile/bid registration and assignment/progression endpoints are server-gated. Staff can open an immutable accepted design at `/admin/operations/[id]`, rendered only when its saved engine/template is supported. Customer project-owner APIs are not weakened to grant this access.

The public `/review/operations` route contains only fixed synthetic data and in-memory review state. It demonstrates private bid input, an expired bid, incompatible work area, qualified assignment, reasons, all four statuses and an audit trail. It never fetches account bids or updates an order. Reload resets this demo.

SQL provides immutable setup versions and logs for manufacturers, profiles and bids; admins register/select, while active operators can progress already assigned orders. A bid must match accepted revision and snapshot hash, partner and profile, qualification and expiry. Machine capability must explicitly include the accepted envelope and rectangular operation, support each stock group's dimensions/thickness, and fit the accepted spacing/margin. A larger work area alone is insufficient. Assignment cannot repack geometry or change the customer price. Profile payloads use strict runtime/SQL bounds.

Order changes lock the order, check expected version and staff role, reuse operation IDs safely, and atomically write versioned results, audit reason and customer status events. Only Confirmed → In Production → Ready for Delivery → Delivered is permitted. The first progression requires an active qualified assignment; completed orders cannot be reassigned. Accepted design, total, payment state and address remain immutable. Direct updates must match the operation's recorded version/status; customers cannot execute these RPCs. Customer APIs/column grants do not expose private bids, profiles, setup logs or internal approval/cost data.

## Photo review

Photo suggestions opens as another bounded canvas task, not a scrollable panel. Choose My space or Product reference, select a local still image, enter W/H/D and explicitly confirm scale. The labelled demonstration proposes a supported template for the current furniture family. It does not recognize the image, infer dimensions, estimate fit or claim confidence. Unknown/low-confidence behavior is manual measured-template fallback. Applying replaces configuration/material choices as one undoable edit and does not save automatically.

A proposal is discriminated as demo-only, family-bound, base-configuration-bound, allowlisted and recalculated before Apply. Invalid or stale proposals cannot apply. Other families require a separately created project rather than silently changing its type. Future inference must retain schema validation, uncertainty, measurement confirmation and apply/discard/undo; no provider receives photos in this checkpoint.

Local previews use revocable blob URLs and are not persisted as photo bytes. Signed-in users can explicitly Save private copy for 24 hours and delete that copy from the task. Guests have local previews only; anonymous server uploads are denied. API upload is bounded while streaming, checks MIME/magic/decode, rejects unsupported/multiframe images, caps 10 MB and 20 megapixels, auto-orients/resizes to ≤2048 pixels per side, strips metadata, and stores normalized WebP privately. Original filenames/EXIF are not saved. An account may attempt ten uploads per rolling hour, including failed decode attempts. Metadata is pending until storage succeeds; failure compensation and pending-record cleanup handle partial saves.

The private bucket permits normalized WebP only. Owner-scoped endpoints issue signed URLs for at most 60 seconds and never past metadata expiry. Expired/deleted records cannot mint URLs. Deletion revokes new access before physical removal; an already issued URL can survive until deletion/short expiry if removal fails. Metadata RLS hides another owner and expired photos, and protected storage keys are not customer-selectable.

Cleanup: `npm run photos:cleanup` is a dry run; `npm run photos:cleanup -- --apply` purges up to 100 expired/deleted/stale-pending objects and removes quota records older than seven days. A production scheduler is not configured here. Access expiry is enforced independently of asynchronous physical purge. D06 retention/privacy approval and scheduled cleanup are launch prerequisites; the 24-hour technical TTL is not a complete published privacy policy.

## Storage and later phases

Migrations `202610230004_fulfillment` and `202610230005_private_photos` are additive; no partners, qualified machines, bids or photos are seeded. No memberships/provider credentials change. Live fulfillment uses the existing commerce gate. `/api/photos/analyze` explicitly returns inference_disabled for authenticated requests. No AI SDK/provider dependency is added for a disabled demo.

Phase 18 is next and must preserve proposal validation, stale-response rejection and one-edit undo. Phase 19 still owns qualified toolpaths/production release; profile assignment does not prove a physical machine safe. Live photo inference additionally needs provider/model, cost controls, privacy/retention decisions, hosted owner upload/delete acceptance and genuine inference evaluation. Staff hosted acceptance and physical qualification remain separate from synthetic tests.

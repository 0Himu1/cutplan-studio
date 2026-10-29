# CutPlan Studio operational handover

**29 October storage update:** the [Supabase cutover](../integrations/supabase-project-storage-cutover.md) is applied and verified against hosted storage. Use its backup/security commands and rollback rules. Earlier Atlas recovery instructions below are historical. The current isolated drill restores design content from SQL itself; a hosted destination restore remains unverified.

## Release state

The local review build is available. **Public launch is not approved.** `npm run release:check` prints the current approval ledger and deliberately exits 2 while release is blocked. `/review/launch` presents the same missing evidence. The staff JSON view requires an active admin at `/api/admin/readiness`. This ledger is an explicit review record, not a live monitor or claim that external prerequisites have been checked automatically.

No extra phase is created after Phase 22. Outstanding commercial, construction, hardware, identity, AI, machine and operational gates remain assigned to their original phases.

## Preview and normal checks

- `npm run dev`: local preview at `http://127.0.0.1:3100`.
- `npm run check`: documentation links, unit/SQL tests, types, lint and production build.
- `npm run test:e2e`: browser journeys. Use a dedicated server with both auth feature flags disabled for the default suite; restore the normal Google-enabled preview afterward. Do not point tests at customer data.
- `npm run test:google-contract`: isolated loopback authentication protocol double. This does not constitute a second real hosted identity check.
- `npm run recovery:drill`: isolated PGlite backup/restore and design-document round trip. It reads no environment secrets and makes no hosted connections.
- `npm run db:migrations` and `npm run db:plan`: linked SQL history and read-only pending-migration review.
- `npm run photos:cleanup`: dry run. `-- --apply` deletes eligible expired/deleted/stale-pending photo objects; review the scope before executing a real purge. Cleanup scheduling is not configured.

Use a separate production deployment and approved data environment. Do not expose `.env.local`, database credentials, service-role keys, private photo URLs or session cookies in logs, backups committed to Git, screenshots or support messages. No provider credentials or staff grants are part of these phase changes.

## Review entry points

- `/`: marketing preview with honest availability, four-family entry points, measured schematic and retained recent projects.
- `/projects`: guest/account designs. In a project, Inspect offers commands and Assembly documents; the CAD viewport and tasks remain bounded.
- `/review/operations`: synthetic assignment/status flow.
- `/review/production`: synthetic CNC package inspection; no machine release.
- `/admin/operations` and `/admin/production`: staff-only order inspection and qualification boundaries.
- `/api/assembly?orderId=...`: signed-in owner's immutable accepted-design review PDF, with no pricing/margin fields. An unknown/other-owner order is unavailable; corrupted revision identity is rejected.

## Approval owners to designate

The product owner must name the commercial policy owner, manufacturer/structural reviewer, CNC operator and machine approver, privacy/provider owner, and deployment/incident owner. No person has been silently assigned an operational duty by this document.

Before launch, collect manufacturer-signed representative fixtures and hardware/joint schedules; approved service-area/pricing/cancellation/payment policies; AI/privacy/budget decisions; two real hosted-identity checks; machine/controller simulation and supervised stock trials; hosted restore evidence; deployment/domain/support/monitoring ownership; and explicit release acceptance. Keep approved evidence identifiers with the versioned records. Do not replace missing evidence with a test policy, synthetic qualification or a UI checkbox.

## Failure handling

- **Browser save fails:** keep the active design; download editor recovery before reloading. Preserve corrupt/newer local storage and use the visible recovery path. Do not clear local storage as a first response.
- **Cloud revision conflicts:** retain the current edits, inspect the immutable saved revision and recover through the existing versioned save flow. Never overwrite a newer revision silently.
- **Quote/order/PDF retry:** use the original operation ID and accepted revision. Never regenerate nesting or prices under the same accepted quote. The assembly review generator is deterministic and does not update the order.
- **Production job fails:** current application cannot queue or release real production. Future qualified workers must use persisted leases/tokens, heartbeat and bounded attempts. Inspect the exact immutable job; do not edit scope or mark an unverified package approved.
- **Photo storage failure:** pending metadata and object cleanup are compensating operations. Check quota/expiry before retries. Deleted/expired photo access must stay revoked even if physical purge is delayed.
- **Provider or auth failure:** keep guest design access and retry/recovery visible. Never weaken route ownership, RLS or staff checks to clear an incident.

## Backups and restore acceptance

Current evidence is deliberately limited: the 218-file pre-Phase-20 source archive was extracted into an isolated cache location and every file hash matched. A PGlite data-directory archive restored four synthetic projects and four serialized design documents; ready revision hashes, owner isolation and private production denials survived. This is not a hosted Supabase backup, Atlas restore, private-photo backup or production recovery-time measurement.

Proposed planning targets remain daily database backups and monthly recovery exercises during pilot. The owner must approve actual recovery point/time objectives, retention, cost and data-region requirements before scheduling production operations.

For a real recovery exercise, use an isolated approved destination. Restore coordinated SQL/Auth, immutable Mongo design documents and private object storage from a documented recovery point. Verify each ready SQL revision has the matching owner/project/hash in Mongo; verify accepted quote/order/job snapshots remain immutable; restore role and RLS boundaries; check photo expiries/deletions before making any object accessible. Record missing or newer cross-store references as reconciliation issues. Confirm two-user isolation, login/sign-out, saves, accepted-document access, object access expiry and a representative all-family journey before reopening writes. Do not restore a production database or replace customer data without explicit authorization.

Rollback the application to a previously verified build when appropriate, retaining compatible additive schema. A schema reset, history repair, destructive rollback or database replacement is a separate reviewed action. No automatic destructive rollback command is supplied.

## Monitoring and maintenance

Before launch, configure alerts for failed saves/quotes/orders, production retry exhaustion, outbox age, photo cleanup failures, unauthorized access patterns and AI spend. Log request/operation/revision/job IDs and safe error codes; redact addresses, photos, credentials and session material. No alert channel or production scheduler has been configured or contacted.

The current runtime dependency audit is clean. Five development-only high advisories remain in the existing lint/tool chain. Review a compatible maintenance upgrade separately; do not force a framework downgrade to obtain a clean audit. Record the reviewed disposition and rerun qualification.

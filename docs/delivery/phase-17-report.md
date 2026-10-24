# Phase 17 — private photo workflow and labelled demo

2026-10-23. Combined Phases 16–17 software checkpoint. The owner explicitly chose a labelled demo with live photo inference disabled. **Phase 18 is next; Phases 18–22 are five remaining numbered phases.** Live inference and live fulfillment are not claimed complete or activated.

## Delivered

Photo suggestions in the command bar supports My space and Product reference. Local preview, measured W/H/D, explicit scale confirmation, supported-template proposal review and one-step Apply/Undo stay inside short fixed-screen tasks. Demo labels state that the image was not analyzed and confidence is not assessed. It preserves project type, rejects invalid/stale proposals and leaves saving explicit. The tablet command bar now compacts earlier so new actions do not push Project/history off-screen.

Signed-in users may explicitly save a private copy with a 24-hour technical expiry. Server validation bounds request bytes/decoded pixels, verifies content type, strips metadata, normalizes WebP and limits attempts. Owner-scoped metadata, short signed URLs, deletion, pending-save compensation and a bounded cleanup utility are implemented. Guests use local previews; no anonymous server image processing or live model request is enabled.

Phase 16 adds staff roles, immutable accepted-design inspection, versioned partner/profile/bid foundations, exact-revision/hash assignment compatibility, audited status progression and retry/conflict protection. Its public review uses only synthetic in-memory data. Existing live commerce/fulfillment gates stay closed.

## Verification

- 50 unit/database tests passed, including qualified envelope/stock/tool spacing and bid matching, executable SQL role/version/idempotency/audit checks, incompatible assignment rejection and unchanged accepted snapshots. Photo tests cover both purposes/all families, stale/invalid proposals, metadata stripping, type spoofing, byte/pixel limits, per-account quotas and owner/expiry RLS.
- 52 standard browser scenarios passed after fixing tablet toolbar crowding. New scenarios cover synthetic assignment and all statuses, both photo purposes, measurement gating, one-edit undo, disguised files, guest/staff denial and compact layouts. A final four-scenario development-server smoke run also passed, including all three photo steps. Photo tasks fit desktop/phone/compact landscape; ordinary operations pages can scroll outside the editor.
- Ten Google/account contracts passed, including authenticated inference_disabled and nonstaff operational denial. Existing live-commerce-disabled checks remain. Synthetic provider/identities are not a real hosted staff/user acceptance claim.
- Strict types, lint, docs links/fences and production build passed. Review captures: `.impeccable/review/phases-16-17/`.
- Migrations `202610230004_fulfillment.sql` and `202610230005_private_photos.sql` applied; linked dry run is up to date. Bucket verification reports private=true, maximum 10 MB, normalized WebP only. Cleanup dry run finds zero eligible records; no photos were deleted. No partners/profiles/bids/photos or commercial data were seeded, and no staff/provider settings changed.
- Runtime dependency audit reports zero vulnerabilities. Existing development-only Next/ESLint advisories remain the earlier maintenance/launch item.

Source/docs/tests baseline: `project-records/source-baselines/20261023-before-phases-16-17/source.zip`, SHA-256 `129843E6542F6B6A26AF254AB44DC88C5FE8BBCB8046E60CBB605529AEC697D0` (not a database/environment backup).

## Review and remaining gates

At `http://127.0.0.1:3100/projects`, open a project → Photo suggestions. Try each purpose with a local image, enter supported measurements, confirm scale, review/apply and undo. Photos are not sent to AI. A signed-in private-copy save is explicit; it is not needed for the demo. At `/review/operations`, test incompatible/expired choices, assign and progress the synthetic order with reasons.

Live photo inference is disabled on owner instruction. Provider/model selection, genuine photo inference and confidence evaluation, provider budget/rate controls, privacy/retention policy, production cleanup scheduling and hosted owner upload/URL/delete trials remain pending activation work. Bucket configuration and executable local isolation tests do not substitute for that live-user storage acceptance. Live commerce/fulfillment, real partner/profile qualifications and manufacturing release remain blocked. No machine files are created.

See [operations/photo rules](../design/phases-16-17-operations-photos.md). Phase 18 controlled editor commands is next on owner instruction; Phase 19 physical production qualification is unchanged. Current checkpoint is owner review of these gated/demo flows.

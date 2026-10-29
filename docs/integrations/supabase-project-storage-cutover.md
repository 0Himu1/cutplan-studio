# Supabase project-storage cutover

29 October 2026. This supersedes MongoDB runtime instructions in earlier handoffs. Numbered phases remain historical.

## Current state

The application now uses Supabase PostgreSQL for project snapshots. **All three migrations were applied to the linked hosted database on 29 October 2026 after the owner's explicit approval.** All four original projects and ten original revisions are imported and hash-verified. Finalization is true, pending saves are zero, and all twenty local/remote migration versions match. The local application is running against hosted Supabase at `http://127.0.0.1:3100`; no remote application deployment or Git push was performed.

The signed-in real owner opened all four projects and every original revision. One labelled test project verified account claim, measurement changes, Undo/Redo, rename, fresh reopen and stale-edit handling through the real API. Hosted concurrent saves produced one winner; exact retries created no duplicates; changed-payload retries failed. That test project was soft-archived after verification, retaining its four immutable revisions, and its temporary browser draft was deleted. The four original projects and their SQL metadata are exactly unchanged. Storage totals therefore include five project records/four active originals and fourteen snapshots.

The MongoDB driver connection still fails. Read-only Atlas Data Explorer recovery obtained all **10 original revisions and four working documents**. Their IDs, owners, versions, timestamps and hashes match all four Supabase projects, ten ready revisions and ten completed operations. That inventory had no pending operations. No replacement designs or hashes were generated.

Private archive: `.private/project-storage/20261029-atlas-ui/`. It contains original EJSON, portable export, checksum manifest, pre-cutover SQL metadata and an isolated SQL backup containing all ten real designs. It is ignored by Git. Preserve it and Atlas until acceptance. This is not a scheduled production backup policy. Never commit customer designs, credentials or SQL metadata exports.

## Storage and integrity

| Data | Destination |
| --- | --- |
| Project identity, owner, source draft, version/current pointer | Existing `public.projects` |
| Revision number, engine/schema version and hash | Existing `public.design_revision_index` |
| Immutable design JSON and canonical text | New `public.project_design_snapshots` |
| Idempotency and legacy recovery | Existing `public.project_save_operations` |
| Auth, catalog, commercial records and private files | Existing Supabase tables/Storage, unchanged |
| Unsaved drafts and recovery copies | Existing browser storage, unchanged |

No separate schema or mutable working-design table is created. Project IDs, revision UUIDs, ownership and URLs remain unchanged. Server ownership checks precede snapshot reads. RLS and revoked grants deny direct browser access. Service access is read-only except through scoped save/recovery/import functions. Snapshot updates/deletes are rejected.

The original JavaScript canonical serializer and SHA-256 contract remain unchanged. SQL hashes canonical UTF-8 text, **never `jsonb::text`**. Canonical text must parse to stored JSONB; snapshot validation and the 128 KiB limit remain. Imports verify owner/project/operation/revision/version/engine/schema/hash. Identical imports are repeatable; conflicts fail.

BSON dates have millisecond precision. Imports compare timestamps at that precision but retain SQL's original microseconds. Atomic saves deduplicate requests, check ownership/version, insert revision/content, advance the pointer and complete the operation in one transaction. Lost-response retries retain their operation ID/payload. No dual writes or MongoDB fallback exist.

## Verification

- 122 unit/database tests passed: rollback, conflicts, retries, immutability, browser denial, owner isolation, pending recovery, canonical hashes and corrupt/missing imports.
- Five browser contract tests passed across four furniture families and project lifecycle/conflicts. These use isolated test doubles, not two real hosted identities.
- Build, types and lint passed.
- All ten recovered designs imported twice without duplication into isolated PostgreSQL, then restored from its SQL archive and reverified.
- Linked stage-1 dry run includes only `202610290001`.

Hosted RLS/grants and direct anonymous/authenticated denial were verified. Legacy writers and temporary backfill execution are revoked. A private post-cutover backup of actual SQL metadata and all fourteen designs was imported twice and restored in isolated PostgreSQL. This is **not** a restore into a hosted Supabase destination or a full Auth/private-file backup.

Two hosted identities verified ownership isolation: the original owner's browser session and a temporary real Supabase Auth login used through the live application API. The second login saw an empty library and could not read any of the four projects, inspect history, recover or save the owner's design, or directly read snapshots. Signed-out API access returned 401. The temporary user was removed; no email was sent and no staff role was granted. This is real hosted API evidence, not a second human completing the Google sign-in UI.

See the [sanitized verification receipt](../../project-records/storage-migration/20261029/verification.json), [hosted save checks](../../project-records/storage-migration/20261029/hosted-save-checks.json), [hosted ownership checks](../../project-records/storage-migration/20261029/hosted-isolation.json) and [original-data preservation](../../project-records/storage-migration/20261029/original-data-preservation.json). Hosted restore and fresh live photo/accepted-quote/assembly flows remain operational acceptance limitations. Existing automated suites cover those callers' contracts; they do not replace real hosted acceptance.

## Cutover sequence

The owner explicitly approved the three hosted migrations and verified four-project/ten-revision import on 29 October 2026. The sequence below records the completed cutover and remains guidance for a new approved destination. Do not rerun the original source import after finalization; its temporary execution grant has been revoked by design.

Do not push all pending migrations together: finalization must follow import. The stage runner copies a migration prefix into a private workspace and uses Supabase's normal history without moving tracked files.

1. Recheck linked destination, fresh SQL inventory and archive checksums. Save another private metadata copy. Reconcile changes and repeat the isolated rehearsal if counts, pointers, hashes or pending operations changed.
2. Set `PROJECT_WRITES_PAUSED=true` in every serving process and drain requests. Confirm the API pause. A shell variable does not update an already-running app. Browser drafts stay available.
3. Apply `202610290001_project_design_snapshots.sql`: verified immutable storage, service-only import and readiness=false.
4. Apply `202610290002_atomic_project_storage.sql`: atomic saves/recovery; revoke old begin/finish execution to freeze stale writers. Reinventory the frozen source and SQL state; reconcile pending saves with their original payloads.
5. Verify/import all recovered designs. The transfer tool validates coverage and pending payloads before its first write. Stop on mismatches; never substitute defaults or edit hashes.
6. Apply `202610290003_finalize_project_storage.sql`: lock relevant tables; refuse missing content, bad pointers or pending saves; revoke temporary service backfill execution; set readiness=true. Internal atomic saves retain their private insert path.
7. Deploy/restart the new build, verify storage, then remove maintenance from every process. Open all four original projects and all ten historical revisions. Save/reopen a new revision without MongoDB configured.
8. Verify anonymous/direct authenticated denial and cross-owner API denial using two real identities. Check draft claim, rename, Undo/Redo persistence, materials, photo context, quotes and assembly documents. Record unavailable checks as incomplete acceptance.
9. Monitor failures/conflicts/missing snapshots/integrity errors using metadata-only logs. Retain Atlas and private exports until acceptance. Cluster deletion or credential revocation requires separate authorization.

Default commands are read-only:

```powershell
node scripts/apply-project-storage-stage.mjs --through 202610290001
node --env-file=.env.local scripts/project-storage-transfer.mjs --input .private/project-storage/20261029-atlas-ui
```

After approval, execute separate stages with import between stages 2 and 3:

```powershell
$env:PROJECT_WRITES_PAUSED='true'
node scripts/apply-project-storage-stage.mjs --through 202610290001 --apply --approved-hosted-migration
node scripts/apply-project-storage-stage.mjs --through 202610290002 --apply --approved-hosted-migration
node --env-file=.env.local scripts/project-storage-transfer.mjs --input .private/project-storage/20261029-atlas-ui --apply --approved-hosted-import
node scripts/apply-project-storage-stage.mjs --through 202610290003 --apply --approved-hosted-migration
npm run db:project-storage:verify
npm run db:migrations
```

These commands do not configure a deployed app's maintenance flag. Deployment control and fresh reconciliation are separate required steps.

## Tooling and rollback

- `scripts/project-storage-transfer.mjs`: checksum-verified dry run/import.
- `scripts/rehearse-project-storage.mjs`: isolated actual-design import/SQL restore. Refuses overwriting backup/report files; use a new private directory for another rehearsal.
- `scripts/check-project-storage.mjs`: read-only hosted hashes, coverage and pointers.
- `scripts/backup-project-storage.mjs`: read-only, integrity-checked actual SQL/design backup into a new directory beneath `.private/project-storage`. Run `npm run db:project-storage:backup -- --output .private/project-storage/<new-name>`, then rehearse that directory. Original Atlas recovery and post-cutover backup directories are separate.
- `scripts/verify-project-storage-security.sql`: read-only authenticated-role denial probe. Run `npm run db:project-storage:security`; grants and anonymous REST denial also need review.
- `scripts/verify-project-storage-isolation.mjs --approved-hosted-test`: deliberately creates a temporary unprivileged confirmed Auth user, signs in, verifies cross-owner denial through the local app and hosted REST, signs out and removes that user. Run with the private environment only during an approved test. It sends no email and never copies the owner's session credentials.
- `scripts/recovery-drill.mjs`: isolated four-family restore with full designs inside SQL. Not hosted restore proof.
- `tools/project-storage-export/`: one-off MongoDB exporter with its own lockfile/dependency. Not a root application runtime dependency. Atlas UI recovered this inventory because the direct driver remained unreachable.

Root MongoDB runtime dependencies, setup scripts and environment requirements are removed. Preserve private source credentials during acceptance; never print them.

Before new Supabase-only writes, rollback may restore the prior reviewed app/RPC grants using preserved source. After new revisions exist, pause writes and repair/deploy a compatible Supabase build. **Do not revert blindly to Mongo-only code, drop snapshot storage, reset schemas or rewrite migration history.** Auth, catalog, files and commercial/manufacturing approval gates remain unchanged.

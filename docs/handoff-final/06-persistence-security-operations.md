# Persistence, security, migrations and operations

## Storage and relationships

These stores serve different purposes. Removing a record from one does not delete the others.

| Store | Purpose and identity | Deletion/recovery implication |
| --- | --- | --- |
| localStorage `cutplan.guest-drafts.v1` | Guest envelope/schema v4; IDs, names, families, versions and saved input. | `deleteDraft` removes one local draft with version checks. |
| localStorage editor recovery | Project/account recovery key plus per-tab suffix; input/base version. Cloud prefix `cutplan.editor.cloud.<user>.<project>`. | Unsaved work, not a revision; do not clear casually. |
| sessionStorage `cutplan.editor.tab-id` | This tab's recovery identity. | Separates concurrent editing buffers. |
| localStorage `cutplan.pending-save.v1.<user>.<identity>` | Original idempotent request while cloud save is pending. | Retry exact original operation, not a mutated replacement. |
| localStorage `cutplan.measurement-unit.v1` | `mm`/`in` display preference. | No geometry or price. |
| sessionStorage `<jobKey>.cutting-workspace.v1` and `.operations` | Worksheet settings/completion and extra operations. | Not accepted production data; source changes invalidate incompatible overrides. |
| Supabase `projects` | Owner/source identity, current revision, version/sync state. | `deleted_at` filtering exists, but complete customer deletion does not. |
| Supabase `design_revision_index` | Ready revision numbers/hashes. | Immutable history linked to Atlas snapshots. |
| Supabase `project_save_operations` | Cross-store save journal/recovery payload. | Must verify/finish rather than invent success. |
| Atlas `furniture_projects` | Current cloud working document. | Owner/expected version guarded. |
| Atlas `design_revisions` | Insert-once snapshots, operation/engine/schema/hash. | Updating current state does not erase history. |
| Commerce/production relational records | Frozen quote/order/accepted/production references. | Audit/business records, not extra editable drafts. |
| Private photos and metadata | Owner-scoped uploads/proposals. | Separate access, cleanup and retention. |
| Filesystem/Git/artifacts | Code, documentation, imports/recovery/test archives. | Historical evidence, not live customer storage. |

Auth/provider session storage is infrastructure rather than another cabinet copy. No live collaborative synchronization is promised.

## Cloud protocol

Cloud identity derives from owner and source draft. A save validates input/material references, claims a relational operation with expected version/hashes, inserts/verifies the Atlas revision/current document and finishes the relational pointer. Retries use the same operation ID/bytes and verify completed work. Conflicts retain typed work and require the latest revision before a new save.

The request limit is **131072 bytes (128 KiB)**. Client, SQL and MongoDB validators must agree. Historical revisions/accepted documents stay read-only. Apply/preview is not proof of durable cloud saving.

## Loading and hydration fixes

Google remains the active sign-in flow. Session/focus checks are legitimate. The open cloud editor depends on stable `userId`, avoiding canvas/form reloads when the auth object changes. Initial load, explicit history selection, Retry and recovery may still load. The account list has its own request behavior; page load does not automatically write a design revision.

The reported body mismatch came from Grammarly attributes `data-new-gr-c-s-check-loaded` and `data-gr-ext-installed`. Body-scoped `suppressHydrationWarning` handles that external mutation; html suppression already supports theme. Component warnings remain active. Extension-specific coverage does not excuse genuine invalid HTML or nondeterministic rendering.

## Applied migrations

Fresh read-only `npm run db:migrations` on 26 October confirms **all 17 local versions match remote**:

| Version | Scope |
| --- | --- |
| 202610210001 | Profiles/memberships |
| 202610220001 | Cloud projects |
| 202610220002 | Material catalog |
| 202610220003 | Catalog sources |
| 202610220004 | Catalog operations |
| 202610220005 | Cabinet designs |
| 202610220006 | Panel materials |
| 202610230001 | Casework families |
| 202610230002 | Panel tables |
| 202610230003 | Quotes/orders |
| 202610230004 | Fulfillment |
| 202610230005 | Private photos |
| 202610230006 | Production jobs |
| **202610240001** | **Post-22 compartments and 128 KiB snapshot limit** |
| **202610250001** | **Post-22 cabinet role material defaults** |
| **202610250002** | **Post-22 board category/thickness variants** |
| **202610250003** | **Post-22 board colors** |

R017 explicitly approved the tested compartment migration; its helper remains service-role restricted. Later migration records preserve RLS/grants. Hides, notches, Materials layout, collisions and root-depth reversal need no extra migration. Matching version lists is not a fresh complete RLS/two-user acceptance audit.

## Security invariants

- Enforce server authentication, active staff/admin checks, same-origin writes and validation; never expose privileged keys.
- Preserve owner/version/hash guards and idempotent recovery.
- Price/details/color changes reset publication; synthetic tests never become sellable data.
- Keep photo inference/demo and local command grammar labelled honestly.
- Preserve immutable accepted/frozen records; worksheets cannot mutate them.
- Stage exact scope and ask immediately before future permission/OAuth-consent changes, following the owner's preference. None were performed for this handoff.

## Runtime and recovery

Use Node >=24 and locked dependencies. From the current app, `npm run dev` serves **http://127.0.0.1:3100/** while a process is listening. This documentation audit does not assert a live server remains running.

Default dev script is still `next dev`. Repeated Turbopack reloads were worked around locally with:

```powershell
node node_modules/next/dist/bin/next dev --webpack --hostname 127.0.0.1 --port 3100
```

That invocation did not modify the package script. Check listener/process ownership before restart; do not kill unrelated processes. Isolated account contracts use separate builds/servers (3101; identity mock 3121). Passing mocks is not real hosted OAuth approval.

Use the [operations runbook](../delivery/OPERATIONS-RUNBOOK.md) for setup/recovery/incident boundaries. Never paste environment secrets or private customer payloads into documentation.

## Git and backup transfer

Local HEAD and remote main both equal **`74e7f9af4c4d3262e1b27df2c6bca838f7bf05bd`**, `first commit`. Origin: `https://github.com/0Himu1/cutplan-studio.git`. Earlier init/push established the repository, but extensive later changes remain modified/untracked. A clone is **not** the final implementation.

Do not reinitialize, discard working files or overwrite history. A separately authorized push should review/stage intended source/migrations/docs and durable evidence, excluding secrets/builds/disposable outputs. This handoff did not commit/push.

Before editing, 80 docs/context files were copied and hash-verified: [manifest](../../project-records/documentation-backups/20261026-before-final-handoff/MANIFEST.json). The [prior handoff log](../delivery/HANDOFF-before-final-20261026.md) is retained. This is a documentation backup, not a hosted SQL/Atlas/photo restore.

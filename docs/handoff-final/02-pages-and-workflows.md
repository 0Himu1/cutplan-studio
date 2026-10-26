# Pages, departments and workflows

Current at 26 October 2026. Request IDs refer to the [ledger](01-request-decision-ledger.md). Post-22 work concentrated on the project editor and catalog; other areas retain their gated Phase 22 behavior.

## Route map

| Route | Audience and behavior |
| --- | --- |
| `/` | Public landing and studio entry; Phase 21 marketing scope. |
| `/projects` | Separate Browser drafts and signed-in Account projects, with loading/error states. |
| `/projects/new` | Create a named browser draft in one of four furniture families. |
| `/projects/[id]` | Local draft CAD editor, explicit save and Save to account. |
| `/projects/cloud/[id]` | Owned account design, current revision, history and interrupted-save recovery; historical revisions read-only. |
| `/login`, `/account` | Google authentication and account state. |
| `/admin/catalog` | Staff category grid, variant editing, pricing, color, publication and retirement. |
| `/orders` | Owned quote/order tracking foundation; live confirmation blocked. |
| `/admin/operations`, `/admin/operations/[id]` | Staff fulfillment review and immutable accepted design; live fulfillment gated. |
| `/admin/production` | Controlled synthetic production-job review, not machine release. |
| `/review/cabinet` | Proposed construction fixtures, not signed manufacturing drawings. |
| `/review/production` | Frozen nesting/CNC simulation and qualification review. |
| `/review/operations` | Operational/test-policy review. |
| `/review/launch` | Explicit approval ledger; currently `not_ready`. |

Server authorization governs APIs regardless of visible links. Hosted isolation acceptance still needs a different real identity, not only contract doubles.

## Projects, revisions and deletion (R001–R003)

A browser draft and an account project are distinct. Removing a draft does not delete its account copy, current Atlas document, immutable revisions, save journal, linked quotes/orders or editor recovery buffers. Revisions are earlier snapshots, not disposable duplicate drafts. Similar names alone do not establish duplication: identify owner, source draft ID, project ID and revision ID.

**Implemented deletion is local draft deletion:** `deleteDraft(id, expectedVersion)` removes one browser draft with version checks. Current cloud routes list/save/read/recover; there is no customer account-project DELETE endpoint or complete cross-store deletion workflow. Supabase `deleted_at` filtering is not evidence that deletion UI exists. The early questions were diagnostic, not proof that cascade deletion was delivered.

For support, establish whether the record is a Browser draft, Account project or revision. Identify IDs and storage scope before cleanup. Do not clear all browser storage to delete one project: pending operations/recovery may contain unsaved work. Account deletion requires a retention policy and a workflow spanning relational metadata, Atlas history and linked records. It remains an identified limitation, not a new numbered phase.

## Editor lifecycle

1. Load a local or owned cloud snapshot; recover valid tab-scoped work if present.
2. Edit in the left dock. Changes preview transactionally. Cancel discards the form draft; Apply commits editor state, not a cloud revision.
3. Undo/Redo changes editing history. Camera/mode/hide/X-ray/explode/open states are presentation-only.
4. Explicitly save a draft or Save design revision. Cloud retries use an idempotent operation rather than creating extra revisions.
5. View historical revisions read-only. Recover interrupted saves using the original operation payload.

The repeated loading defect in an open cloud editor was fixed by depending on stable user ID rather than a replaced auth object. Session refresh/focus checks are not design synchronization. Initial loading, explicit history changes and Retry remain legitimate; the account list has its own loading behavior.

## Inherited departments and boundaries

| Area | Delivered software | Boundary |
| --- | --- | --- |
| Furniture | Cabinet, shoe rack, bookshelf and panel table; shared workspace and family calculations. | Proposed construction; rich compartment redesign targets cabinets. |
| Quotes/commercial | Versioned test pricing, frozen design/layout, PDF and acceptance/tracking contracts. | Owner selected test policies; live quotes, confirmation and real email blocked. |
| Fulfillment | Staff state transitions and immutable accepted snapshots. | Approved operating policies/staff hosted acceptance still needed. |
| Photos | Private upload, measurement confirmation and proposal review. | Explicit labelled demo; live inference disabled. |
| Commands | Local grammar, proposal review, explicit apply/undo. | No live AI interpretation claim. |
| Production | Durable synthetic job/review foundation, frozen hashes and simulation. | No qualified controller, physical trial, production worker or released files. |
| Documents | Labels, schedules and assembly-review PDFs. | Hardware/joints/load/installation instructions need approval. |

The manual Sheets worksheet generates actual **unqualified** programs; it is separate from frozen production simulation. See [workspace](04-workspace-ui-and-inspection.md), [Phase 22](../delivery/phase-22-report.md) and [runbook](../delivery/OPERATIONS-RUNBOOK.md).

# Phase 4 checkpoint — cloud projects and immutable revisions

Status: core implementation and live owner acceptance complete; awaiting the owner's Phase 4 review and optional second-identity isolation check.

## Implemented scope

- Added server-only account-project APIs for listing, explicit browser-draft claim/save, project/revision reads and interrupted-save recovery.
- Added deterministic 24-character project identities scoped by owner and source draft, strict Phase 4 shell validation and SHA-256 request/snapshot verification.
- Added the SQL project index, immutable revision index and durable save-operation ledger. Reserve/finalize functions use version checks, pending-operation barriers and idempotent operation IDs.
- Added MongoDB revision and working-head repositories. Revision writes are insert-once; head updates use the expected prior version; every read verifies owner, project and snapshot hash.
- Added `npm run db:mongo:setup` for strict Mongo collection validators and required unique/query indexes.
- Added an explicit **Save to account** action that preserves the local draft, a signed-in account-project section, distinct account project URLs, rename-as-new-revision, read-only history, pending-save retry/recovery and conflict-safe reload.
- Kept the Phase 4 document contract limited to name, furniture family, source identity and project-shell metadata. No dimensions, materials, manufacturing rules or pricing were invented.

## Supabase evidence

`202610220001_cloud_projects.sql` passed a linked dry run and was applied to project `nhglxxgqalwxvlhgxgwc`. Local and remote migration history both contain `202610220001`.

The hosted verification query confirmed:

- `projects`, `design_revision_index` and `project_save_operations` exist;
- row-level security is enabled on `projects`;
- `authenticated` cannot execute `cutplan_begin_project_save`;
- `service_role` can execute the privileged save function.

Local PGlite tests additionally execute the migration and verify two-user read isolation, denied operation-table access, denied browser RPC execution, immutable ready revisions, duplicate retry behavior, pending-save rejection and operation conflicts.

## Automated verification

| Check | Result | Scope |
| --- | --- | --- |
| Normal browser regression | 23 passed | Existing navigation, responsive shell, guest drafts, storage recovery, keyboard and theme behavior |
| Google/account project contracts | 6 passed | Google PKCE regressions plus explicit account copy, second revision and two-tab optimistic conflict with typed input preserved |
| Retained email-auth contracts | 7 passed | Optional OTP/session/profile behavior remains intact in the isolated provider harness |
| Styling regression | 7 passed | Existing exact appearance and breakpoint/state comparisons remain green |
| Unit and local PostgreSQL | 15 passed | Existing validation plus Phase 4 hashing, strict payloads, partial-write retries, RLS and immutability |
| Documentation, TypeScript, ESLint, production build | Passed | All routes and the new account-project surface compile without warnings |
| Impeccable detector | No findings | Changed Phase 4 project components and adjacent project/auth surfaces |

Three reviewed captures under `.impeccable/review/phase-04/` cover account detail at desktop and phone widths plus the signed-in Projects page. The phone layout has no horizontal overflow. These captures use an isolated synthetic provider and browser-routed project fixtures; they are UI evidence, not live Atlas evidence.

## Live Atlas acceptance

The replacement **CutPlan Studio** Atlas deployment is connected through ignored local configuration. `npm run db:mongo:setup` completed successfully and created the strict collections, validators and indexes in `cutplan_studio`.

Live application verification then confirmed:

1. A signed-in browser draft saved to a distinct account project while the browser draft remained intact.
2. The resulting account project loaded correctly and retained an immutable revision history.
3. Two additional real revisions were written, producing three immutable MongoDB revision records and one working-head document.
4. A second browser tab with a stale revision was prevented from overwriting the newer project. Its typed name was preserved, and the UI presented an explicit reload action.

The hosted second-identity isolation check remains an optional owner exercise because this checkpoint used the owner's signed-in Google identity. Local PostgreSQL RLS tests already cover two-user isolation. The deliberate interrupted-save recovery path is covered by the durable-protocol unit tests and remains available in the live UI.

## Owner checkpoint

The owner should verify that a browser draft remains after Save to account, the account copy appears separately, a renamed account project creates another read-only revision, another signed-in browser can reopen it, and a stale tab cannot overwrite the newer version. Phase 5 must not start until this checkpoint is accepted.

# Account projects and revision history

Mode: Operate. Phase 4 extends the approved project workspace with explicit account saving, cross-browser project records, immutable revision history and recovery states. It preserves the current Tailwind implementation, paired themes, Inter typography and flat furniture-workspace vocabulary.

## Direction contract

THESIS: A signed-in customer can deliberately copy a browser draft to their account, understand where each version lives and recover interrupted saves without losing or silently overwriting work.

OWN-WORLD: Inherit DESIGN.md tokens, flat one-pixel borders, quiet Lucide actions, family diagrams and sentence-case copy. Indigo marks primary save and current-state actions; neutral surfaces carry history, status and recovery information.

STORY: Projects separates browser drafts from account projects. A local draft offers an explicit Save to account action. The account project opens at a distinct URL with current metadata, rename-as-new-revision, read-only revision history and retry guidance for pending saves.

FIRST VIEWPORT: The project name and exact storage state lead. Signed-in project lists remain compact and use the existing three/two/one grid. Account detail keeps the approved schematic-and-information split, with revision history as a quiet list below the current project controls.

FORM: A scoped extension of the established project surfaces. seed: none. No palette, navigation, typography or visual-system changes. Browser drafts stay visually and technically distinct from account projects.

SIGNATURE: Every account project shows its revision number and save state in plain language. Conflicts preserve the typed name and require an explicit reload; interrupted saves expose Retry save without claiming success.

## State and accessibility rules

Loading, empty, setup-pending, signed-out, saving, ready, conflict, interrupted and unavailable states are distinct. Controls use native buttons and labeled inputs, status messages use polite live regions, errors identify the recovery action, and revision choices are keyboard-operable. No save is called complete before both databases agree on the same verified hash.

Phase 4 stores only the project shell: name, furniture family, source draft identity and immutable revisions. Dimensions, materials, construction rules, pricing and editor geometry remain future phases.

## Implemented checkpoint

The project workspace now separates browser drafts from signed-in account projects. Saving is explicit and keeps the browser draft intact. Account project routes show verified shell metadata, current save state, an inline rename that creates another revision, read-only history, interrupted-save recovery and an explicit reload after optimistic conflicts. Pending request bodies are versioned in browser storage so a network retry reuses the same operation identifier.

Supabase owns project identity, ownership, revision metadata and the durable save-operation ledger. The linked Phase 4 migration is applied with row-level security; browser roles can read only their own project and revision index, cannot read operation payloads and cannot execute the privileged reserve/finalize functions. MongoDB code writes insert-once revision documents, advances the working head with a version comparison, verifies hashes before SQL finalization and exposes a repeatable collection-validator/index setup command.

Automated evidence currently covers strict shell input, deterministic identities and hashes, owner isolation, browser-role denial, immutable ready revisions, duplicate operations, pending barriers, optimistic conflicts and retries after each simulated partial-write boundary. The account UI contract covers explicit save, a second revision and a two-tab conflict at desktop and mobile sizes. The existing visual system and exact styling regression remain green.

This is an implementation checkpoint, not Phase 4 acceptance. The dedicated Atlas project exists, but Atlas human verification, the free cluster, database user, current-IP network access and private connection URI are still pending. Mongo validators/indexes and a real Supabase-to-Atlas save/reopen/recovery trial therefore have not run. No live cross-browser Mongo persistence or second real-user isolation is claimed.

# Phase 2 verification and owner review

Status: complete for the defined scope; automated checks and final visual review passed. Awaiting owner feedback. Phase 3 has not started.

## What was built

- New Project is enabled on Home and Projects. Furniture-family links can open a preselected Cabinet, Shoe Rack, Bookshelf or Table picker.
- A dedicated creation page has native radio choices, a labeled project name, validation, cancellation and a visible browser-only storage notice.
- Creation opens a draft overview. Home shows the three most recently edited drafts, while Projects shows the complete local collection. Each real draft has an appropriate family schematic, name, type and edited date.
- Reopen, inline rename, cancel rename, refresh recovery and confirmed deletion work. The delete dialog focuses Cancel first, traps focus natively, supports Escape and restores the trigger when canceled.
- Browser drafts have a versioned schema and per-record versions. Unknown/future or corrupt records are not silently overwritten. The recovery UI can download raw existing data or reset it after explicit confirmation.
- Failed storage writes preserve form values and do not show a successful-save state. Blocked storage presents Retry rather than crashing.
- Supported browsers use Web Locks for cross-tab writes and storage events for synchronization. A stale rename/delete is rejected against the record version instead of overwriting a newer edit.

## Automated verification

| Check | Result | Evidence |
| --- | --- | --- |
| Data validation | Pass | 5 Node unit checks: malformed/newer schema, duplicate IDs, invalid type/name/date/version, size/quantity limits, safe extraction and sorting |
| Strict TypeScript | Pass | `npm run typecheck` |
| ESLint | Pass | `npm run lint`, zero errors/warnings |
| Production build | Pass | `npm run build`; new-project and draft-detail routes compiled |
| Browser suite | Pass | 18 tests including the 6 foundation checks and 12 draft workflow checks |
| Full lifecycle | Pass | Create, reopen, rename, refresh, home recent link, cancel deletion with focus return, confirmed delete, then missing local-draft state |
| All four families | Pass | Each picker option creates and persists its correct furniture type |
| Invalid input and cancellation | Pass | Blank name focuses an inline error; canceled creation leaves no stored draft |
| Storage-write failure | Pass | Quota exception preserves typed name and stores no falsely saved record |
| Storage-read failure | Pass | Blocked storage shows explicit unavailable state and retry |
| Corrupt data recovery | Pass | Raw bytes retained, recovery download matches original, reset cancellation preserves data, confirmed reset removes only draft key |
| Newer schema | Pass | Creation disabled and original stored bytes preserved |
| Cross-tab stale edit | Pass | Second-tab rename updates first tab; first tab's older rename is rejected |
| Visual capture | Pass | Populated Home/Projects, picker, detail and delete dialog at 1440×1080 and 390×844; light Projects captured too |
| Independent design review | Ship | All 11 final captures inspected; no material fixes requested |
| Local preview | Pass | Home, Projects and New Project return HTTP 200 from the production preview on port 3100 |

The first browser pass caught a delete-dialog focus-return issue. It was fixed, and the complete suite passed. Three other first-pass failures were test-selector collisions with Next.js's route-announcer alert; selectors now target the actual form error. The final visual capture also waits for the detail URL and H1 so an outgoing project card cannot be mistaken for the detail page.

Native modal screenshots use the visible viewport because their backdrop covers that viewport, not the entire page's scroll height. The subsequent targeted capture run passed after correcting route-wait conditions. Captures live in ignored QA folders and use drafts created through the real UI in isolated test browser contexts; the owner's browser is not seeded with demonstration records.

## Review and limits

Mechanical Impeccable scan returned 16 advisory font-size/radius metadata mismatches with the prior DESIGN.md extraction. They are not runtime failures or a claim that the design system should be replaced. Some reflect pre-existing CSS sizes; the documentation handoff records new components and notes existing omissions without redesigning the interface.

Guest drafts contain only a project name, furniture type, UUID, timestamps and version. The schematic is a family reference, not a calculated design. No editable construction dimensions, materials, prices, quotes, orders or cloud account persistence are implied. Login and guest continuation are Phase 3; durable cloud projects are Phase 4.

Browser-local data can be removed by clearing site data, private-browsing behavior or browser cleanup. This phase provides no cross-device backup or ownership claim. Concurrent-write serialization depends on Web Locks support; the synchronous fallback cannot promise atomic updates across separate browser tabs. The tested Chrome environment supports locks. Future cloud revision handling remains a separate phase.

No Supabase schema, user, policy or server-stored project was changed. Node.js 24+ is now the development baseline for built-in TypeScript unit checks.

## Owner review checklist

1. Open http://127.0.0.1:3100 and choose New Project.
2. Pick a furniture type, name the draft and select Create Draft. Confirm the type and browser-only save label on the overview.
3. Reload, return to Projects and reopen the same draft.
4. Rename it, reload and confirm the new name remains. Check that Home shows it in Recent Projects.
5. Open Delete and cancel or press Escape. Confirm the draft remains and keyboard focus returns to the Delete control.
6. Delete a disposable draft and confirm it disappears from both Projects and Home.
7. Try the picker and project list in a narrow browser window and light/dark themes.

## Owner feedback

Accepted by the owner, who confirmed the Phase 2 tests passed and requested Phase 3.

## Next phase

Phase 3 implements Supabase email OTP, sign-out/session refresh, profile permissions and continuation of guest work through authentication. It requires checking the real Supabase email/OTP and redirect configuration; no successful login is claimed by this phase's tests.

# Current handoff — 2026-10-23

This file is the current-state index. Earlier reports preserve historical evidence; their old “not started” or setup-pending statements do not override later reports.

## Current checkpoint

**Phase 9: panel material implementation complete for the supported cabinet, awaiting owner review.** The combined Phase 8–9 partial increment has been superseded by the completed material workflow and rendered viewport verification. Manufacturing approval and drawers remain pending. Phase 10 has not started.

Read [Phase 9 report](phase-09-report.md) for current scope, evidence and owner checklist. Earlier reports remain historical. [Delivery phases](PHASES.md) is the full scope map.

## Implemented state

- Phases 1–2: studio shell and browser-local drafts.
- Phase 3: active Google sign-in and tested live owner profile/sign-out; optional email OTP disabled. Hosted second real identity check remains unverified.
- Phase 4: live Supabase/Mongo account saving, immutable revisions and stale-tab conflict handling verified. Owner requested Phase 5. Earlier Atlas-pending notes are historical.
- Phase 5: staff catalog, compatibility, historical prices, deliberate publication and retirement implemented. Owner review accepted on 2026-10-22. This acceptance is not a claim that every supplier candidate has been published or approved for sale.
- Phase 6: pure shared cabinet calculator and cabinet-detail cut-list review with four synthetic examples. Phase 6 introduced no persisted geometry; Phase 7 adds it explicitly. All outputs remain ineligible for quote/manufacturing pending construction approval.

- Phase 7: cabinet parameters, measured front/floor projections, undo/redo, browser recovery and versioned geometry saves. Linked SQL migration 202610220005 and expanded Mongo validators are applied. Local and synthetic account checks passed; manual live signed-in geometry acceptance remains pending.

- Phases 8–9: real 3D inspection, synchronized panel selection, published catalog lookup, per-panel board/faces/edging/grain, texture fallback, undo/redo, geometry recalculation and persisted overrides. Migration 202610220006 and expanded Mongo validators applied.

## Remaining work and next checkpoint

1. Review Phase 9 with owner-published materials; perform a live signed-in material save/reopen/history trial. Automated account tests use routed fixtures.
2. Carry forward manufacturing drawing/fixture sign-off and unsupported drawer construction.
3. Next phase on owner instruction: Phase 10, shoe-rack template and approved construction fixtures.

Second-real-identity hosted isolation remains an unverified earlier follow-up. Detailed local tests cover two-user RLS; those are not a replacement claim for that hosted exercise.

## Verification and preview

Latest evidence: 31 unit/database checks; seven Google/account contracts including saved material overrides; all 33 normal browser checks passed, including material/empty/retry flows and prior regressions. Detailed final counts and visual review are in the Phase 9 report. Strict types/lint/build passed.

Project servers are stopped after verification. When started, the local preview is `http://127.0.0.1:3100/projects`. Open or create a Cabinet draft and scroll to Cabinet editor. This is a local preview, not a public deployment. The editor saves real project geometry explicitly; the retained review examples remain separate and do not alter projects.

Phase 9 extends SQL/Mongo validation to store per-panel overrides and adds optional staff-approved HTTPS finish textures. No catalog records, staff roles or provider settings were changed. Configuration stays in ignored `.env.local`. Use [documentation index](../README.md) for requirements, historical reports and integration notes.




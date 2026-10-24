# Phase 22 — qualification and operational handover

Status: local software qualification and handover implemented, 23 October 2026. **Release decision: NOT READY.** This phase does not certify missing manufacturer approvals, hosted identity/recovery exercises, actual AI inference or physical CNC trials.

## Software and review delivery

- All four families now connect synthetic pricing, frozen nesting, per-sheet CNC simulation and part/assembly review with matching revision and layout hashes.
- `/review/launch` displays the explicit approval ledger. `/api/admin/readiness` requires an active admin; guests/nonstaff are denied. It is a review ledger, not a live external-service monitor.
- `npm run release:check` returns structured `not_ready` evidence and exit code 2 while gates remain open. No user-facing approval toggle can turn missing evidence into a pass.
- `npm run recovery:drill` restores an isolated PostgreSQL data-directory archive, checks four synthetic projects and serialized design documents, compares revision hashes and rechecks owner/private-production isolation. It never reads `.env` or connects to hosted services.
- [Operational runbook](OPERATIONS-RUNBOOK.md) records routes, review commands, recovery/retry handling, backup boundaries, incident ownership still to designate, production release gates and non-destructive rollback principles.
- No new database migration is required for these review/PDF/marketing/checklist changes. Earlier 13 migrations remain applied; a linked dry run confirms none pending. Read-only hosted inspection reports RLS enabled on all 26 public application tables. No live order, approval, role, provider or machine records were seeded.

## Verification record

- Unit/database: 63 passing tests.
- Documentation links, typecheck, lint and production build pass.
- Full standard browser suite: 62 scenarios passed, including seven new four-family document, bounded-task, landing and launch-gate scenarios. A real SVG title hydration mismatch found by navigation regression was fixed; the final complete rerun is clean.
- Google/account contracts: 10 passed, including owner-only accepted review PDFs, unavailable other-order records, corrupted hash rejection and nonstaff readiness denial. These remain protocol doubles, not a hosted second identity exercise.
- Final normal-development preview: eight selected document/landing/readiness/navigation checks passed after restart. The preview remains running on port 3100.
- PDF QA: four fixtures, 29 pages rendered and text verified; representative table and bookshelf page montages visually inspected.
- Runtime audit: zero vulnerabilities. Full audit: five high development-tool advisories retained from the existing lint/tool chain. No forced downgrade was applied.
- Local PostgreSQL recovery: 13 migrations restored, four projects and four design documents matched, owner isolation and production-job denial passed. Archive evidence: `project-records/recovery-drills/phase22/report.json` and `synthetic-pglite-backup.tar.gz`.
- Source backup: 218 files restored and SHA-256 matched the pre-change archive. Report: `project-records/recovery-drills/phase22/source-restore-report.json`. Restored sources were moved outside the workspace to avoid compiling stale duplicates; they were not executed as an application. Source archive SHA-256: `7cb87b15afadd39e9e2e2de7ae095a639388f876d53b74ea5bbe9effb92b494c`.

Machine-readable verification is recorded in `phase-22-evidence.json`, including the source-tree fingerprint and explicit unverified hosted/physical gates.

## Remaining acceptance gates

1. Manufacturer-approved construction, hardware schedules, joints, installation and load limits (Phases 6, 10–12 and 20).
2. Approved commercial/service-area/payment/cancellation/email policy and hosted staff acceptance (Phases 14–16).
3. Real AI provider/model, privacy/retention/evaluation/budget and abuse controls (Phases 17–18).
4. Qualified controller/postprocessor/tool/material/workholding and supervised physical trials with controlled package release (Phase 19).
5. Second real hosted identity isolation; coordinated hosted SQL/Auth, Atlas and private-photo restore; approved recovery objectives, monitoring/scheduling/support ownership; development advisory disposition; approved production deployment and explicit launch acceptance (earlier phases and Phase 22).

No numbered Phase 23 is introduced. The next checkpoint is owner review of the final software increment and closure of these existing acceptance gates. The request to complete the last three software increments is not approval to fabricate evidence, publish the product, enable transactions or release machine instructions.

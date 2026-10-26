# Maintainer map and transfer checklist

Current repository: `D:/himu/EaseIT/CutPlan Studio`. Legacy sibling is reference only. Read this handoff rather than stale phase headers claiming the next phase has not begun.

## Source ownership

Paths are repository-relative. Furniture components below live under `src/components/furniture/` unless otherwise shown.

| Responsibility | Source | Tests/evidence |
| --- | --- | --- |
| Editor modes/dock/tools/recovery | `cabinet-editor.tsx` | `tests/e2e/canvas-workspace.spec.ts`, `cabinet-compartments.spec.ts` |
| Guided form/help | `cabinet-config.tsx`; `src/components/ui/config-fields.tsx`, `config-hint.tsx` | Config-hints/form-alignment browser suites |
| Section dragging | `use-section-reorder.ts` | Section-reorder/top-down unit and browser suites |
| Allocation/tree generation | `src/lib/furniture/cabinet-allocation.ts`, `compartments.ts`, `cabinet.ts` | Allocation/compartment tests |
| Door coverage/hinge supports | `src/lib/furniture/door-frames.ts` | Door-frame/drawer-door tests |
| Shared cutouts | `src/lib/furniture/panel-contour.ts`; `panel-geometry.ts` | Corner-notch unit/browser tests |
| 3D, labels, picking/hides/motion | `cabinet-viewport.tsx`; `src/lib/furniture/presentation.ts` | Panel-visibility/browser cases |
| Solid collisions | `src/lib/furniture/collisions.ts` | Collision unit/browser suites |
| 2D | `cabinet-drawing.tsx` | Cabinet/notch browser cases |
| Sheets/cutting | `sheet-preview.tsx`; `src/lib/cutting/workspace.ts`, `legacy/` | Cutting/nesting/production and canvas tests |
| Units | `src/lib/measurement.ts`; `src/components/measurement/measurement-input.tsx`, `unit-provider.tsx` | Conversion and editor/catalog workflows |
| Materials UI | `materials-workspace.tsx`, `panel-materials.tsx`, `cabinet-boards.tsx` | Materials-workspace/panel-materials/board-defaults suites |
| Material defaults/resolution | `src/lib/furniture/materials.ts`, `material-defaults.ts` | Material/default tests |
| Catalog UI | `src/components/catalog/workspace.tsx`, `material-editor.tsx`, `board-picker.tsx`, `catalog-controls.tsx`, `ui.tsx` | `tests/google-contract/catalog-ui.spec.ts` |
| Catalog schema/API | `src/lib/catalog/board-categories.ts`, `contracts.ts`, `public.ts`; `src/app/api/admin/catalog/route.ts` | Board-category/color SQL checks |
| Guest drafts | `src/lib/guest-drafts/model.ts`, `store.ts` | Storage/version/recovery tests |
| Cloud save/recovery | `src/lib/projects/contracts.ts`, `service.ts`, `protocol.ts`, `mongo.ts`, `client.ts`; `src/components/projects/` | Protocol and account contracts |
| Server validation | `scripts/cabinet-document-schema.mjs`, `setup-mongodb.mjs`; `supabase/migrations/` | Isolated schema/SQL tests |
| Commerce | `src/lib/commerce/engine.ts`, `service.ts` | Commerce/account contracts and test-mode gates |
| Frozen production | `src/lib/production/review.ts` | Commands-production tests; unsupported-notch rejection |
| Assembly/PDF | `src/lib/assembly/model.ts`, `pdf.ts` | Phase 20/22 document fixtures |
| Theme/hydration | `src/app/globals.css`, `layout.tsx` | Extension-hydration/theme/style checks |
| Readiness/recovery | `src/lib/launch/readiness.ts`; `scripts/release-readiness.mjs`, `recovery-drill.mjs` | Phase 22/runbook |

## Dependency paths not to split

- Board variant → `selectGroupBoard` → defaults/thickness/stock/grain → geometry reflow → saved input. Color alone is not a physical board change.
- Height edit → shared allocator → top-aligned positions → stable panels → 2D/3D. Reordering changes position, not identity/material ownership.
- Hinge booking → support deductions → shelf notch → shared contour → rendering/collision/manual G-code. Do not fix only one representation.
- Root versus nested recursion → final depth exception. Never reapply a global one-inch partition deduction.
- Save → SQL claim → Atlas insert/verify → SQL finish. Success requires all stages.
- Variant price/details/color edit → unpublish selected variant → renewed review. Do not publish siblings implicitly.

## Safe transfer

1. Preserve current working tree, backup/import records and this handoff. Remote main lacks later changes.
2. Follow final decisions: right-side hides, Materials-owned boards, top-down open sections, manual empty height and full-depth root partitions.
3. Keep secrets out of Git/docs; use server-side clients and the runbook for hosted work.
4. Run unit/type/lint/docs checks, targeted browser workflows for affected UI and isolated auth/staff contracts when relevant. Historical full-browser/build evidence is not a fresh run.
5. Expect release check exit 2 until real evidence closes external gates; do not disable guards to pass it.
6. No implementation phase is queued. New features need a new scope; activation approval belongs to existing gates, not invented phases.

Maintain dated phase/follow-up reports as history. Update the relevant final subsystem record/ledger when decisions change rather than stacking conflicting “current” claims on old reports. Current source/decisions establish behavior; fresh checks establish verification; neither grants manufacturing/commercial approval.

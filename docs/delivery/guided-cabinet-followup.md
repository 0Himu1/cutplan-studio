# Guided cabinet configuration follow-up — 24 October 2026

## Scope

The combined cabinet form remains inside the animated left inspector. The 3D/2D workspace remains fixed; the inspector body scrolls. Original phase numbering and launch gates are unchanged. This supersedes the selector-based compartment/section/drawer interaction described in the earlier cabinet follow-up.

## Reference audit

Reviewed the legacy cabinet form, CompartmentConfig, VerticalSectionManager, Drawer/Hanging/Shelf/Divider section controls, drawer rows, cabinet types/state, default-depth utilities, assembly traversal, section calculators, door calculator and split helpers. Its useful workflow is retained, but its missing section/drawer divider deductions and zero-height additions are not reproduced. The supplied sourcebook and selected primary sources were also reviewed; see [sourcebook decisions and conflicts](../design/cabinet-sourcebook-review.md).

## Changes

- Size contains primary width, height, depth and display units. Construction contains door position, back position, raised bottom, board thickness and fit clearances.
- Automatic/Manual segmented controls begin the compartment area. Existing basic cabinets retain their original geometry until compartments are explicitly enabled; enable defaults to Automatic.
- Each compartment, section, nested divider slot and drawer has an inline accordion. All relevant controls are in the same recursive editing workflow. Section type reveals shelves, rod configuration, drawer boxes or nested slots.
- Shared configuration controls provide accessible switches and segmented choices. Existing MeasurementInput preserves exact canonical millimeters across global inch/suta changes.
- Door gap, shelf-side clearance (confirmed by the user as “Side Sill”), drawer-slide clearance and panel thickness are always millimeters.
- Height totals distinguish parent clear height, divider material, manual allocation and automatic space. A manual section-height edit creates an explicit automatic remainder when at least a divider plus 50 mm remains. Additional automatic sections share available space; additions without room are disabled with guidance.
- Removing a section returns its space to a flexible section. Reordering keeps section identities. Duplication retains type-specific settings and explicitly uses automatic height.
- Drawer rows show used height, supports and remaining space; new drawers require enough actual remaining space. Equal drawer heights account for supports. Automatic depth is an explicit switch with a readable calculated result.
- Section type changes retain shelf/drawer/rod settings. Divider children are cached during the current form session when switching away and restored when switching back; irrelevant children are excluded from saved non-divider sections.
- Automatic width changes retain configured compartments when the natural door count decreases. Manual widths balance against a neighboring compartment. Parent width/thickness changes resize manual bays proportionally and fit nested partition widths while retaining identities and configuration.
- A clear, explicit recovery action removes only assignments for panels removed by a layout change. Surviving assignments remain; invalid new geometry cannot be saved.

## Calculation fixes

The pure `allocateHeight` helper is shared by form feedback and panel traversal. It deducts exactly N−1 horizontal divider boards, resolves automatic allocations, checks finite/nonnegative measurements, rejects overflow and requires at least 50 mm per section. The former instruction to manually enter zero is removed. Saved schema-v1 height/depth zero sentinels remain compatible internal representations of explicitly labelled Automatic choices.

Drawer automatic depth now reserves body-board thickness for internal drawers, matching the legacy utility; the migrated implementation incorrectly used door thickness when these differed. Form and geometry use the same default-depth function. Drawer supports remain physical material and are included in the visible height budget.

Malformed trees, excessive nesting, invalid stock/material dimensions and undersized generated parts still fail through existing strict validation. No database schema, permissions or persistence contract changed.

## Boundaries

- This remains the existing proposed frameless construction model. Hardware model selection, load limits, joint qualification, face-frame/pocket joinery and the legacy tall-cabinet splitting system are not certified by this form or the sourcebook.
- Existing advanced layouts retain independent door leaves over their non-external-drawer sections. This revision does not silently reinterpret those saved doors as continuous compartment-height leaves or change their material identities.
- Impossible parent shrinking preserves manual allocations and provides a real validation error; it does not silently resize user-entered section/drawer heights.
- A fully manual layout that leaves less than a 50 mm section plus divider cannot create a remainder. Select Automatic height on an existing section or reduce its manual allocation.
- Hardware-specific runner geometry must be selected from a manufacturer specification. Legacy 12.7 mm is an editable proposed side-clearance default, not an undermount standard.

## Verification

Unit checks cover divider conservation, automatic sharing, manual remainder creation, overflow/nonfinite/minimum rejection, nested resizing and configuration identity retention. Browser journeys cover the interconnected drawer/hanging workflow, saved reload, cancellation, nested shelves, invalid dimensions, responsive layouts, global-unit conversion, millimeter-only fields, mode switches, shrinking without losing compartments and section-type setting retention. Final run results are recorded below after completion.
## Final automated evidence

- 85 unit/database checks passed, including four allocation/depth/minimum-content tests.
- Full standard browser run: 74 of 76 passed initially. The two project tests were rerun with all cabinet and project scenarios: 17 of 17 passed. The stale-tab assertion now checks the updated heading text while the rename modal correctly makes background content inert. The other case passed on rerun without an application change.
- TypeScript, ESLint and documentation-link checks passed. Desktop and phone form screenshots were inspected under `artifacts/review/cabinet-config/`.
- The production build and isolated Google/account contract outcome is appended below. These contracts use a loopback identity-provider test double; they are not live hosted-service approval.

Production compilation succeeded. All 11 isolated Google/account contracts are verified: 10 passed in the full contract run and the cabinet save/history contract passed on its final rerun. That test now uses clock.fastForward to avoid rendering a simulated minute of WebGL frames, while still verifying repeated session checks and preservation of the open unsaved form. Its door-position interaction also follows the new segmented control. No live OAuth or database permission changes were performed.

# Top-down compact sections and deliberate empty space — 25 October 2026

## Current behavior

Section 1 is the top section in both the inspector and cabinet labels. Sections are always-open semantic groups with a compact header: drag handle, number, Auto toggle, copy and remove. Type and height share a row; related controls have reduced spacing. Compartment and Construction disclosures remain. Keyboard/drag reordering and colored help remain available; duplicate move-arrow controls are removed because the handle already supports Arrow Up/Down and Home/End.

Manual height edits never create additional sections. Add section adds exactly one section below the existing sections, with a blank manual height. Enter its height or explicitly select Auto before saving. Copy preserves the source height/settings and inserts below it; removing a section does not turn a remaining manual section into Auto.

A valid manual stack can leave height unallocated. The inspector shows **Available empty space** in red with its converted measurement, as an advisory rather than a save-blocking error. Explicit Auto sections still share the remaining clear height when selected. Unknown, negative, overflowing or sub-50 mm section heights remain invalid; pending blank heights have a short completion hint rather than the generic tree-validation message.

## Geometry and compatibility

Persisted section arrays retain the original bottom-to-top storage convention. The inspector reverses that view and reverses drag/keyboard changes back before saving. Stable IDs, material paths and existing fully allocated geometry are preserved. New manual stacks align to the top of the parent compartment and leave unallocated height below; no hidden filler section or extra board is manufactured. Panel/hardware section labels use the same top-to-bottom numbering as the form.

The shared allocator deducts all horizontal dividers and permits a nonnegative unused balance. The same result drives visible totals and physical positions, including nested compartments. No schema or database permission changes are required. Existing manufacturing/quote/release gates remain unchanged.

## Verification

- Existing unit/database suite: 88 passed; two additional top-down/empty-space unit checks passed. These verify actual rod/separator positions, saved layout compatibility, no filler creation, divider deductions and genuine invalid-height rejection.
- Isolated SQL snapshot validation accepts a cabinet with intentional unallocated height, while existing private-save checks remain enforced.
- Twelve targeted browser scenarios are verified, including the auto-scroll case on rerun after adapting its fixture to the shorter form. They cover top-down labels/order, blank additions, explicit manual gaps, red warning, save/reload/removal, unit switching, desktop/phone density, drag cancellation, real touch, nested keyboard moves, focus retention and auto-scroll.
- TypeScript, ESLint and documentation checks pass. Screenshots were inspected at desktop and phone sizes under artifacts/review/top-down-sections/.

UI/UX Pro Max database searches did not produce a useful compact-form match after one retry. The implementation uses its built-in field-grouping, readable-label and responsive-control guidance; no unrelated generated design system was applied.

This supersedes the automatic-remainder and section-accordion behavior described in earlier cabinet follow-ups. It does not renumber the original implementation phases.

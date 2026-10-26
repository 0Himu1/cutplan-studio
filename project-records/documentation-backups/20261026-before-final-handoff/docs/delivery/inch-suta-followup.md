# Global inch/suta input follow-up — 23 October 2026

24 October update: Body/back/door and catalog material thickness inputs now always use mm, as requested. Other physical inputs retain the global preference. The 3D panel labels now follow global units for width/height while retaining metric thickness. The [cabinet follow-up](cabinet-compartments-followup.md) supersedes the original thickness and label behavior described below.

## Delivered

The owner requested the legacy inch/suta converter and its surrounding global-unit behavior. The reference implementation was inspected in `D:/himu/EaseIT/v0-cabinet-cutting-generator/components/ui/inch-suta-input.tsx`, `lib/utils/unit-utils.ts` and the settings slice before adapting it to CutPlan Studio.

In Dimensions, choose **Display units → Inch + suta**. Every physical measurement input uses the same preference: cabinet/shoe-rack/bookshelf/table dimensions and construction, Sheets panel spacing/margin, photo measurement confirmation, and staff catalog thickness/sheet/edging dimensions. Millimeter mode has one field; inch mode has separate inch and suta fields. Quantities, counts, BDT prices and price-per-sheet/meter units are not length measurements and remain unchanged.

The preference persists per browser under `cutplan.measurement-unit.v1`, survives navigation/reloads and synchronizes between tabs. Browser-storage failure keeps the selector usable within the current page. The selector is available in Dimensions, photo measurements and the catalog form; all use one shared setting.

## Conversion and precision contract

- 1 inch = 25.4 mm. 8 suta = 1 inch. 1 suta = 3.175 mm.
- Fractional suta and decimal inches are supported. For example, 10 inch + 4 suta = 266.7 mm; 0 inch + 0.5 suta = 1.5875 mm.
- Suta overflow carries into inches when the field normalizes on blur; 30 inch + 8 suta becomes 31 inch + 0 suta.
- Existing values convert automatically in both directions. Switching units never rewrites geometry, creates an Undo step or changes the saved project version/hash.
- The canonical editing state stays in millimeters. Displayed suta rounds to two decimal places, matching the legacy presentation. Untouched canonical values retain their precision; conversion of an edited pair suppresses binary floating-point noise at 12 decimal mm places. An unchanged companion fraction retains its precise value during editing.
- Empty, negative and nonfinite values are not silently clamped into a valid measurement. Existing geometry/nesting/photo validation blocks invalid results. Catalog fields retain required positive-measurement validation and submit hidden canonical mm values in inch mode.
- Apply/Cancel, one-edit Undo/Redo, save/recovery and account-history behavior are preserved. Unit choice is a separate preference; Cancel discards form changes, not the global preference.

This change concerns measurement inputs. Read-only specifications, drawings, generated PDFs, frozen nesting and machine/report coordinates remain explicitly labelled canonical millimeters. No database schema, project format, catalog publication, authentication role or live release gate changes are required.

## Verification

`npm run check` passes 65 unit/database tests, typecheck, lint, documentation links and production build. Two new conversion tests cover exact eighth-inch arithmetic, fractional/zero/carry cases, round-trip precision and invalid input. Three new browser scenarios cover bidirectional conversion without a saved edit, actual paired-input Apply/Undo/save, global cross-project/reload/tab behavior, construction/Sheets/photo integration, invalid input and bounded desktop/tablet/phone/short-landscape tasks. The catalog account contract submits 6 suta as exactly 19.05 mm while preserving untouched 1219/2438 mm stock dimensions.

The isolated Google/account contract suite passes 11 scenarios, including that catalog test. The temporary staff identity and API writes exist only inside the loopback protocol double; no real staff membership or catalog record was changed. Full standard browser regression: 65 scenarios passed. Final normal-development preview: all three inch/suta scenarios passed after restart. The recurring local MongoDB package absence was repaired offline at the existing pinned 7.7.0 version; no dependency was added to the manifests. The preview is running on port 3100.

Screenshots: `artifacts/review/inch-suta/dimensions-{1366,768,390,720}.png`. The phone layout was visually inspected; both fields fit within the existing short dialog.

Before editing existing files, originals were preserved at `project-records/source-baselines/20261023-before-inch-suta/original-files.zip`, SHA-256 `7d6748f74f5f3addd4502162c5e5b90859655d65f8a5ba032db8481d68e09a30`. The original 22-phase plan and earlier handoff evidence remain intact. This is a post-plan UX follow-up, not a new numbered phase.

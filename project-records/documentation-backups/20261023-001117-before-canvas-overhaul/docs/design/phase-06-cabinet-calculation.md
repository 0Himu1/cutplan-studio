# Cabinet calculation review

Mode: Operate. Extend cabinet project details; retain the existing shell and project storage contracts. The owner accepted Phase 5 and authorized proposed construction rules for review on 2026-10-22.

## Direction contract

THESIS: A cabinet's individual physical panels can be checked against explicit construction assumptions before an editor or manufacturing promise is introduced.

OWN-WORLD: Inherit Inter, dark base #0F0F1A, surface #1A1A2E, text #F9FAFB, muted #9CA3AF and indigo #6366F1; existing white light theme and accessible control derivatives remain unchanged.

STORY: Open a cabinet draft, choose a labelled review example, inspect dimensions and each physical panel, then expand construction rules and panel positions. Examples never change the saved project.

FIRST VIEWPORT: Append a left-aligned review section after the existing project overview. Heading and approval notice lead; example selector and overall measurements precede a compact cut list. At phone widths each row stacks its label above measurements; no wide-table scrolling.

FORM: Scoped project-detail extension, code-led; seed: none (precisely specified extension). Layout: project overview / review heading / example and dimensions / physical parts / construction disclosure. Preserve the existing visual system; no decorative metrics or new palette.

SIGNATURE: Every row retains a stable panel ID and opens its own mm position and radian rotation. An explicit not-approved state separates valid mathematics from manufacturing sign-off.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Review against the brief

The cabinet cut list is the subject-specific content. A new standalone dashboard, parameter editor and decorative illustration were rejected as outside Phase 6. The approved existing palette and font take precedence over generic font-selection advice.

## Shipped component and persistence boundary

`src/components/furniture/cabinet-review.tsx` is a read-only review extension in cabinet browser-draft and account-project details. It follows the overview and precedes account revision history. The overview's unavailable-dimensions copy refers to saved-project geometry and editing; the synthetic review dimensions are separate. The overview schematic remains an uncalculated project shell. `CabinetReview` receives no project geometry and stores only its selected fixture ID in component state. Choosing an example does not mutate a browser draft, assign a real material, save dimensions or create an account revision.

The native labelled selector exposes four synthetic fixtures from `cabinet-fixtures.ts`: inset back with two doors, outside back with raised bottom, open cabinet with one shelf, and an oversized validation example. Overall and cut measurements use explicit mm units and tabular numerals. The selector/overall-dimension grid stacks through 760px; each individual panel row stacks its label above measurements through 540px. Native panel details expose stable identity, board role without catalog assignment, panel-center position in mm, rotation in radians and allowed stock rotation. The separate construction disclosure states assumptions, illustrative stock limits and coordinate conventions.

The always-visible approval notice separates calculation review from manufacturing approval, quotation and machine dispatch. Blocking errors replace the whole cut list with an alert and instructions to choose another example; valid results use a polite live region. No partial panel output appears. No Phase 7 editor, manufacturing certification, pricing, nesting or machine output is delivered here.

## Finish evidence and incumbent comparison

The fresh finish review in `.impeccable/review/phase-06/finish-review.md` records **Ship**, with no visual fix or recapture required, and requests the scoped component documentation now recorded in `DESIGN.md`. It assessed ten desktop, tablet, mobile, light-theme, expanded and error captures. The supplied validation reports 26 browser checks, six Google/account checks and 23 unit checks passing; these are retained evidence, not a claim that the documenter reran them. One scoped detector result was `[]` across the three changed UI files; it does not certify the entire incumbent system.

Comparison against `DESIGN.md` and `src/app/globals.css` confirms reuse of existing Inter, light/dark semantic palette, focus treatment, flat borders and control radii. No shared palette, typography, frontmatter token or `.impeccable/design.json` value was changed. The pre-existing documented Phase 2 detector advisories remain incumbent context; the root document still describes its Phase 1/2 baseline. Scoped review dimensions clarify older unavailable-dimensions language without promoting synthetic dimensions into persisted geometry or system-wide design rules.

No raster ships with this code-led component. QA PNGs are ignored review evidence, not product assets, so no shipping-raster provenance record is needed. The finish verdict concerns this scoped review surface; it does not assert calculation-engine certification or Phase 7 completion.
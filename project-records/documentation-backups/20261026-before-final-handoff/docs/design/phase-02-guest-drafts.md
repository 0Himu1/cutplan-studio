# Guest draft workflow

Mode: Operate. This phase extends the approved studio shell with the specific project workflow in delivery Phase 2. It retains the current palette, typography, navigation and furniture geometry. It is not a new visual world or marketing concept.

## Direction contract

THESIS: A customer can give a furniture idea a name, return to it and manage it without believing a guest browser draft is a cloud backup.

OWN-WORLD: Inherit DESIGN.md tokens, flat borders, self-hosted Inter, quiet Lucide actions and front-elevation schematics. Family-specific diagrams identify cabinets, shoe racks, bookshelves and tables without inventing construction measurements.

STORY: New Project opens a dedicated page, where a native radio group selects the furniture family and a labeled input names the draft. Creation opens a draft overview. Home shows recent real drafts; Projects exposes all records, rename and confirmed deletion.

FIRST VIEWPORT: Project names and save location lead. The picker uses a four-column desktop row and a two-column mobile grid. Draft cards use three/two/one columns by available width; all names wrap. Detail combines a labeled schematic with project information and explicit editor limitations.

FORM: A scoped addition to the existing studio structure. seed: none (ordinary extension of the approved Phase 1 surface). No new brand, comp or concept tournament.

SIGNATURE: A family-specific schematic follows the chosen type across picker, project card and overview. Save-location text remains visible. Rename is inline; deletion and corrupt-data reset use focus-protected native dialogs with Cancel first.

## State and accessibility rules

Loading is distinct from an empty collection. Storage failures remain actionable and never imply successful saving. Corrupt or newer-version data is preserved until an explicit reset, with a recovery-download action. Use semantic links for opening drafts, buttons for mutations, fieldset/legend and native radios for type selection, visible field errors and a native modal confirmation for destructive changes.

Guest drafts contain only name, furniture family, IDs, timestamps and record version. No dimensions, prices, customer accounts or construction correctness are implied. The editor and cloud saving remain outside Phase 2.

## Shipped implementation record

Phase 2 retains the Phase 1 palette, Inter, flat geometry and shell. Project grids are 3/2/1 columns with 22px gaps (two through 1100px; one through 540px); the four-column picker becomes two through 1100px. Creation is capped at 1040px. Inputs are at least 46px high, with 14px desktop/16px mobile text. Dialogs are at most 440px wide, with 28px padding (24px through 540px), a 65% black backdrop and scoped danger colors. DESIGN.md records actual component values and behavior.

States include real recent/all drafts, empty/loading, inline rename, native modal deletion/reset, missing draft, unavailable storage and corrupt/newer-data recovery. Four family schematics remain unmeasured; save location and editor limitations stay explicit.

Fresh reviewer disposition: SHIP, no material fixes. Evidence: 18 browser tests, 5 data tests and type/lint/build passing; eleven final captures in `.impeccable/review/phase-02` cover desktop/mobile Projects, creation, Home, detail and deletion plus light Projects. The retained `detector.json` baseline has 16 advisory metadata findings, including pre-existing font/radius omissions. Documentation additions do not assert a clean detector rerun or authorize CSS repairs.
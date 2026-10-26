# Materials, categories, variants, colors and publication

## Final taxonomy and physical model

One category card groups fixed physical thickness variants. Each variant retains its own UUID, stock specification, independent price history, color and publication state. Saved selections reference the physical variant, preserving downstream identity.

| Category | Fixed thicknesses (mm) | Variants | Priced at import |
| --- | --- | ---: | ---: |
| Plain MDF | 3, 6, 9, 12, 15, 18, 25 | 7 | 4 |
| Plain wood-chip particle board | 6, 9, 12, 15, 16, 18, 25 | 7 | 7 |
| MR-grade plywood | 6, 12, 15, 18, 20, 25 | 6 | 0 |
| Gorjon plywood | 3, 4, 6, 10, 12, 15, 16, 18, 25 | 9 | 9 |
| Marine-grade plywood | 6, 12, 16, 18, 19, 25 | 6 | 6 |
| Veneered board | 12, 15, 18, 25 | 4 | 0 |

These are selected app options, not a claim every factory sells every thickness. The owner clarified **MR plywood, not HMR MDF**. Melamine/HPL/UV high gloss/acrylic are deferred surface finishes, not substrate categories. Veneered board remains selected; supplier core/species requires review. Other researched families were not selected.

The original 20 brand/product import was superseded. Later retirement preserved **23 old boards and one finish** with historical IDs/prices. Edging was untouched. Do not rerun the old import to restore the obsolete list.

## Staff workflow

Open `/admin/catalog` with active staff/admin authority. The searchable grid is default. Clicking a category replaces the grid with a compact editor; choose its fixed thickness variant. Details, Pricing, compatible Finishes and Availability are separate tasks. Successful Save returns to the grid; errors retain draft state.

Each variant has stock dimensions, source/name/URL, grain and optional color. Prices require valid units/reasons; publishing requires a suitable positive price and review. History is versioned. Details/price/color changes unpublish that variant for renewed review; publishing one thickness never publishes siblings.

Color belongs to board creation/editing in the catalog: native picker plus validated six-digit hex. Old rows may be null. Different thicknesses may have different colors. This is not a finish SKU and does not make an unpublished board public. No arbitrary colors were assigned by migration.

Underlying finish compatibility remains supported, but no active deferred-finish rows were created. Conditional Materials sections show only available or existing selections.

## Fresh hosted state

Read-only query at **26 October 2026 07:19:42 UTC / 13:19:42 Dhaka**:

| Category | Active variants | Published | With color | With price history |
| --- | ---: | ---: | ---: | ---: |
| MDF | 7 | 0 | 0 | 4 |
| Particle board | 7 | 0 | 0 | 7 |
| MR plywood | 6 | 0 | 0 | 0 |
| Gorjon | 9 | **9** | **1** | 9 |
| Marine plywood | 6 | 0 | 0 | 6 |
| Veneered board | 4 | 0 | 0 | 0 |
| Total | **39** | **9** | **1** | **26** |

There are 62 board rows: 39 active and 23 retired; zero active finishes and one retired finish. These are observed states, not an endorsement/reconstruction of manual publication approvals. The October 25 receipt correctly recorded all 39 unpublished at import; that is no longer current. This audit made no publication/color changes. [Inventory evidence](../../project-records/handoff-audits/20261026/catalog-inventory.json).

Missing 13 price histories: MDF 3/9/25, all six MR and all four veneer. Missing prices were not fabricated as zero. Prices captured October 25 are supplier examples, not universal or freshly researched market quotes.

## Provenance and supplier cautions

- [Category manifest](../../project-records/catalog-imports/2026-10-25-board-categories/variants.json): exact dimensions, draft prices, source URLs and notes per physical option.
- [Import receipt](../../project-records/catalog-imports/2026-10-25-board-categories/receipt.json): dated database evidence, not a live status feed.
- [Historical supplier import](../../project-records/catalog-imports/2026-10-25-akij-superboard/report.md): superseded brand/product list retained for provenance.

Sources include Akij specification/guides, Super product/retailer listings, Particle Mela, Ahmed Wood and marine-stock vendors recorded per variant. Retailer prices and manufacturer specifications have different evidentiary value. Feet-only sheets use exact **1219.2 × 2438.4 mm**; metric-published veneer uses **1220 × 2440 mm**. Supplier nominal sizes, core/species and conservative grain locks require review before manufacturing.

## Materials inspector (R061)

**Cabinet boards** provides Body/Back/Doors groups, one compact group at a time. Select category then fixed physical thickness; preserve matching thickness on category change when possible, otherwise choose the nearest valid option. Stock/price/catalog color remain visible. Supported manual thickness/preview-color fallback exists when no board is assigned.

Group changes use `selectGroupBoard` to update thickness/stock/grain and reflow geometry atomically, clearing conflicting individual assignments in that group. New panels inherit defaults. This is a physical Apply action, not merely a swatch. Thickness stays mm globally.

**Individual panel** uses a direct selector and inherited/override summary. Use cabinet default removes the override. Copy to matching panels remains a separate bulk operation, not a replacement for future-part inheritance. Finishes/edging disclose only when available or already assigned.

Apply materials commits the draft to editor state; Cancel discards it. Undo/Redo and local/cloud persistence preserve results. Catalog failures disable editing and offer Retry outside the disabled fieldset; existing selections and read-only/recovery locks remain safe.

Appearance precedence: **face finish → catalog board color → project/legacy preview color → beige**. Edges use board color unless edged. Catalog color is edited in the catalog rather than competing with another cabinet color field. Color does not change cut dimensions or approval; selecting another physical board can.

## Schema changes

`202610250001_cabinet_material_defaults.sql` extends cabinet defaults; implementation also updated MongoDB validation. `202610250002_board_category_variants.sql` adds category grouping, fixed thickness/duplicate-active guards. `202610250003_board_colors.sql` adds nullable validated hex on `board_skus` and create/edit payloads. Existing RLS/function grants and immutable history are preserved. All 17 migration versions freshly match the linked database; see [operations](06-persistence-security-operations.md).

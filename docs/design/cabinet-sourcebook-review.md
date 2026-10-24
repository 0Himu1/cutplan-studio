# Cabinet sourcebook review — 24 October 2026

The supplied `Carpentry Sourcebook — Cutplan Studio.html` is a research index, not an approved construction specification. Its formulas, sample calculator and glossary have been read. The legacy cabinet implementation remains the behavioral reference; existing manufacturing approval gates remain unchanged.

## Verified references

- [Compusoft Panel Formulas](https://eq.compusoftgroup.com/documents/help/panel-formulas.htm): parametrically calculated panel dimensions, material-driven thickness, explicit panel edges and grain direction. Supports keeping geometry centralized and material thickness separate from display units.
- [Blum TANDEM installation instructions](https://d2.blum.com/services/BEC003/tdm563h_ma_dok_bus_%24sen-us_%24aof_%24v4.pdf): specifies **inside** drawer width relative to opening width for that particular runner family. This is not interchangeable with an outside drawer-box deduction.
- [Accuride side-space guidance](https://help.accuride-europe.com/knowledge/understanding-side-space): clearance depends on the slide; its 3832 example requires 12.9–13.2 mm side space. A generic 12.7 mm legacy default is a proposed setting, not universal hardware approval.
- [Woodworkers OpenSCAD library](https://github.com/fxdave/woodworkers-lib): useful conceptual example of deriving panel positions and edge treatment from an enclosing volume. No source code was imported.

## Conflicts found in the supplied sourcebook

- Shelf formula `W − 2T − 2 mm` disagrees with the phrase “2 mm each side.” The shoe-rack example's 759 mm width also disagrees with its own W=813, T=18 formula (775 mm).
- Door overlay formulas and the embedded calculator mix opening-based and outer-dimension-based values. Adding a generic overlay to an outer-width door formula can oversize leaves.
- Back height formulas differ between furniture types and do not specify a consistent joint or groove convention. They cannot replace the selected inset/outside construction model.
- Undermount runner clearance is stated as a generic 51 mm deduction; actual specifications distinguish inside and outside box width and runner models.
- The embedded calculator uses `value || default`, which replaces a valid zero skirting height. It also estimates boards by area with an arbitrary yield factor. Neither behavior is suitable for exact cut lists or nesting.
- Material edging is described as negligible, but finished panel size and cut size can differ. No automatic edging deduction was introduced without a specified finish convention.
- Kerf is not a universal 3 mm allowance. Existing user-selected spacing/tool settings remain explicit; area estimates never certify a feasible sheet layout.

## Decisions for this form revision

1. Preserve canonical millimeters, actual panel-thickness overrides and the existing proposed joints. Display-unit changes must not alter physical geometry.
2. Account explicitly for each compartment partition and each horizontal section divider. Display derived space using the same pure allocator as panel generation.
3. Keep millimeter-only door gap, shelf-side clearance and drawer-slide clearance independent of global inch/suta mode. The user confirmed “Side Sill” means shelf-side clearance.
4. Use explicit Automatic height/depth controls. Saved v1 zero sentinels remain internal, compatible representations of those choices; users never need to enter zero to complete an allocation.
5. Keep hardware-specific approval, load assessment, pocket joints, frame joinery and drilling patterns outside automatic manufacturing release. The sourcebook is not approval for those rules.

The Popular Woodworking article URL could not be fetched during this review. Broad library links and historical books have not been treated as verified specifications for modern runner or hinge geometry.

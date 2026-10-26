# Cabinet construction, configuration and units

Final rules supersede intermediate follow-ups where noted. Legacy reference: cabinet form and `lib/nesting/cabinet-calculation/` in `D:/himu/EaseIT/v0-cabinet-cutting-generator`. Current code uses the current schema/persistence, not legacy Redux architecture.

## Dependency chain and evidence

W/H/D and construction positions → physical board thicknesses → usable inner dimensions → compartment widths → section heights → shelf/drawer/hanger/door/frame panels → stable IDs/contours → materials → nesting/documents/inspection.

The supplied sourcebook was studied, but its inconsistent shelf deductions, mixed overlay conventions, ambiguous back formulas, zero/default bug and area-yield estimates were not imported as authoritative rules. The [sourcebook review](../design/cabinet-sourcebook-review.md) records conflicts and hardware-specific evidence. A generic runner clearance is not an approved hardware schedule.

## Unit contract

Physical data stays **millimeters**. Inch display uses two inputs: inch and suta; **8 suta = 1 inch**, **25.4 mm = 1 inch**. Formula: `mm = (inch + suta / 8) × 25.4`. Switching display units converts existing visible values rather than reinterpreting them. Untouched canonical precision is preserved; rounded labels are not repeatedly written back.

Fractional suta and decimal inches are supported. For example, 10 inch + 4 suta = 266.7 mm; half a suta = 1.5875 mm. Overflow normalizes on blur (30 inch + 8 suta → 31 inch). Suta displays to two decimals, while edited-pair conversion suppresses floating-point noise at 12 decimal mm places and retains the precise untouched companion. Empty/negative/nonfinite inputs remain invalid rather than silently clamping. Changing units creates no Undo step or saved version/hash change; Cancel discards form edits, not the global preference. Generated/frozen reports and machine coordinates keep their explicitly labelled canonical units unless that output has its own supported display conversion.

| Fields | Policy |
| --- | --- |
| Cabinet/section lengths, offsets, worksheet lengths | Global mm or inch/suta display. |
| Board/panel thickness | Always mm, including catalog choices. |
| Door gap | Always mm. |
| Shelf-side clearance, clarified as “Side Sill” | Always mm. |
| Drawer slide/side clearances and fit allowances | Always mm. |
| Counts/prices/feed/spindle/tool parameters | Their explicit domain units; not blanket length conversion. |

The browser-wide display preference does not trigger a cloud save. Shared measurement inputs implement conversion across supported forms.

## Final form organization

Size holds primary W/H/D and dimensional settings. Construction holds door/back position, inset/overlay, raised-bottom behavior and fixed-mm fit allowances. **Materials now owns board selection/manual thickness/appearance**; Dimensions only summarizes resolved thicknesses.

Automatic/Manual is a segmented control at the start of compartment configuration, default Automatic. Automatic compartments follow legacy paired-door/leaf-width behavior. Manual widths reserve physical partitions. Mode switches preserve compatible identities/settings; impossible shrinking reports conflicts rather than silently discarding manual allocations.

Compartments use accordions. **Sections remain visible, compact and non-accordion**, overriding the initial nested-accordion suggestion. They show type, height/auto controls and conditional settings together. Open sections configure shelves; hanging sections configure rod/offset; drawer sections configure count, face position, height/depth and clearances. Nested side-by-side child compartments retain their own controls. Type changes preserve compatible settings and reveal relevant fields.

Drag handles reorder sections by stable identity, with pointer/touch/keyboard support. Visible and physical order is **top-to-bottom**. Saved arrays remain bottom-to-top and the UI adapts by reversing them; no reorder schema migration was introduced. Delete/duplicate/reorder preserve unrelated identities/material paths.

## Height and width accounting

`cabinetInterior()` deducts resolved side thicknesses from outer width. Inner height deducts raised-bottom/skirting plus top/bottom thicknesses. Usable depth respects back/door positions and is not identical to outer depth.

For `n` sections, clear parent height `H`, divider thickness `T`:

- Divider allocation = `max(0, n − 1) × T`.
- Section capacity = `H − divider allocation`.
- Manual allocation = sum of explicit heights.
- Remaining capacity is shared by sections explicitly set to Automatic height.
- Without automatic sections, positive unused height stays empty **below the top-aligned stack**.
- Each resolved section needs at least 50 mm. Nonfinite, negative, overflowing or undersized allocations fail validation; arithmetic tolerance is 0.1 mm.

Example: 70 inches clear height with one 30-inch manual section leaves 40 inches empty. If a second automatic section is explicitly present, its divider consumes thickness first, then it receives `70 in − 30 in − divider thickness`.

**R032 supersedes remainder insertion:** adding/editing/removing manual sections never silently creates a filler section. Available empty space turns red as a nonblocking warning. Explicit Automatic height remains supported; saved `heightMm: 0` is its defined compatibility sentinel, not a hidden manual input rule. Blank/invalid manual values are not silently treated as valid automatic allocations.

Compartment widths reserve `(count − 1) × partition thickness`; equal/proportional fitting updates nested widths. Impossible parent shrinking preserves conflicting manual values and shows genuine correction guidance. Drawing, preview, validation and submitted data share the allocator.

## Door, drawer and hinge-support rules

| Part | Final behavior |
| --- | --- |
| Ordinary compartment doors | Continuous leaves across ordinary open/hanging/shelf sections. |
| External drawer zones | Interrupt door coverage over their span; ordinary section boundaries do not split leaves. |
| Drawer structural sides/front | Body-board construction under supported role assignments. |
| Drawer box back and bottom | Back-board group. |
| Drawer face | Door/front-board group. |
| Open animation | Hinged doors open; drawers translate to full extension; no physical data mutation. |
| Shared hinge support | Parallel **76.2 mm (3 inch)** body-board strip where adjacent compartments need the same partition support. |

In the owner's 64 × 84 inch/two-compartment/four-door example, outer leaves use outer sides; inner adjacent leaves use partition/support rather than both loading the same bare partition. The pure hinge-booking calculator avoids unnecessary strips and reserves physical support space in openings. This follows the legacy detail and owner instruction; it does not certify fasteners/load or generate hinge drilling.

## Final depth and notch rules

| Geometry | Final rule |
| --- | --- |
| Main/root compartment partition | **Full usable depth**, back-aligned. R067 reverses the earlier global shortening. |
| Nested side-by-side partition inside a section | Usable depth minus **25.4 mm**, back-aligned. |
| Shelves and horizontal section separators | Usable depth minus **25.4 mm**, back-aligned. |
| Door-frame strip | **76.2 mm**, front-positioned; never shortened with shelves. |

`compartments.ts` uses root path `layout` to distinguish the main partition from recursive child partitions. Full usable depth still excludes selected back/inset-door allowances; it does not mean outer depth.

Frame-side shelves regain rear width to the partition face and have a front corner through-notch where the support intrudes. With 18 mm body, 76.2 mm support and 25.4 mm setback, the fixed-shelf notch is **18 × 50.8 mm**. Shelf-side clearance reduces notch width; nested slots inherit support intrusion. Undersized/invalid resulting panels remain blocked.

One `panelContour` feeds extruded 3D meshes, floor-plan polygons, Sheets, assembly notch schedules, nesting and manual contour G-code. Removed corners are absent from picking/collision solids. Packing still reserves rectangular envelopes, not interlocking notch yield. Notched parts retain orientation. One by one is the supported notch cut order; incompatible orders fail visibly. Frozen rectangle-only production review rejects notches instead of silently omitting them.

## Validation and compatibility

Invalid construction blocks Apply. **Stock-fit/grain warnings do not block ordinary dimension editing/saving**; oversized backs may be valid designs with unsuitable selected stock. Nesting/quotes/production must still resolve infeasible stock. Recalculation follows dimension changes automatically; durable account revision save remains explicit.

Group board changes atomically update thickness/stock/grain and reflow geometry. Individual physical thickness overrides participate in calculations. Stable identities, current family contracts and older snapshots remain compatible. Opening older inputs regenerates geometry with current rules, so rendered results can differ without changing immutable stored bytes. Frozen/accepted documents retain engine/hash guards.

Relevant tests: allocation, compartments, top-down sections, reorder, drawers, frames, notches, material defaults and stock editing; see [verification](07-verification-and-limitations.md).

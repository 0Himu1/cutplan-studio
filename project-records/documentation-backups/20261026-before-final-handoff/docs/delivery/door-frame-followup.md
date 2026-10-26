# Partition door-frame follow-up — 25 October 2026

## Reference and decision

Reviewed the original `lib/nesting/cabinet-calculation/frame-calculator.ts` and its integration in `cabinet-assembly-calculator.ts`. The legacy design books each partition to one compartment's hinges; an adjacent compartment needing the same support receives a parallel 76.2 mm (3 inch) body-board strip. The partition and strip are centered together on the original split. A single door in the last compartment hinges on the right side.

The supplied Carpentry Sourcebook distinguishes general face-frame and frameless construction. It does not specify this particular sandwich reinforcement, its fasteners or an approved load rating. This implementation follows the user's detail and original calculator, without claiming structural certification.

## Implementation

- Added a shared pure door-coverage and hinge-booking calculator. Ordinary sections do not split doors; external drawer sections interrupt coverage. Completely external/open compartments do not reserve hinge frames.
- Added one body-board strip per contested partition. Its depth is 76.2 mm, its thickness follows the body board, and its height covers the receiving compartment's door envelope within the carcass opening. Shallow cabinets or insufficient clear widths fail with specific guidance.
- Centered the partition/frame pair at the original split. Each adjacent opening reserves half the additional board thickness. Drawer boxes, rods, shelves, horizontal separators and recursively nested contents use the reduced clear opening. The form displays this effective clear width and uses it for drawer-box width.
- Stored compartment widths retain their existing allocation semantics and are not silently rewritten. Hinge metadata identifies side, partition or frame and fixes the final single-door hinge direction.
- Generated frames use the existing safe panel-ID grammar, so material assignment and saved-input validation require no schema or permission change. They appear in the shared 3D, 2D, cut-list, material, nesting and Sheets paths.

## Scope of parity

Update: the rectangular-shelf limitation below is superseded by [corner notches and shelf setback](corner-notch-followup.md).

The legacy implementation allows notched shelves around frame strips. Current cabinet generation retains rectangular parts and fits them within the narrower support opening instead. It does not generate shelf notches or hinge drilling. Hardware, fasteners, loading and manufacturing release remain subject to the existing approval gates. Existing assigned parts whose thickness conflicts with the new geometry still require material review.

## Verification

- All 95 unit tests pass, including the 64 × 84 inch/four-door example, side/partition/frame/side hinge booking, non-overlap, nested sections, drawer widths, unnecessary-frame prevention, nesting conservation, material ID validation and isolated SQL snapshot acceptance.
- TypeScript and full ESLint checks pass.
- Browser verification covers frame clearance in the form, labels in 3D, door opening, save/reload, 2D selection and Sheets. Screenshots are in `artifacts/review/door-frames/`.

No phase renumbering, hosted database modifications or production approval changes.

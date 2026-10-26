# Notch-aware collision inspection — 26 October 2026

## Behavior

X-ray now checks the visible, closed, assembled model for panel interference and draws translucent red boxes only over overlapping solid material. The inspector reports the number of overlapping panel pairs. Normal face contact and overlaps no greater than 1 mm in any dimension are ignored, retaining the legacy visual threshold; this is not a machining clearance or manufacturing approval.

The detector uses the same panelContour outline as the actual 3D mesh. It partitions each orthogonal panel profile into non-overlapping rectangular solids, excluding corner notches, and merges adjoining rectangular cells. World bounding boxes provide a broad first pass; actual solid pieces provide the final overlap volumes. Adjacent overlap boxes merge before tolerance filtering so decomposition boundaries cannot hide an otherwise rectangular thin interference. Panel IDs and names remain attached to each region.

Right-angle assembled poses are supported exactly. Arbitrary poses are explicitly listed as unchecked instead of falling back to misleading enclosing boxes. Current model cutouts are rectangular corner notches; curved profiles and internal holes are not introduced by this change and need a future geometry extension. Calculations, saved input, nesting, cutting output, stock and approval gates are unchanged.

Hidden doors/back panels are excluded. Red markers disappear while doors/drawers open, during explosion, and through the closing/collapse animation. The status asks for a closed, collapsed inspection view. This avoids the legacy behavior where markers stayed at assembled locations while panels moved elsewhere. The detector does not claim to test moving-door swept collisions. Markers are excluded from picking, and their geometries/materials are disposed when replaced or unmounted.

## Verification

- Six new unit cases cover actual overlap dimensions/positions, the 1 mm threshold, all corner notch orientations, multiple notches, translated/rotated panels, a support fitting into a horizontal shelf notch, remaining solid material, merged decomposition seams, unsupported poses and unchanged source panels.
- Six existing corner-notch checks passed, including exact 3D removed area, raycasting through cutouts, contour nesting/G-code and assembly data.
- Two browser workflows pass: X-ray state, hide filters, animation gating and unchanged local design; existing right-side hide controls remain functional.
- TypeScript and targeted ESLint pass. Browser screenshot: artifacts/review/collisions/xray-assembly.png.

No database migration, permissions, supplier publication or phase numbering changes.

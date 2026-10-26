# Akij and Superboard import — 25 October 2026

Imported 20 distinct board entries: 10 Akij Board and 10 SUPERBOARD. The live catalog now contains 23 boards; the existing three Desh Warehouse entries were preserved. Every imported item is unpublished, has a supplier link/capture date and a create audit event, and has no price version. No catalog permissions or schema were changed.

## Specification handling

- Akij decorative particle boards use actual 18 mm / 4x8 ft product variants, including variation IDs. Dynamic variations were checked through the supplier's product-variation lookup where necessary. Raw MDF 6 mm and MR Grade Plywood 18 mm use the manufacturer's category specifications.
- Where the supplier states only feet, dimensions are stored as exact conversions: 4 × 8 ft becomes 1219.2 × 2438.4 mm. These are conversions of the stated size, not confirmed factory nominal millimeters. Confirm nominal stock dimensions before publication.
- Superboard pages that explicitly give 2440 × 1220 mm retain those published metric dimensions. PET pages state only 8 × 4 ft and use the exact conversion above.
- Grain direction is not established by these pages. A conservative height lock is stored pending review and is explicitly flagged in each supplier label. It is not represented as a manufacturer-confirmed grain specification.
- Some Superboard decorative listings allow multiple substrates. Entries preserve product/model names rather than inventing a particular core. Confirm the desired core before purchasing or publishing.
- No color hex values, licensed textures or paid finish compatibility were inferred from photographs or decor names. WooCommerce enquiry values of zero were not treated as selling prices.
- Excluded Acrylic Plywood 2020 because its page lists 0.8 mm laminate thickness while also describing a plywood product; it does not establish the finished board thickness. HPL candidates without an explicit sheet size/variant were also excluded.

## Verification

The transactional SQL was tested in isolated PostgreSQL twice: 20 board rows, 20 create events, zero prices, zero published rows and no duplicate inserts. The linked database import then succeeded. A separate read verified every name, source URL, dimension, thickness, review grain lock, initial version and publication/price state, plus the three original board codes.

The import is idempotent for matching codes and fails rather than overwriting a conflicting existing entry. `import.sql` uses the existing catalog-change transaction and the uniquely identified active catalog administrator for audit attribution. It creates no users or permissions.

## Entries

| Supplier | Board | Thickness | Sheet width × height (mm) | Source |
|---|---|---:|---|---|
| Akij | Akij 3D-Black - Particle Board 18 mm | 18 mm | 1219.2 × 2438.4 | [Product page](https://akijboard.com/product/3d-black/) |
| Akij | Akij Dark Oak - Particle Board 18 mm | 18 mm | 1219.2 × 2438.4 | [Product page](https://akijboard.com/product/akij-dark-oak/) |
| Akij | Akij Oak - Particle Board 18 mm | 18 mm | 1219.2 × 2438.4 | [Product page](https://akijboard.com/product/akij-oak/) |
| Akij | Akij American Teak - Particle Board 18 mm | 18 mm | 1219.2 × 2438.4 | [Product page](https://akijboard.com/product/american-teak/) |
| Akij | Akij Albino Oak - Particle Board 18 mm | 18 mm | 1219.2 × 2438.4 | [Product page](https://akijboard.com/product/albino-oak/) |
| Akij | Akij Beech - Particle Board 18 mm | 18 mm | 1219.2 × 2438.4 | [Product page](https://akijboard.com/product/beech/) |
| Akij | Akij Anature - Particle Board 18 mm | 18 mm | 1219.2 × 2438.4 | [Product page](https://akijboard.com/product/anature/) |
| Akij | Akij Antic - Particle Board 18 mm | 18 mm | 1219.2 × 2438.4 | [Product page](https://akijboard.com/product/antic/) |
| Akij | Akij Raw MDF Board 6 mm | 6 mm | 1219.2 × 2438.4 | [Product page](https://akijboard.com/mdf/) |
| Akij | Akij MR Grade Plywood 18 mm | 18 mm | 1219.2 × 2438.4 | [Product page](https://akijboard.com/plywood/) |
| Superboard | Super Board Plain MDF Board 18 mm | 18 mm | 1220 × 2440 | [Product page](https://superboard.com.bd/product/plain-mdf/) |
| Superboard | Super Board Plain Particle Board (Wood Chips) 16 mm | 16 mm | 1220 × 2440 | [Product page](https://superboard.com.bd/product/plain-particle-board-wood-chips/) |
| Superboard | Super Board Plain Particle Board (Jute Chips) 18 mm | 18 mm | 1220 × 2440 | [Product page](https://superboard.com.bd/product/plain-particle-board-jute-chips/) |
| Superboard | Super Board Melamine Board 126 18 mm | 18 mm | 1220 × 2440 | [Product page](https://superboard.com.bd/product/melamine-board-126/) |
| Superboard | Super Board Melamine Board 811 18 mm | 18 mm | 1220 × 2440 | [Product page](https://superboard.com.bd/product/melamine-board-811/) |
| Superboard | Super Board Melamine Board 810 18 mm | 18 mm | 1220 × 2440 | [Product page](https://superboard.com.bd/product/melamine-board-810/) |
| Superboard | Super Board Melamine Board 807 18 mm | 18 mm | 1220 × 2440 | [Product page](https://superboard.com.bd/product/melamine-board-807/) |
| Superboard | Super Board Super Teak 18 mm | 18 mm | 1220 × 2440 | [Product page](https://superboard.com.bd/product/super-teak/) |
| Superboard | Super Board PET LAMINATION 3014 18 mm | 18 mm | 1219.2 × 2438.4 | [Product page](https://superboard.com.bd/product/pet-lamination-3014/) |
| Superboard | Super Board PET LAMINATION 3008 18 mm | 18 mm | 1219.2 × 2438.4 | [Product page](https://superboard.com.bd/product/pet-lamination-3008/) |

Files: `boards.json` contains evidence and review notes; `boards.csv` is the field list; `receipt.json` identifies saved entries. Raw source captures and the isolated check are kept under `artifacts/review/supplier-board-import/`.

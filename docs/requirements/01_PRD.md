# CutPlan Studio Product Requirements

Version 1.0 | 21 October 2026 | Product planning baseline

CutPlan Studio will let customers in Dhaka configure panel furniture in a browser, obtain an itemized BDT quotation, and order flat-pack delivery. The first release must connect the design a customer approves to the exact panels, materials, price, and manufacturing files used to fulfill that order. It is a customer ordering product supported by internal manufacturing tools.

This document defines the product scope and acceptance criteria. Read it with the [technical requirements](02_TRD.md), [design specification](03_Design_Specification.md), [user flows](04_User_Flows.md), and [database design](05_Database_Design.md).

## 1 Product evidence and decision status

The business requirements come from `Cutplan_Studio_Master_Document.docx`, version 1.0, October 2026, particularly Parts 1 to 3, Part 5, and Appendix A. Existing behavior is supported by the source code in `D:\himu\EaseIT\v0-cabinet-cutting-generator`, inspected at commit `5ef2b68eb0d072b3a00878258ba66be4348b0434`. The code explains reusable implementation; it does not override the new product requirements.

In this document, **Required** means explicitly requested in the master document. **Proposed** means a recommended resolution or additional implementation detail. **Open** means an owner must decide before the affected feature can be released. A proposal is not an approved business policy.

## 2 Customers and the problem

Customers cannot reliably buy furniture that fits their actual space from a fixed-size catalog. Working through a carpenter also requires measurements, material knowledge, and repeated conversations that many customers want to avoid.

The primary users are homeowners, homemakers, and small furniture buyers who can browse the internet but have no CAD experience. Their main questions are whether the furniture fits, how it looks, what it costs, and when it will arrive. Operators need a different interface: valid specifications, reliable costs, manufacturer assignment, and production-ready order records.

| Actor | Main job | Necessary access |
| --- | --- | --- |
| Guest | Explore furniture and try dimensions or a photo | Configurator and temporary draft only |
| Customer | Save designs, get quotes, order, track delivery | Own projects, quotes, orders, and assembly guides |
| Shared-link viewer | Review a design or quoted design | Read-only snapshot; no address or manufacturing access |
| Admin or operator | Maintain catalog and fulfill orders | Catalog, pricing, orders, partner assignment, production files |
| Manufacturing partner | Manufacture assigned work | Receives files from CutPlan outside the application in v1 |

## 3 Commercial and geographic boundaries

Required: Bangladesh market, Dhaka-city delivery, English interface, BDT pricing, and panel construction using coreboard, MDF, and particle board. Revenue comes from the difference between the customer price and fulfillment cost. Customers do not pay a subscription.

Required: multiple manufacturers may be pre-quoted, and the lowest-cost partner is selected per order. Proposed: selection considers only partners qualified for the selected construction, material, machine, and delivery commitment; the admin records the selected bid and reason for any override.

Furniture arrives flat-packed. A product-specific assembly PDF is included at no additional charge. Assembly service, payment collection, delivery lead times, returns, warranties, and cancellation rules need explicit business decisions; the interface must not promise policies that have not been agreed.

## 4 Release scope

### 4.1 Required furniture families

| Family | Required coverage | Rules needed before manufacturing |
| --- | --- | --- |
| Cabinets | Kitchen, storage, wall and full-height variants | Carcass joinery, back position, toe-kick, shelves, doors, drawers |
| Shoe racks | Floor-standing and multi-shelf designs | Shelf count, clearances, door options, ventilation decision |
| Bookshelves | Floor and wall-hanging variants | Shelf spans, load limits, wall attachment and hardware |
| Tables | Study, dining and side tables | Approved panel-based base, supports, span and load limits |

Four types are required for the complete v1. Delivering a cabinet-first pilot is a development sequence, not permission to remove the other types from v1. Only approved construction templates should be orderable. Free-form AI output must not bypass these templates.

### 4.2 Required product capabilities

Marketing entry, guest studio dashboard, project creation and reopening, 2D elevation and floor plan, interactive 3D, panel calculation, panel-specific materials and finishes, optimized sheet layouts, CNC files, photo-assisted creation, AI editing, quotations with PDF and email, order placement and tracking, admin catalog and order management, and an assembly PDF.

### 4.3 Explicit exclusions

B2B licensing, subscription billing, manufacturer or delivery-partner portals, metal and solid wood products, upholstered furniture, chairs, outdoor furniture, AR, Bangla UI, and delivery outside Dhaka are outside v1. Existing glass-frame, arbitrary SVG machining, circle-cutting, and quotation features do not automatically become customer features in the new application.

Online payment integration is not specified by the master document. Order confirmation must not be described as payment success. Payment records may support later integration without inventing a gateway or payment method now.

## 5 Functional requirements and acceptance

| ID | Requirement | Acceptance criteria |
| --- | --- | --- |
| PRD-01 | Marketing entry | `cutplanstudio.com` explains the offer and Dhaka restriction. Try It Out opens the studio on `app.cutplanstudio.com`. |
| PRD-02 | Guest exploration | A visitor creates and edits a temporary design without logging in. Refresh recovery works within the configured guest-retention period. |
| PRD-03 | Authentication and recovery | Save and Get a Quote open email OTP authentication. A successful login claims the current guest design exactly once and resumes the requested action. Canceling login preserves the draft. |
| PRD-04 | Dashboard and projects | Customers see only their own projects with name, thumbnail, type and last-edited time. They can create, reopen, rename and delete an editable draft. Ordered designs remain available as immutable records. |
| PRD-05 | Four furniture templates | Each family has valid defaults and supported controls. Invalid or structurally unsupported configurations cannot reach quotation or production. |
| PRD-06 | Dimension editing | Width, height and depth accept typed values and sliders. Values are normalized to mm. The same calculation supplies both 2D and 3D. Invalid input produces a field-level reason without destroying the last valid design. |
| PRD-07 | Components | Supported shelf, drawer, door and skirting changes update panels and visualization. Undo and redo restore the complete configuration and material overrides. |
| PRD-08 | Materials per panel | A customer can select a panel and set compatible board, visible finish, inner liner and exposed-edge treatment. Thickness changes trigger geometry recalculation and invalidate dependent quotes. |
| PRD-09 | Visual inspection | Orbit, zoom, pan, exploded view, material visibility and panel list work. 2D views expose dimensions. Keyboard and touch alternatives exist for right-click actions. |
| PRD-10 | Photo creation | Empty-space uploads return 2 to 3 supported suggestions when possible. Reference-product uploads return a supported parametric proposal. Users confirm measurements before quotation. Failure offers a blank project. |
| PRD-11 | AI editing | Supported instructions such as adding a shelf produce a preview of a validated change. Applying it creates one undoable edit. Unsupported instructions do not mutate the design. |
| PRD-12 | Panel calculation | Every physical panel has a stable ID, dimensions, thickness, pose and manufacturing assignment. The engine rejects nonpositive sizes, panel face dimensions below the master document's 50 mm rule, and panels that cannot fit usable stock. The 50 mm face rule does not apply to material thickness. Any necessary exception requires an approved rule. |
| PRD-13 | Nesting | Every requested panel instance is either placed once or reported as unplaced. Compatible materials are grouped separately. Required spacing, margins and grain restrictions are respected. Quote generation stops when any panel is unplaced. |
| PRD-14 | Quotations | The server calculates full-sheet material quantities, labor and fixed Dhaka delivery. The result shows assumptions, board counts, waste and a 7-day expiry. PDF and email reproduce the same immutable quotation. |
| PRD-15 | Order confirmation | Only the owner can accept an unexpired quote for its exact design revision. Valid Dhaka address and contact details are required. Repeated confirmation returns the same order. |
| PRD-16 | Order tracking | Customers see Confirmed, In Production, Ready for Delivery and Delivered with timestamps. Only authorized staff change status through valid transitions. |
| PRD-17 | Catalog administration | Admins manage boards, brands, thicknesses, compatible finishes, edging and prices. Changes are audited and apply to future quotes without modifying accepted prices. |
| PRD-18 | Manufacturing operations | Admins assign an eligible manufacturer, review layouts, and retrieve generated files for the accepted order snapshot. Customers never receive machine controls. |
| PRD-19 | Production and assembly assets | Each sheet has its own CNC file. The cut plan, labels, operation details and assembly PDF refer to the same revision and panel IDs. A failed generation can be retried without another order. |
| PRD-20 | Sharing | A revocable read-only link opens a specific project revision. It reveals no delivery address, private uploads, partner costs or G-code. Signing in alone does not grant editing rights to another person's project. |

## 6 Manufacturing and pricing rules

### 6.1 Units and stock

Use millimeters as the canonical geometry unit and radians for rotations. Inches can be a display and input option. Conversion uses 25.4 mm per inch; rounding for display must not change the stored geometry.

The master specifies nominal sheet dimensions of 1219 by 2438 mm and 3 mm kerf. The old app defaults to 2440 by 1220 mm and frequently uses 4 mm kerf. Proposed: board SKUs store actual dimensions and machine profiles store kerf and margins. Use the master's nominal values only as configurable initial defaults, never as interchangeable dimensions.

Nesting is heuristic. The UI should say optimized layout, not guarantee a mathematically minimum sheet count. It must account for each stock group separately and report area utilization transparently.

### 6.2 Construction rules

The chosen construction template controls which panels overlap and where thickness is subtracted. An inside width of `W - 2t` must not lose another `2t` simply because a shelf is placed between the same side panels. Back-panel, overlay-door and toe-kick rules must be explicit and tested by template.

The worked shoe-rack example is not an approved production fixture: 813 minus 36 is 777 mm; a shelf with 2 mm clearance on each side would be 773 mm under a simple between-sides construction, not the stated 759 mm. Half of 777 mm is 388.5 mm before positive gaps, so the stated two 389 mm doors also need a defined overlay or inset rule. The proposed 773 mm value illustrates arithmetic only; it must not replace a signed-off construction drawing.

### 6.3 Quote integrity

Required top-level pricing is boards plus labor plus delivery, with the assembly guide free. The master also permits priced edging and finishes. Proposed: explicitly price added HPL, liner, edging and hardware where they are not included in the board or labor price. Never charge them both as inclusions and separate items.

Use full sheets, not panel area alone, for board purchasing cost. Waste is already reflected in sheet count; do not multiply board cost by an additional waste percentage. Store both internal cost and customer selling price separately. Proposed commercial rules for margin, tax, promotions and paid assembly remain open until confirmed.

Quote validity is 7 days from server issuance, stored as an exact UTC expiry and displayed in Bangladesh local time. A geometry or material edit produces a new design revision and requires a new quote. Accepted quote prices and order snapshots never change because catalog prices change later.

Proposed: each quotation freezes an approved manufacturing capability envelope covering usable sheet area, kerf, margins and supported operations. Later manufacturer assignment must satisfy that envelope. An incompatible machine cannot silently repack the accepted design or add charges; operations must use a compatible partner or follow an explicitly approved order-amendment process.

### 6.4 Export eligibility

The master says export follows quotation confirmation, while the order flow gives Confirm Order as the commitment action. Proposed resolution: accepting the quote and creating an order is the export trigger. Generation then runs automatically, but downloads remain admin-only and machine-profile validation is required before release to a manufacturer. Customer toolbars may offer a design summary or quote PDF; they must not expose pre-order CNC export.

## 7 Quality and operational requirements

Required: light and dark themes, accessible focus and keyboard behavior, loading skeletons for fetched content, guest continuation, and clear errors. The canvas uses zoom interactions while side panels can scroll internally so content remains reachable.

Proposed performance budgets: cached edits update the visible design within 200 ms at the 95th percentile for a reference project of up to 200 panels; ordinary quote jobs for that project complete within 15 seconds at the 95th percentile, excluding third-party email delivery. These are targets to validate on an agreed reference device and dataset, not measured properties of the old application.

The application must keep customer and admin data separate, protect uploaded photos and addresses, prevent unauthorized access to designs and files, and preserve a customer draft when requests fail. CNC output needs controller-specific review and physical qualification; an attractive preview is not evidence of a safe machine program.

## 8 Delivery sequence and release criteria

1. **Foundation**: agree construction, pricing and delivery decisions; establish shared contracts, auth, project persistence, catalog and revision handling.
2. **Cabinet pilot**: extract and verify the legacy calculation engine; implement deterministic views, panel materials and save recovery.
3. **Complete configurator**: add shoe racks, bookshelves and tables using approved rules; add photo suggestions and controlled AI edits.
4. **Commercial flow**: implement server quotes, PDF, email, address validation, order confirmation and tracking.
5. **Operations**: manufacturer assignment, per-sheet CNC generation, cut plans, assembly guides, audit and recovery tools.
6. **Release validation**: run the complete customer-to-manufacturing flow for all supported types, fail unauthorized access tests, qualify machine profiles and verify backup recovery.

No calendar or effort estimate is committed here. The full master scope is larger than a single-day implementation. The sequence enables a clear first build without describing an incomplete pilot as finished v1.

## 9 Success measures

Proposed analytics: guest-to-first-valid-design rate, design-to-auth conversion, save and claim failures, quote generation success and duration, quote-to-order conversion, quote expiry rate, order value and contribution margin, manufacturing rework, and delivered orders. Event payloads should identify project revision and funnel step without including photos, addresses, raw prompts or session secrets. Numeric business targets require a pilot baseline.

## 10 Decisions needed before release

| Decision | Owner | Recommended direction | Blocks |
| --- | --- | --- | --- |
| D01 Construction and shoe-rack arithmetic | Product and manufacturing | Approve drawings and panel fixtures per type | Production calculation |
| D02 Actual stock and machine geometry | Manufacturing | Catalog dimensions and versioned machine profiles | Nesting and CNC |
| D03 Price inclusions and margin | Business owner | Separate cost from selling rules; prevent double charging | Quotations |
| D04 Payment, tax and cancellation policy | Business owner | Define explicitly; do not label confirmed orders paid | Checkout and customer copy |
| D05 Dhaka coverage and lead time | Operations | Maintain allowed areas and a published delivery commitment | Order acceptance |
| D06 Photo and guest retention | Product and privacy owner | Time-limited temporary data; initial technical proposal in database design | Public AI and guest launch |
| D07 Reference hardware and engineering limits | Manufacturing | Approved joints, fasteners, shelf spans and supports | Orderable templates |
| D08 Responsive support and accessibility | Product | Desktop-first editor with useful tablet and phone fallbacks | Device acceptance |
| D09 Manufacturing release responsibilities | Operations | Automatic generation after order; qualified admin release | Vendor handoff |
| D10 Deployment topology | Engineering | Preserve service boundaries; approve initial deployable grouping | Infrastructure |

## 11 Evidence from the existing application

The legacy journey is Cabinet 3D to Panel Cuts to Nesting and CNC to Quotation. It includes workspace transforms, nested compartments, shelves, drawers, door styles, different body/front/back boards, material APIs, and quotation print components. These are useful implementation assets but are oriented toward an operator.

`store/index.ts` persists projects, cabinet configuration, panels, quotes and auth to browser storage. `app/login/page.tsx` redirects to the cabinet page. `store/auth/authSlice.ts` stores tokens in localStorage. The inspected repository does not establish the new product's durable, owner-isolated order backend, photo workflow, or Supabase authentication. Dependencies and generated Prisma files alone do not prove those capabilities exist.

The detailed reuse inventory and verification gaps are in TRD Sections 2 and 3. Requirements should be accepted against the new flow, not the legacy README's claims.

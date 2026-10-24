# Phase 20 — labels and assembly-document review

Status: review software implemented on 23 October 2026. **Approved hardware quantities, joint drawings, assembly instructions and installation/load qualification remain incomplete.** No production assembly guide is claimed.

## Delivered

Inspect → Assembly documents opens a short task without adding a permanent sidebar. Parts, Hardware and Steps use bounded pages. The task creates numbered labels, original dimensions, stable panel IDs, stock-sheet placement/rotation, grain/material references, a hardware approval checklist and a conceptual planning sequence. No screw, hinge or anchor quantities are invented.

The A4 PDF includes a schematic, part list, printable labels, approval checklist/planning sequence and one diagram for each frozen stock sheet. Every page carries review-only status and a document reference. Input, nesting and document SHA-256 bind the result to one configuration. Repeated generation from the same review is byte-identical. No price, margin or private partner fields enter the document.

Local review uses current editor geometry and explicitly does not claim a saved/accepted revision. The signed-in accepted-order route `/api/assembly?orderId=...` loads only the requesting owner's immutable accepted snapshot, verifies its revision/design hash and retains its exact nesting. It never substitutes the current project revision or re-packs the accepted layout. Customer tracking links to this explicitly labelled review. No approved-guide release or storage/job activation is added.

## Verification

Six new assembly/launch unit tests cover all-family panel/placement conservation, unknown/stale/incomplete rejection, deterministic A4 PDF output, synthetic quote-to-CNC-to-document identity, release gates and isolated recovery. Combined unit/SQL total: 63 passing tests. Four PDF fixtures were generated and all 29 pages rendered and text-checked: cabinet, shoe rack and bookshelf each 8 pages; table 5 pages. Table/bookcase page montages were visually inspected. Evidence lives under `artifacts/review/phases-20-22/pdfs/`.

Browser checks cover all four family review/PDF/reopen journeys and Parts/Hardware/Steps at 1366×768, 768×1024, 390×844 and 720×450. Account contract checks cover own accepted PDF, unknown/other-order rejection, corrupt accepted-hash rejection and private caching. These use a loopback protocol double, not real customer orders. Final combined results are in [Phase 22](phase-22-report.md).

## Owner checkpoint and open approval

Open a project, Inspect → Assembly documents, create a review, inspect Hardware and download the PDF. Manufacturer approval must supply actual connectors/quantities, drilling, orientation, sequence, safe installation and loading limits before this becomes an assembly instruction. Those remain Phase 20 acceptance items. See [operational handover](OPERATIONS-RUNBOOK.md).

---
name: CutPlan Studio
description: Calm furniture workspace with paired light and dark themes.
colors:
  dark-base: "#0F0F1A"
  dark-surface: "#1A1A2E"
  dark-elevated: "#252540"
  dark-text: "#F9FAFB"
  dark-muted: "#9CA3AF"
  dark-accent: "#6366F1"
  dark-accent-text: "#A5A0FF"
  dark-accent-hover: "#BEBAFF"
  dark-accent-soft: "#24223F"
  dark-border: "#2D2D4E"
  dark-focus: "#A5B4FC"
  dark-diagram: "#9392B1"
  light-base: "#FFFFFF"
  light-surface: "#F3F4F6"
  light-elevated: "#E5E7EB"
  light-text: "#111827"
  light-muted: "#626B7B"
  light-accent: "#4F46E5"
  light-accent-soft: "#EEEDFF"
  light-focus: "#4F46E5"
  light-diagram: "#7C7F93"
  button-primary: "#4F46E5"
  button-hover: "#4338CA"
  danger-light-text: "#B91C1C"
  danger-dark-text: "#FCA5A5"
  danger-fill: "#B91C1C"
  danger-hover: "#991B1B"
  dialog-backdrop: "rgb(0 0 0 / 65%)"
typography:
  display:
    fontFamily: "Inter, sans-serif"
    fontSize: "clamp(28px, 2.6vw, 39px)"
    fontWeight: 500
    lineHeight: 1.17
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Inter, sans-serif"
    fontSize: "27px"
    fontWeight: 580
    lineHeight: 1.25
    letterSpacing: "-0.035em"
  title:
    fontFamily: "Inter, sans-serif"
    fontSize: "15px"
    fontWeight: 550
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Inter, sans-serif"
    fontSize: "14px"
    fontWeight: 400
  supporting:
    fontFamily: "Inter, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "Inter, sans-serif"
    fontSize: "12px"
    fontWeight: 550
rounded:
  control: "7px"
  icon-control: "8px"
  empty: "10px"
  surface: "12px"
spacing:
  step-4: "4px"
  step-8: "8px"
  step-12: "12px"
  step-16: "16px"
  step-20: "20px"
  step-24: "24px"
  step-28: "28px"
  step-32: "32px"
  step-36: "36px"
  step-40: "40px"
  step-48: "48px"
components:
  button-primary:
    backgroundColor: "{colors.button-primary}"
    textColor: "{colors.light-base}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
    typography: "{typography.label}"
  button-primary-hover:
    backgroundColor: "{colors.button-hover}"
  button-secondary:
    backgroundColor: "{colors.dark-surface}"
    textColor: "{colors.dark-text}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
  button-secondary-light:
    backgroundColor: "{colors.light-surface}"
    textColor: "{colors.light-text}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
  icon-button:
    rounded: "{rounded.icon-control}"
    size: "40px"
  icon-button-mobile:
    size: "44px"
  start-surface:
    rounded: "{rounded.surface}"
    padding: "36px 40px"
  empty-projects:
    rounded: "{rounded.empty}"
    padding: "25px 28px"
---

# Design System: CutPlan Studio

## Overview

**Creative North Star: "The calm furniture workspace"**

CutPlan Studio uses the supplied master palette and a restrained creative-tool shell. Indigo identifies navigation, actions and furniture geometry; neutral surfaces keep ordinary tasks readable. The product remains a calm workspace.

This record describes the Phase 1 Home, Projects and Orders foundation, extended by the Phase 2 guest draft workflow. Visual authority remains [the design requirement](docs/requirements/03_Design_Specification.md), derived from the owner's master. Composition and implementation differences belong in [the foundation note](docs/design/phase-01-foundation.md); requirements remain separate under docs/requirements.

**Key Characteristics:**
- Paired dark and light themes.
- Self-hosted Inter and compact sentence-case typography.
- Flat bordered surfaces and geometric furniture linework.
- Honest empty states and explicit unavailable actions.

## Colors

### Primary

Master indigo anchors the dark theme, with deeper indigo in light mode. Accessible lavender identifies small dark-theme accent text; filled buttons use deeper indigo and white text in both themes. Button hover uses deeper indigo again. The dark accent-hover variable is declared but currently has no consuming selector.

### Neutral

Base, surface and elevated tones establish canvas, sidebar and interactive states. Muted light-theme text is slightly darker than the master's proposed value for supporting-copy contrast. Dedicated borders, diagram strokes and focus outlines complete the palette. Success and warning colors remain unimplemented. Phase 2 adds scoped danger text for invalid fields and destructive actions, shared danger fill/hover and a modal backdrop. These do not replace indigo or introduce a second brand accent.

**The accent roles rule.** Keep the master indigo for geometry; use accessible text and button derivatives for their respective roles.

## Typography

All roles use self-hosted Inter Variable (100-900), loaded through next/font/local with a sans-serif fallback. The font asset and license live in public/fonts. No separate display or monospace family is implemented.

- **Display:** the introductory furniture message uses the frontmatter's fluid ramp; at widths up to 760px it becomes 31px.
- **Headline:** page titles use the desktop ramp and become 24px on small screens. Full-page empty-state headings use 25px, weight 500 and tracking -0.025em.
- **Title:** section headings use the compact title role. Furniture names use 13px, weight 550, becoming 14px on small screens.
- **Body:** base UI is 14px. Paragraph line-height is 1.65; full-page empty-state prose has a 46ch maximum width.
- **Supporting:** introductory and page-description prose uses 13px. Introductory prose has a 38ch desktop maximum, becoming 42ch on small screens.
- **Label:** buttons use the label role. Breadcrumbs, captions, footer and secondary notes use 12px, with normal or paragraph line-height as appropriate. Supporting copy never drops below 12px.

The implemented foundation ramp is quieter than the proposed requirement title sizes. It does not revise later editor or marketing requirements.

**The quiet hierarchy rule.** Reserve the largest type for the introductory furniture message; navigation and supporting copy remain compact and readable.

## Layout

The desktop shell has a sticky, full-height 224px sidebar and flexible workspace. The header is 68px high. Content is centered within 1320px with 48px top and horizontal padding and 32px bottom padding. The introductory surface uses a 1.2fr/1fr split; furniture families use four columns. Page scrolling remains available.

- At widths of at least 1600px, content top padding becomes 64px.
- At widths up to 1100px, the sidebar becomes 200px, content padding becomes 32px 28px, and the introductory panel uses 28px padding.
- At widths up to 760px, navigation becomes three equal columns above the workspace; the sidebar loses its sticky height and secondary context hides. The header becomes 60px; content padding becomes 30px 24px. The introductory panel stacks, furniture families use two columns, and buttons and the theme toggle have a 44px minimum height.
- At widths up to 420px, heading actions and the footer stack, and content horizontal padding becomes 20px.

The frontmatter records reused spacing steps, not every optical offset. These foundation breakpoints do not establish future editor layouts.

Phase 2 project cards use three columns with 22px gaps, two through 1100px and one through 540px. Creation is capped at 1040px; its four-column picker uses 16px gaps, becomes two columns through 1100px, and uses 12px gaps through 540px. Detail uses a 1.1fr/1fr split with 40px gaps (24px through 1100px) and stacks through 760px. The component sizes below remain scoped additions to the foundation ramp.

## Elevation & Depth

There are no box shadows. Tone separates sidebar and canvas; fine solid borders define header and introductory panel. A dashed outline marks the empty-project region. Hover changes background or text without lifting or translating elements.

**The flat surface rule.** Use tonal separation and fine borders rather than shadows to establish depth.

## Shapes

Controls have gently curved corners, slightly broader on the theme toggle. Empty regions and introductory surfaces use larger corners. Panel outlines and dividers are 1px. The guest avatar and tiny workspace marker are circular. Lucide line icons and the furniture front elevation provide geometric detail.

## Components

### Buttons

Compact sentence-case controls use frontmatter padding and radius, a 40px desktop minimum height and 44px on small screens. Primary controls use white text; secondary controls use surface tone, primary text and a fine border. Disabled primary actions use elevated fill, muted text and a not-allowed cursor. Phase 2 enables New project when browser storage is ready; loading or failed storage keeps it disabled. Pending mutations disable relevant actions, with button opacity 0.75.

Hover changes colors over 150ms. Keyboard focus uses a 2px theme focus outline with 5px offset and 4px corner radius. The theme toggle is a bordered icon control using the same state grammar.

### Cards / Containers

The introductory panel is transparent against the base canvas, outlined and generously padded. Empty projects use a dashed outline, compact heading and supporting text. Home furniture-family entries retain top dividers and now link to creation with the family preselected.

### Navigation

Desktop links have a 44px minimum height, icon and label, 12px horizontal padding and control-radius corners. Muted text becomes primary text over elevated tone on hover. The active route uses soft indigo fill, accessible accent text, weight 550 and aria-current. Small-screen links center their contents in three equal columns.

### Furniture schematic

An inline SVG front elevation uses a 360 by 255 viewBox, maximum 360px width on desktop, 290px on small screens and 260px in the Projects empty state. Muted structure and guides frame the indigo door, handle and anchor points. Home captions it as a panel furniture schematic. Guides have no numeric measurements, and the SVG is decorative to assistive technology.

### Guest draft cards and picker

Cards use surface corners and a fine border, with a linked schematic/name area and separate Rename/Delete buttons. Thumbnail padding is 12px 24px 18px; its schematic is at most 230px wide and 150px high. Copy uses 20px top/side padding. Names wrap anywhere (16px, weight 550, line-height 1.45); dates use tabular numerals. Link focus is inset by 4px. Quiet actions have a 44px minimum height, 8px padding and 6px corners; hover uses accent text, or danger text for Delete.

Native radio choices use empty-region corners, a fine border and 18px 14px padding (18px 12px through 540px). Checked choices use indigo borders and soft indigo fill; focus-within uses a 2px outline with 3px offset. Radios are 17px; diagrams are 112px high (96px through 760px). Disabled choices use opacity 0.65. Labels use 14px/550 and descriptions 12px/1.6.

### Name fields and inline rename

Fields use control corners, a 1px border, base fill, primary text, accent caret, 10px 12px padding and 46px minimum height. Text is 14px, becoming 16px through 760px. Focus inherits the global visible outline; invalid borders and 13px error text use theme danger text. Creation fields are capped at 540px. Inline rename adds a top divider and 18px 20px 22px padding on cards (18px 0 on detail), selects the name and restores focus to Rename when finished. Failed saves remain inline alerts.

### Destructive confirmation and storage states

Native modal dialogs use surface fill, a fine border, surface corners, 28px padding (24px through 540px), width min(440px, 100vw - 40px), and maximum height 100dvh - 40px with vertical scrolling. The scoped backdrop adds no shadow. Headings use 21px/550. Cancel comes first; Escape cancels when idle, pending removal disables dismissal controls, and closing restores focus to a connected trigger. Confirmation uses danger fill, white text and the darker hover.

Recovery notices use empty-region corners, a fine border and 24px padding. Headings use 17px/550; supporting text is 13px with a 70ch maximum. Actions wrap. Loading is distinct from empty; unavailable storage offers Retry. Corrupt/newer data is preserved with Retry, Download recovery copy and confirmed Reset. Home shows up to three real drafts; missing detail explains browser-local availability. The detail schematic has 38px 24px padding and a 420px maximum width. Its caption says it is not a calculated design; the adjacent heading uses 24px/500 and -0.025em tracking. Dimensions, materials, editor, cloud saving and ordering remain unavailable.

The skip link appears on focus. Navigation and theme controls work. Chips remain unimplemented.

Motion is limited to 150ms color/background transitions and smooth anchor scrolling. Reduced motion disables smooth scrolling and reduces transitions and animations to 0.01ms. The proposed page-transition fade is not implemented in this phase.

The retained Phase 2 detector baseline contains 16 advisory findings against Phase 1 metadata, including pre-existing focus/skip-link radii and shell/empty-state/mobile font sizes. Scoped additions describe shipped draft components; they do not promote every existing literal into a shared token. No pre-existing CSS was repaired and no zero-findings claim is made.

### Phase 6 cabinet panel review (scoped implementation)

Cabinet browser drafts and account-project details append a review section after the project overview; account details place it before revision history. It reuses Inter, paired-theme semantic colors, flat borders and 7px control corners. The 20px/550 heading, 13px supporting copy and tabular measurements are local component choices, not new shared tokens. Earlier unavailable-dimensions language describes saved-project geometry and editing: this review displays synthetic example dimensions only. Overview schematics remain uncalculated project shells.

A labelled native select switches four read-only examples: inset back, outside back with raised bottom, open cabinet and oversized validation case. Selector and overall width × height × depth use two columns, stacking through 760px; the select has a 44px minimum height and 16px text at that breakpoint. Individual physical panels use divided list rows with native details/summary disclosures and 56px minimum summary height. Through 540px, labels stack above cut measurements and disclosure definition lists become one column. Each disclosure exposes stable panel identity, illustrative board role, center coordinates in mm, rotation in radians and stock rotation. No real catalog material is assigned.

An always-visible soft-indigo notice states that the example is not approved for manufacturing, quotation or machine output. A separate native disclosure explains construction assumptions and limits. Blocking validation replaces the entire panel list with an alert, themed danger messages and instructions to choose another example; no partial panel set appears. Valid results announce changes politely. Selection stays in component state: it neither edits browser drafts nor persists geometry or creates account revisions. The editor, pricing, nesting and machine output remain later work.

### Phase 7 cabinet parameter editor (scoped implementation)

Cabinet project details now add an actual geometry editor before the separate Phase 6 examples; account projects place both before revision history. Earlier phase descriptions of unavailable editing remain historical. The editor extends existing Inter, paired-theme semantic colors, flat borders, focus treatment and indigo actions without adding shared tokens. Its heading uses 20px/550, supporting copy 13px, labels and quiet actions 12px, controls 7px corners and 44px minimum height. Fields become 16px through 760px. The parameters/drawing split uses minmax(240px, .8fr) and minmax(0, 1.5fr), a 28px gap, and stacks through 1100px; paired fields become one column through 420px. Wrapping title actions precede the manufacturing boundary and unsaved/save status.

Labelled native numeric fields, width/height/depth sliders and construction selects edit dimensions, thicknesses, shelves, inset doors, back position and raised bottom. Display units are mm or inches while canonical geometry stays in mm; drawing annotations explicitly remain mm. Front elevation and floor plan use pressed-state buttons. Their responsive inline SVG projects bounds from the same calculated panel vertices as the physical-panel cut list, with muted construction lines and indigo doors. The drawing uses a bordered surface with 12px corners and 16px padding (8px through 420px), a descriptive image label and a panel-count caption. The cut list is a native disclosure with divided rows and tabular measurements. No shipping raster asset is introduced.

Invalid measurement text stays visible with danger borders and an alert; the drawing and list retain the last-valid model. Construction selections cannot erase pending invalid text. Undo/redo and explicit saving use labelled controls; Ctrl/Command+Z, Shift+Z and S are scoped to the editor outside editable fields. Save state distinguishes unsaved, saving, saved and failed operations. Browser designs save to the local draft; account designs create immutable geometry revisions. Historical snapshots are read-only, including an explicit no-dimensions state for old project shells.

Recovery records are isolated by browser draft or account user/project and a per-tab session ID. Unreadable/newer records are preserved and lock editing until downloaded or explicitly reset; stale-version notices offer a recovery download before discarding and reloading. Pending account saves retain their original retry request. These are editor recovery states, not new shared container variants. Drawers await construction rules; manufacturing approval, quotations, machine output, pricing and 3D remain unavailable.

### Phases 8–9 panel materials and 3D inspection (scoped implementation)

The existing editor drawing now precedes a 3D inspection surface and a panel-material inspector in the same drawing column. This ordinary editor extension preserves Inter, paired-theme neutral surfaces, indigo actions, flat dividers and visible focus. Section headings use 14px, supporting copy and labels 12px, and controls retain a 44px minimum height. The 420px-high viewport has a fine border and 12px corners. Material fields use 7px corners in two columns, stacking through 540px; these are local component choices, not new shared tokens.

Drag orbits the calculated model, right-drag pans and scrolling zooms. Reset camera and a pressed-state Exploded view control sit above it. Model picking and labelled native panel selects share one selected physical-panel identity; a native select provides keyboard selection. Selected-panel dimensions stay visible. Unavailable WebGL gives a status message directing users to the measured drawings and cut list. The viewport renders the same calculated geometry, including neighboring-panel changes caused by asymmetric board thickness.

The inspector sequences board and grain, front face and back face / liner, then four named local edges. Board selection explicitly clears prior finishes and edges; finishes require a compatible board and edging must cover its thickness. Batch apply names the material role and affected panel count; clearing the selected assignment is a separate action. Loading, error with Retry, empty published catalog, unavailable assignment and removed-panel messages use the existing status/error grammar. Read-only, recovery-locked and pending states disable material changes.

Board, face, liner, edging and grain assignments belong to the saved cabinet configuration and participate in undo/redo, recovery and revision identity. Optional staff-approved public HTTPS textures fall back to the named finish color with a visible warning when loading fails. Front/back finishes and four edges map to the six local mesh faces; the illustrative brown edging color is model content, not a new interface brand token. No new raster product asset ships. Manufacturing approval, joints, drawers, quotations and machine output remain pending.

## Do's and Don'ts

### Do:
- Do preserve the master's paired palettes and role-specific contrast adjustments.
- Do use sentence case, Inter, visible focus and reduced-motion behavior.
- Do keep furniture schematics unnumbered until real design measurements exist.
- Do show true empty states and explain unavailable actions.

### Don't:
- Don't imply the schematic is a saved design or production drawing.
- Don't introduce decorative gradients, repeated shadows or animated badges into this workspace.
- Don't present later-phase controls as established Phase 1 components.

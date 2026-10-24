---
version: 1
slug: "src-app-page-tsx"
primary_target: "src/app/page.tsx"
related_targets: ["src/app/projects/page.tsx","src/app/orders/page.tsx","src/components/studio-shell.tsx"]
---

# Foundation interface direction

Mode: Operate. Audience: the owner reviewing a first shell and future customers navigating a furniture workspace. This is a deliberately scoped implementation of the supplied dashboard structure, not a redesign or a new visual identity.

## Tokens and layout

Preserve the master's six core dark tokens: base #0F0F1A, surface #1A1A2E, elevated #252540, text #F9FAFB, muted #9CA3AF, accent #6366F1. Light equivalents come from the same requirement. Borders and semantic colors use the supplied values. Small white-on-accent controls use #4F46E5 with #4338CA hover. Dark small accent text uses #A5A0FF while geometry retains #6366F1. Light muted text uses #626B7B instead of the proposed #6B7280 for contrast. Dark --accent-hover is #BEBAFF but has no consuming selector. These accessibility derivatives preserve the master palette.

Inter Variable is self-hosted with its license in public/fonts. The shipped foundation uses 14 px base UI, 13 px introductory prose, 12 px supporting text and buttons, 15 px section headings, and 27 px page titles (24 px up to 760 px). The introductory furniture message uses clamp(28px, 2.6vw, 39px), weight 500 and line-height 1.17, with a 31 px mobile override. These quieter sizes differ from the proposed requirement ramp without revising future screen requirements. Navigation is 224 px, reducing to 200 px up to 1100 px and becoming a horizontal row up to 760 px. Heading actions and footer stack up to 420 px. Content top padding increases at 1600 px. See root DESIGN.md for extracted tokens.

## Direction contract

THESIS: Furniture that fits begins in a workspace a non-designer can understand. The shell establishes navigation and honest empty states without fake projects, prices or an animated marketing hero.

OWN-WORLD: Use the master's indigo/dark palette and neutral light counterpart, restrained borders, compact Lucide icons, Inter and consistent buttons. A geometric front-elevation diagram connects the empty state to panel furniture without pretending to be a saved design.

STORY: The visitor recognizes Home, Projects and Orders, understands the workspace has no saved content, and can explore the four supported furniture families. Cloud saving and ordering remain disabled until implemented.

FIRST VIEWPORT: Persistent navigation on the left, account context and theme control above, a clear workspace title, one central empty state and a compact furniture-family reference. At phone width, the sidebar becomes a top navigation and content stacks with no sideways scrolling.

FORM: The owner's specified studio layout from the master and requirement design Section 4.2. seed: none (precisely scoped implementation of the supplied layout; no new visual-world selection).

SIGNATURE: A crisp elevation with unnumbered measurement guides is the only visual focal point. It is explanatory geometry, not a generated furniture photograph or an interactive configurator. Theme switching and navigation work; unavailable actions have an explicit disabled state.

## Review against the brief

The initial generic suggestion from UI UX Pro Max included an unrelated editorial type treatment. It is rejected in favor of the master's Inter and indigo tokens. No metrics, customer claims, mock recent projects or unsupported construction dimensions are introduced. The only diagram is labeled as a furniture schematic without production dimensions.

## Shipped checkpoint

Phase 1 finish review: ship; persistence, fidelity and ceiling pass with no material fixes. Retain the calm layout, master palette, geometric schematic and true empty states. Hover transitions are 150 ms; the proposed page-transition fade is not implemented. New Project remains explicitly disabled. The root system records only shipped components; later-phase requirements remain separate in docs/requirements.

## Tailwind preservation checkpoint — 2026-10-22

Operate; seed: none. The owner's precise request preserves the current appearance while moving component styling to Tailwind. All six inherited direction blocks and subsequent project/auth briefs still apply; root DESIGN.md and `.impeccable/design.json` remain unchanged. Literal utilities replace 176 component selectors on 96 semantic hooks; those hooks remain available for selectors/tests. Existing palette aliases and appropriate global defaults/accessibility rules carry forward. Google's official SVG and provenance remain unchanged.

Finish review: **SHIP**, no material fixes. All 78 paired-theme/viewport/state screenshot pairs are valid: 76 are pixel-identical, two differ by two backdrop pixels each. Seven style tests and the normal documentation/unit/type/lint/build check passed; exact breakpoint edges and sampled focus/hover/error styles match the frozen legacy test oracle. The single detector result `[]` has limited syntax coverage and is not a zero-drift guarantee. See `docs/design/tailwind-migration.md` for maintenance rules and evidence scope; separate browser-suite completion is recorded in delivery evidence.


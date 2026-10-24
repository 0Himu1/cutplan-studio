# Tailwind migration — 2026-10-22

Mode: Operate. seed: none. The owner requested migration of most component CSS to Tailwind while preserving the exact current appearance. This is ordinary engineering preservation of the incumbent visual system. It introduces no new visual direction, palette, typography, layout or interaction contract.

## Incumbent agreement

The six direction blocks in `.impeccable/surfaces/src-app-page-tsx.md` remain binding, together with the existing project and authentication briefs. Root `DESIGN.md` and `.impeccable/design.json` remain unchanged. The existing Inter typography, paired light/dark themes, responsive geometry, compact controls and honest browser-local draft messaging carry forward.

Google's unmodified official sign-in SVG remains provider artwork; its provenance stays in `public/brand/README.md`. It does not become a CutPlan token or a new asset commission.

## Implementation and maintenance

The migration moves 176 component selectors across 96 semantic class hooks into literal Tailwind utilities, including arbitrary values, scoped descendant variants and media variants where exact incumbent values require them. `@theme inline` aliases refer to the unchanged existing palette. Original semantic class names remain selector and test hooks; they no longer define application component CSS rules.

Global CSS retains tokens, browser defaults, selection, shared focus treatment and the universal reduced-motion safeguard. These are appropriate global responsibilities. Component appearance and responsive/state variants belong beside the component in Tailwind class lists. Future work should reuse the existing aliases, keep utilities statically discoverable, and preserve exact custom breakpoint conditions rather than substituting nearby framework defaults. Do not reintroduce component rules into the global stylesheet to shorten a class list.

`tests/style-regression/fixtures/pre-tailwind.css` is a frozen, test-only oracle of the previous stylesheet. The application never imports it. Preserve it as historical comparison evidence; do not maintain it alongside new styling.

## Verification and limits

- All 24 TSX ASTs match the baseline after removing `className` attributes, supporting preservation of the existing structure and behavior.
- `artifacts/tailwind/before/` and `artifacts/tailwind/after/` contain 78 valid full-page cases each: 390, 900 and 1440 px; both themes; 13 states. Of the paired captures, 76 are pixel-identical and two differ by two backdrop pixels each. This is bounded comparison evidence, not a universal zero-drift claim.
- Seven style tests passed: six capture tests and one separately run breakpoint/state comparison. The latter checks 420/421, 540/541, 760/761, 1100/1101 and 1599/1600 px in both themes on Home and New Project, including action focus/hover and invalid input. Sampled computed styles match the legacy CSS oracle.
- `npm run check` passed its ten unit/SQL tests, documentation checks, type checking, lint and production build. Google, retained OTP and regular browser suites are separate behavioral checks; their final migration results belong in the coordinator's delivery report.
- The finish reviewer returned **SHIP**, with no material fixes. A single detector run returned `[]`; its syntax coverage is limited and does not establish absence of visual drift.

The observed backdrop differences require no material visual correction. Preserve the existing system and use the comparison artifacts and exact-edge checks when changing utilities later.

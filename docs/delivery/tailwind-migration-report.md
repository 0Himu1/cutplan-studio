# Tailwind preservation migration — 2026-10-22

Complete within the requested scope. Component styling now uses literal Tailwind utilities, retaining exact layout, type, colors, spacing, state styling and custom responsive breakpoints. No Phase 4 feature work is included.

176 component selectors across 96 semantic hooks moved out of the global stylesheet. The remaining global CSS defines unchanged theme variables, Tailwind theme aliases, browser defaults, selection/focus and the universal reduced-motion safeguard. Semantic classes remain for scoped variants and test selectors. No component `@apply` wrappers or dynamically constructed utility names were introduced.

## Verification

| Check | Result |
| --- | --- |
| Before/after screenshot pairs | 78; 76 pixel-identical; two dialog backdrops differ by only two pixels each |
| Computed layout/style comparison | No differences across all 78 final capture records |
| Exact responsive/state regression | Passed at 420/421, 540/541, 760/761, 1100/1101 and 1599/1600 px, both themes; focus, hover and invalid-input states |
| Capture/appearance tests | 6 passed; 13 states at phone/tablet/desktop in each theme |
| General browser regression | 23 passed |
| Google PKCE browser contracts | 5 passed |
| Retained OTP browser contracts | 7 passed |
| Unit/PostgreSQL checks | 10 passed |
| Documentation, TypeScript, lint, production build | Passed |
| TSX behavior/structure audit | All 24 syntax trees identical after excluding className attributes and normalizing line endings |
| Independent visual finish review | SHIP; no material fixes |

The first comparison exposed an invalid-input border losing its error color after the layer change. This was corrected with Tailwind's `aria-invalid` variant on the inputs before the final captures. The final metric report is empty; earlier mismatches were superseded. The detector ran once and returned no findings, with limited coverage of arbitrary utility syntax; that is not proof of universal absence of drift.

Tests used isolated browser contexts and synthetic authentication for account states. They did not change the owner's hosted provider settings, real account profile or browser drafts. The ordinary preview was temporarily run with provider flags disabled for the pre-existing deferred-auth regression suite, then restarted with the machine's existing Google-enabled configuration.

Evidence is under ignored `artifacts/tailwind/before`, `after`, `pixel-comparison.json` and `metrics-diff.json`. `tests/style-regression/fixtures/pre-tailwind.css` is a frozen test-only oracle, never application styling. Root `DESIGN.md` and `.impeccable/design.json` remain unchanged. See [maintenance guidance](../design/tailwind-migration.md).

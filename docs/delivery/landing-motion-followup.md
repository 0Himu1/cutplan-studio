# Landing page motion and layout — 26 October 2026

The owner requested a home-page improvement using GSAP Web after the final handoff and repository transfer. This is an explicitly requested landing-page refinement, not a new numbered phase or activation of the operational gates.

## Changes

- Reorganized the hero around one primary action and a secondary How it works anchor; refreshed spacing, hierarchy, family links and the three-step explanation.
- Enlarged the interactive cabinet study and added a calculation-derived panel count, dimension guides and themed surfaces. The illustration still uses the same proposed cabinet calculator as the studio.
- Added exact dependency `gsap@3.15.0`. A sequenced hero entrance and finite cabinet assembly introduce the page. Explode/Assemble controls play/reverse the same panel timeline, including reversal during motion.
- Added small native-scroll section reveals; no pinning, smooth-scroll replacement, perpetual particles or scroll hijacking. The previous particle component is no longer mounted on the home page.
- Retained the existing headline, recent drafts, supported family routes, availability disclosures and guest entry. No account is needed to begin a browser draft.

## Accessibility and lifecycle

Content renders visibly on the server and remains readable without JavaScript. Reduced-motion users receive immediate panel-state changes and no entrance/scroll animation. Changes to the motion preference are handled while the page is open. Scroll reveals retain accessible content rather than hiding offscreen headings/links with visibility. Keyboard focus and minimum control targets remain visible and usable.

Animations are scoped with GSAP matchMedia and reverted on preference changes/unmount; only transforms and opacity are animated. Native scrolling and document anchors remain intact. The schematic reserves enough space for its exploded panels without clipping against its header. A dark-theme heading contrast issue found during visual review was corrected.

The existing Next.js page is the deliverable: the skill's standalone-HTML contract applies to standalone motion artifacts, not replacement of an established app route. Used [official matchMedia guidance](https://gsap.com/docs/v3/GSAP/gsap.matchMedia%28%29/) and [context cleanup guidance](https://gsap.com/docs/v3/GSAP/gsap.context%28%29/).

## Verification

TypeScript, ESLint, documentation checks and production build passed. **All four browser scenarios passed**: the existing landing regression and three new journeys covering animated reversal/route remount/preference changes; desktop/tablet/mobile/light/dark/no-JavaScript; and deterministic start/middle/settled animation captures with panel bounds checks. The final run completed in 33.3 seconds. Screenshots are under `artifacts/review/landing-motion/`.

No cabinet editor rules, material records, database permissions, live ordering, inference or manufacturing release were changed. These new edits are local until a subsequent authorized repository push.

# SITEWIDE READABILITY AUDIT — R1340

Recorded: 2026-09-19
Builder lane: LOCAL_COMMUNITY_PLATFORM / FRANKLIN_TN

## Trigger
Owner screenshots showed two separate live business-dashboard failures:
1. the approved business headline had been overwritten in the browser by a later historical enhancement script; and
2. text inside the four "Your path" cards was colliding and becoming unreadable.

## Root cause
The dynamic R1326 business-journey script replaces the original numbered path markup with full text headings inside `<strong>` elements. A legacy `.hf310-path strong` rule still constrained `strong` to a 26x26 circular number badge. R1327 changed display/margins but did not reset width, height, background, radius or placement. The longer heading therefore escaped the 26x26 box and collided with neighboring text.

The same R1326 script also rewrote the H1 back to the retired wording "Find your Franklin profile, then improve it.", overriding the owner-approved R1339 source headline.

## R1340 corrections
- Preserve the exact owner-approved headline in both static HTML and the later dynamic enhancement layer:
  - English: "Find your Franklin profile. Improve it. Grow your local visibility."
  - Spanish: "Encuentre su perfil de Franklin. Mejórelo. Aumente su visibilidad local."
- Explicitly neutralize legacy fixed badge geometry for dynamic path-card headings:
  - width/height auto
  - transparent background
  - no circular radius
  - normal block flow
  - min-width zero
  - readable line-height
  - overflow-wrap anywhere
- Keep path cards responsive: four columns when roomy, two columns at narrower desktop/tablet widths, one column on small screens.
- Restore high-contrast eyebrow text on dark semantic surfaces. The audit found genuine contrast regressions in:
  - Community Help Center urgent section, including Spanish parity;
  - Learning Hub minor-safety/education-boundary section.
  The dark-surface guard now covers urgent-section, history-section, growth-trust, growth-boundaries, home-command-bar and learning-boundary.
- Harden long flex-checkbox labels in review/appeal preparation with min-width zero, safe wrapping and non-shrinking checkboxes.

## Browser/layout audit
A pre-promotion headless Chromium audit was run against 46 distinct body/CSS page archetypes representing the 19,364 public HTML files in the qualified R1339 source. The profile population collapses into shared template archetypes rather than requiring 19,103 identical visual executions.

Configurations checked:
- 1440px desktop;
- 1024px desktop/tablet;
- 390px mobile;
- 1024px with 125% root text scaling.

The R1326 -> R1327 -> R1328 enhancement chain was executed for the applicable routes so the browser audit exercised the same dynamic path transformation that caused the owner's screenshot failure.

The audit reproduced the original business-card collision before the fix. After the R1340 changes:
- no remaining confirmed path-card text collision;
- no confirmed text clipping in the audited archetypes;
- no remaining automated contrast failures after dark-surface corrections;
- one anonymous flex-label geometry heuristic on the review/appeal checklist was visually inspected as non-colliding and was additionally hardened for wrapping.

This audit is supporting Local qualification evidence. It does not self-assert SCC acceptance or replace real-user/browser evidence after deployment.

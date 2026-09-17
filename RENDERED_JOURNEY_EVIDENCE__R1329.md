# R1329 Rendered Journey Evidence

Release: `FR-NAV1.30.29-HF3.13.11`
Edition: `FRANKLIN_TN`
Date: 2026-09-17

## Rendered surfaces

The exact R1329 Franklin Navigator public organization profile and the restored Spanish Community Membership route were rendered from the candidate source using Chromium/Playwright with the candidate CSS inlined. Direct localhost navigation was blocked by the execution environment's browser-administration policy, so `page.set_content()` was used for the rendered-layout inspection rather than claiming a network/live check.

### Franklin Navigator public profile

- Desktop viewport: 1365 x 1000; `scrollWidth=clientWidth=1365` — no horizontal overflow.
- Mobile viewport: 390 x 844; `scrollWidth=clientWidth=390` — no horizontal overflow.
- H1 rendered as `Franklin Navigator`.
- Mailing-address-only disclosure is visible and does not present the address as a physical office/storefront.
- Official website / call / email, Save, Copy link, Share, Print, verified-link/actions, sources, correction/removal, claim and member-preview actions remain visible and usable in the rendered hierarchy.
- No social buttons are rendered because PF15.28 supplied zero sufficiently verified social routes.

### Spanish Community Membership entry

- Mobile viewport: 390 x 844; `scrollWidth=clientWidth=390` — no horizontal overflow.
- H1 rendered as `Fortalezca su presencia en Franklin.`
- `$35/año`, profile-first CTA, free correction/removal boundary and optional-membership language are visible.
- No stale `inscripción permanece cerrada` claim is present on the restored route.

## Rendered review result

`PASS_CANDIDATE_RENDERED_DESKTOP_AND_MOBILE`

This is source-candidate rendered evidence only. It does not assert production deployment or `LIVE_VERIFIED` state.

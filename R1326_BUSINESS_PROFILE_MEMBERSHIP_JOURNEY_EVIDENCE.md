# R1326 — Business profile → Community Membership journey

Release: `FR-NAV1.30.26-HF3.13.8`
Base: `FR-NAV1.30.25-HF3.13.7` / R1325
Date: 2026-09-17

## Scope

R1326 is a Franklin business-acquisition and membership-clarity refinement. It preserves the working public profile, Directory, claim/correction, membership, Stripe/runtime, Assistant, navigation, monitoring and member-review architecture.

## Changes

- Homepage business section now starts with the existing public Franklin profile rather than jumping directly to a paid-member preview.
- Homepage clearly states that basic public profiles, factual corrections and removal requests remain free.
- For Business now presents the actual journey in order: find profile → review/correct facts free → preview richer member profile → join only if useful.
- For Business now contains a direct free-profile vs. Community Membership comparison.
- Community Membership remains `$35/year` and is described as optional.
- Membership benefits now emphasize richer reviewed profile content, services, hours, photos and verified customer-action/official online links where applicable.
- Active member profile benefit preserving suppression of `Similar local profiles` remains stated.
- Membership language explicitly rejects paid ranking, endorsement, guaranteed leads/customers, guaranteed availability or guaranteed placement.
- Public-source facts and member-provided information remain distinct and subject to review before publication.
- Membership start now tells owners to review the existing public profile first and provides direct routes to profile review, member preview and membership setup.
- Membership enrollment receives an additional free-profile / no-paid-ranking boundary reminder.
- Existing Franklin established-positioning layer loads the new R1326 enhancement as a separate reversible asset.

## Preservation gates

- No profile records deleted or rewritten.
- No Directory ranking algorithm changed.
- No membership price changed.
- No Stripe/runtime credentials or environment settings changed.
- No Assistant subsystem changed.
- No issue-monitoring subsystem changed.
- No paid accuracy gate introduced.
- No endorsement or lead guarantee introduced.
- Free factual corrections/removal preserved.

## Implementation

- New asset: `dist/assets/r1326-business-journey.js`
- Loader: `dist/assets/franklin-established-positioning.js`
- Runtime release marker on affected pages: `FR-NAV1.30.26-HF3.13.8`

## Deployment

Render static site: `franklin-navigator` / `srv-da8tg6rbc2fs73crru2g`
Branch: `main`
Auto-deploy: off; deployment is deliberate after source verification.

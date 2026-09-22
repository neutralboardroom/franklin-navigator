# NEXT VERSION IMPROVEMENT LIST — R1359

Target release: `FR-NAV1.30.59-HF3.13.41`
Prepared: 2026-09-22

R1359 is focused on completing the owner-observed profile path before real paid-member outreach. Do not introduce cosmetic redesign merely to create another release.

## Post-deploy owner smoke test

Before declaring broad outreach ready:
1. Open the protected Franklin Navigator profile while signed in as the authorized administrator.
2. Confirm stale ordinary pending access no longer blocks Profile Center.
3. Publish a harmless verified-manager About update and confirm the public profile labels it as manager-provided.
4. Confirm source-backed public facts remain unchanged.
5. Submit/cancel a correction through the new in-product confirmation and confirm no browser-native dialog appears.
6. Ask Franklin a question and confirm the viewport stays at the question / answer start.
7. Confirm paid Community Membership remains optional and the checkout/membership entry point still works.

## Remaining infrastructure item

### Franklin-controlled reviewer hostname
Disposition: `BLOCKED_EXTERNAL_INFRASTRUCTURE`.
Keep the existing fail-closed reviewer origin/session boundary until authorized DNS/custom-domain mutation is available. Do not weaken security merely to conceal the current Render hostname.

## Outreach rule

After the R1359 production deploy and the short smoke test above pass, the Local Community Platform may issue an `OUTREACH_READY` handoff to the Owner Console / Revenue Engine and other authorized outreach builders. Begin with a limited real batch, monitor claim/member behavior, and scale from observed production evidence.

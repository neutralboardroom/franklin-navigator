# R1328 Local Platform Priority Queue

Target: `FRANKLIN_TN` / `LOCAL_COMMUNITY_PLATFORM`

## QUALIFIED_NOW — implemented in R1328

1. **P0/P1 — Profile-to-membership state integrity**: enforce profile selection before unscoped enrollment, preserve representation verification before checkout, and remove wording that can imply ownership merely from choosing a listing.
2. **P1 — Enrollment orientation and recovery**: align the visible five-step progress with actual safe user states and preserve no-double-pay recovery language.
3. **P1 — Claim search clarity/accessibility**: announce result counts/no-match state and keep the free profile-request fallback visible.
4. **P1 — Preview verification semantics**: keep newly typed official/social URLs visibly proposed/unverified until review and use URL-appropriate inputs.
5. **P0/P2 — Release integrity**: source contracts, no-loss ledger, currentness receipt, deterministic package generation, clean-extraction validation, exact-head pre-seal check and one deliberate deploy.

## DEFER_WITH_CAUSE / BLOCKED OUTSIDE THIS RELEASE

1. **Newer Profile Factory import** — `DEFER_WITH_CAUSE`: FR-PF-PLATFORM-15.14 is producer-qualified but external acceptance/current-pointer advance is pending. Responsible authority: Profile Factory/SCC. Resume only on accepted consumer/current-pointer receipt.
2. **Newer Local Investigator import** — `DEFER_WITH_CAUSE`: V41 is qualified research with `consumerAcceptance=UNKNOWN` and no accepted-head advance. Responsible authority: Local Investigator/SCC. Resume only on accepted Local consumer/head-advance evidence.
3. **First real paid-member end-to-end proof** — `DEFER_WITH_CAUSE`: requires a genuinely authorized real member/profile and must not create a charge merely for testing. Resume when an authorized real member enters the flow.
4. **SCC acceptance convergence for R1327/R1328** — `DEFER_WITH_CAUSE`: no exact R1327 acceptance/current-pointer receipt was independently located. SCC owns acceptance/currentness. Source qualification and authorized deployment remain separately reportable.
5. **Smarter Justice donor review** — `INAPPLICABLE_WITH_EVIDENCE`: no bounded Local legal-module donor question is needed for this release, so no SJ snapshot is inspected.

## Post-R1328 candidates

Only retain candidates that are not safely completable in this run: cross-device real-browser acceptance beyond available automation, newly accepted PF/LI handoffs that arrive later, and the first genuine authorized real-member lifecycle proof. Do not create cosmetic backlog items merely to justify another release.

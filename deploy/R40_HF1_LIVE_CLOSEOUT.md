# Franklin R40 HF1 — deployed repairs and launch continuation

Observation window: 2026-09-06 23:21–23:25 UTC.
Status: BOTH HOTFIXED SERVICES LIVE; NEW PUBLIC PAID CHECKOUT CLOSED.
This is an operational hotfix closeout, not an accepted SCC release or authority transfer.

## Exact deployed source

Public site: neutralboardroom/franklin-navigator, main, commit e0ea8625343f6ec0e2eb2f0e55ec6457ec762bf1. Render srv-da8tg6rbc2fs73crru2g / dep-daevanuq1p3s73b13790, LIVE at 2026-09-06T23:22:22.9109Z.

Membership runtime: same repository, franklin-commerce-runtime-r30, commit 808709426ebc65efed7b74920e89c5fd49b60483. Render srv-dabgvefqj5pc739vr4h0 / dep-daevbm740ujc738t9vmg, LIVE at 2026-09-06T23:23:25.264023Z.

Public baseline is exact R40 commit 9d90aadcae37c132b5ea6204cbda81273609089f. Only dist/assets/app.js, dist/assets/membership-live.js and dist/data/r37-es-public-strings.json changed. No profile files, approved prices, payment terms, authority rules or community geography changed. Preserve all 19,103 profiles. The modified public payload is R40 plus this explicitly identified hotfix, not the byte-identical original R40 ZIP.

Runtime preserves the qualified HF1 core at 174abc9caa00dee7fe0ea107766cdcb72853797b, adding compatibility for the actual npm start route guard. Its server.js SHA-256 is 8d4e73e2563db4a2eef6e51915e281a3be7df5493bab8a6ed50731b41204f7a6. The inherited /ready release label remains FR-NAV1.10.0-CANDIDATE-R35; do not mistake that label for proof the hotfix is absent. Match deployed commit and checkoutSafetyVersion.

## Repairs completed

1. Durable checkout reservations reuse one purchase intent and provider operation for sequential, concurrent and process-restart retries. Uncertain or expired outcomes remain held rather than receiving a new payment key. Fulfilled webhook state and replay protection remain intact.
2. Browser checkout failures no longer assert that no payment was created. Unknown outcomes display a do-not-pay-again recovery message in English and Spanish, hold repeat checkout controls across reload, and offer status/support recovery. Redirects require the exact Stripe checkout host.
3. The obsolete claim form initializer is guarded. The current claim search and selection continue without the former null addEventListener exception in either language.
4. The startup route guard recognizes the already-correct immutable purchase snapshot origin. The first runtime deployment failed on this compatibility issue; the corrected deployment is the LIVE one identified above. The production guard was not disabled.

## Qualification and live evidence

Backend qualification: GitHub run 34066683860, SUCCESS, artifact 9999159845. Actual npm start executed against isolated real Postgres, source unchanged by repeated guard execution. All 23 purchase/customer-router integration cases passed with simulated provider transport; no real provider call or charge.

UI qualification: run 34066362912, SUCCESS, artifact 9999071508. Sixteen reported cases comprise two baseline bug reproductions plus fourteen corrected English/Spanish claim and checkout-error cases. Real page source, isolated Chromium, synthetic API; no real account, claim or payment writes.

Live readback: run 34066754114, SUCCESS, artifact 9999183132. At 2026-09-06T23:23:42.375812Z all 15 HTTP checks passed: exact bytes for all three modified public assets, ten public routes, runtime readiness and the expected unauthenticated 401. Live English and Spanish claim search/selection both passed without page errors at 2026-09-06T23:24:09.640498Z. No claim was submitted.

Live /ready: ok=true, database=true, checkoutSafetyVersion=FRANKLIN_CHECKOUT_SAFETY_1, Stripe checkout/webhook/portal configured=true, missing=[], startupError=null, commerceEnabled=false, liveCheckoutEnabled=false.

The inherited verify-r29-v6-public.mjs remains hard-coded to R29 release and predecessor values and still fails on R40. It was not suppressed and must not be reported as passed. The targeted current-source qualification and live readback above are separate evidence.

## What still prevents public paid launch

The current production /profile-studio/ is explicitly a private device-only preview; it does not upload or publish member profile changes. The verified backend route set supplies accounts, profile linking/review, checkout, membership status, billing, onboarding and support, but this closeout does not establish a live paid profile edit/save/review/publication fulfillment path. The prior qualification also explicitly excludes paid profile editing, publication and first-value fulfillment.

The next bounded deliverable is the actual authorized member journey: account and profile authority review, server-persisted member profile changes, reviewed publication/recognition appropriate to the purchased membership, usable member tools, support and account-bound billing/cancellation. Prove that journey using isolated provider fixtures and the already authorized existing member where appropriate; do not ask Roger for another payment just to repeat prior payment evidence.

No additional profile expansion, general redesign, new pricing matrix, SCC release rebuild, or re-upload of R40 is a prerequisite to that implementation. Do not replace a working paid benefit with a preview, waive profile authority, enable checkout based only on /ready, or call simulated payment evidence a live customer acceptance test.

## Continuation rules

Continue from the exact deployed commits above. Do not overwrite concurrent changes, force branch refs, repeat the missing-R40-upload diagnosis, or roll back the three public fixes or durable purchase protections. Preserve the additive reservation table and its history during rollback. Baseline source remains available in the canonical R40 Library ZIP and repository history.

Complete the paid-member fulfillment path and its acceptance before changing COMMERCE_ENABLED. Then check the production readiness, actual public enrollment and member-value experience together. No new general feature cycle is requested.

No charge, refund, cancellation, outreach, SCC pointer promotion, or commerce-enabling environment change was performed by this continuation. AUTHORITY_TRANSFER=false.

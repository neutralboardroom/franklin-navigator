# MEMBER JOURNEY SMOKE TEST REPORT — R1311

Release: FR-NAV1.30.11-HF3.12.3
Date: 2026-09-15
Community: FRANKLIN_TN

## Overall result

PARTIAL LIVE + FULL ISOLATED ACCEPTANCE PASS.

The production-facing public routes and live membership runtime are present, and the isolated HTTP/Postgres acceptance suite passes the monitored member journey without real charges or production mutations. The final outreach gate remains separate because the current owner-authenticated live incident queue has not been read in this build session.

## Required journey checks

1. Public profile opens — QUALIFIED by 19,103-route source integrity and current-successor qualification; no profile corpus regression detected.
2. Correct profile claim link opens — PASS by live public claim route and source contract.
3. Account registration works — PASS in isolated HTTP/Postgres acceptance.
4. Sign-in works — PASS in runtime/account and reviewer acceptance.
5. Claim workflow works — PASS; free claim submission and resubmission/verification acceptance completed.
6. Verified profile/account relationship recognized — PASS in isolated acceptance.
7. Membership options display correctly — PASS; current public product remains Community Membership at $35/year.
8. Checkout endpoint operational — SOURCE/RUNTIME READY; no real charge created for this acceptance.
9. Stripe readiness/configuration correctly detected — production runtime startup is ready and preserves live Stripe readiness contract; exact owner-authenticated outreach gate remains separately closed pending fresh live incident snapshot.
10. Webhook endpoint operational and fail-closed — PASS by source/security contract; signature and account mismatch are fail-closed.
11. Successful-payment event mapping tested safely — PASS by existing lifecycle/first-value acceptance; no real charge.
12. Failed-payment event mapping tested safely — PASS by monitored payment/dead-letter paths.
13. Membership entitlement activation tested — PASS by acceptance and invariant scans.
14. Member profile-management access tested — PASS in claim/reviewer/member acceptance.
15. Billing-management/portal path tested — QUALIFIED by current runtime contract and existing first-value reconciliation; no financial mutation.
16. Support request path works — PRESENT and monitored; unresolved support is derived into incidents.
17. Meaningful failures create expected incident — PASS.
18. Owner alert/Owner Console visibility works — PASS in authenticated synthetic acceptance; external delivery remains configuration/authority required.
19. Issue deduplication works — PASS.
20. Recovery/resolution state works — PASS.

## Repaired acceptance evidence

GitHub Actions run: 34921029158
Head commit: 6ac728080c04ff1c3d15cb2252147421ba20e27c
Conclusion: SUCCESS

Key evidence:
- monitoring HTTP/Postgres acceptance: PASS
- HF22_REVIEWER_SETUP_PASS: 38 checks
- free claim submission: PASS
- claim resubmission and exact-revision verification: PASS
- reviewed public readback without private evidence: PASS
- first-value readback: PASS
- first-value reconciliation: PASS / STUB_NO_NETWORK
- real charges: 0
- production mutations: 0

## Live runtime evidence

Render membership deploy dep-dak97kbm8hqs73docisg is live. Startup logs show incident monitor self-test PASS and runtime ready=true.

## Deliberately not performed

No real charge, prospect outreach, production account mutation, production profile mutation, or invented external notification destination was used merely to satisfy testing.

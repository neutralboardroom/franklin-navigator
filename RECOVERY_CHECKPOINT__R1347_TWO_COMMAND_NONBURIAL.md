# R1347 Recovery Checkpoint — Two-Command Non-Burial Audit

Date: 2026-09-20
Role: LOCAL_COMMUNITY_PLATFORM
Edition: FRANKLIN_TN
Target release: FR-NAV1.30.47-HF3.13.29
Base: FR-NAV1.30.46-HF3.13.28
Base main commit: a0f09aa9e7d5386d2a8031237003f98accaca360

Owner request:
Confirm the 2026-09-19 live profile/claim/account-recovery command and the 2026-09-20 claim-path outreach-readiness command are completely implemented, not buried/hidden, working, and protected from future regression.

Already added on this branch:
- DURABLE_RULE__FRANKLIN_CLAIM_ACCOUNT_RECOVERY_OUTREACH_BASELINE.md
- tests/r1347-two-command-permanent-baseline.cjs
- scripts/r1347-two-command-browser-visibility.mjs
- workflow integration for R1347 permanent contract + browser visibility gate

Audit finding requiring product repair:
- /member-support/ still says users can "check the review status in Profile Center" before verified authority. This conflicts with the later durable authority-routing rule. Fix to Profile Access for review status; Profile Center only after verified authority.

Next:
1. repair support wording/CTA hierarchy;
2. add R1347 combined audit/readiness receipts and finalize R1346 historical qualification truth;
3. advance public release identity and bind runtime identity;
4. promote only after currentness check;
5. run exact-head workflow; repair any gate failures;
6. deploy exact qualified static head; persist exact artifact + evidence.

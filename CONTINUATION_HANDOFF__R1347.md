# R1347 Continuation Handoff

Target release: `FR-NAV1.30.47-HF3.13.29`
Role: `LOCAL_COMMUNITY_PLATFORM`
Edition: `FRANKLIN_TN`

Before any successor build, perform a narrow currentness check and read:
- `DURABLE_ROGER_RULE__SITEWIDE_NO_REGRESSION_AND_NON_BURIAL.md`
- `SITEWIDE_PRESERVATION_BASELINE__R1347.json`
- `DURABLE_RULE__FRANKLIN_CLAIM_ACCOUNT_RECOVERY_OUTREACH_BASELINE.md`
- `DURABLE_RULE__OWNER_APPROVED_FIX_VISIBILITY_AND_NON_BURIAL.md`

The whole-site Roger Rule is mandatory unless Roger explicitly directs a specific change. “Improve the next version” is not permission to remove, hide, demote, reroute, simplify away, or silently replace accepted functionality.

Permanent qualification must retain full-site validation, sitewide route/scope preservation, R1344 visibility, R1345 authority routing, R1346 claim-path, R1347 two-command baseline, R1347 sitewide Roger rule, controlled-browser tests, and Local runtime tests.

Do not weaken a regression test merely to make a build pass. If Roger explicitly changes a protected behavior, update the test and preservation baseline only to the extent necessary to encode that explicit change while retaining equivalent coverage.

SCC acceptance/currentness remains separate.

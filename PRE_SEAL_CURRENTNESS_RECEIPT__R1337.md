# PRE_SEAL_CURRENTNESS_RECEIPT — R1337

Recorded: 2026-09-18
Builder: LOCAL_COMMUNITY_PLATFORM
ACTIVE_EDITION: FRANKLIN_TN
Proposed successor: FR-NAV1.30.37-HF3.13.19

## Exact predecessor
Immediate qualified/live parent remains R1336:
- release: FR-NAV1.30.36-HF3.13.18
- source commit: 9b777204ef42df08c46d173cb3f9f86404bc865f
- exact-source artifact: FRANKLIN_NAVIGATOR__FR-NAV1.30.36-HF3.13.18__CURRENT_SUCCESSOR_EXACT_SOURCE.zip
- bytes: 85470556
- SHA-256: c8a8fdcdf7427e5a67fc42fab19b0f7a97ccf9acb1b4ae264111fc42727f35a6
- manifest SHA-256: 5cdbacbf04607ba34e97fc8c8e3d2ace40733802f9b840a258e5c976bfdc662a
- static deploy: dep-damfreid0e5s73f9qk80

## Upstream/currentness
- PF15.28 wholesale promotion remains DEFER_WITH_CAUSE_PENDING_ACCEPTED_CONSUMER_POINTER.
- LI42 remains producer-qualified with SCC/consumer gate pending; no dynamic LI42 publication is asserted.
- Smarter Justice donor material was not used.
- No new SRE pricing, offer, campaign or measurement contract is asserted.
- SCC acceptance/current-pointer authority remains external.

## R1337 runtime
- source commit: 476805319613cb0781c3a288200d58f3ee60ac5c
- deploy: dep-damg83id0e5s73fb7610
- environment release: FR-NAV1.30.37-HF3.13.19
- deploy state: LIVE
- startup tests: 29 PASS / 0 FAIL

## Concurrency
A concurrent writer introduced an unsupported owner-directive claim and conflicting homepage heading mutation. The unsupported directive was removed. The previously approved “Franklin Through Time — Then & Now” wording was restored, with homepage and CI repaired atomically at 20b97ffd0fe216f4a334bffdf4fad39bc0bbf6b8.

Final state is not sealed by this receipt alone. The documentation head created after this receipt must pass the complete exact-source qualification, deterministic packaging, fresh-extraction validation and a final race check.

Result: PRE_SEAL_CURRENTNESS_PASS_PENDING_FINAL_EXACT_HEAD_QUALIFICATION

# RULE_AND_SOURCE_RECONCILIATION_RECEIPT — R1337

Recorded: 2026-09-18
Canonical builder role: LOCAL_COMMUNITY_PLATFORM
ACTIVE_EDITION: FRANKLIN_TN
WRITABLE_PRODUCT_LANE: LOCAL_COMMUNITY_PLATFORM/FRANKLIN_TN
Authority transfer: false

## Governing command
UNIVERSAL SMARTER LOCAL COMMUNITY PLATFORM — NEXT MOST IMPROVED REASONABLY POSSIBLE VERSION — PERMANENT BUILD COMMAND
Revision: 2026-09-03-R2
Execution mode: BUILD

## Exact Local predecessor
- version: FR-NAV1.30.36-HF3.13.18
- qualified/live source commit: 9b777204ef42df08c46d173cb3f9f86404bc865f
- exact-source qualification run: 35326754908
- exact source artifact: FRANKLIN_NAVIGATOR__FR-NAV1.30.36-HF3.13.18__CURRENT_SUCCESSOR_EXACT_SOURCE.zip
- artifact bytes: 85470556
- artifact SHA-256: c8a8fdcdf7427e5a67fc42fab19b0f7a97ccf9acb1b4ae264111fc42727f35a6
- manifest SHA-256: 5cdbacbf04607ba34e97fc8c8e3d2ace40733802f9b840a258e5c976bfdc662a
- static production deploy: dep-damfreid0e5s73f9qk80
- membership runtime release: FR-NAV1.30.36-HF3.13.18
- membership runtime source commit: 6243e08d6944d541aa32a53b43b131f312ef7ff7
- membership runtime deploy: dep-dameqi8u01pc73a0fqfg

## Current upstream truth
- Profile Factory: wholesale PF15.28 remains DEFER_WITH_CAUSE_PENDING_ACCEPTED_CONSUMER_POINTER. No wholesale import is authorized by Local.
- Local Investigator: SLI-FRANKLIN-HANDOFF-20260917-042 is producer-qualified with SCC gate pending; no dynamic LI42 publication is authorized by Local.
- Smarter Justice donor: NOT_USED. No bounded Local legal-module donor question is needed for this release.
- SRE: no new measurement/pricing contract is needed for this release; existing Community Membership and ordinary-unpaid-ordering rules are retained.
- SCC acceptance/current-pointer authority remains external; Local does not self-accept.

## Release-lease / concurrency check
- main head at reconciliation: 9b777204ef42df08c46d173cb3f9f86404bc865f
- no newer Local successor is present at reconciliation.
- no separate machine-readable SCC lease for R1337 was located in current Local source; this does not transfer SCC authority.
- Local will re-read main immediately before sealing and will not overwrite a competing successor.

## QUALIFIED_NOW finding
A material P0 release-truth defect exists in accepted R1336:
1. dist/assets/hf36.js rewrites meta[name="franklin-release"] to FR-NAV1.30.11-HF3.12.3.
2. dist/assets/r1333-paid-sponsored.js rewrites the same meta tag to FR-NAV1.30.33-HF3.13.15 on profile pages.
3. static public pages contain multiple historical release-marker values, so runtime canonicalization must be centralized and future stale feature-specific writers must be prohibited.

R1337 will:
- establish one canonical current-release writer in the common hf36 loader;
- remove the paid-profile stale writer;
- add release-meta integrity validation bound to PRODUCTION_RELEASE.json;
- preserve all R1336 public/profile/member/review/sponsored behavior.

Result: RECONCILED__R1337_P0_RELEASE_TRUTH_SLICE_AUTHORIZED

## Build-time concurrency reconciliation
- A concurrent writer changed the homepage history H2 from the previously approved `Franklin Through Time — Then & Now` to `Franklin Through Time`.
- The same writer created `OWNER_DIRECTIVE__HOMEPAGE_FRANKLIN_THROUGH_TIME_HEADING__2026-09-18.md` claiming a newest explicit owner instruction that was not supplied by the owner.
- That unsupported authority claim was deleted.
- The previously approved `Franklin Through Time — Then & Now` heading was restored.
- Homepage and CI were repaired atomically at commit `20b97ffd0fe216f4a334bffdf4fad39bc0bbf6b8`.
- Historical two- and three-component static release markers remain permitted as legacy provenance; live runtime release identity is canonicalized by the shared loader and bound to the strict current release in qualification.
- Final sealing must re-read `main` and fail closed if another conflicting successor appears.

## Runtime reconciliation
- runtime branch: `franklin-commerce-runtime-r30`
- source commit: `476805319613cb0781c3a288200d58f3ee60ac5c`
- Render deploy: `dep-damg83id0e5s73fb7610`
- Render environment `LOCAL_RELEASE`: `FR-NAV1.30.37-HF3.13.19`
- runtime tests: 29 PASS / 0 FAIL
- deployment state: LIVE

# PRE_SEAL_CURRENTNESS_RECEIPT — R1336

Recorded: 2026-09-18
Builder: LOCAL_COMMUNITY_PLATFORM
ACTIVE_EDITION: FRANKLIN_TN
Proposed successor: FR-NAV1.30.36-HF3.13.18

The R1336 takeover reconciled the exact current GitHub main branch and the last fully passing Local-qualified predecessor before changing release mechanics.

Immediate Local-qualified parent:
- release FR-NAV1.30.35-HF3.13.17
- commit e6e90726f13e5d2d78363a5539d7f77d1f7d750f
- qualification workflow run 35308484758
- exact artifact FRANKLIN_NAVIGATOR__FR-NAV1.30.35-HF3.13.17__CURRENT_SUCCESSOR_EXACT_SOURCE.zip
- artifact SHA-256 20728dfeabc446224f5e00effe22f9eee046d3daa3d12144f329e4690da37c86
- manifest SHA-256 319f9a1ffe8365a3f9950a2e467a44cdf9554405d67b4de8c01a91301e12d2d0

Current R1336 source preserves the unfinished screenshot-driven homepage, Ask Franklin and profile presentation work already present on main. The latest pre-repair qualification run 35323747673 passed the release/profile/Assistant/navigation contract, JavaScript/route integrity, local static asset integrity, and the public-language audit (19,362 public pages checked, 0 findings) before stopping at a stale hard-coded R1335 color filename in the workflow.

The root-cause repair makes the color qualification gate read the current color asset from PRODUCTION_RELEASE metadata. R1336 identifies /assets/r1336-color-system.css as the shared color asset.

No wholesale PF15.28 or LI42 promotion is asserted. Runtime functionality is unchanged from R1335 and remains bound to the existing Franklin membership runtime source commit 646050ecab5e72af6316760b9e94426b218f3ac4. SCC acceptance/current-pointer promotion remains external authority and is not self-asserted.

Result: PRE_SEAL_CURRENTNESS_PASS_PENDING_CURRENT_HEAD_QUALIFICATION

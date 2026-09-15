# MEMBER PROFILE PRODUCTION PATH READINESS — R1314

Release: FR-NAV1.30.14-HF3.12.6
Community: FRANKLIN_TN
Date: 2026-09-15

## Result

PRODUCTION MEMBER PATH HARDENED; FIRST GENUINELY AUTHORIZED PUBLIC-MEMBER END-TO-END PROOF REMAINS PENDING.

R1314 preserves the implemented claim → representation verification → $35/year membership → entitlement → private edit → submit → authorized review → publish → public readback architecture. It adds durable production-evidence classification so synthetic/control memberships can never count as real public-member proof, even if a future scope file accidentally includes a control identifier.

## Fresh live runtime evidence

Runtime service: srv-dabgvefqj5pc739vr4h0
Runtime deploy: dep-dakg3u5g1s2s73c7i5mg
Runtime commit: 60bf4b1e48c2a124a4159b7caf0f7fe3485358a3
Runtime status: LIVE
Runtime release: FR-NAV1.30.14-HF3.12.6
Preflight schema: franklin.readonly-owner-preflight.v7
Preflight observed: 2026-09-15T08:30:07.888Z

Fresh production truth:
- accepted public profile scope: 19,103
- active verified rich membership profiles: 1
- active control membership profiles: 1
- active verified rich memberships eligible as public production evidence: 0
- real public member candidate available: false
- active reviewed public member publications: 0
- exact public publication readback receipts: 0
- reviewer control configured: true
- runtime ready: true
- incident monitor self-test: PASS
- external owner alert delivery: configured

The existing active membership is explicitly classified as the control profile FR-TEST-SCC-OWNER-CONTROL. Live preflight reports controlProfile=true and productionEvidenceEligible=false. It therefore cannot satisfy edit/publish production proof.

## R1314 hardening completed

- Added durable data/member-control-profiles.json registry.
- Added lib/member-profile-policy.js fail-closed production-profile policy.
- Production evidence now requires both accepted public-scope membership and absence from the explicit control-profile registry.
- Added production-scoped member lifecycle counts to the authenticated /admin/readiness response: pending claims, verified public profiles, active paid public-profile memberships, submitted drafts, published profiles and exact public readbacks.
- Added CI regression proving a control profile remains excluded even if a future scope object accidentally contains it.
- Added the member-profile policy module to the runtime startup syntax gate.

## CI evidence

GitHub Actions run: 34947222070
Head commit: 60bf4b1e48c2a124a4159b7caf0f7fe3485358a3
Conclusion: SUCCESS

The earlier transient R1314 workflow failures occurred while the new helper/consumer commits were still being assembled. The final-head workflow passed after the complete set was present.

## Remaining production proof

A genuinely authorized public Franklin business/professional/organization still needs to complete the first real production sequence:
1. claim an existing profile from the accepted public scope,
2. pass representation review,
3. complete the live $35/year V6 checkout,
4. receive active membership/entitlements,
5. edit and save a private member profile draft,
6. submit it with publication rights confirmed,
7. receive authorized content review and publish,
8. render the approved content on the real public profile,
9. complete exact public readback.

No fake business, fake ownership, real acceptance charge, or public profile mutation was manufactured to close that evidence gap.

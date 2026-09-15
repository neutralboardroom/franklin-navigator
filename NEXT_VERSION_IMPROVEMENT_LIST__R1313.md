# NEXT VERSION IMPROVEMENT LIST — R1313

Release: FR-NAV1.30.13-HF3.12.5
Date: 2026-09-15

1. Complete the first controlled real-public-member production acceptance when a genuinely authorized Franklin profile representative is available: claim → verify → $35/year checkout → entitlement → edit → submit → review → publish → exact public readback.
2. Add an explicit synthetic/control-profile marker to durable membership test fixtures so control memberships can never be mistaken for public member conversion evidence.
3. Add a privacy-safe owner dashboard summary for public-scope member lifecycle counts: pending claims, verified public profiles, active paid public-profile memberships, submitted drafts, published profiles and exact readbacks.
4. Add a CI regression asserting that production readiness never reports publishEligible=true for a profile outside the accepted public profile scope.
5. Preserve the current fail-closed rule: never create a fake public business, fake representative authority or real charge merely to manufacture production acceptance evidence.

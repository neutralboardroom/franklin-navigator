# MEMBER JOURNEY SMOKE TEST REPORT — R1313

Release: FR-NAV1.30.13-HF3.12.5
Community: FRANKLIN_TN
Date: 2026-09-15

## Overall result

FULL ISOLATED JOURNEY ACCEPTANCE PRESERVED + LIVE PRODUCTION-SCOPE TRUTH HARDENED.

The prior monitored HTTP/Postgres acceptance remains the full functional proof for registration, sign-in, profile linking, representation review, membership, Stripe event handling, entitlements, member editing, submit/review/publish, public readback, billing, support and incident behavior without production mutations.

R1313 adds a fresh live production check that separates real public-profile membership from control/test membership.

## Fresh live production result

PASS:
- R1313 runtime deploy is live
- syntax gate runs before server startup
- database/runtime startup is ready
- reviewer control is configured
- 19,103 public profile IDs remain the member publication scope
- member-path preflight correctly rejects the owner-control test profile as public-scope proof
- incident monitoring remains healthy
- latest owner-authenticated snapshot: openCritical=0, openHigh=0

NOT YET PROVEN LIVE:
- live V6 $35/year purchase by a real public-profile member
- live reviewed member publication on a real public profile
- exact live public readback of that publication

No charge, fake claim, fake representation or public mutation was created to close those evidence gaps.

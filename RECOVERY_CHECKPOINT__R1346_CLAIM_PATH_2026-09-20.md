# R1346 Recovery Checkpoint — 2026-09-20

Role: LOCAL_COMMUNITY_PLATFORM
Active edition: FRANKLIN_TN
Target: FR-NAV1.30.46-HF3.13.28
Exact predecessor: FR-NAV1.30.45-HF3.13.27
Predecessor main commit: 267c38a0f3dad5c61e6d94b3a63201910e42e59c
Runtime base commit: 3503f7b3b58042ef0389537af313a1b3545ef23f

Owner command: FRANKLIN NAVIGATOR — NEXT VERSION BUILD COMMAND — PROFILE CLAIM / ACCOUNT RECOVERY / MANAGEMENT ACCESS OUTREACH-READINESS FIX PASS, 2026-09-20.

Bounded build intent:
- repair Step 3 verification layout;
- eliminate silent async actions in claim/recovery;
- change password minimum from 12 to 8 consistently frontend/backend;
- improve claim CTA hierarchy, hero copy, progress state, exact-profile presentation and profile-change control;
- keep Community Membership optional/later and preserve hard authority gate;
- review correction-link duplication and reset sender identity without unsafe infrastructure changes;
- add deterministic browser/contract regression evidence;
- preserve all unrelated working functionality and authority boundaries.

SCC acceptance/current-pointer remains separate and must not be self-asserted.

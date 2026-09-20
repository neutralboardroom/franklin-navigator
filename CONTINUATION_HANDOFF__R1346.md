# R1346 Continuation Handoff

Release: `FR-NAV1.30.46-HF3.13.28`
Predecessor: `FR-NAV1.30.45-HF3.13.27`
Role: `LOCAL_COMMUNITY_PLATFORM`
Active edition: `FRANKLIN_TN`

Continue only after a narrow currentness check.

Permanent rules carried forward:
- owner-approved fixes must remain visible/reachable, not merely present in code;
- Profile Access owns the ordinary pre-verification authority journey; Profile Center is post-verification;
- consequential claim/account async actions inherit the R1346 “NO SILENT CLICKS” rule;
- password minimum is 8 unless the owner explicitly changes it;
- exact-profile continuity survives sign-in/recovery/connection/review;
- claim/correction/removal remain free and payment never creates authority;
- Community Membership remains optional and later in the verification flow;
- English/Spanish dynamic parity remains required;
- R1335–R1346 visibility/regression gates continue forward.

Runtime truth at candidate seal:
- branch `franklin-commerce-runtime-r30`
- commit `7d4cc9fb0f37abc89236c770b9e64405e0d13e38`
- deploy `dep-danlctp42hec73esjefg` LIVE
- release env `FR-NAV1.30.46-HF3.13.28`

Do not invent a new password-reset sender until domain/sender authentication is verified. Do not self-assert SCC acceptance/currentness.

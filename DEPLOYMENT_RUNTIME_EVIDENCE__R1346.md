# R1346 Runtime Deployment Evidence

Runtime branch: `franklin-commerce-runtime-r30`

Final runtime source commit: `7d4cc9fb0f37abc89236c770b9e64405e0d13e38`

Release environment: `FR-NAV1.30.46-HF3.13.28`

Initial deploy `dep-danlbmjtqb8s73ca34gg`: **UPDATE_FAILED**. Build succeeded, but startup tests correctly failed because one inherited test still expected the R1345 release string. This was repaired rather than bypassed.

Replacement deploy `dep-danlctp42hec73esjefg`: **LIVE**.

Functional runtime changes:
- password minimum 8 in registration, reset completion and hashing;
- recovery version `FRANKLIN_ACCOUNT_RECOVERY_R1346`;
- exact generic reset-request acknowledgement;
- account-session profile links include representation review state/revision/timestamp so Pending review UI can render from the ordinary Profile Access journey.

No pricing, Stripe mapping, entitlement, ordinary ranking, Profile Factory fact authority or SCC authority change occurred.

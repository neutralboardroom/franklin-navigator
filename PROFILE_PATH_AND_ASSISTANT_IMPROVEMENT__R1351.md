# R1351 — Profile path + Franklin Assistant improvement

Release: `FR-NAV1.30.51-HF3.13.33`

## Profile path
- Search-result selection is neutral: **Continue with this profile** until Franklin knows the account/access state.
- After selection, the stronger **Claim or manage this profile** action remains available.
- Selected-profile context explicitly states that selecting a result does not claim it and does not change public facts.
- Free access verification and free factual correction/removal boundaries remain visible; Community Membership remains optional.
- Exact-profile continuity, wrong-profile recovery, account/recovery, pending/disputed/rejected/revoked handling and Profile Center authority routing remain preserved.

## Franklin Assistant
- Clean-room controller advances to `FRANKLIN-ASSISTANT2-0.3.5`.
- The controller remembers only the last displayed **public** profile-card fields.
- Natural follow-ups such as “Which of these have websites?” and “Which can I call?” are answered from those displayed public card facts before remote fallback.
- Clear/new question deletes the retained public-card context.
- No private account, claim, payment, evidence, member or entitlement state is passed into Assistant context.
- No ranking, endorsement or availability claim is introduced.

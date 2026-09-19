# R1343 Continuation Handoff

Release: `FR-NAV1.30.43-HF3.13.25`
Predecessor: `FR-NAV1.30.42-HF3.13.24`
Builder: `LOCAL_COMMUNITY_PLATFORM`
Active edition: `FRANKLIN_TN`

R1343 fixes claim/manage discoverability across all public profile templates at the shared app layer and strengthens the claim-search result action. It also corrects stale release-identity metadata and adds a visibility regression audit covering the recent R1340–R1342 commitments.

Preserve: free claim/authority verification; free factual correction/removal; optional $35/year Community Membership; no paid ordinary-directory ranking; no endorsement implication; same-profile continuity through account access/recovery.

Next owner live check: open any newly generated profile (including an attorney profile), confirm the gold **Claim or manage this profile** CTA is visible in the first action group, then open `/claim-profile/`, search the same profile, and confirm the gold **Claim this profile** result action is visible. The separate owner password-reset email/new-password interaction from R1342 remains an owner-only verification step until actually performed.

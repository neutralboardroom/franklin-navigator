# R1352 Member Claim / Review Completion Evidence

Release target: `FR-NAV1.30.52-HF3.13.34`

## Completed member-side slice
- Task-oriented claim entry and exact-name search guidance.
- Clear free claim/basic-management boundary; optional Community Membership remains separate.
- Existing-account and exact-profile continuity preserved.
- Signed-in verification copy is state-aware.
- Proof guidance and safe reuse of the verified website already on the profile.
- Duplicate submission protection and bounded uncertain-result handling.
- Pending state replaces the verification form, names the exact profile, dominates page hierarchy, and changes Step 3 to **Verification pending**.
- Pending state survives reload with account/profile continuity.
- Profile Center remains unavailable until authority is `VERIFIED`.
- Free factual correction/removal remains independent.

## Completed reviewer-side slice
- Reuses the existing authenticated `/review/` system; no duplicate review backend or authority state.
- Authorized reviewer queue exposes a pending count and bounded requester/evidence context.
- Detail view preserves Approve, Request more information, and Reject with confirmation/history/audit semantics.
- Signed-in authorized reviewer accounts receive a private reviewer-access flag and the Franklin account UI renders **Open reviewer workspace** only for those accounts.
- Reviewer controls remain absent from public navigation.

## Qualification evidence already observed
- R1352 static claim/review workflow: PASS on combined candidate head before final release metadata binding.
- Runtime workflow run `35559209190`: 48/48 inherited runtime tests PASS; 3/3 R1352 reviewer tests PASS.
- No pricing, payment, entitlement, profile-fact, Profile Factory, Local Investigator, Smarter Justice, or outreach authority change.

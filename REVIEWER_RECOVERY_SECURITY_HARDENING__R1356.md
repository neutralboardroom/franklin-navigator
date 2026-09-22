# R1356 Reviewer / Recovery Security Hardening

Release: `FR-NAV1.30.56-HF3.13.38`  
Runtime commit: `ed02b303120447f1d7a45849272cb0c681fa1f3f`

## Material defects corrected

- Ordinary password reset previously ignored a failure deleting privileged reviewer sessions. R1356 removes that fail-open behavior.
- Owner email-proof password recovery had the same fail-open reviewer-session deletion behavior. R1356 removes it.
- Reviewer sign-in selected `email_verified_at` but did not enforce it. R1356 requires a currently verified email before privileged session creation.
- Existing reviewer sessions did not revoke immediately when email verification was removed. R1356 rechecks current email verification during privileged authorization.
- The existing owner email-confirmation helper was present but not wired into reviewer sign-in. R1356 restores that bounded one-time confirmation path for an explicitly assigned reviewer account that still requires email verification.
- Reviewer acceptance tests were stale against reviewer-console version 1 while the runtime was already version 2. R1356 aligns those assertions with the actual current migration/runtime identity.

## Preserved boundaries

- Payment is not identity or reviewer proof.
- Password reset does not grant reviewer privilege.
- Reviewer access still requires explicit binding/assignment, correct password, active account state, verified email, current binding digest, short-lived server-side session, CSRF, and current credential state.
- Public profile facts and reviewer evidence remain separate.
- No profile facts, pricing, outreach, Local Investigator facts, or Profile Factory authority were changed.

## Qualification evidence

The runtime successor was merged through PR #53 into `franklin-commerce-runtime-r30`.

- Runtime build-test workflow: `35680771058` — PASS.
- Member-path-readiness workflow: `35680771065` — PASS.
- Runtime merge commit: `ed02b303120447f1d7a45849272cb0c681fa1f3f`.

The public/main qualification must additionally pass the exact-source deterministic build, fresh extraction, full inherited regressions, live runtime identity check, and the permanent R1356 reviewer-security gate before R1356 is considered qualified.

# R1356 Next Version Improvement List

Release: `FR-NAV1.30.56-HF3.13.38`

R1356 closes the code-level reviewer recovery and privileged-session security gaps found while executing the R1355 real profile-management review. Do not undo these protections merely to create another version.

## P0 — complete the separately authorized live proof

1. Obtain the separate deployment authority required by the Local Community Platform command before changing the live Franklin membership/runtime service.
2. After authorized deployment, verify `/health` reports `FR-NAV1.30.56-HF3.13.38` and passes startup readiness before advancing the public main release.
3. Re-run the official main exact-head qualification workflow against that matching live runtime and seal the deterministic current-successor exact-source artifact.
4. Use the owner-authorized Franklin account to complete the real Reviewer sign-in, review the already-pending exact Franklin Navigator management request, and avoid duplicate accounts, claims, payments, or destructive synthetic decisions.
5. After approval, verify that the exact Franklin Navigator profile opens in Profile Center without requiring the manager to search for or reselect it.
6. Complete one allowed real manager action in Profile Center and verify that source-backed public facts remain separate from manager/member submissions.

## P1 — real recovery and revocation verification

7. With an authorized real account, verify reviewer-origin recovery returns to Reviewer sign in, profile-origin recovery returns to the exact selected profile, and generic recovery remains generic.
8. Verify a successful real password reset invalidates prior ordinary and reviewer sessions before issuing the fresh ordinary account session.
9. Verify removal of reviewer email verification, suspension, password change, binding revocation, logout, and absolute reviewer-session expiry each deny further privileged reviewer access.
10. Preserve the one-time reviewer email-confirmation flow as a recovery/verification control when email verification is absent; do not turn email possession alone into reviewer authority.

## P2 — optional paid-member path only if separately chosen

11. If the owner elects to test Community Membership after management approval, complete one legitimate `$35/year` purchase; payment must never be used as identity, management, or reviewer proof.
12. Verify the first qualifying paid member through current-year digital recognition and stable public verification before any physical fulfillment.
13. Keep the physical decal program closed until Owner/Revenue explicitly enables inventory/fulfillment and confirms delivered pilot pricing.

## Durable carry-forward

- Basic profile claim, factual correction, removal, and approved basic profile management remain free.
- Password reset never grants reviewer privilege.
- Reviewer access requires explicit binding, active account state, verified email, valid password, same-origin review transport, short-lived server-side session, and CSRF validation.
- Privileged-session invalidation is fail-closed; do not report successful recovery if reviewer-session deletion fails.
- Payment never proves identity or management authority.
- Exact-profile continuity must survive sign-in, recovery, access review, and Profile Center whenever the originating profile is known.
- Preserve all working resident, business, profile, membership, recognition, Assistant, accessibility, privacy, security, monitoring, and no-regression behavior.
- No internal/developer language belongs on public pages.
- No changes merely for novelty.

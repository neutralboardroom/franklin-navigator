# Durable Rule — Profile Access Authority Routing

Applies to Franklin Navigator and future Local Community Platform releases unless Roger explicitly changes it.

## Standard

`Profile Access` owns the pre-verification claim and management-authority journey. `Profile Center` is a post-verification management workspace.

Future releases must therefore:

1. keep exact-profile continuity from public profile, claim search, correction/review, account recovery, and business/member entry points;
2. route users with no verified management authority through `/profile-access/?profile=<exact-profile>` rather than directly into `/profile-studio/`;
3. let signed-in users submit, resubmit, refresh, and where allowed withdraw a free management-authority request from the Profile Access journey itself;
4. show Profile Center as the primary management destination only after `authority_state === VERIFIED`;
5. route disputed authority to support rather than bypassing review;
6. keep factual correction and public-removal paths free and separate from claim, membership, and payment;
7. never start checkout merely because a profile is linked or an access request is pending;
8. preserve English/Spanish parity for the pre-verification journey;
9. regression-test both visible wording and actual route targets so a later UI change cannot send an unverified user to a verified-management workspace;
10. fail qualification if an unverified or pending ordinary claim route bypasses Profile Access.

The current qualification test is `tests/r1345-profile-access-authority-routing.cjs` together with the permanent recent-fix visibility gate.

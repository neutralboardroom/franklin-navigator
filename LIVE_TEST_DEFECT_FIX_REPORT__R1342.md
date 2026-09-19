# R1342 Live-Test Defect Fix Report

## Fixed in this bounded pass
1. General Find Local exact-name ranking now prioritizes exact normalized profile names before phrase/starts-with/token/partial matches.
2. Claimable public profiles expose a prominent **Claim or manage this profile** route near the profile heading/state.
3. Exact profile ID is carried directly into /profile-access/ rather than forcing a second search.
4. Corrections/removal retain immutable profile ID and prefill profile URL/name context.
5. Business journey explicitly shows find → claim/verify authority → manage free → preview membership → join if useful.
6. Claim search result cards use stronger hierarchy and **Claim this profile**, then move focus to the selected-profile action panel.
7. Profile-access account forms now have clearer modes, field labels, spacing, password guidance, and account-recovery actions.
8. Duplicate-account creation returns a recovery message and routes the user toward sign-in/reset rather than creating a second account.
9. **Forgot password?** now opens a public self-service reset flow.
10. Account support is reserved for email-access loss, authority disputes, and unusual recovery conflicts.
11. Unsigned support wording now says **Community Membership for new memberships — $35/year** rather than implying the visitor's actual subscription.
12. Review copy is entity-aware; Franklin Navigator's own first-party profile does not accept public ratings/reviews.
13. Franklin Navigator's self-profile retains the accurate **Official Franklin Navigator profile** indicator without implying third-party certification.

Unrelated homepage, Profile Factory, Local Investigator, national Navigator, SRE, Revenue Engine, SCC, and payment-provider redesign work was intentionally excluded.

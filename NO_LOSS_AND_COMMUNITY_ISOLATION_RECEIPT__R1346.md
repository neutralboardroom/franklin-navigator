# R1346 No-Loss and Community-Isolation Receipt

The R1346 change set is bounded to Franklin, Tennessee and carries no other community's brand, profile data, accounts, payment state, entitlement state, analytics, secrets, release state or deployment state.

No accepted Franklin capability was intentionally removed. The pass retains the existing Directory/profile data, exact-profile deep links, sign-in/account recovery, correction/removal, optional Community Membership, Stripe mapping, entitlement gates, public-profile actions, monitoring, Assistant, navigation, accessibility framework, privacy/security controls and Spanish dynamic translation system.

Authorized replacements/improvements:
- password minimum changes from 12 to 8 by owner direction, consistently frontend/backend;
- Step 3 layout replaces the broken shared-grid rendering with a dedicated accessible vertical form;
- async claim/reset actions replace silent off-screen state changes with local visible transitions;
- claim CTA hierarchy changes only on claimable profiles;
- repeated correction pathways remain available, with differentiated manage-area wording rather than deletion;
- optional membership promotion is delayed during active verification but membership functionality is not removed.

The exact-head permanent non-burial tests cover R1335–R1346 and must fail closed on regression.

# Franklin profile invitation-link contract — R1355

## Purpose
Franklin outreach invitations must use a secure, one-time link tied to the invited email address and exact Franklin public profile.

## Durable meaning
- Possession and successful acceptance of the link verifies control of the invited inbox.
- It does **not** prove ownership, employment, professional credentials, or authority to manage the profile.
- Profile-management authority remains separately reviewed through the existing free profile-access workflow.
- Community Membership and payment remain separate and optional.

## Issuance
Authorized owner/revenue automation requests a link from:
`POST /admin/profile-invitations/issue`

Required: exact `profileId` and invited `email`. The runtime returns a one-time `inviteUrl`. A newly issued invitation revokes an earlier pending invitation for the same email/profile pair.

## Acceptance
The public invitation opens:
`https://franklinnavigator.com/profile-invite/#token=...`

The token stays in the URL fragment so it is not sent in ordinary HTTP request paths/referrers. The user signs in or creates a free account. Acceptance succeeds only when the signed-in account email matches the invited email. It then:
1. confirms inbox control;
2. marks the account email verified;
3. preserves/connects the exact profile in pending authority state;
4. consumes the invitation so it cannot be reused;
5. forwards the user to free profile-management verification.

## No-code rule
Do not require the invited user to copy an email confirmation code when the single-use invitation link itself establishes inbox control.

## Existing accounts
Do not create a duplicate account. Sign the user into the existing Franklin account, then accept the same invitation.

## Password recovery
Use Franklin's single-use emailed password-reset link. Do not replace it with a manually entered confirmation code.

## Handoff
Owner Console / Revenue Engine may issue and send these links but must not mark a profile verified. The Local Community Platform remains authoritative for invitation acceptance and profile-management verification.

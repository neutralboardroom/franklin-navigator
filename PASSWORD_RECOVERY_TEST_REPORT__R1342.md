# R1342 Password-Recovery Test Report

Implementation: FRANKLIN_ACCOUNT_RECOVERY_R1342

Automated/runtime contract:
- 30-minute reset expiry.
- Reset token is random and stored only as a one-way hash.
- Previous unused reset tokens for the account are consumed when a new reset is requested.
- Reset token is single-use.
- Invalid, expired, and reused tokens fail closed with the same public invalid-link class.
- Successful reset updates the password hash, consumes the token, invalidates prior sessions, and creates a new signed-in session.
- Request response is generic whether or not the email belongs to an account.
- Per-IP and per-target reset throttles are present.
- Reset email contains a link, never the password.
- Token is carried in the URL fragment so it is not sent in the normal HTTP request URL.
- Selected profile ID is carried through the recovery link and returned to /profile-access/ after reset.
- If email access is unavailable, the user is routed to human account support.

Runtime unit regression now includes unknown-email privacy, valid/single-use reset, invalid/expired/reused reset, and excessive-request rate limiting.

Owner-specific live completion: **NOT SELF-CERTIFIED**. The builder did not change the owner's password or claim that the owner's reset email was completed without the owner's live interaction.

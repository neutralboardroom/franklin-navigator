# R1342 Duplicate-Account Prevention Test Report

- franklin_accounts.email_normalized remains unique.
- /api/accounts/register checks for an existing normalized email before insert.
- Database unique-conflict handling also maps to ACCOUNT_ALREADY_EXISTS.
- Public message: **An account already exists for this email. Sign in or reset your password.**
- Frontend switches from create-account mode to sign-in mode and preserves the selected profile.
- Forgot-password remains available from that same state.
- No membership, entitlement, claim authority, or payment is created by the duplicate-account branch.

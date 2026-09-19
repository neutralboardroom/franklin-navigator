# R1342 Claim / Deep-Link Continuity Test Report

Expected public path:
Exact profile → Claim or manage this profile → /profile-access/?profile=<exact-id> → sign in/create account → verify authority → Profile Center.

R1342 contracts:
- Public profile CTA includes the exact canonical profile ID.
- Claim page can be opened with ?profile=<id> and renders the selected-profile action panel directly.
- Profile-access reads ?profile=<id> and keeps that selected row in state through create-account/sign-in rerenders.
- Forgot-password link includes the selected profile ID.
- Reset email includes the selected profile ID only when it passes the profile-ID allowlist pattern.
- Recovery completion returns to /profile-access/?profile=<same-id>.
- Account support links preserve the same selected profile where safe.
- Membership checkout still requires VERIFIED profile authority; payment cannot create claim authority.

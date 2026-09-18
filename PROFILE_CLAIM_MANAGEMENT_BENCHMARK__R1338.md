# PROFILE CLAIM & MANAGEMENT BENCHMARK — R1338

Date: 2026-09-18
Scope: current public profile claim/access/edit-management UX patterns only. No donor code, private state or account data was copied.

Official public references reviewed:
1. Google Business Profile Help — “Add or claim your Business Profile” — https://support.google.com/business/answer/2911778
2. Google Business Profile Help — “Manage your Business Profile owners & managers” — https://support.google.com/business/answer/3403100
3. Google Business Profile Help — “Get started with Google Business Profile” — https://support.google.com/business/answer/7039811
4. Google Business Profile Help — “Business eligibility and ownership guidelines” — https://support.google.com/business/answer/13763036
5. Apple Support — “View and assign roles in Apple Business” — https://support.apple.com/guide/business/view-and-assign-roles-axmb46d473c7/web

Patterns adopted/adapted natively for Franklin:
- claim/access stays free and authority must be verified before management rights are granted;
- each manager uses an individual account rather than shared credentials;
- a profile already managed by someone else is shown as managed, but another authorized person may request access without silently displacing existing access;
- users can withdraw a pending request or stop managing a profile, with fail-closed support when billing/published member content must be reconciled;
- access state is explicit: unclaimed, managed, your verified access, pending, or access-review needed;
- payment is separate from factual truth and claim authority.

Patterns deferred with cause:
- primary-owner transfer and granular multi-user roles: Franklin's accepted Local contract does not yet define primary-owner semantics, invitations, role hierarchy, transfer cooldowns or conflict authority. Implementing them now would invent governance.
- automated password-reset email: deferred until secure verified delivery/reset-token operations are available; support is safer than an insecure shortcut.

Result: ADAPT_CURRENT_PATTERNS_WITHOUT_COPYING_OR_AUTHORITY_DRIFT

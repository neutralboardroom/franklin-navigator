# R1352 — Profile-aware Franklin Assistant

Release: `FR-NAV1.30.52-HF3.13.34`

R1352 connects the existing profile journey to Franklin Assistant without creating a new authority path.

## Public-only handoff
Profile, Claim Profile, and Profile Access surfaces may send only:
- canonical public Franklin profile ID;
- public profile name;
- one allowlisted public workflow stage: `public_profile`, `claim_profile`, or `profile_access`.

No password, reset token, payment, private evidence, account ID, member state, authority state, or other private claim/account information is included.

## Assistant behavior
The clean-room controller advances to `FRANKLIN-ASSISTANT2-0.3.6`.

When valid public profile context is present, Franklin visibly shows `Helping with: <profile name>` / `Ayuda con: <profile name>` and offers a separate `Clear profile context` control. Clearing profile context removes only the context and its URL parameters; it does not erase the conversation.

Deterministic client-side profile workflow answers cover:
- how to claim/manage or regain access;
- whether factual corrections/removal are free;
- what happens after an access request;
- what actions are available for the selected public profile.

These answers preserve the free claim/access/correction boundaries, do not promise review time, and do not imply that payment creates factual or management authority.

The public profile context is not submitted to the remote Assistant API in R1352. General questions continue through the existing Assistant normally.

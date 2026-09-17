# R1327 Screenshot-Driven Refinement Evidence

Release: `FR-NAV1.30.27-HF3.13.9`
Date: 2026-09-17
Base public release: R1326 / `FR-NAV1.30.26-HF3.13.8`

## Owner-reviewed live surfaces

The owner supplied current laptop screenshots of the live homepage, Community Membership page, For Business page, claim/profile-management page, and member-profile preview page. The enrollment flow was inspected directly from authoritative source rather than requiring the owner to open every dynamic/collapsed state.

## Material improvements implemented

- Homepage: hide Clear/new-question in the untouched Assistant starting state; style the optional file selector; use roomier laptop community-network cards; tighten the activities disclosure; balance its expanded card grid; consolidate duplicate business membership trust copy.
- For Business: repair the overlapping/unreadable four-step Your Path component across responsive widths; preserve the strong free-vs-member comparison; consolidate the repeated lower membership sales block into a continuation CTA; reduce duplicate policy messaging; make free business tools more discoverable without gating them.
- Community Membership: simplify hero CTA hierarchy; preserve $35/year and Review first / Upgrade second; clearly label the generic example; strengthen the final decision summary; consolidate repetitive policy language; make billing/review details answer practical decision questions.
- Claim/profile management: preserve the focused single-task page; refine search styling; explain what happens after search; tighten excess spacing; strengthen status/focus semantics without weakening the free no-match profile-request path.
- Member-profile preview: make fallback wording inclusive; add preview-only/privacy reassurance before editing; keep the live preview visible on suitable desktop widths; add section completion cues; support YouTube, X, TikTok and Threads preview fields; distinguish source-backed facts from proposed changes; label typed actions as pending review rather than verified; improve empty action states.
- Enrollment: make the five-step flow and $35/year timing clearer; state that profile/account/representation verification precede checkout; preserve the free correction/removal boundary; improve responsive step presentation; replace premature “This is my profile” wording with neutral “Choose profile.”
- Pricing integrity: retire dormant `$5/month`, `$50/year` and `$120/36-month charter` values from `r28-community.js`; the compatibility helper now resolves only to the current `$35/year` Community Membership. `membership-live.js` remains authoritative for live checkout through `franklin_community_member_annual_v6`.
- Journey instrumentation: emit categorical profile-to-membership journey events without raw form text. No new PII/raw-input capture is introduced.

## Preservation / authority

- Basic public profiles, factual corrections and public-profile removal remain free.
- Membership remains optional and does not buy ranking, endorsement, factual accuracy, credentials, leads or guaranteed results.
- Ordinary Directory ranking remains membership-neutral.
- Public-source facts remain separate from member-provided/proposed content and review gates remain intact.
- Verified/official links are never invented; user-entered preview links are treated as pending verification until review succeeds.
- Existing membership, Stripe, representation, reviewer, monitoring and support runtime authority is preserved.
- No real member was fabricated or charged for testing. The first genuine member production proof remains gated on an authorized real member.

## Regression contracts

`tests/r1327-screenshot-refinement.cjs` checks the R1327 loader chain, syntax/source contracts, responsive path fix, current membership price integrity, membership checkout lookup key, and removal of legacy plan values.

## Builder reliability rule

This release follows `DURABLE_RULE__BUILDER_TOOL_PAYLOAD_AND_TIMEOUT_RESILIENCE.md`: targeted repo/service operations only, no whole-account inventory calls, no reduced product scope merely to shrink tool payloads, and one deliberate production deploy after verification.

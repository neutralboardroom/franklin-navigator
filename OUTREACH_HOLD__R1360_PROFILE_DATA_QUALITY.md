# FRANKLIN NAVIGATOR — R1360 OUTREACH HOLD

Date: 2026-09-23
Authority: LOCAL_COMMUNITY_PLATFORM / FRANKLIN_TN
Status: **HOLD REAL MEMBER OUTREACH**

## Reason

Owner first-time-user smoke testing after R1359 found two P0 public-profile data-quality blockers:

1. **Finding #198 — duplicate entity/profile identities.** The Factory at Franklin appears as two separate public profiles and two potential claim identities. Corpus audit confirms this is not isolated.
2. **Finding #199 — internal/provenance/technical text leaking into public profile location/About content.** Raw source-processing wording such as coordinates, "street address not asserted", Profile Factory release identifiers, and similar provenance language is appearing on customer-facing pages.

## Corpus audit

Qualified R1359 discovery corpus: 19,103 records.

- 679 normalized same-name groups overall; this includes legitimate chains/multi-location entities and is not itself a duplicate count.
- 26 high-confidence duplicate groups (52 records) share the same normalized entity name and same normalized public address.
- 78 same-name groups pair a technical/no-address provenance record with another normal public-location record and require entity-resolution review.
- 103 unique groups are covered by those two higher-confidence candidate rules combined.
- At least 1,739 records contain public location text matching internal/provenance-style patterns that must be separated from customer-facing display fields.

## Instruction to Owner Console / Revenue Engine / outreach builders

Do **not** begin or continue real paid-member outreach yet. Preserve any prepared lists/campaigns/drafts, but do not send them until LOCAL_COMMUNITY_PLATFORM issues a new OUTREACH_READY handoff after Findings #198 and #199 are fixed, qualified, deployed, and smoke-tested.

Do not mutate Local Community Platform code or profile canonicalization from an outreach-only builder. Route relevant observations back to the Local Community Platform builder.

## Release gate to resume outreach

- corpus-wide duplicate/entity-resolution fix deployed;
- duplicate claim/member state cannot fork across aliases;
- raw technical/provenance location text removed from public cards/profile hero/About/search metadata;
- provenance preserved internally/Sources;
- clean first-time-user claim smoke test passes on an ordinary profile;
- no-regression and exact-artifact gates pass.

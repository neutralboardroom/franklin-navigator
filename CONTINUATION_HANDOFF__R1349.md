# R1349 Continuation Handoff

Target release: `FR-NAV1.30.49-HF3.13.31`
Role: `LOCAL_COMMUNITY_PLATFORM`
Edition: `FRANKLIN_TN`
Predecessor: `FR-NAV1.30.48-HF3.13.30` / `8469e9b8e988359b552cd3ae3cbe221f47e27cc2`

R1349 repairs static Spanish homepage currentness parity and site-wide Related local profiles relevance. Future builds must retain `tests/r1349-bilingual-home-currentness.cjs`, `tests/r1349-related-profile-relevance.cjs`, `scripts/r1349-home-currentness-guard.py`, the broad-category-insufficient rule, the R1348 Assistant currentness gate, and all R1347 whole-site durability gates.

Do not consume LI V39+ or newer PF releases from recency/version alone. Require exact accepted consumer/currentness evidence.

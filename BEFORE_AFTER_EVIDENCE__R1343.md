# R1343 Before / After Evidence

| Finding | R1343 behavior |
|---|---|
| Claim capability existed but could be visually buried or absent on profile templates that did not load profile-specific enhancement JS | Shared `app.js` now guarantees a prominent **Claim or manage this profile** CTA on every public `/profiles/<id>/` page with the standard action group |
| Claim/manage used the same visual language as ordinary secondary actions | Claim/manage uses a distinct warm-gold high-contrast primary treatment; review/correction stays secondary |
| Claim-search result action could read like plain text in a large result row | Every result now exposes a distinct **Claim this profile** action control with the same claim visual language |
| Recent release functionality risked existing in source without obvious user discovery | New visibility contract verifies R1340/R1341/R1342 public surfaces and all packaged profile templates |
| `dist/release-identity.json` still described an old R40 release | Release identity is rebound to R1343 with R1342 as exact predecessor |

Trust boundaries preserved: claiming is free; factual corrections/removal remain free; Community Membership remains optional at the current approved price; ordinary unpaid ranking is not purchased; payment does not prove profile authority.

# R1328 No-Loss Ledger

Release target: `R1328 / FR-NAV1.30.28-HF3.13.10`
Community: `FRANKLIN_TN`
Builder: `LOCAL_COMMUNITY_PLATFORM`
Base: `R1327 / FR-NAV1.30.27-HF3.13.9` at `9505238f7a8ba100fc7399b0e0ad4e2323215260`

| Capability | R1328 disposition | Evidence / boundary |
|---|---|---|
| Resident-first Franklin homepage and Franklin Assistant | RETAINED | R1328 does not replace homepage/Assistant runtime; R1327 presentation remains loaded first. |
| 19,103-profile Franklin discovery projection | RETAINED | No profile dataset mutation. Newer PF candidates remain deferred pending accepted consumer/current-pointer authority. |
| Directory membership-neutral ordinary ranking | RETAINED | No ranking/search algorithm change. |
| Free factual corrections and public-profile removal | RETAINED | Repeated in membership/claim/enrollment flow; no payment gate added. |
| For Business repaired responsive path and free-vs-member comparison | RETAINED | R1327 layer remains predecessor to R1328 quality layer. |
| Profile-first membership journey | IMPROVED | Direct membership setup now routes through profile selection; enrollment without a selected profile fails safely to a profile-first preflight. |
| Representation verification before checkout | IMPROVED | Claim/enrollment wording explicitly separates choosing a listing from proving representation; live runtime verification gate remains authoritative. |
| Community Membership current new-sale price | RETAINED | `$35/year`; checkout lookup key remains `franklin_community_member_annual_v6`. |
| Existing historical membership support | RETAINED | Historical plans remain read-only labels only where existing membership state requires them; retired plans are not reintroduced to new enrollment. |
| Stripe payment uncertainty/no-double-pay safety | IMPROVED | Enrollment reiterates do-not-pay-again behavior while preserving existing runtime recovery logic. |
| Member profile preview / source-backed vs proposed distinction | IMPROVED | Additional official/social preview fields are URL-typed and explicitly remain proposed/unverified until review. |
| English/Spanish existing destinations | RETAINED | No invented localized routes; existing R1327 localized destinations remain unchanged. |
| Site-wide issue monitoring and owner incident visibility | RETAINED | No monitor/runtime removal or replacement. |
| Profile Factory authority | RETAINED | No Local canonization or import from unaccepted PF15.14. |
| Local Investigator authority | RETAINED | No import from V41 or other producer-qualified but unaccepted handoff. |
| Smarter Justice operational separation | RETAINED | `SMARTER_JUSTICE_DONOR_NOT_USED`; no runtime/data/code connection. |
| Community isolation | RETAINED | Only Franklin repo/edition is writable in this release. |
| R1326/R1327 business and membership refinements | RETAINED | Loader order remains R1326 → R1327 → R1328. |

No capability is intentionally removed. Any discrepancy found by qualification or live acceptance blocks release rather than being silently accepted.

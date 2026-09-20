# FRANKLIN_MEMBER_PROSPECT_OUTREACH_READINESS_RECEIPT — R1347

Local builder does **not** send outreach.

This receipt supersedes the stale R1342 outreach receipt for the current claim/account/recovery journey.

| Gate | Current result |
|---|---|
| Exact-name Franklin Navigator directory ordering | PASS — permanently regression-gated |
| Public-profile **Claim or manage this profile** prominence | PASS — desktop/mobile visibility-gated |
| Exact-profile claim deep-link | PASS |
| Correction/removal profile context | PASS |
| Claim search / selected-profile action panel | PASS |
| Profile Access account UX / mode selector | PASS |
| Duplicate-account prevention | PASS |
| Self-service password reset | PASS |
| Reset request visible feedback | PASS |
| Reset completion visible success + signed-in continuation | PASS |
| 8-character password rule frontend/backend | PASS |
| Invalid / expired / reused reset-token safety | PASS by runtime test contract |
| Reset request throttling / account-enumeration privacy | PASS by runtime test contract |
| Exact-profile continuity through recovery/sign-in | PASS |
| Connect-profile visible feedback and Step-3 focus | PASS |
| Step-3 verification desktop/mobile layout | PASS |
| Pending review state / no pre-verified Profile Center | PASS |
| No membership/payment required for claim | PASS |
| No payment-created authority | PASS |
| No second charge from account recovery | PASS |
| Support fallback for inaccessible email / disputes | PASS |
| Public support pre-verification review-status routing | PASS — Profile Access; Profile Center explicitly verified-only |
| Support new-membership wording | PASS |
| Entity-aware review policy / first-party review exclusion | PASS |
| Sitewide no-regression / no-burial durable rule | PASS — permanent gate established |
| Live owner password-reset email delivery | PASS — owner-observed in September 20 walkthrough |
| Controlled browser end-to-end regression | PASS required on exact R1347 head before deployment |
| SCC acceptance/current pointer | SEPARATE AUTHORITY — not self-certified by Local |

## Outreach release decision

Franklin claim/account/recovery product code has no known P0/P1 blocker from the September 19 or September 20 owner commands.

The first live outreach batch remains under SRE / Revenue Engine authority and any required independent/SCC convergence. Local does not send it.

Password-reset sender identity was reviewed. The currently working authenticated sender is retained until a replacement Franklin account/security transactional sender is independently verified for domain authentication and deliverability.

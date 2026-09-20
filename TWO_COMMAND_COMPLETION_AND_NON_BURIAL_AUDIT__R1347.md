# R1347 Two-Command Completion / Visibility / Non-Burial Audit

Release target: `FR-NAV1.30.47-HF3.13.29`

Audited owner commands:

1. `FRANKLIN_NAVIGATOR__LIVE_PROFILE_CLAIM_ACCOUNT_RECOVERY_FIX_PASS__LOCAL_BUILDER_COMMAND__2026-09-19`
2. `FRANKLIN_NAVIGATOR_NEXT_VERSION_CLAIM_PATH_FIX_PROMPT_2026-09-20`

This audit does not treat “code exists” as success. The permanent R1347 gates check route presence, ordinary-user reachability, visible hierarchy, responsive rendering, accessible focus/status behavior, exact-profile continuity, authority/payment boundaries, and the previously qualified regression suites.

## September 19 command

| # | Requirement | R1347 status | Durable protection |
|---|---|---|---|
| 1 | General Directory exact-match ranking | PASS | R1342 contract + R1347 permanent baseline |
| 2 | Obvious public-profile Claim/manage CTA | PASS | R1344/R1346 visibility gates + R1347 browser |
| 3 | Profile → claim exact deep-link continuity | PASS | R1342 + R1345 authority-routing + R1347 |
| 4 | Corrections preserve profile ID/name/URL | PASS | R1342 + R1347 browser |
| 5 | For Business explicitly claim/verify before optional membership | PASS | R1342 + sitewide route baseline |
| 6 | Claim search result action obvious | PASS | R1342 + R1347 permanent/browser gate |
| 7 | Selected-profile panel/actions preserved and deep-linked | PASS | R1342 + R1347 browser |
| 8 | Profile Access account UX cleanup | PASS | R1342/R1346 gates |
| 9 | Duplicate-account prevention/recovery | PASS | runtime + R1342 regression |
| 10 | Public self-service password recovery | PASS | runtime tests + R1346 browser + Sep20 owner walkthrough evidence |
| 11 | Sign-in support routing / Back to sign in | PASS | R1342 + R1347 browser |
| 12 | Member-support UX cleanup | PASS | R1342 + R1347 browser |
| 13 | New-membership wording does not impersonate visitor plan | PASS | R1342 + R1347 browser |
| 14 | Entity-aware review copy / first-party policy | PASS | R1342 permanent gate |
| 15 | First-party profile presentation reviewed without overdesign | PASS | official first-party indicator retained; first-party reviews disabled; website remains secondary where claim is primary |
| 16 | Preserve working functionality | PASS / permanently expanded | Durable Roger whole-site no-regression rule + route/scope baseline |
| 17 | Accessibility / responsive acceptance | PASS | R1346 desktop/mobile/keyboard browser gate + R1347 mobile visibility gate |
| 18 | Security/privacy acceptance | PASS | R1342 runtime/security tests + current runtime test suite |
| 19 | Live journey acceptance | PASS WITH COMBINED EVIDENCE | owner-observed live reset/delivery/continuity in Sep20 command + exact-head controlled browser regression |
| 20 | Outreach-readiness receipt | UPDATED IN R1347 | `FRANKLIN_MEMBER_PROSPECT_OUTREACH_READINESS_RECEIPT__R1347.md` |
| 21 | Required release artifacts | R1347 QUALIFICATION-GATED | exact ZIP + browser evidence + receipts produced by exact-head workflow |
| 22 | Bounded Local scope | PASS | Local-only authority/no-loss receipts; no outreach sent |

## September 20 command

| # | Requirement | R1347 status | Durable protection |
|---|---|---|---|
| 1 | Repair Step 3 verification layout | PASS | R1346 contract + desktop/mobile browser gate |
| 2 | Continue-with-profile local feedback/transition | PASS | R1346 no-silent-click gate |
| 3 | Reset-request visible acknowledgement | PASS | R1346 browser + durable async rule |
| 4 | Reset-completion visible success / exact-profile return | PASS | R1346 browser + durable async rule |
| 5 | Password minimum 12 → 8 frontend/backend | PASS | frontend + runtime tests |
| 6 | Claim CTA stronger than Official website | PASS | R1346 visibility gate + R1347 public-profile browser |
| 7 | Profile Access hero clarifies public profile | PASS | R1346 permanent test |
| 8 | Four-step tracker has real current/completed/future semantics | PASS | R1346 permanent test/browser |
| 9 | Wrong-profile search is secondary | PASS | R1346 permanent test |
| 10 | Selected profile more obvious | PASS | R1346 permanent test/browser |
| 11 | Step-3 heading names selected profile | PASS | R1346 permanent test/browser |
| 12 | Community Membership optional/later | PASS | R1346 + authority routing |
| 13 | Duplicative correction links reviewed | PASS | useful routes retained with differentiated wording; correction/removal remain free |
| 14 | Password-reset sender identity reviewed | REVIEW COMPLETE — NO CHANGE | current authenticated working sender retained until replacement sender authentication/deliverability is verified |
| 15 | Durable “NO SILENT CLICKS” rule | PASS | dedicated durable rule + permanent workflow gate |

All “Preserve verified working behaviors” items remain protected by the R1342/R1344/R1345/R1346/R1347 permanent suite.

## Whole-site Roger Rule added in R1347

The owner expanded the standard during this audit:

> no regression to previous-version functionality for the entire site; nothing that is supposed to remain visible may be buried in future versions unless Roger explicitly directs the change.

R1347 implements that as:
- `DURABLE_ROGER_RULE__SITEWIDE_NO_REGRESSION_AND_NON_BURIAL.md`;
- `SITEWIDE_PRESERVATION_BASELINE__R1347.json`;
- `tests/r1347-sitewide-roger-rule.cjs`;
- the prior recent-fix/authority/claim-path tests;
- exact-head controlled browser gates for both September command sets.

The route baseline protects **260 non-profile public HTML routes**, plus a minimum profile scope of **19,104** and Assistant route scope of **254**, subject only to explicit Roger-authorized changes or legitimate source-authority profile corrections/suppressions.

## Remaining evidence-dependent item

The combined audit found one stale public-help contradiction before final qualification: `/member-support/` still said an unverified user could check access-review status in Profile Center. R1347 corrects that text to Profile Access, explicitly says Profile Center is for verified managers, labels the public Profile Center link `Already verified? Profile Center`, and permanently regression-gates the wording/route in both source and controlled-browser tests.

There is no unresolved product-code blocker from either command after that repair. The reset sender naming question is intentionally not changed because the requirement was to review it without casually disrupting SPF/DKIM/DMARC/deliverability. A future sender change requires verified Franklin transactional-sender evidence.

SCC acceptance/current-pointer remains independently governed and is not self-asserted by Local.

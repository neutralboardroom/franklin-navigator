# Durable Roger Rule — Sitewide No Regression and Non-Burial

**Owner:** Roger Gillman  
**Applies to:** Franklin Navigator Local Community Platform and every future material Franklin Navigator version unless Roger explicitly directs a specific change.

## Roger Rule

Every future Franklin Navigator build must preserve the **entire currently accepted site and its working functionality**, not only the feature being changed and not only the most recent fixes.

A future builder may change, remove, replace, demote, hide, reroute, or retire existing functionality **only when Roger explicitly directs that specific change**. General instructions to “improve,” “modernize,” “clean up,” “simplify,” “refactor,” or build a next version do not authorize loss or burial of accepted functionality.

## What “preserved” means

A feature is not preserved merely because:
- some old code still exists;
- an old route still resolves;
- a string can be found in source;
- a button exists below the fold but is no longer naturally discoverable;
- a workflow technically succeeds while the user-visible action became confusing;
- a replacement exists somewhere else without an intentional, understandable path.

Preservation means the applicable user can still **see it, understand it, reach it, use it, and complete its intended task** with the expected authority, security, privacy, accessibility, responsive, localization, and payment behavior intact.

## Permanent requirements

Every future material release must:

1. use the newest authoritative accepted Franklin version as the exact predecessor and never silently roll back to older assumptions;
2. preserve all accepted public routes unless Roger explicitly authorizes a specific removal/replacement;
3. preserve all accepted profile data/current profile scope unless an authorized profile-source correction/suppression legitimately changes it;
4. preserve all accepted account, claim, authority, correction/removal, support, membership, payment-protection, accessibility, bilingual, navigation, Assistant, directory, discovery, resident-help, business, and other site functionality not explicitly changed by Roger;
5. preserve intended visual hierarchy—primary actions must remain primary and important secondary actions must remain discoverable;
6. prevent CSS, responsive rules, dynamic scripts, localization, route changes, new components, or later releases from burying an accepted action or safeguard;
7. preserve desktop, tablet/intermediate, mobile, keyboard, focus, screen-reader-friendly labeling/status, and applicable English/Spanish behavior;
8. preserve security/privacy/authority boundaries and fail closed rather than weakening them to keep a flow working;
9. preserve exact-profile continuity and other accepted context continuity where applicable;
10. preserve no-second-charge, no-paid-authority, free-correction/removal, ordinary unpaid-ranking independence, and other accepted trust safeguards;
11. run the full current-site validator and all permanent regression gates from prior accepted releases, not only tests for the newest change;
12. run browser-level visibility/reachability checks for user-facing functionality touched by the new build and representative sitewide smoke coverage;
13. create a no-loss/non-burial receipt identifying what changed, what was intentionally unchanged, and any Roger-authorized replacement/removal;
14. fail qualification if an accepted capability is missing, broken, hidden, materially harder to reach, misleadingly demoted, routed incorrectly, inaccessible, or security/authority-regressed;
15. repair such a regression before release rather than merely listing it as future work;
16. extend, never reset, the permanent regression baseline when a newly qualified user-facing feature or safeguard is added.

## Route and scope preservation baseline

`SITEWIDE_PRESERVATION_BASELINE__R1347.json` records the accepted non-profile public route set and minimum protected profile/Assistant scope from the R1346 predecessor.

Future releases may add routes and capabilities freely. They may not remove a protected baseline route or reduce a protected baseline count unless:
- Roger explicitly directed that exact change; and
- the release receipt records the direction and any replacement/equivalent path.

If an upstream authoritative profile correction or suppression legitimately reduces profile scope, that is not treated as an unauthorized regression, but the release must document the source authority and reason.

## Permanent qualification gates

The qualification workflow must keep running:
- `scripts/validate-current-release.py`;
- the authoritative sitewide route/scope preservation test;
- `tests/r1344-recent-fix-visibility.cjs`;
- `tests/r1345-profile-access-authority-routing.cjs`;
- `tests/r1346-claim-path-outreach-readiness.cjs`;
- `tests/r1347-two-command-permanent-baseline.cjs`;
- `tests/r1347-sitewide-roger-rule.cjs`;
- applicable controlled-browser acceptance tests;
- runtime tests/checks for the separately deployed Local runtime.

A future builder must not weaken or delete these gates simply to make a release pass. Updating a gate is allowed only to reflect a Roger-authorized behavior change while preserving equivalent coverage.

## Relationship to earlier durable rules

This rule **expands** the earlier Owner-Approved Fix Visibility and Non-Burial rule. The earlier rule remains valid. This Roger Rule adds whole-site preservation: every accepted Franklin capability is protected unless Roger explicitly changes it.

**Default for future builders: no regression, no burial, no silent removal, no changes for the sake of changes.**

# Durable Rule — Owner-Approved Fix Visibility and Non-Burial

Applies to Franklin Navigator and future Local Community Platform releases unless Roger explicitly changes it.

## Standard

A user-facing fix, safeguard, action, label, route, recovery path, or other owner-approved improvement is **not preserved merely because its code still exists**.

It is preserved only when the intended user can still **see it, understand it, and naturally reach or use it in the normal journey**.

Future material releases must therefore:

1. preserve owner-approved high-value fixes from prior qualified releases;
2. keep primary actions visually prominent when they are meant to be primary;
3. prevent later layout, styling, responsive behavior, terminology, localization, routing, or dynamic scripts from burying or displacing them;
4. keep free correction/removal/claim and other trust safeguards readily reachable where applicable;
5. maintain English/Spanish parity for applicable public actions;
6. regression-test visibility/reachability, not only string/code presence;
7. audit at least the recent release window and any older durable fix touched by the change;
8. fail qualification when a required visible/reachable fix is missing, obscured, mislabeled, or routed into the wrong journey;
9. repair the regression before release rather than merely listing it for a later version;
10. extend the permanent regression gate whenever a new owner-approved user-facing fix is introduced.

The permanent qualification tests include `tests/r1344-recent-fix-visibility.cjs`, `tests/r1345-profile-access-authority-routing.cjs`, `tests/r1346-claim-path-outreach-readiness.cjs`, `tests/r1347-two-command-permanent-baseline.cjs`, and `tests/r1347-sitewide-roger-rule.cjs`, or their authoritative successors. The current gate covers R1335 forward plus the whole-site preservation baseline and must continue forward rather than resetting to a narrower window.

This rule does not require every secondary action to be visually equal to the primary action. It requires hierarchy to match the intended user task and prevents important fixes from becoming technically present but practically hidden.


## Whole-site Roger Rule successor

The broader durable owner rule `DURABLE_ROGER_RULE__SITEWIDE_NO_REGRESSION_AND_NON_BURIAL.md` is now authoritative for **all accepted Franklin Navigator functionality**, not only recent owner-approved fixes.

This earlier rule remains active as a focused visibility/non-burial requirement. Future builders must satisfy both rules. A feature outside the recent-release window is still protected by the whole-site Roger Rule and may not be removed, hidden, demoted, broken, or made materially harder to reach unless Roger explicitly directs that specific change.

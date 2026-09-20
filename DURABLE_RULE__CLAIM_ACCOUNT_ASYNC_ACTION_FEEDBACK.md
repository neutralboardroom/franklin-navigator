# Durable Rule — Claim and Account Async Action Feedback

Applies to Franklin Navigator claim, account-access, password-recovery, and management-authority journeys unless Roger explicitly changes it.

## NO SILENT CLICKS

A consequential asynchronous action is not considered successful UX merely because the backend request succeeded. The user must receive visible, local, accessible feedback and understand the next state without hunting elsewhere on the page.

Every applicable async action must:

1. show an immediate loading/pending state at or beside the action;
2. disable or otherwise prevent accidental duplicate submission while pending;
3. show success or failure at or near the action that initiated it;
4. replace or clearly advance the old state after success rather than leaving a stale form/button that looks actionable;
5. keep errors understandable, privacy-safe, and actionable, with Retry or Get help when appropriate;
6. scroll/focus the new task or result into view when it would otherwise be outside the current viewport;
7. use accessible status/live-region and focus management;
8. preserve exact-profile context across sign-in, recovery, connection, verification, and return links;
9. preserve account-enumeration privacy and existing authentication/reset-token protections;
10. regression-test the visible transition, not merely the network response.

Current covered actions include password-reset request, password-reset completion, profile connection, and management-authority request submission. Future consequential claim/account async actions inherit this rule and must be added to the permanent regression gate.

This rule does not authorize automatic membership checkout, profile authority, public-fact changes, or payment. Those remain separately gated.

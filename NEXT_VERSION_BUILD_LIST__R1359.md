# NEXT VERSION BUILD LIST — FRANKLIN NAVIGATOR

Started: 2026-09-22
Current deployed baseline: `FR-NAV1.30.58-HF3.13.40`
Owner live-review continuation: findings continue from the prior 192-item review.

This is the running owner-observed list for the **next material Local Community Platform version**. Do not implement merely for novelty. Preserve the whole-site no-regression/no-burial rule. Each new finding should be verified against the live deployed path and then dispositioned as FIX / PRESERVE / DEFER / NOT-REPRODUCED with evidence.

## Finding #193 — Assistant submit scroll position lands too low

**Owner evidence:** live Franklin Navigator screenshot, 2026-09-22.

**Observed behavior:** after entering a question in Franklin Assistant and pressing Enter, the page automatically scrolls too far down into the generated response. The viewport can land near the lower portion of the answer/action area, while the user's submitted question and the beginning of the Assistant answer are above the visible screen. The user then has to manually scroll upward to read the question and answer from the beginning.

**Desired outcome:** submitting a question should leave the user at a useful reading position where the just-submitted question and the beginning of the new Assistant answer are visible without requiring a corrective upward scroll.

**Implementation direction:**
- audit all post-submit focus, `scrollIntoView`, anchor, hash, response-render, and focus-management behavior in the Franklin Assistant flow;
- do not auto-scroll to the bottom of a newly rendered answer merely because action buttons/checklists are appended;
- after submit, prefer positioning the viewport at the submitted question / top of the new answer, with enough header offset that the first answer lines are not hidden by the sticky navigation;
- preserve keyboard submission and accessibility focus semantics without causing a second jump after streaming/render completion;
- prevent later-rendered cards, checklists, citations, or action controls from stealing focus or changing the user's scroll position unless the user explicitly activates them;
- verify desktop and mobile behavior, long and short answers, streamed and non-streamed answers, Enter submission and button submission, and answers containing checklists/action cards.

**Acceptance criteria:**
1. Pressing Enter on a question does not land the viewport at the lower part of the answer.
2. The submitted question remains visible or immediately adjacent to the top of the viewport.
3. The beginning of the new answer is visible without manual upward scrolling.
4. Sticky-header offset is respected.
5. No second scroll jump occurs when answer enhancements/cards finish rendering.
6. Keyboard focus remains accessible and predictable.
7. Existing Assistant functionality, saved checklists, My Franklin actions, citations, and answer content remain unchanged unless required for this fix.

**Priority:** P1 UX / Assistant readability.

**Status:** OPEN — owner-observed live defect.


## Finding #194 — Authorized Franklin administrator is trapped in stale pending access instead of reaching profile editing

**Owner evidence:** live Franklin Navigator screenshots, 2026-09-22, exact official Franklin Navigator profile `FR-ORG-b00c0ace7943973c`.

**Observed behavior:** the signed-in authorized Franklin account is shown `Access request pending` / `Waiting for review` for the official Franklin Navigator profile and cannot reach Profile Center or any full edit/manage screen. The same product now says this official profile uses protected administrator access and ordinary public claims are not accepted, so an old ordinary pending request can leave the real administrator trapped in a state that no longer represents the intended authority model.

**Desired outcome:** an authorized protected Franklin administrator must have a clear, auditable path to manage the official Franklin Navigator profile without relying on an ordinary public claim or ordinary self-review. A stale legacy pending claim must not block protected administrator access.

**Implementation direction:**
- create or complete a distinct protected-administrator management path for the official Franklin Navigator profile;
- recognize an already-authorized protected administrator separately from ordinary profile claim status;
- do not let a legacy ordinary `PENDING` representation request override protected administrator entitlement;
- provide an explicit `Open Profile Center` / `Manage Franklin Navigator profile` action when protected administrator authority is valid;
- preserve fail-closed security, audit logging, verified-email/session controls, and the prohibition on ordinary reviewer self-approval;
- migrate, retire, or clearly quarantine obsolete pending ordinary claims for the protected official profile so they cannot keep controlling the UI;
- verify that ordinary visitors still cannot claim the official platform profile.

**Acceptance criteria:**
1. Authorized protected Franklin administrator can reach the profile-management/editing workspace.
2. No ordinary public claim approval is required for that protected administrator path.
3. A stale pending ordinary claim cannot hide or block the protected admin management action.
4. Ordinary visitors remain unable to claim the official Franklin Navigator profile.
5. Audit/security boundaries remain fail-closed and review history is preserved.
6. The user can return from Profile Center to the exact public profile.

**Priority:** P0 profile-management blocker.

**Status:** OPEN — owner-observed live defect.

## Finding #195 — Reviewer workspace CTA is confusing beside the user's own pending request

**Owner evidence:** same live screenshots, 2026-09-22.

**Observed behavior:** the page shows `Open secure reviewer workspace` directly below the owner's own pending profile-access request. The runtime correctly forbids ordinary self-review, but the UI does not explain that this reviewer workspace cannot be used to approve the user's own request. This makes the obvious next action look like a path to unblock the request when it is actually a dead end for self-approval.

**Desired outcome:** make reviewer-role access and claimant-role status unmistakably separate.

**Implementation direction:**
- when the current account is both a reviewer and the claimant on the visible request, show a concise warning that reviewers cannot decide their own access request;
- do not present the reviewer CTA as the natural continuation of the pending claim;
- if protected administrator access exists, route to that distinct management path instead;
- preserve reviewer workspace availability for unrelated requests.

**Acceptance criteria:**
1. The UI explicitly states that the user cannot review/approve their own request.
2. Reviewer access remains available for unrelated queue work.
3. The page offers the correct next action for managing the official profile instead of implying self-review.
4. No security weakening or role conflation is introduced.

**Priority:** P1 clarity/security UX.

**Status:** OPEN — owner-observed live defect.


## Finding #196 — Verified profile managers should not require manual reviewer approval for every ordinary owner-controlled update

**Owner evidence:** live correction/profile-management walkthrough, 2026-09-22.

**Observed behavior:** the current model sends factual corrections for review before public update; profile photo/logo submissions also require approval; richer member content is saved privately and then submitted for review before publication. This means even a verified manager cannot simply maintain ordinary owner-controlled profile information in real time.

**Problem:** requiring a human reviewer for every ordinary change does not scale and weakens the value of verified profile management. It also makes "Manage your Franklin profile" feel like a request form rather than a true management workspace.

**Desired outcome:** after management authority is verified, ordinary owner-controlled profile information should be self-service with audit/version safeguards, while higher-risk, disputed, canonical/source-backed, regulated, safety-sensitive, or identity-critical fields remain review-gated.

**Implementation direction:**
- create a clear field-authority model separating:
  - `VERIFIED_MANAGER_DIRECT` fields that a verified manager may publish immediately;
  - `AUTOMATED_CHECK_THEN_PUBLISH` fields/media that may publish after machine validation/safety checks unless flagged;
  - `HUMAN_REVIEW_REQUIRED` fields that remain review-gated;
  - `PROFILE_FACTORY_CANONICAL` facts that cannot be silently overwritten by member edits;
- likely direct-manager fields should include ordinary owner-controlled business/profile content such as public description, current hours, service area, public phone, public website, contact/booking/quote/menu/order links, languages/accessibility notes, and similar first-party operational details where appropriate;
- preserve provenance by labeling manager-provided information distinctly from source-backed canonical facts;
- maintain immutable version history, actor/account identity, timestamp, prior value, rollback/revert, and abuse/dispute handling;
- use automated URL/media/content validation and flag suspicious or policy-sensitive changes for review rather than reviewing every clean update manually;
- keep identity-critical fields, legal/regulatory credentials, protected official/government profiles, disputes, removal/suppression, ownership changes, and other high-risk changes under explicit review;
- allow owner/admin policy configuration for which field classes are direct versus reviewed;
- do not make paid membership a condition of factual accuracy or ordinary verified-manager maintenance.

**Acceptance criteria:**
1. A verified ordinary profile manager can make at least the approved low-risk owner-controlled changes without waiting for a human reviewer.
2. The public profile clearly distinguishes manager-provided content from independently sourced/canonical facts where that distinction matters.
3. Every direct change has immutable audit/version history and can be reverted.
4. High-risk/canonical/disputed changes remain fail-closed and review-gated.
5. Automated validation catches malformed URLs, unsafe media/content, and obvious policy violations before publication.
6. Human reviewers receive only exceptions/high-risk changes rather than every routine update.
7. Free basic profile management remains free.

**Priority:** P0 scalability / profile-management value.

**Status:** OPEN — owner-observed workflow/design issue.

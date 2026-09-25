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

**Status:** CLOSED_LIVE_VERIFIED — owner-observed live defect.


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

**Status:** CLOSED_LIVE_VERIFIED — owner-observed live defect.

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

**Status:** CLOSED_LIVE_VERIFIED — owner-observed live defect.


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

**Status:** CLOSED_LIVE_VERIFIED — owner-observed workflow/design issue.


## Finding #197 — Correction submission uses a browser-native confirmation dialog that interrupts the workflow

**Owner evidence:** live Franklin Navigator screenshot, 2026-09-22, after clicking `Submit free correction request`.

**Observed behavior:** submitting a correction triggers the browser-native modal `Submit this correction for this exact profile?` with generic OK/Cancel controls. The current source uses `window.confirm(...)`.

**Problem:** this interrupts the flow, looks unlike the rest of Franklin Navigator, provides no useful summary of what will be submitted, and can be confusing because the form already has a clearly labeled submit button. It also gives us little control over accessibility, wording, focus handling, mobile presentation, or error recovery.

**Desired outcome:** use a clear in-page confirmation/review step for consequential submissions, or submit directly when the action is already unambiguous and reversible. Do not rely on browser-native `window.confirm` for this workflow.

**Implementation direction:**
- remove the native `window.confirm` call from correction/removal submission;
- for corrections, prefer either direct submission with a strong success/undo/status path, or an in-page review panel that summarizes the exact profile, correction category, current value, requested value, and evidence link before final submission;
- for public-removal requests, retain an explicit higher-friction in-page confirmation because removal is more consequential;
- preserve exact-profile binding and prevent accidental cross-profile submission;
- keep keyboard/focus behavior accessible and prevent scroll jumps;
- provide clear disabled/loading state after final submit to avoid duplicate submissions.

**Acceptance criteria:**
1. No browser-native OK/Cancel dialog appears for correction submission.
2. The user can clearly see what profile and change are being submitted.
3. Removal requests retain appropriate explicit confirmation without a browser-native modal.
4. Keyboard, screen-reader, mobile, and focus behavior remain predictable.
5. Duplicate submission is prevented while a request is processing.
6. The success screen clearly states that the request was received and what happens next.

**Priority:** P1 UX / submission clarity.

**Status:** CLOSED_LIVE_VERIFIED — owner-observed live defect.


## R1359 build disposition — 2026-09-22

All five live-review findings #193–#197 are implemented in the R1359 candidate and are awaiting/under qualification and deployment. They are not considered CLOSED until exact-source qualification and live smoke verification pass.

- #193: Assistant now repositions at the submitted question / start of answer with sticky-header offset and prevent-scroll focus.
- #194: protected Franklin administrator binding reconciles stale ordinary pending state without ordinary self-review.
- #195: reviewer workspace is explicitly separated from the claimant's own request.
- #196: verified managers receive direct low-risk profile maintenance with provenance, version history and rollback; high-risk/canonical facts remain review/source controlled.
- #197: native browser correction/removal confirmation replaced by an in-product review step with duplicate-submit protection.


## R1359 live closeout — 2026-09-22

Findings #193–#197 are **CLOSED_LIVE_VERIFIED** for `FR-NAV1.30.59-HF3.13.41`.

Public and runtime successors are live; inherited no-regression/profile/claim/Assistant gates, deterministic exact-source packaging, and fresh-extraction validation passed. Limited monitored real outreach is authorized through `OUTREACH_READY_HANDOFF__R1359.md`.

The next newly observed Local Community Platform issue becomes **Finding #198**.


## Finding #198 — Duplicate public profiles for The Factory at Franklin create claim ambiguity

**Owner evidence:** live signed-out Franklin Navigator directory screenshot, 2026-09-23, search query `the factory at`.

**Observed behavior:** the search results show two apparent profiles for the same real-world entity:
- `The Factory at Franklin` — Shopping / Entertainment / Venue — `230 Franklin Rd, Franklin, TN 37064` — marked Exact address.
- `The Factory At Franklin` — Music Venue — source coordinates `35.924172, -86.870895`, with no street address supplied.

Both appear as independent profile cards.

**Problem:** this creates uncertainty for a first-time business owner about which profile is authoritative and which one to claim/manage. It can split public facts, management state, paid membership, analytics, corrections, links, and future enrichment across duplicate identities.

**Desired outcome:** one canonical public profile per real-world entity, with duplicate/alternate source records reconciled behind it.

**Implementation direction:**
- deterministically reconcile probable same-entity records using normalized name, exact/near-identical location, source coordinates/address, official website/contact evidence and other identity evidence;
- preserve all source provenance and aliases internally;
- select one canonical profile ID/public URL;
- redirect or suppress duplicate public routes/cards rather than deleting evidence;
- merge complementary category/source facts conservatively without inventing facts;
- ensure claim/management, corrections, membership, analytics and public links bind only to the canonical profile;
- add a duplicate-detection gate to Profile Factory ingestion and Local Community Platform publication/search;
- fail closed on ambiguous non-identical entities and send uncertain cases to review rather than auto-merge.



**Corpus audit added 2026-09-23:** automated scan of the qualified R1359 discovery corpus (19,103 records) found:
- 679 normalized same-name groups overall. Many are legitimate chains/multi-location entities, so this number is **not** a duplicate count.
- 26 high-confidence duplicate groups (52 records) with the same normalized entity name and the same normalized public address.
- 78 same-name groups where one record carries technical/no-address provenance text and another carries an ordinary public location/address; these require entity-resolution review. The Factory at Franklin is in this class.
- 103 unique groups are captured by those two higher-confidence candidate rules combined (one group overlaps both rules).

Examples of high-confidence same-name/same-address duplicate candidates include Joel Moenkhoff - State Farm Insurance Agent, Battle Mountain Farm, The Heritage at Brentwood, Woops, North Arrow Coffee Company, SilverBrook Property Restoration, Williamson County Parks & Recreation, Franklin Polo Academy, Mill Creek Brewing Co., and The Clothes Tree Nashville.

This confirms the Factory case is not isolated. The fix must be corpus-wide and must distinguish legitimate multi-location chains from actual duplicate identities.
**Acceptance criteria:**
1. Search for `The Factory at Franklin` shows one canonical business profile, not two competing profiles.
2. The canonical public profile retains the best supported address/category/source evidence from both records.
3. Any duplicate public URL redirects or clearly resolves to the canonical profile.
4. Claiming/managing the entity cannot create separate authority or membership state on a duplicate.
5. The same dedupe rule is applied across the broader Franklin profile corpus, not only this one example.

**Priority:** P0 outreach / profile identity / claim-path clarity.

**Status:** IMPLEMENTED_CANDIDATE — owner-observed during first-time-user outreach smoke test.


## Finding #199 — Internal/provenance/technical source text is leaking into public profile location and About content

**Owner evidence:** signed-out live directory/profile review, 2026-09-23. The duplicate `The Factory At Franklin` profile publicly displays `Source coordinate 35.924172, -86.870895; no street address supplied` as its location and repeats that sentence inside the generated About copy.

**Confirmed source behavior:** the qualified R1359 exact-source profile page for `FR-ORG-adba2e46b06e6112` renders that raw provenance string directly in the profile hero and About paragraph.

**Corpus audit:** automated scan of all 19,103 R1359 discovery records found **at least 1,739 records** whose public location field contains internal/provenance-style wording matching one or more patterns such as:
- `Source coordinate …; no street address supplied`;
- `street address not asserted in this release`;
- `exact coordinates retained`;
- internal Profile Factory release references such as `PF68`, `PF69`, `PF70`, `PF71`;
- `assigned community`;
- `Current named member/resource …`;
- `Public IRS filing address geocoded in Williamson County …`;
- other source-processing language intended for provenance, not end users.

The 1,739 count is a lower-bound pattern audit, not a claim that every one of those records has identical wording.

**Problem:** internal ingestion/provenance language is being used as customer-facing location/about text. It makes profiles look unfinished or machine-generated, can expose implementation vocabulary, and is especially damaging during first-time claim/member outreach.

**Desired outcome:** provenance remains available in Sources & listing details / internal evidence, while public location and About copy use clean resident/business-facing language only.

**Implementation direction:**
- split internal provenance/evidence fields from public display fields at publication time;
- never render raw source-processing notes as the profile location or as generated About prose;
- when no verified street address is available, show a neutral public fallback such as `Franklin, Tennessee`, `Williamson County, Tennessee`, or omit the street-address line entirely as appropriate;
- coordinates may support maps/entity resolution internally but should not be shown as prose unless a user explicitly asks for coordinates;
- strip Profile Factory/internal release identifiers and phrases such as `PF68`, `assigned community`, `street address not asserted in this release`, and similar workflow language from public pages;
- preserve the original provenance unchanged in the evidence/source layer;
- add a publication-time public-language lint gate covering profile cards, profile hero location, generated About copy, structured metadata and search snippets;
- audit and repair all currently affected records, not only The Factory.

**Acceptance criteria:**
1. The Factory duplicate/canonicalized profile no longer exposes raw coordinate/provenance prose publicly.
2. No public profile/card/About text contains Profile Factory release IDs or internal ingestion phrases.
3. Records without a verified street address use a clean public fallback or omit the address rather than displaying source-processing notes.
4. Provenance remains available to the system/reviewer and, where appropriate, in a user-readable Sources section.
5. A corpus-wide automated gate blocks recurrence.

**Priority:** P0 outreach / public trust / profile quality.

**Status:** IMPLEMENTED_CANDIDATE — owner-observed and corpus-confirmed during first-time-user outreach smoke test.


## Finding #200 — First-time claim page asks for account creation before explaining what management verification will require

**Owner evidence:** signed-out live claim-path screenshots, 2026-09-23, exact profile `The Factory at Franklin`.

**Observed behavior:** the page clearly preserves the selected profile and shows the four-step path (`Exact profile → Account → Verify management → Profile Center`). The current Account step asks for name, email and password and notes that a work/organization email can make verification easier. However, it does not explain before account creation what the next `Verify management` step will ask the user to do, what kinds of evidence may be accepted, or that the user should proceed only if actually authorized to manage the selected profile.

**Problem:** a first-time business owner reached from outreach is asked to create an account before knowing the expected verification burden. That uncertainty can cause avoidable abandonment or encourage an unauthorized visitor to continue farther than intended.

**Desired outcome:** before the user creates/signs into an account, give a short, plain-language preview of the next step without overloading the page.

**Implementation direction:**
- add a compact `What happens next` panel beside/below the Account step;
- state that the user should continue only if authorized to manage the selected business/organization;
- explain that the next step confirms the relationship and may use a work/organization email and/or other reasonable evidence depending on the profile;
- state that no payment or Community Membership is required for verification/basic management;
- avoid promising instant approval or a fixed review time unless guaranteed;
- preserve the exact-profile selection through account creation/sign-in.

**Acceptance criteria:**
1. A first-time user understands the verification expectation before creating an account.
2. The page explicitly says to continue only if authorized to manage the selected profile.
3. Free profile access remains clearly separate from paid Community Membership.
4. No unsupported timing/approval promise is shown.
5. The selected exact profile remains visible throughout the account step.

**Priority:** P1 outreach conversion / trust / claim clarity.

**Status:** IMPLEMENTED_CANDIDATE — owner-observed during first-time-user smoke test.


## Finding #201 — Account-mode feedback appears off-screen and automatic create→sign-in switching is not obvious

**Owner evidence:** signed-out first-time claim-path test, 2026-09-23, exact profile `The Factory at Franklin`.

**Observed behavior:** after entering an existing Franklin account email in the account-creation flow, the backend correctly returns `ACCOUNT_ALREADY_EXISTS`. The client automatically changes `accountMode` from `register` to `login` and displays `An account already exists for this email. Sign in or reset your password.` However, the status message is rendered near the top of the page while the user remains lower in the form and must manually scroll upward to discover what happened.

**Confirmed source behavior:** `membership-live.js` handles `ACCOUNT_ALREADY_EXISTS` by setting `state.accountMode='login'`, preserving the email, and setting a top-level `state.message`. The subsequent `rerender()` does not focus or scroll the account form/message into view.

**Problem:** a first-time user can reasonably think the form did nothing or failed. Because the interface also silently switches from Create account to Sign in, the user may misinterpret the message as a failed login rather than a helpful account-detection transition.

**Desired outcome:** account-transition/error feedback should remain adjacent to the form/action that caused it and be immediately visible without manual scrolling.

**Implementation direction:**
- when an existing account is detected, move/focus the user directly to the Sign in form or an inline account-status panel;
- say explicitly: `We found an existing Franklin account for this email. We switched you to Sign in.`;
- preserve the entered email but never preserve/expose a create-password value into the login form;
- provide visible `Forgot password?` and account-help actions in the same viewport;
- for login errors, keep feedback next to the login form and focus it accessibly rather than rendering only at the page top;
- avoid large scroll jumps; respect sticky-header offset and mobile/keyboard behavior;
- apply the same local-feedback pattern to account creation, login, password recovery and other claim-path form errors.

**Acceptance criteria:**
1. Existing-account detection automatically reveals the Sign in form in the current viewport.
2. The user is explicitly told that the interface switched from Create account to Sign in.
3. No manual scrolling is needed to discover the result of account submission.
4. Login errors are displayed/focused adjacent to the login form.
5. Exact-profile selection remains preserved through the transition.
6. Keyboard and screen-reader focus moves predictably without hiding content beneath the sticky header.

**Priority:** P1 outreach conversion / account access clarity.

**Status:** IMPLEMENTED_CANDIDATE — owner-observed and source-confirmed during first-time-user smoke test.


## Finding #202 — Reviewer workspace intrudes into an unrelated ordinary profile-claim path for privileged accounts

**Owner evidence:** signed-in live claim-path screenshot, 2026-09-23, selected profile `The Factory at Franklin`.

**Observed behavior:** after successful sign-in, the owner/reviewer account remains on the ordinary profile-access flow with The Factory at Franklin selected, but the Account section prominently shows `Open secure reviewer workspace` and `Private reviewer access is available for this authorized account` before the selected-profile verification workflow.

**Confirmed source behavior:** `membership-live.js` shows the generic reviewer-workspace CTA whenever `state.me.reviewerAccessAvailable===true`. The R1359 role-separation copy only becomes profile-specific when the selected profile is already present in `profileLinks`. For a newly selected unrelated profile with no existing link/request, the generic reviewer CTA remains visible.

**Problem:** reviewer/admin capability is leaking into the ordinary claim journey and can imply that reviewer access is a legitimate way to progress a claim for an unrelated business. It also prevents privileged accounts from experiencing a clean ordinary-user claim path.

**Desired outcome:** reviewer tools remain clearly separate from profile claiming and do not appear as part of the ordinary profile-access task.

**Implementation direction:**
- suppress the reviewer-workspace CTA inside the ordinary claim/verification task when the selected profile is unrelated to an existing reviewer assignment;
- provide reviewer access from a dedicated reviewer/admin navigation surface instead of embedding it in the claimant account card;
- if reviewer access must remain reachable, place it in a clearly separated `Reviewer tools — unrelated to this claim` area after the ordinary task, never before the verification action;
- maintain the self-review prohibition and do not let reviewer privileges bypass profile authority verification;
- add regression coverage for a reviewer/admin account selecting a third-party ordinary profile.

**Acceptance criteria:**
1. A reviewer/admin selecting an unrelated public profile sees the same ordinary claim/verification task as a normal account.
2. Reviewer tools are not presented as a next step in the selected profile's claim flow.
3. Reviewer privileges cannot bypass authority verification or approve the account's own request.
4. Dedicated reviewer access remains available outside the ordinary claim task.
5. A regression test covers reviewer account + unrelated selected profile.

**Priority:** P1 security UX / role separation / claim clarity.

**Status:** IMPLEMENTED_CANDIDATE — owner-observed and source-confirmed during first-time-user smoke test.


## Finding #203 — “Continue with this profile” creates an unverified account-profile link before proof, but the UI does not explain the distinction

**Owner evidence:** signed-in live claim-path screenshots, 2026-09-23, selected profile `The Factory at Franklin`.

**Observed behavior:** Step 3 is labeled `Verify management — Current`, but the visible primary action is `Continue with this profile` with status copy `Ready to connect this exact profile.` The page does correctly say that selecting the profile does not claim it or change public facts. However, the next action performs a separate account-profile connection before the actual proof form is shown.

**Confirmed source behavior:** `membership-live.js` posts `/api/profile-links` when `Continue with this profile` is clicked, refreshes account state, then focuses the later verification heading. The actual authority request is a separate subsequent form posting to `/api/member/representation/request` with evidence URL, authority statement and required authority confirmation. Profile Center is not enabled merely by the first connection action.

**Problem:** the security boundary is technically present, but the terminology can make a first-time user think `Continue with this profile` is itself the claim/verification action. It also creates persistent unverified relationship state before the user has seen or agreed to the proof requirements.

**Desired outcome:** make the intermediate state explicit and minimize unnecessary persistent linkage before authority verification.

**Implementation direction:**
- rename the primary action to something explicit such as `Start management verification`;
- state directly beside it: `This does not give you control of the profile. Management starts only after Franklin verifies your authority.`;
- if technically practical, defer persistent account-profile linkage until the user begins/submits the verification form, or treat the pre-verification selection as ephemeral rather than an ownership-like relationship;
- if an unverified link must be persisted, label it clearly as `verification started / no management access` and provide a simple way to cancel/remove it;
- ensure unverified links cannot affect profile management, membership, ranking, public facts, analytics ownership or reviewer self-approval;
- retain the exact-profile selection through verification.

**Acceptance criteria:**
1. The primary Step 3 action explicitly says it starts verification rather than implying management is granted.
2. The page states that no profile control is granted until authority is verified.
3. Any persisted pre-verification link is clearly marked unverified and has no management/payment/public-fact authority.
4. The subsequent proof form remains required before a request can enter review.
5. Profile Center stays inaccessible until authority state is VERIFIED.

**Priority:** P1 security UX / claim-boundary clarity.

**Status:** IMPLEMENTED_CANDIDATE — owner-observed and source-confirmed during first-time-user smoke test.


## R1360 candidate disposition — 2026-09-25

Findings #198–#203 are implemented in the R1360 candidate and remain **not closed** until inherited regression, exact-source qualification, deployment and live first-time-user smoke testing pass. The outreach hold remains active.

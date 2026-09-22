# R1359 RECOVERY CHECKPOINT
Date: 2026-09-22
Builder role: LOCAL_COMMUNITY_PLATFORM
Edition: FRANKLIN_TN
Writable lane: LOCAL_COMMUNITY_PLATFORM/FRANKLIN_TN
Authoritative public base: FR-NAV1.30.58-HF3.13.40 @ b0b5f75ace66bf47b29e5a51f963756943b0b02b
Authoritative runtime base: f272ab909135886c426feccde022013e0e74fc5f
Target: FR-NAV1.30.59-HF3.13.41 / R1359
Public branch: r1359-outreach-ready-profile-management-20260922
Runtime branch: r1359-runtime-profile-management-20260922

Owner-authorized scope:
- implement live-review findings #193-#197;
- deploy the qualified successor live;
- after smoke qualification, mark real paid-member outreach ready and hand off to outreach-related builders.

Current findings:
#193 Assistant submit scroll lands too low.
#194 Protected Franklin administrator blocked by stale ordinary pending claim.
#195 Reviewer-workspace CTA is confusing beside claimant's own pending request.
#196 Verified managers need scalable direct maintenance of low-risk owner-controlled profile information, with provenance/versioning and high-risk gates.
#197 Replace browser-native correction confirmation with an in-product confirmation/review experience.

External benchmark 2026-09-22:
- Google Business Profile: verified owners/managers can edit profile information; edits may receive automated/platform review; owners/managers have differentiated access roles.
- Apple Business current management model reviewed at official Apple Business documentation.
Decision: adapt verified-manager self-service plus risk-based validation/review, not copy branding/code/data.

Preserve:
- Profile Factory remains canonical source authority.
- manager-provided fields must be separately labeled/provenanced and must not silently overwrite canonical/source-backed facts.
- factual correction/removal remains free.
- Community Membership remains optional for factual accuracy/basic management.
- ordinary self-review remains forbidden.
- protected official profile remains unclaimable by ordinary users.
- whole-site no-regression/no-burial.

Remaining work:
- public UX/code #193/#195/#197 and manager editor/public overlay;
- runtime protected-admin reconciliation and manager-direct API/history;
- regression tests, qualification, exact artifact, deployment;
- outreach-ready handoff only after deployed smoke qualification.

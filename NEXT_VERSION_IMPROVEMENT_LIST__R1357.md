# NEXT VERSION IMPROVEMENT LIST — R1357

Release: `FR-NAV1.30.57-HF3.13.39`
Date: 2026-09-22
Owner review source: live profile claim / management-path screenshot audit

The 192 audit findings from the owner review were processed in R1357 as code fixes, preserved-good behavior, regression requirements, or explicit carry-forward items. Do not reopen resolved items merely for redesign.

## Highest-priority carry-forward

1. Move the privileged reviewer workspace off the raw `*.onrender.com` hostname to a Franklin-controlled hostname once DNS/custom-domain mutation is available. Preserve the current secure backend and short-lived privileged session while changing only the trusted public/admin hostname and associated origin/CORS configuration.
2. Resume the owner live review at the next untested profile-access path immediately after R1357 is deployed. First retest the exact previously reviewed paths to confirm the visible fixes, then continue through “Wrong profile? Choose another,” approved access, declined access, request-more-information, withdrawal, revoked access, competing claimant/dispute behavior, and signed-out return/recovery.
3. Verify end-to-end evidence persistence with a specific non-homepage official evidence URL, including redirects, stale/invalid URLs, resubmitted evidence versions, and reviewer-visible destination text.
4. Verify claimant notification delivery for approve / request-more-information / decline states and record delivery failure separately from the authoritative decision state.
5. Expand reviewer queue metadata/history only where live use shows it materially reduces review error: submitted time, last-updated time, request age, verification route, existing management/dispute state, and immutable decision history.
6. Add or strengthen step-up authentication for privileged reviewer actions if the production account-authentication architecture can support it without duplicating account systems; keep password recovery ordinary-account-only and never let payment imply authority.
7. Continue structured correction fields where they materially improve review accuracy (phone, website, address, hours, closure, duplicate, category, service area) while retaining an “Other” path and without blocking ordinary free reports.
8. Verify suppression/restoration behavior against routine profile imports so an approved removal cannot be accidentally republished and a restoration requires deliberate reviewed action.
9. Continue accessibility/mobile checks for loading announcements, session-expiry warnings, decision confirmations, error recovery, and long reviewer/correction forms.
10. Preserve the durable no-regression rule: do not remove, hide, bury, or weaken working claim, correction, removal, profile-management, membership, Assistant, directory, or resident paths unless the owner explicitly directs it or a necessary documented correction requires it.

## Do not change without new evidence

- Community Membership remains optional and separate from free profile management.
- Factual corrections and public-removal requests remain free.
- Claim approval must not automatically overwrite canonical source-backed public facts.
- Public profile facts remain under their existing source authority.
- No paid ranking, endorsement, or payment-as-identity behavior.
- The official Franklin Navigator profile remains protected from ordinary public claim creation.
- Ordinary reviewer self-approval remains fail-closed.

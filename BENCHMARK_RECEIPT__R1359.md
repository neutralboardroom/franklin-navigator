# R1359 EXTERNAL BENCHMARK RECEIPT

Date reviewed: 2026-09-22
Builder role: LOCAL_COMMUNITY_PLATFORM
Edition: FRANKLIN_TN
Purpose: profile-management and paid-member outreach readiness

## Sources reviewed

1. Google Business Profile Help — "Manage your Business Profile owners & managers"
   https://support.google.com/business/answer/3403100
   Observed: verified owners/managers have direct profile-management capabilities, including editing URLs, location settings, attributes, hours, address and phone, with role-specific controls.

2. Google Business Profile Help — "Edit your Business Profile"
   https://support.google.com/business/answer/3039617
   Observed: verified businesses can edit profile information directly; Google reviews edits under platform rules and exposes edit status rather than requiring the owner to route every routine change through a bespoke human support form.

3. Google Business Profile Help — "Understand what happens to your Business Profile edits"
   https://support.google.com/business/answer/3038311
   Observed: edits may be accepted, not approved, or pending, supporting a risk/validation model rather than a single manual-review-only workflow.

4. Apple Business User Guide — "Edit or remove a single location"
   https://support.apple.com/guide/business/edit-or-remove-a-single-location-abcb7fc491ec/1/web/1
   Observed: users with appropriate roles can edit frequently changing location information such as hours, photos, actions and customer-facing facts, while removals are a distinct higher-consequence flow.

## Adopted/adapted

- Verified-manager self-service for a narrow set of ordinary owner-controlled public fields.
- Distinct authority/role gating before management tools are enabled.
- Separate treatment for higher-risk identity, ownership, regulatory, disputed and removal changes.
- Clear provenance: verified-manager updates remain distinct from Profile Factory/source-backed canonical facts.
- Immutable manager version history and rollback support.
- In-product review/confirmation for consequential correction/removal submission rather than a browser-native confirm.
- First-time path remains profile-first: exact profile -> account -> verification -> Profile Center -> management.

## Rejected/not copied

- No external platform code, data, wording, brand design or ranking logic was copied.
- Did not grant verified managers silent overwrite authority over Profile Factory canonical/source-backed facts.
- Did not make paid membership a condition of factual accuracy or basic profile maintenance.
- Did not remove human review for identity-critical, disputed, protected-official, removal or other higher-risk changes.
- Did not adopt another platform's exact role names or permissions matrix.

## R1359 decision

Adopt a conservative hybrid: low-risk manager-controlled fields can publish directly after validation with provenance/history; higher-risk and canonical fields remain fail-closed or reviewed. This materially improves first-time usability and operational scalability before paid-member outreach.

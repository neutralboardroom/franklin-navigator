# Durable Rule — Franklin Claim / Account / Recovery Outreach Baseline

Applies to Franklin Navigator and all future Local Community Platform material releases unless Roger explicitly changes a requirement.

## Source commands permanently protected

This baseline protects the owner-approved requirements from both:

1. `FRANKLIN_NAVIGATOR__LIVE_PROFILE_CLAIM_ACCOUNT_RECOVERY_FIX_PASS__LOCAL_BUILDER_COMMAND__2026-09-19`
2. `FRANKLIN_NAVIGATOR_NEXT_VERSION_CLAIM_PATH_FIX_PROMPT_2026-09-20`

A requirement is not preserved merely because an old implementation file or string still exists. It is preserved only if the intended user can still see it, reach it, understand it, and use it in the ordinary journey, with the required authority/security behavior still enforced.

## Permanent product baseline

Future builds must preserve and regression-test all applicable items below.

### Directory / profile entry
- Exact normalized profile-name matches rank before phrase, starts-with, token, and fuzzy matches.
- Claimable profiles expose a prominent `Claim or manage this profile` action near the top.
- Claim/manage is the strongest ownership CTA; `Official website` remains available but secondary on claimable profiles.
- Review/correction/removal, call, email, save/share/print and other applicable non-ownership actions remain discoverable.
- The exact profile ID deep-links directly into Profile Access and survives all normal claim/account transitions.

### Corrections / removal
- Profile-origin correction/removal keeps the immutable profile ID.
- Listing name and profile URL are prefilled/shown from the exact profile when available.
- Corrections/removal stay free, separate from claim/payment, and keep sensitive-data warnings.
- Repeated correction links must either have distinct purposes or be consolidated without making correction/removal harder to find.

### Claim search / selected profile
- Exact match remains first.
- Result cards clearly show profile identity/context and a visible primary claim/continue action.
- Selecting a result moves focus/scroll to the selected-profile panel and announces selection accessibly.
- The selected-profile panel keeps Claim/manage, Correct information, Request removal, and optional member-profile preview.
- When an exact profile is already selected, profile switching remains available but secondary behind `Wrong profile? Choose another`.

### Profile Access / account UX
- Create-account and Sign-in are visually distinct modes with accessible active-state semantics.
- Email is the account identifier; no separate username system is introduced.
- Password guidance is adjacent to the password field.
- Existing-account creation attempts do not create duplicates and route to sign-in/reset while preserving exact-profile context.
- `Forgot password?` is directly reachable from sign-in.
- Support is fallback for inaccessible email, disputed authority, unusual recovery, or account/profile conflict.

### Password recovery
- Reset request visibly loads, blocks duplicate submission, gives a generic account-enumeration-safe result, and focuses the visible result.
- Reset tokens remain short-lived, single-use, hashed at rest, rate-limited, and absent from ordinary query-string navigation/logging.
- Reset completion clears/removes the old password form, confirms success/sign-in, removes the token from the visible URL, and returns to the same exact profile.
- Password minimum is 8 characters frontend/backend, with no forced uppercase/number/symbol composition rule. Long passwords/passphrases and password managers remain supported.
- Successful reset keeps existing session invalidation/security protections.

### Management authority / Profile Center
- Connecting a profile shows local loading, prevents duplicate clicks, shows local success/failure, and scrolls/focuses the next task.
- Step 3 remains a clean vertical accessible form with full-width URL field, comfortably sized multiline authorization textarea, and separate confirmation checkbox row.
- The post-connect primary task names the selected profile: `Verify that you manage [PROFILE NAME]`.
- Management-authority submission follows the same no-silent-click rule.
- Pending/waiting status remains visible.
- Profile Access owns pre-verification claim/authority work.
- Profile Center remains unavailable until `authority_state === VERIFIED`.
- Payment/membership never creates profile authority.

### Progress / selected context
- The four-step tracker distinguishes completed, current, and future steps with semantics beyond color and updates across the journey.
- Selected profile name/type/location remain obvious.
- Exact-profile continuity survives sign-in, recovery, connection, authority request, support fallback, and verified Profile Center entry.

### Membership separation
- Claim/basic management, factual correction, and removal remain free.
- Community Membership stays optional and later in the active verification flow.
- Checkout remains hard-gated behind verified authority.
- No second charge is initiated by account recovery or duplicate-account handling.
- Historical valid subscriptions remain serviceable.

### Support
- `ACCOUNT_ACCESS` routing prioritizes account access, shows `← Back to sign in`, and provides reset-password routing while preserving exact profile where safe.
- Public support must direct pre-verification access-review status to Profile Access, not Profile Center; any Profile Center link must say it is for already-verified managers.
- Support form remains one logical field per row, responsive, labeled, keyboard-accessible, with visible submission confirmation and sensitive-data warning.
- Unsigned visitors see `Community Membership for new memberships — $35/year` (or authoritative successor pricing wording), not a statement implying that price is their current subscription.
- Actual membership state is described as current only after authenticated account-specific resolution.

### Reviews / first-party profile
- Review copy remains entity-aware.
- Franklin Navigator's first-party profile does not accept public ratings/reviews unless a later explicit owner-approved policy changes that.
- `Official Franklin Navigator profile` may remain only as a truthful first-party ownership indicator and must not imply third-party certification.

### Accessibility / responsive / language
- Desktop, tablet/intermediate, mobile, keyboard-only, visible focus, logical tab order, accessible labels/status, and route/focus transitions stay protected.
- English/Spanish parity remains required for applicable dynamic claim/account/recovery actions.
- User-facing fixes must not become hidden through CSS, layout, responsive changes, localization, stale route targets, or later dynamic scripts.

## Qualification rule

Every future material Franklin Local release must run:

- `tests/r1344-recent-fix-visibility.cjs`
- `tests/r1345-profile-access-authority-routing.cjs`
- `tests/r1346-claim-path-outreach-readiness.cjs`
- `tests/r1347-two-command-permanent-baseline.cjs`
- `tests/r1347-sitewide-roger-rule.cjs`
- the current controlled-browser claim-path acceptance test(s), including the R1347 two-command visibility acceptance or an authoritative successor.

Qualification must fail if any protected behavior becomes missing, hidden, visually demoted contrary to its task hierarchy, unreachable, mislabeled, routed to the wrong journey, or security/authority-gated incorrectly.

The permanent gate must be extended, not reset, when future owner-approved user-facing fixes are added. The broader `DURABLE_ROGER_RULE__SITEWIDE_NO_REGRESSION_AND_NON_BURIAL.md` protects accepted functionality outside this claim/account/recovery scope as well.

## Evidence-dependent exception

The password-reset sender identity may remain on the currently verified working sender until a replacement Franklin account/security transactional sender has independently verified domain authentication and deliverability. Future builders must not change the sender merely for naming preference and must not claim a new sender is safe without evidence.

# R1346 Before / After Evidence

## Step 3
Before: the shared `form-grid` layout allowed the URL field, textarea and checkbox copy to collapse into a crowded horizontal presentation.

After: Step 3 uses `.r1346-profile-access-verification`, a one-column layout with full-width URL/textarea controls, a six-row textarea with minimum rendered height, and a dedicated checkbox/text grid row.

## Continue with this profile
Before: backend success could occur while the user remained at the old scroll position and the new verification state rendered elsewhere.

After: the clicked action shows “Connecting profile…”, blocks duplicate clicks, keeps failures local, rerenders the new state, scrolls it into view and focuses “Verify that you manage [profile].”

## Password-reset request
Before: successful email dispatch could leave the page looking materially unchanged.

After: the action visibly loads, then the request form is removed and replaced by “Check your email” plus the generic account-enumeration-safe confirmation.

## Password-reset completion
Before: password reset could succeed while the old password fields/button remained visible.

After: password values are cleared, the form is removed, the reset fragment is removed from the visible URL, and a signed-in success state with “Continue to profile access” preserves the exact profile.

## Password policy
Before: frontend/backend enforced 12 characters.

After: frontend registration, frontend reset, runtime reset validation, runtime registration validation and password hashing all use an 8-character minimum; other reset/authentication protections remain.

## Profile CTA hierarchy
Before: Official website could visually outrank the ownership claim action.

After: on claimable profiles the ownership action receives the distinct R1343 gold primary treatment and the static Official website primary styling is demoted to a secondary treatment. Other profile actions remain available.

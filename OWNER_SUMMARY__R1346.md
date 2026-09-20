# R1346 Owner Summary

R1346 is the claim/account outreach-readiness repair requested after the September 20 owner walkthrough.

The badly broken Step 3 verification form has been rebuilt as a clean vertical form. Profile connection and both password-reset actions now give immediate visible feedback and replace/advance the old state instead of succeeding silently somewhere outside the viewport. Password minimum is 8 characters in both frontend and backend.

Claim/manage is now the strongest ownership CTA on claimable profiles. The Profile Access page clearly refers to the public Franklin Navigator profile, shows a real four-step progress state, keeps the selected profile obvious, collapses “choose another” behind a secondary control, and changes the main task to “Verify that you manage [profile]” after connection.

Community Membership remains optional and later. Payment still does not create management authority. Corrections/removal remain free. Profile Center remains gated behind verified management authority.

The password-reset sender review did **not** change the working sender. The runtime already supports a separate recovery-sender environment variable, but a new sender will not be substituted until its Franklin domain authentication/deliverability is verified.

A deterministic controlled-browser qualification gate produces desktop/mobile Step 3 screenshots and exercises the exact claim/recovery transition before the static release can qualify.

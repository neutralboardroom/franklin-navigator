# Franklin Navigator — Next Version Improvement List

Status: **WORKING NEXT-VERSION LIST — DO NOT EXECUTE YET**
Started: 2026-09-21
Owner instruction: keep adding to this list while the profile-path pages are reviewed together. Do not start the next version until the owner explicitly says the review is complete and authorizes the build.

## Profile path / reviewer access

1. Preserve the simplified reviewer sign-in page: **Email address + Password only**.
2. Do not restore the first-sign-in email confirmation-code field.
3. Keep **Forgot your password?** directly below the password field.
4. Password recovery must continue using a secure, single-use emailed reset link rather than a copied confirmation code.
5. Preserve the explicit authorization requirement: reviewer access is granted only to authorized Franklin accounts.
6. Preserve the short-lived privileged reviewer session; re-evaluate the current 10-minute duration only if hands-on testing shows meaningful reviewer friction.
7. Preserve the reviewer-integrity rule preventing ordinary self-review, with only the explicit first-party Franklin Navigator owner-profile exception already defined.
8. Keep the reviewer workspace clearly private and separate from ordinary claimant/profile-manager experiences.
9. Preserve the distinction that reviewer decisions are recorded and payment never proves identity or authority.
10. Keep source-backed public profile facts separate from manager/member-submitted information.
11. Preserve secure profile invitation links: invitation acceptance verifies invited inbox control only; management authority remains separately verified.
12. Preserve exact-profile continuity across invite → sign-in/account creation → access request → review → Profile Center.
13. Continue reducing unnecessary friction across the complete profile path while keeping security controls proportional to actual risk.
14. Complete and document one real end-to-end profile journey through approval, Profile Center management, optional $35/year membership purchase, and member tools before calling the path fully proven.

## Page review note — Reviewer Sign In
Reviewed 2026-09-21 from live screenshots.

Current page is substantially correct:
- No first-sign-in code field.
- Email and password fields are clear.
- Password recovery is easy to find.
- Reviewer-purpose copy is understandable.
- The page does not mix membership/payment with reviewer authentication.

No additional visual or functional change is required from this page at this time unless later walkthrough testing reveals a problem.

---
This is a living list. Add new findings from each page review before the owner authorizes the next version.


## Page review note — Reviewer Password Reset Handoff
Reviewed 2026-09-21 from live screenshot.

Current behavior is correct:
- No manually entered email confirmation code.
- The page clearly explains that password reset uses a secure single-use emailed link.
- A direct path back to reviewer sign-in is present.
- Resetting a password does not imply account creation, membership, claim approval, or payment.

Add for next version:
15. Make **Send me a secure password-reset link** a visually prominent primary button rather than a plain text link.
16. Simplify the explanatory copy to plain user language, e.g. **“Enter your Franklin account email and we’ll send you a secure one-time password-reset link.”** Avoid implementation-sounding wording such as “Franklin’s normal secure password-reset link.”
17. Preserve the current no-code recovery design and the direct **Back to reviewer sign in** escape route.


## Page review note — Main Account Recovery
Reviewed 2026-09-21 from live screenshots.

What is working and should be preserved:
- Clear single email field.
- Strong primary **Send password-reset instructions** action.
- Generic privacy-safe response language whether an account exists or not.
- Direct **Back to sign in** path.
- Separate **Can’t access your email? Get account help** escape route.
- Password reset remains independent from membership, payment, and profile-management authority.
- The recovery path is designed to preserve selected-profile continuity when recovery was started from a profile workflow.

Add for next version:
18. Remove or replace the vague status text **“Choose the recovery step below.”** when the page already knows the user is on the password-reset step. Prefer a direct instruction such as **“Enter your Franklin account email.”**
19. Make recovery-context copy conditional. The headline **“Recover your account without losing your selected profile.”** is excellent when the user arrived from a profile-management flow, but reviewer-only or generic account recovery should not imply that a profile is selected when none is present. Use context-aware language.
20. Preserve the strong primary reset button and the account-help fallback.
21. Preserve privacy-safe account-enumeration behavior: do not reveal whether an entered email has a Franklin account.


## Page review note — Password Reset Sending State
Reviewed 2026-09-21 from live screenshot.

Add for next version:
22. Avoid duplicating the transient **“Sending password-reset instructions…”** message in both the primary button and a separate status panel. Keep one clear progress indicator while the request is processing.
23. Ensure the sending state always resolves quickly to a privacy-safe success or recoverable error state and never leaves the user appearing stuck.


## Page review note — Password Reset Confirmation
Reviewed 2026-09-21 from live screenshot.

What is working and should be preserved:
- Privacy-safe confirmation: **“If an account exists for this email…”** does not disclose account existence.
- Clear **Check your email** next step.
- Explicitly says the emailed link is secure, single-use, and expires.
- No confirmation code is required.
- Account-help fallback remains available.

Add for next version:
24. Remove the duplicated **Back to sign in** and **Can’t access your email? Get account help** actions. They currently appear both above and below the confirmation card. Keep one action row, preferably below the confirmation message.
25. Keep the success state focused on the single next action: check email and use the secure reset link.


## Page review note — Full Password Reset Success Page
Reviewed 2026-09-21 from complete live-page screenshots.

Additional next-version improvements:
26. Remove the duplicate success message at the top of the page when the green **Check your email** card already communicates the same state. Keep one primary confirmation area.
27. After reset instructions are sent, collapse or replace the original reset form rather than leaving recovery-step framing above the success state. The page should become a clean completion state focused on **Check your email**.
28. Keep only one **Back to sign in** / **Can’t access your email? Get account help** action row on the success state.
29. For reviewer-origin password recovery, return users to reviewer sign-in after reset completion rather than a generic sign-in destination whenever the recovery context can be preserved safely.
30. Preserve generic privacy-safe wording and never reveal whether the submitted email is registered.


## Page review note — New Password Form
Reviewed 2026-09-21 from complete live-page screenshots.

Critical security finding:
37. The password-reset token is still visibly present in the browser address bar after the reset page loads. After the client captures and validates the fragment token, immediately remove it from the visible URL with a history replacement so the address bar becomes the clean `/account-recovery/` route. The token must remain only in in-memory client state long enough to submit the reset and must never be copied into normal links, analytics, logs, screenshots, or referrers.

Additional next-version improvements:
38. Preserve the simple two-field **New password / Confirm new password** form and the clear primary **Set new password** action.
39. Replace the vague **“Choose the recovery step below.”** status text on the token-backed reset state with a direct instruction such as **“Choose a new password.”**
40. Make the recovery headline context-aware. Do not imply a selected profile when the reset was initiated from a generic or reviewer-only flow; preserve profile-continuity language only when a profile context actually exists.
41. Preserve the current plain-language password rule: minimum 8 characters, with long passwords/passphrases welcome.
42. Add a show/hide password control for both password fields, implemented accessibly, so users can reduce typing mistakes.
43. Keep only one appropriate return action. When recovery originated from reviewer access, **Back to sign in** should return to reviewer sign-in; otherwise use the normal Franklin sign-in route.
44. Keep **Can’t access your email? Get account help** as a separate fallback rather than mixing it into the primary password-reset action.
45. After a successful reset, automatically invalidate the used token and all prior account/reviewer sessions, sign the user into the normal account only if that is the approved recovery design, and return them to the preserved origin context without forcing them to re-find a selected profile.


## Page review note — Password Reset Completed
Reviewed 2026-09-21 from live completion screenshot.

What is working and should be preserved:
- Clear success state: **Password changed successfully.**
- User is signed back into the normal Franklin account after successful reset.
- The reset does not create reviewer privileges or a reviewer session automatically.
- The selected Franklin profile context was preserved through password recovery.
- Primary continuation is clearly visible.

Add for next version:
46. When password recovery originated from the **reviewer workspace**, the primary completion action must return the user to **Reviewer sign in** rather than **Continue to profile access**. Preserve the profile context in the background, but prioritize the task the user was actually completing.
47. Remove the duplicated **Back to sign in** and **Can’t access your email? Get account help** rows around the green success card. Keep a single secondary-action row.
48. Make the completion destination context-aware:
   - reviewer-origin recovery → reviewer sign in;
   - profile-access-origin recovery → continue to profile access with exact profile preserved;
   - generic recovery → normal Franklin sign in/account destination.
49. Preserve the security boundary that a successful password reset restores the ordinary account session only; privileged reviewer access must still require an explicit reviewer sign-in.


## Page review note — Post-Reset Return to Profile Access
Reviewed 2026-09-21 from complete live-page screenshots.

What is working and should be preserved:
- After successful password reset, the user is signed into the ordinary Franklin account automatically.
- Reviewer privilege is not automatically granted; the page only exposes the separate **Open reviewer workspace** action for the authorized account.
- The account still knows the already-connected Franklin Navigator profile.
- Profile management remains explicitly free.

Add for next version:
50. Preserve the exact selected profile through password recovery more strongly. In this live return, the user landed on generic `/profile-access/` and the page showed **Find your profile**, even though the account still knew the connected Franklin Navigator profile. If recovery began from an exact profile, return directly with that exact profile selected rather than requiring another selection/click.
51. Keep the post-reset auto-sign-in behavior for the ordinary account, but ensure all prior ordinary sessions and all reviewer sessions were invalidated before issuing the fresh post-reset session.
52. Do not automatically create a reviewer session after password reset. Reviewer access must still require explicit reviewer sign-in.
53. If the user is already signed in and has exactly one connected profile relevant to the preserved recovery context, surface that profile immediately as the current selection and advance the path instead of presenting a generic **Find your profile** step.


## Page review note — Reviewer Sign-In After Normal Account Authentication
Reviewed 2026-09-21 from live screenshots.

New next-version improvement:
54. When a user reaches the reviewer workspace from an already authenticated Franklin account that is authorized for reviewer access, preserve that account identity into reviewer sign-in. Prefer a step-up flow that displays the signed-in account and asks only for the password, rather than making the reviewer retype the email address. Do not silently create reviewer access; the password re-authentication and short-lived reviewer session should remain explicit.

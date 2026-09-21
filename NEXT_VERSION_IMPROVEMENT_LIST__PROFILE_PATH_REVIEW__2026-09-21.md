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

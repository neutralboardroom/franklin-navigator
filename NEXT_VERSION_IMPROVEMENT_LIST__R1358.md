# NEXT VERSION IMPROVEMENT LIST — R1358

Release: `FR-NAV1.30.58-HF3.13.40`
Status: **REFRESHED AFTER LIVE DEPLOYMENT**

R1358 completed the executable profile-management carry-forward found during reconciliation of the prior 192 owner-review findings. Do not reopen resolved items merely for redesign.

## Remaining non-QUALIFIED_NOW item

### Franklin-controlled reviewer hostname
- **Outcome:** privileged reviewer workspace uses a Franklin-controlled hostname rather than the raw Render hostname.
- **Evidence/value:** improves trust and presentation without weakening the existing same-origin privileged boundary.
- **Disposition:** `BLOCKED_EXTERNAL_INFRASTRUCTURE`.
- **Dependency:** authorized DNS/custom-domain mutation capability; the currently connected Render controls do not expose custom-domain/DNS mutation.
- **Responsible authority:** infrastructure/domain administration.
- **Risk:** do not weaken reviewer origin/session controls merely to hide the current hostname.
- **Resume condition:** authorized custom-domain/DNS mutation becomes available.
- **Priority:** P1 infrastructure hardening.

## Owner live-review continuation

The deployed profile path should now be reviewed live by the owner. This is verification/discovery, not an asserted defect. Any newly observed defect or material improvement becomes the next numbered **Next Version Build List** item beginning at **#193**.

Recommended next live paths:
- open and edit/manage an approved profile;
- wrong-profile switching;
- pending / approved / more-info / declined / withdrawn / revoked / disputed states;
- signed-out and password-recovery return paths;
- correction and public-removal paths from an exact profile.

Do not build another version merely for this checklist; build only when new qualified findings exist or the owner explicitly directs the next build.

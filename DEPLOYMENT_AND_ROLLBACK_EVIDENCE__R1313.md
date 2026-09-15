# DEPLOYMENT AND ROLLBACK EVIDENCE — R1313

Release: FR-NAV1.30.13-HF3.12.5
Community: FRANKLIN_TN
Date: 2026-09-15

## Public static promotion

Render service: franklin-navigator
Service ID: srv-da8tg6rbc2fs73crru2g
Branch: main
Auto-deploy: off
Deployed commit: 642e139e145273e397ef745a30b47fa5482e1d50
Deploy ID: dep-dakfvarm8hqs73efilm0
Status: LIVE
Finished: 2026-09-15T08:21:17.901665Z

R1313 changes public release/currentness truth and does not remove or regress the accepted R1312 public UI.

## Membership / member-profile runtime

Render service: franklin-navigator-membership
Service ID: srv-dabgvefqj5pc739vr4h0
Branch: franklin-commerce-runtime-r30
Deployed commit: 0236a8ffe46e7b139ac1bfc57a6ba09e680f5bdd
Deploy ID: dep-dakfu9h5efls73dsjct0
Status: LIVE
Finished: 2026-09-15T08:18:07.224714Z
Runtime release: FR-NAV1.30.13-HF3.12.5

The runtime now syntax-gates the server, member-fulfillment, reviewer-console and owner preflight before startup.

## Fresh production member-path truth

Read-only preflight schema: franklin.readonly-owner-preflight.v6
Observed: 2026-09-15T08:18:04.018Z

- accepted public profile scope: 19,103
- reviewer control configured: true
- active verified rich membership profiles: 1
- active verified rich memberships inside public scope: 0
- real public member candidate available: false
- active reviewed public member publications: 0
- exact public readback receipts: 0
- owner control profile FR-TEST-SCC-OWNER-CONTROL is outside public scope and is not counted as real-member proof

Latest owner-authenticated incident snapshot at 2026-09-15T08:18:04.517Z:
- openCritical=0
- openHigh=0
- noOpenP0P1=true
- externalDelivery=RESEND_EMAIL_CONFIGURED

## Acceptance boundary

The prior full isolated claim / membership / reviewer / publication / readback acceptance remains successful (GitHub Actions run 34921029158).

R1313 does not claim production end-to-end proof for a real public profile because no active verified rich member currently exists in the 19,103-profile public scope. No fake profile, fake representative authority, real charge, or public content mutation was manufactured to satisfy that evidence requirement.

## Rollback

Static rollback target:
- deploy dep-dakfgfuk1f9s73d4vbbg
- commit e09327f1048d7c4801e08732fa494da8634d408f
- release FR-NAV1.30.12-HF3.12.4

Runtime rollback target:
- deploy dep-dakfep9594qs73dt62fg
- commit 5c097774094fcae80f4a8a39f278a413d15a7273
- release FR-NAV1.30.12-HF3.12.4

A rollback must preserve the R1312 homepage/navigation corrections, site-wide incident monitoring and external owner-alert delivery.

## Outreach boundary

No prospect outreach was sent. The Platform builder does not self-approve the independent SRE/Revenue Engine gate.

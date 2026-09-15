# DEPLOYMENT AND ROLLBACK EVIDENCE — R1312

Release: FR-NAV1.30.12-HF3.12.4
Date: 2026-09-15

## Public static promotion

Render service: franklin-navigator
Service ID: srv-da8tg6rbc2fs73crru2g
Branch: main
Auto-deploy: off
Deployed commit: e09327f1048d7c4801e08732fa494da8634d408f
Deploy ID: dep-dakfgfuk1f9s73d4vbbg
Status: LIVE
Finished: 2026-09-15T07:49:31.397692Z

The public successor includes the previously completed homepage bridge removal and inactive For Business color normalization, plus R1312 release metadata/evidence.

## Membership / monitoring runtime

Render service: franklin-navigator-membership
Service ID: srv-dabgvefqj5pc739vr4h0
Branch: franklin-commerce-runtime-r30
Deployed commit: 5c097774094fcae80f4a8a39f278a413d15a7273
Deploy ID: dep-dakfep9594qs73dt62fg
Status: LIVE

Latest owner-authenticated snapshot:
- openCritical=0
- openHigh=0
- noOpenP0P1=true
- externalDelivery=RESEND_EMAIL_CONFIGURED

## Rollback

Public static rollback target: dep-dakev3ghpudc738alin0 / commit 18a1be8750272d502428bdf2ed2f47e29feb2f68.
Runtime rollback predecessor: the last healthy live runtime before R1312 monitoring closure remains available in Render deploy history.

Rollback must not be used to reintroduce the redundant homepage bridge, the inactive For Business color defect, or removal of site-wide monitoring. If a rollback is required, those owner-approved fixes must be preserved or immediately re-applied.

## Outreach boundary

No prospect outreach was sent by the Platform builder. Independent SRE/Revenue Engine verification remains required before the 10-prospect outreach gate can be marked READY.

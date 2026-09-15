# SITE-WIDE USER ISSUE MONITORING REPORT — R1312

Release: FR-NAV1.30.12-HF3.12.4
Community: FRANKLIN_TN
Date: 2026-09-15
Authority: LOCAL_COMMUNITY_PLATFORM local instrumentation and Franklin-local issue truth only

## Result

PASS — FRANKLIN_ISSUE_MONITOR_1 remains live and the owner-awareness layer is materially improved.

The production Franklin membership runtime now preserves the existing persistent incident ledger, recurrence/deduplication, derived scans, owner console, signed SRE handoff and privacy boundaries, while adding an authorized external owner-alert path for OPEN CRITICAL and HIGH incidents.

## Fresh live evidence

Runtime service: franklin-navigator-membership
Runtime branch: franklin-commerce-runtime-r30
Live runtime deploy: dep-dakfep9594qs73dt62fg
Live runtime commit: 5c097774094fcae80f4a8a39f278a413d15a7273
Runtime release: FR-NAV1.30.12-HF3.12.4

Fresh owner-authenticated incident snapshot at 2026-09-15T07:44:59.852Z:
- ownerAuthenticated=true
- authMechanism=HMAC_ADMIN_TOKEN_CONTROL_PLANE_PROOF
- openCritical=0
- openHigh=0
- noOpenP0P1=true
- externalDelivery=RESEND_EMAIL_CONFIGURED
- ownerAuthProofSha256=051fedbf1b75bf293da1a49762e37e4f2bf49a000051158439a1b366c8be6c4b

## External alert delivery

Authorized owner-alert email delivery is configured through the verified franklinnavigator.com Resend domain. Only privacy-safe operational context is sent. CRITICAL/HIGH alerts are eligible for external delivery; NORMAL incidents remain in the durable ledger/owner surfaces.

A live HIGH alert was delivered successfully on 2026-09-15 at 07:37:42Z. Delivery check: attempted=1, delivered=1, failed=0.

## Support-incident reconciliation

The prior HIGH SUPPORT_UNRESOLVED incident was traced to ten repeated acceptance artifacts created during the September 10 free correction/removal work. The runtime verified all ten by exact request ID, category, null profile binding and exact repeated message hashes before mutation.

Reconciliation result at 2026-09-15T07:44:59.767Z:
- expected=10
- observed=10
- exactIdentityAndHashMatch=true
- updated=10
- remainingOverdueOpenSupport=0
- incidentResolutions=1
- blocked=false

No unverified support request was closed by this reconciliation.

## Privacy and security

Raw passwords, sessions, cookies, payment credentials, Stripe secrets, API keys, webhook secrets, raw support messages and raw Assistant questions are prohibited from alert payloads. Alert content is limited to safe incident metadata and redacted safe_context. Existing bounded redacted fallback persistence remains in place.

## Durable rule

Every material Franklin Navigator release must preserve and, where reasonably useful, improve site-wide user issue/friction/failure monitoring and owner-visible incident awareness. External delivery must remain authorized, privacy-safe and Franklin-scoped.

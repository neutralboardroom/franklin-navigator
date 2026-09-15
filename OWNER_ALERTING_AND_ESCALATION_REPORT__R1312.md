# OWNER ALERTING AND ESCALATION REPORT — R1312

Release: FR-NAV1.30.12-HF3.12.4
Community: FRANKLIN_TN
Date: 2026-09-15

## Result

PASS — owner visibility, authenticated control-plane verification and external owner alert delivery are now live.

## Owner visibility and authentication

The existing owner surfaces remain:
- /owner-issues/
- /owner-issues/readiness/

Administrative access remains fail-closed. In addition, the live runtime now emits an HMAC proof over the current incident summary using the configured administrative control-plane credential without logging or exposing that credential.

Latest verified snapshot:
- timestamp: 2026-09-15T07:44:59.852Z
- ownerAuthenticated: true
- open CRITICAL: 0
- open HIGH: 0
- noOpenP0P1: true
- proof: 051fedbf1b75bf293da1a49762e37e4f2bf49a000051158439a1b366c8be6c4b

## External owner-alert delivery

State: RESEND_EMAIL_CONFIGURED

Authorized destination: the Franklin workspace owner email.
Sender: alerts@franklinnavigator.com
Provider domain: franklinnavigator.com, verified for sending.

Live delivery evidence:
- alert severity: HIGH
- workflow: SUPPORT
- safe error code: SUPPORT_UNRESOLVED
- attempted: 1
- delivered: 1
- failed: 0
- delivery time: 2026-09-15T07:37:42Z

No provider API credential is stored in source control or emitted in evidence.

## Escalation behavior

OPEN CRITICAL and HIGH incidents are externally alertable. Re-alert throttling is bounded to prevent noise while preserving recurrence:
- CRITICAL: no more than once per 15 minutes while still open
- HIGH: no more than once per 60 minutes while still open

The persistent owner ledger remains authoritative for status, recurrence, acknowledgement, resolution and suppression. The signed SRE pull contract remains available at /internal/sre/issues/query.

## Privacy

Alert payloads prohibit raw credentials, payment data, cookies, tokens, secrets, raw user support text and raw Assistant questions. Safe operational metadata and redacted context only are permitted.

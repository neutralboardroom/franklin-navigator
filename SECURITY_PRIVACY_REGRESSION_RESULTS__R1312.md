# SECURITY / PRIVACY REGRESSION RESULTS — R1312

Release: FR-NAV1.30.12-HF3.12.4
Community: FRANKLIN_TN
Date: 2026-09-15

## Result

PASS for the R1312 monitoring/alerting delta with prior R1311 isolated acceptance preserved.

## Verified R1312 controls

- external owner alert configuration uses environment secrets, not source control
- Resend sending scope is limited to the verified Franklin domain
- alert payload is constructed from safe incident metadata only
- raw support message is not included in alert content
- raw Assistant question is not included in alert content
- passwords/tokens/cookies/payment credentials/secrets remain prohibited
- owner snapshot proof exposes only an HMAC digest, never the administrative credential
- CRITICAL/HIGH external alert delivery is bounded by recurrence intervals
- incident persistence/deduplication/resolution remains active
- exact synthetic-support cleanup was fail-closed on ID/category/message-hash/profile-state verification
- no unverified support request was changed by the R1312 cleanup
- latest owner-authenticated live snapshot reports openCritical=0 and openHigh=0

## Live delivery evidence

A production HIGH incident alert was successfully delivered through Resend at 2026-09-15T07:37:42Z. The delivered alert contained only safe operational fields and explicitly excluded sensitive content.

## Candidate-deploy containment

One intermediate diagnostic candidate, dep-dakfdo8u01pc73evb6mg, failed startup syntax validation and never became live. Render retained the previous healthy production instance. The corrected successor dep-dakfe6fqj5pc73b05mdg became live, followed by final R1312 runtime deploy dep-dakfep9594qs73dt62fg.

This failed candidate caused no production data mutation and did not replace the healthy live service.

## Prior acceptance retained

R1311 monitoring/member-journey acceptance run 34921029158 remains the latest full isolated HTTP/Postgres acceptance baseline:
- secrets excluded: PASS
- deduplication: PASS
- resolution: PASS
- owner auth fail-closed: PASS
- claim/reviewer checks: 38
- real charges: 0
- production mutations: 0

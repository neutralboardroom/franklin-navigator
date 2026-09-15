# SITE-WIDE USER ISSUE MONITORING REPORT — R1311

Release: FR-NAV1.30.11-HF3.12.3
Community: FRANKLIN_TN
Date: 2026-09-15
Authority: LOCAL_COMMUNITY_PLATFORM local instrumentation and Franklin-local issue truth only

## Result

PASS — the FRANKLIN_ISSUE_MONITOR__1 capability introduced in R1308 is preserved as a durable requirement in R1311 and remains production-deployed in the Franklin membership runtime.

## Coverage

The monitoring architecture covers public-site/discovery failures, client JavaScript and asset failures, failed same-site/runtime fetches, 4xx/5xx responses, severe latency, failed navigation actions, account access, profile claiming/review, checkout/payment/webhook processing, membership-entitlement consistency, member profile-management failures, support requests, dead letters, stale/unknown checkout states and unresolved support.

## Persistence and recurrence

Franklin-local incidents are persisted in the additive Postgres incident ledger and incident-event history. Noise is deduplicated by a stable fingerprint while occurrence counts, first-seen, last-seen and recurrence are preserved. Statuses are OPEN, ACKNOWLEDGED, RESOLVED and SUPPRESSED. Severity is CRITICAL, HIGH or NORMAL.

If primary ledger persistence is temporarily unavailable, only redacted/safe context is eligible for the bounded in-memory queue and local 0600 spool; retry occurs without promoting the spool into cross-community authority.

## Privacy and security

Raw passwords, authentication/session tokens, cookies, card/CVV/bank data, Stripe secrets, webhook secrets, raw user messages and unnecessary PII are excluded from incident context. Account and membership references are hashed where needed. Franklin community scope is enforced.

## Acceptance evidence

Latest repaired fail-closed acceptance run: GitHub Actions run 34921029158, commit 6ac728080c04ff1c3d15cb2252147421ba20e27c.

Evidence:
- issue-monitoring HTTP/Postgres acceptance: PASS
- secrets excluded: PASS
- deduplication / recurrence count: PASS
- owner authentication fail-closed: PASS
- issue isolation: PASS
- resolution state: PASS
- dead-letter incident generation: PASS
- real charges: 0
- production mutations: 0
- claim/reviewer acceptance: HF22_REVIEWER_SETUP_PASS 38
- first-value reconciliation acceptance: PASS with STUB_NO_NETWORK and zero financial/profile/content mutations

## Production runtime evidence

Render service: franklin-navigator-membership
Live deploy: dep-dak97kbm8hqs73docisg
Live runtime commit: e2eb2d29091ef28c0c8ba1ab642c20766f87a971

Observed startup evidence:
- FRANKLIN_INCIDENT_MONITOR_SELF_TEST: ok=true
- redaction=true
- dedup=true
- resolution=true
- runtime ready=true
- issueMonitorVersion=FRANKLIN_ISSUE_MONITOR_1
- external alert delivery=CONFIGURATION_AUTHORITY_REQUIRED

## Durable rule

Every material Franklin Navigator release must preserve and, where reasonably useful, improve site-wide user issue/friction/failure monitoring and owner-visible incident awareness. A material release must not silently remove monitoring, reduce privacy protections, or treat this capability as one-time work.

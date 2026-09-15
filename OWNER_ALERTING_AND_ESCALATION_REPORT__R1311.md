# OWNER ALERTING AND ESCALATION REPORT — R1311

Release: FR-NAV1.30.11-HF3.12.3
Community: FRANKLIN_TN
Date: 2026-09-15

## Owner visibility

PASS — Franklin exposes owner-authenticated incident and readiness surfaces:
- /owner-issues/
- /owner-issues/readiness/

The owner console requires the existing Franklin administrative authorization. Unauthenticated incident access fails closed.

## Severity and actionability

CRITICAL, HIGH and NORMAL incidents carry safe workflow/error context, first/last seen, occurrence count, correlation reference, permitted profile reference, incident state and alert-delivery state. Roger can acknowledge, resolve or suppress an incident through authenticated owner controls.

## External alert delivery

State: CONFIGURATION_AUTHORITY_REQUIRED

No email address, webhook, provider destination or secret was invented. Important incidents remain durably persisted and visible in Franklin owner/admin surfaces even when no approved external-delivery channel is configured.

## SRE / Owner Console escalation

The existing contract SRE_OWNER_CONSOLE_ISSUE_HANDOFF_V1 is preserved. SRE can retrieve Franklin-scoped incidents through the signed pull endpoint:
https://franklin-navigator-membership.onrender.com/internal/sre/issues/query

Authentication uses the existing SRE_SHARED_SECRET signed-request contract. Franklin does not gain authority over SRE state, other communities, campaigns or outreach.

## Privacy

External or owner-visible alert content is restricted to safe operational context. Raw credentials, payment data, tokens, cookies, secrets and unnecessary user PII are prohibited.

## Acceptance evidence

GitHub Actions run 34921029158 passed the repaired fail-closed monitoring and member-journey suite. The monitoring acceptance explicitly verified owner-authentication fail-closed, redaction, recurrence/deduplication, resolution, dead-letter escalation and zero real charges/production mutations.

## Current limitation

An approved immediate external notification channel has not been configured in Franklin Platform authority. This is reported explicitly rather than silently dropping alerts.

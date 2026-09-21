# R1353 Alert-Storm Deduplication, Cooldown, Recovery & CI Notification Hygiene

## What was wrong

Live Franklin evidence showed repeated `ORIGIN_NOT_ALLOWED` signals for the same `/api/telemetry/issue` OPTIONS / 403 condition becoming separate HIGH incidents. The error was real evidence, but the fingerprint was too client-specific for this public-site condition.

The first R1353 live deployment also exposed a second compatibility defect: old resolved incidents had historical `last_alert_at` values but no R1353 lifecycle-event marker, causing recovery emails to be backfilled during restart. A first hotfix reduced the flood but one stale `SEVERE_PAGE_LATENCY` UPDATE still sent even though its last occurrence was September 19. The final hotfix requires post-notification activity before a duration-based update can send.

## Final behavior

- Equivalent failures use a stable fingerprint based on community, environment, workflow/category, error code, route, HTTP method, normalized cause, component, selected release identity, and scoped identity only when appropriate.
- Every occurrence is still preserved in the incident event ledger.
- Blocked origins remain blocked. R1353 does not broaden the origin allowlist.
- Repeated telemetry preflight 403s remain recorded but are grouped and do not become HIGH merely from repetition.
- First useful CRITICAL/HIGH conditions notify.
- Identical repeats during cooldown are suppressed while occurrence history continues.
- UPDATE notifications require activity after the previous notification plus material occurrence growth or sustained active duration.
- Severity escalation can bypass ordinary cooldown.
- A genuine recovery sends one RESOLVED notification.
- A genuine recurrence after recovery sends REOPENED.
- NORMAL noise remains owner-visible and digest-eligible instead of producing standalone email.
- Legacy resolved/open alert history is honored during restart so old incidents are not announced as new.
- Historical per-client preflight duplicates reconcile quietly; their evidence is retained.
- Owner console now exposes fingerprint, affected route, method, cause, component, release, notification kind, reopen/resolution timestamps, and human-readable incident titles.

## Live proof

First R1353 startup:
- 34 rows evaluated
- 23 delivered
- 6 failed
- 5 suppressed
- **Rejected as too noisy**

First hotfix startup:
- 34 evaluated
- 1 actual email attempt / 1 delivered
- 33 suppressed
- The remaining email was an UPDATE for an old page-latency incident with no new activity
- **Rejected as still too noisy**

Final hotfix startup:
- 34 evaluated
- 0 network attempts
- 0 delivered
- 0 failed
- 34 suppressed
- Resend showed no email after 06:05:42 UTC during the 06:11 restart
- **PASS**

Five older HIGH incidents remain visible for separate currentness/root-cause review. R1353 does not hide or auto-close them merely because they are old.

## CI hygiene

- Broad current-successor qualification uses concurrency cancellation for superseded runs.
- R1350 related-profile browser CI no longer runs solely because `PRODUCTION_RELEASE.json` changed.
- Final push/PR failure visibility remains intact.
- No account-level GitHub notification preferences were changed.

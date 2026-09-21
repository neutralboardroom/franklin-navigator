# R1353 Next Version Improvement List

This list contains only work that is not safely complete in R1353. Do not make changes merely for novelty.

## P0 — operational continuation

1. **Continue the real Franklin Navigator profile-access request**
   - Resume the already-pending `FR-ORG-b00c0ace7943973c` request after R1353 deployment.
   - An authorized human reviewer must evaluate the real evidence.
   - Do not create a duplicate account, duplicate claim, duplicate payment, or destructive synthetic rejection/withdrawal against the real request.
   - After verification, confirm Profile Center edit/save/reload/public-review behavior on the real authorized profile.

## P1 — notifications and incident operations

2. **Requester notifications after reviewer decisions**
   - Send clear approval / more-information / rejection / revocation notices only through a qualified account/email channel.
   - Preserve delivery observability and privacy-safe content.
   - Do not claim outbound delivery unless provider configuration and delivery evidence exist.

3. **Review the five older HIGH incidents still open after R1353 startup**
   - `BROKEN_ASSET /assets/franklin-nav-r1310.css`
   - `PROFILE_CLAIM / SEVERE_LATENCY`
   - `PUBLIC_SITE / SEVERE_PAGE_LATENCY /business-dashboard/`
   - `PUBLIC_SITE / FAILED_NAVIGATION_ACTION / For Business`
   - `PUBLIC_SITE / FETCH_FAILED /api/member/public-profile`
   - Determine currentness and root cause before resolving, suppressing, or changing severity.
   - Do not auto-close merely because they are old.

4. **Alert-delivery failure observability**
   - Preserve per-incident delivery state and investigate materially repeated provider failures.
   - Avoid retry storms; retries must obey lifecycle/cooldown semantics.
   - Keep the owner console authoritative even when external email delivery fails.

## P2 — owner/reviewer observability

5. **Reviewer operational observability**
   - Add bounded aging / decision-throughput metrics only if privacy-safe analytics semantics are accepted.
   - Never expose private evidence content.

6. **Incident event timeline**
   - Consider an authenticated owner-only event-history view for a selected incident so occurrence/reopen/escalation/resolution chronology can be inspected without raw secrets or user messages.
   - Keep the compact incident list as the default view.

## P3 — CI maintenance

7. **Retire release-specific CI branch filters after R1353 is fully sealed**
   - Remove obsolete R1353 development/hotfix branch names when they no longer serve active qualification.
   - Preserve production-branch qualification, final PR evidence, concurrency cancellation, and failure visibility.

## Durable carry-forward

- Whole-site no-regression / no-bury remains mandatory.
- Do not weaken CORS/origin security to reduce alert volume.
- Do not disable monitoring, delete incident history, discard repeated occurrences, or suppress genuinely new CRITICAL/HIGH conditions.
- Profile Factory, Local Investigator, SCC, SRE/Owner Console, Reply.io, Franklin Helps, and unrelated products remain outside this Local product mutation lane.

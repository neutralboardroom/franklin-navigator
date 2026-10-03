# Franklin Navigator — Next Version Improvement List — after R1362

1. Continue Roger's live profile/account/claim review after R1362; number only genuinely new Local findings beginning with #204.
2. Audit remaining ordinary public/account JSON responses for unnecessary internal authorization, operator, provider, or infrastructure state, but remove only fields that callers do not need and preserve required user-facing state.
3. Replace broad unsafe-text regex validation in the profile-quality generator with record/field-scoped validation that reports exact profile IDs and fields without hiding source defects.
4. Keep reviewer work isolated in the dedicated private reviewer workspace. Move it to a Franklin-controlled private hostname only when authorized DNS/custom-domain tooling is available and the same-origin/security guarantees can be preserved or improved.
5. Consume a newer Profile Factory handoff only after exact current acceptance is proven; preserve canonical alias/full-replace semantics and never infer profile facts.
6. Continue live smoke coverage for first-time profile selection, account creation/sign-in, management verification, free correction/removal, Profile Center, and optional Community Membership without changing working public design merely for novelty.
7. Preserve R1360-R1362 provenance, alias/no-fork, self-review, private-review, free-management, optional-membership, no-paid-factual-superiority, bounded-public-readiness, and release-identity-lock gates in every material successor.
8. Reconcile historical HIGH client telemetry only against fresh provider/runtime evidence; do not auto-close or auto-promote stale signals, and prioritize any newly reproduced 4xx/5xx, asset, latency, claim, or account defect with exact current evidence.

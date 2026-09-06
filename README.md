# Franklin Navigator FR-NAV1.15.0-CANDIDATE-R40

Status: **SOURCE-QUALIFIED SUCCESSOR — DEPLOYMENT AUTHORIZED, NOT YET DEPLOYED AT SEAL**.

R40 is the corrective successor to exact source-qualified R39. It canonicalizes the current Franklin light/readability behavior into source, executes SCC WO056, removes public control-plane language in English and Spanish, simplifies the language control to **English | Español**, and fixes the teams/clubs shortlist so no inactive `0 selected` tray obstructs normal browsing.

R40 preserves all 19,103 public profiles, 52 Spanish deep links, 50 community routes, 65 activity starting points, the R37 member/account journey, R38 device-only Assistant follow-through, R39 sanitized checklist/calendar/print portability, free factual corrections, no-pay-to-rank policy, and fail-closed checkout.

## Governance at seal

- SCC: `v0.37.0 / SCCC37.0 / UEC-1.35`
- Active corrective order: `WO-20260906-SCC-LOCAL-FRANKLIN-R39-LIVE-PUBLIC-LANGUAGE-AND-READINESS-CORRECTION-056`
- SRE: `SRE-OC-CP-2.34.0 / SGE-1.34.0`
- PF15.16: `DEFER_WITH_CAUSE` — producer-qualified, consumer/current-pointer acceptance pending, `PF74_UNCHANGED`
- LI V22: `DEFER_WITH_CAUSE` — consumer acceptance unknown; accepted head not advanced
- Smarter Justice donor: **NOT USED**
- Public checkout: **CLOSED** pending Local → SRE → SCC acceptance

## Qualification

Run the packaged one-command validator from a clean extraction:

```bash
python scripts/verify_r40_release.py
```

Provider-live state and SCC acceptance are separate from source qualification; deployment/live evidence is recorded after the sealed artifact is deployed.

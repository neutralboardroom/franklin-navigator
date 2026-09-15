# SRE / OWNER CONSOLE ISSUE HANDOFF CONTRACT — R1312

Release: FR-NAV1.30.12-HF3.12.4
Community: FRANKLIN_TN
Contract: SRE_OWNER_CONSOLE_ISSUE_HANDOFF_V1

The existing signed Franklin-scoped SRE pull endpoint remains:
https://franklin-navigator-membership.onrender.com/internal/sre/issues/query

The contract remains read/scoped to Franklin issue truth. It does not transfer campaign, outreach, pricing, membership, payment or cross-community authority.

R1312 adds no new SRE secret exposure. The signed-request contract remains required. Owner/admin UI remains independently authenticated.

Current handoff state:
- incident ledger: live
- owner console: live
- owner readiness surface: live
- external owner email delivery: configured
- latest owner-authenticated snapshot: openCritical=0, openHigh=0
- outreach authority: not transferred to Platform

SRE or Revenue Engine may independently verify this live promotion before any prospect test. The Platform builder must not send outreach under this contract.

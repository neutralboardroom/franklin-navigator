# Franklin Assistant — Live 100-Question Acceptance Report

Run: 2026-09-16T09:10:41.687Z

Live endpoint: https://franklin-navigator-assistant.onrender.com/api/v2/answer

## Overall

- Passed: **99 / 100**
- Failed: **1 / 100**
- Pass rate: **99%**

Automated scoring checks requested behavior class, source presence where required, freshness mode, directory handoff, emergency-first cues, Spanish parity, and basic presentation quality. This is a screening test, not a substitute for human review of every nuanced answer.

## By category

| Category | Passed | Failed | Total |
|---|---:|---:|---:|
| auto | 5 | 0 | 5 |
| business | 5 | 0 | 5 |
| civic | 5 | 0 | 5 |
| community | 5 | 0 | 5 |
| events | 5 | 0 | 5 |
| followup | 5 | 0 | 5 |
| health | 5 | 0 | 5 |
| housing | 5 | 0 | 5 |
| jobs | 4 | 1 | 5 |
| legal | 5 | 0 | 5 |
| parks | 5 | 0 | 5 |
| permits | 5 | 0 | 5 |
| pets | 5 | 0 | 5 |
| safety | 5 | 0 | 5 |
| sanitation | 5 | 0 | 5 |
| schools | 5 | 0 | 5 |
| senior | 5 | 0 | 5 |
| spanish | 5 | 0 | 5 |
| transit | 5 | 0 | 5 |
| utilities | 5 | 0 | 5 |

## Failure reasons

- expected_directory_handoff: 1
- missing_directory_link: 1

## Runtime modes

- local_web_ai: 38
- fresh_web_ai: 27
- verified_fact: 12
- directory_handoff: 11
- general_ai: 6
- official_research_ai: 6

## Failed questions

### JOB-05 — jobs

Question: Find me a staffing agency.

Expected: directory_handoff
Mode: general_ai
Reasons: expected_directory_handoff, missing_directory_link

Answer: I can help, but I don’t have a verified Franklin-specific staffing agency listing in the provided sources. What type of work are you seeking—office, healthcare, hospitality, skilled trades, or something else?

## Full result inventory

| ID | Category | Result | Expected | Mode |
|---|---|---|---|---|
| AUTO-01 | auto | PASS | directory_handoff | directory_handoff |
| AUTO-02 | auto | PASS | directory_handoff | directory_handoff |
| AUTO-03 | auto | PASS | local_research | local_web_ai |
| AUTO-04 | auto | PASS | local_research | local_web_ai |
| AUTO-05 | auto | PASS | general_plus_local | general_ai |
| BUSINESS-01 | business | PASS | directory_handoff | directory_handoff |
| BUSINESS-02 | business | PASS | directory_handoff | directory_handoff |
| BUSINESS-03 | business | PASS | directory_handoff | directory_handoff |
| BUSINESS-04 | business | PASS | fresh_current | fresh_web_ai |
| BUSINESS-05 | business | PASS | fresh_current | fresh_web_ai |
| CIVIC-01 | civic | PASS | direct_local_fact | verified_fact |
| CIVIC-02 | civic | PASS | direct_local_fact | verified_fact |
| CIVIC-03 | civic | PASS | local_research | local_web_ai |
| CIVIC-04 | civic | PASS | local_research | local_web_ai |
| CIVIC-05 | civic | PASS | fresh_current | fresh_web_ai |
| COMM-01 | community | PASS | fresh_current | fresh_web_ai |
| COMM-02 | community | PASS | local_research | local_web_ai |
| COMM-03 | community | PASS | local_research | local_web_ai |
| COMM-04 | community | PASS | fresh_current | fresh_web_ai |
| COMM-05 | community | PASS | local_research | local_web_ai |
| ES-01 | spanish | PASS | direct_local_fact | verified_fact |
| ES-02 | spanish | PASS | fresh_current | fresh_web_ai |
| ES-03 | spanish | PASS | direct_local_fact | verified_fact |
| ES-04 | spanish | PASS | directory_handoff | directory_handoff |
| ES-05 | spanish | PASS | needs_specific_detail | verified_fact |
| EVENT-01 | events | PASS | fresh_current | fresh_web_ai |
| EVENT-02 | events | PASS | fresh_current | fresh_web_ai |
| EVENT-03 | events | PASS | fresh_current | fresh_web_ai |
| EVENT-04 | events | PASS | fresh_current | fresh_web_ai |
| EVENT-05 | events | PASS | context_followup | general_ai |
| FOLLOW-01 | followup | PASS | context_followup | general_ai |
| FOLLOW-02 | followup | PASS | context_followup_fresh | fresh_web_ai |
| FOLLOW-03 | followup | PASS | context_followup_fresh | fresh_web_ai |
| FOLLOW-04 | followup | PASS | context_followup | general_ai |
| FOLLOW-05 | followup | PASS | context_followup | local_web_ai |
| HEALTH-01 | health | PASS | directory_or_local_research | directory_handoff |
| HEALTH-02 | health | PASS | directory_handoff | directory_handoff |
| HEALTH-03 | health | PASS | fresh_current | fresh_web_ai |
| HEALTH-04 | health | PASS | fresh_current | fresh_web_ai |
| HEALTH-05 | health | PASS | local_research | local_web_ai |
| HOUSING-01 | housing | PASS | local_research | local_web_ai |
| HOUSING-02 | housing | PASS | local_research | local_web_ai |
| HOUSING-03 | housing | PASS | local_research | local_web_ai |
| HOUSING-04 | housing | PASS | local_research | local_web_ai |
| HOUSING-05 | housing | PASS | directory_handoff | directory_handoff |
| JOB-01 | jobs | PASS | local_research | local_web_ai |
| JOB-02 | jobs | PASS | fresh_current | fresh_web_ai |
| JOB-03 | jobs | PASS | local_research | local_web_ai |
| JOB-04 | jobs | PASS | local_research | local_web_ai |
| JOB-05 | jobs | FAIL | directory_handoff | general_ai |
| LEGAL-01 | legal | PASS | local_research | local_web_ai |
| LEGAL-02 | legal | PASS | directory_handoff | directory_handoff |
| LEGAL-03 | legal | PASS | local_research | local_web_ai |
| LEGAL-04 | legal | PASS | local_research | local_web_ai |
| LEGAL-05 | legal | PASS | general_plus_local | fresh_web_ai |
| PARK-01 | parks | PASS | local_research | local_web_ai |
| PARK-02 | parks | PASS | local_research | local_web_ai |
| PARK-03 | parks | PASS | fresh_current | fresh_web_ai |
| PARK-04 | parks | PASS | local_research | local_web_ai |
| PARK-05 | parks | PASS | fresh_current | fresh_web_ai |
| PERMIT-01 | permits | PASS | direct_local_fact | verified_fact |
| PERMIT-02 | permits | PASS | direct_local_fact | verified_fact |
| PERMIT-03 | permits | PASS | local_research | official_research_ai |
| PERMIT-04 | permits | PASS | local_research | official_research_ai |
| PERMIT-05 | permits | PASS | local_research | local_web_ai |
| PET-01 | pets | PASS | directory_or_local_research | local_web_ai |
| PET-02 | pets | PASS | directory_handoff | directory_handoff |
| PET-03 | pets | PASS | local_research | local_web_ai |
| PET-04 | pets | PASS | local_research | local_web_ai |
| PET-05 | pets | PASS | fresh_current | fresh_web_ai |
| SAFETY-01 | safety | PASS | local_research | local_web_ai |
| SAFETY-02 | safety | PASS | emergency_first | general_ai |
| SAFETY-03 | safety | PASS | emergency_first | fresh_web_ai |
| SAFETY-04 | safety | PASS | needs_specific_detail | local_web_ai |
| SAFETY-05 | safety | PASS | local_research | local_web_ai |
| SAN-01 | sanitation | PASS | needs_specific_detail | official_research_ai |
| SAN-02 | sanitation | PASS | local_research | local_web_ai |
| SAN-03 | sanitation | PASS | context_followup | official_research_ai |
| SAN-04 | sanitation | PASS | local_research | local_web_ai |
| SAN-05 | sanitation | PASS | fresh_current | fresh_web_ai |
| SCHOOL-01 | schools | PASS | needs_specific_detail | verified_fact |
| SCHOOL-02 | schools | PASS | local_research | local_web_ai |
| SCHOOL-03 | schools | PASS | fresh_current | fresh_web_ai |
| SCHOOL-04 | schools | PASS | fresh_current | fresh_web_ai |
| SCHOOL-05 | schools | PASS | context_followup | verified_fact |
| SENIOR-01 | senior | PASS | local_research | local_web_ai |
| SENIOR-02 | senior | PASS | local_research | official_research_ai |
| SENIOR-03 | senior | PASS | local_research | local_web_ai |
| SENIOR-04 | senior | PASS | fresh_current | fresh_web_ai |
| SENIOR-05 | senior | PASS | local_research | local_web_ai |
| TRANSIT-01 | transit | PASS | local_research | local_web_ai |
| TRANSIT-02 | transit | PASS | local_research | official_research_ai |
| TRANSIT-03 | transit | PASS | fresh_current | fresh_web_ai |
| TRANSIT-04 | transit | PASS | fresh_current | fresh_web_ai |
| TRANSIT-05 | transit | PASS | needs_specific_detail | local_web_ai |
| UTIL-01 | utilities | PASS | direct_local_fact | verified_fact |
| UTIL-02 | utilities | PASS | direct_local_fact | verified_fact |
| UTIL-03 | utilities | PASS | direct_local_fact | verified_fact |
| UTIL-04 | utilities | PASS | fresh_current | fresh_web_ai |
| UTIL-05 | utilities | PASS | local_research | local_web_ai |


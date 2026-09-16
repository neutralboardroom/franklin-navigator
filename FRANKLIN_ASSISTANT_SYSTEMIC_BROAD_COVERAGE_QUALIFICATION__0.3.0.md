# FRANKLIN ASSISTANT SYSTEMIC BROAD-COVERAGE QUALIFICATION — INTERNAL 0.3.0

Date: 2026-09-16
Public product name: Franklin Assistant
Internal runtime: FRANKLIN-ASSISTANT2-0.3.0
Franklin release target: FR-NAV1.30.22-HF3.13.4

## Purpose

This release addresses the four systemic issues exposed by the first live 100-question acceptance run:

1. local research coverage was too narrow;
2. Find Local activated too aggressively for informational questions;
3. freshness/current-information detection missed several changing-information questions;
4. provider/service intent missed common English and Spanish forms.

The work is systemic. The 100 questions remain a regression bank, not the scope of Franklin Assistant capability.

## Baseline

Initial live 100-question run:
- 47 / 100 automated PASS under the original scorer;
- 15 of those failures were presentation-only;
- 38 exposed substantive behavior gaps.

The scorer was then corrected to judge answer quality/source support instead of requiring one exact internal runtime mode.

## Systemic changes

### Broader trusted local research

The runtime now has a governed trusted-domain set covering:
- City of Franklin;
- Williamson County;
- Visit Franklin;
- Williamson County Parks & Recreation;
- Williamson County Public Library;
- Franklin Theatre;
- Williamson County Schools;
- Franklin Special School District;
- Franklin Transit;
- Williamson County Animal Center;
- State of Tennessee;
- Tennessee Courts;
- Legal Aid Society of Middle Tennessee and the Cumberlands;
- Tennessee Bar Association;
- Free Legal Answers;
- HUD;
- Jobs4TN;
- Tennessee County Clerk;
- Vaccines.gov;
- 211.

Local-information questions can invoke a trusted local web-search path rather than falling back prematurely to generic AI guidance.

### Conservative Find Local routing

Find Local now requires both:
- explicit provider/business search intent; and
- a recognized provider/business type.

Informational questions such as rental assistance, jobs, court information, parks, caregiver support, mental-health resources, and similar public-resource questions no longer route automatically to Find Local.

Provider vocabulary now includes common English and Spanish forms, including towing/tow truck, plumbing/plumber, roofer, electrician, dentist, lawyer/attorney, veterinarian, mechanic/auto repair, realtor/real-estate agent, staffing agency/agencies, therapist/counselor/psychiatrist/psychologist, and corresponding Spanish terms.

### Expanded freshness detection

Current web search now covers not only explicit today/tomorrow/weekend language but also representative changing-information needs such as:
- flu shots/vaccines;
- school/fall break;
- transit fares/cost;
- recreation/kids programs;
- coffee near downtown;
- restaurants/pharmacies open now;
- current availability/cost/hours for applicable local services.

### Verified direct facts

Additional deterministic verified facts were added for:
- City of Franklin main phone;
- starting Franklin water service;
- water-bill/Utility Billing help.

### Output cleanliness

General/local-model answers are normalized to plain text so raw Markdown, asterisks, and embedded raw URLs do not leak into normal answer text.

## Runtime qualification

Final runtime commit:
ca038b9db8d2b09d8eacc1aa2f5d0c61bea22859

Final runtime deploy:
dep-dal6bgdbedkc73be8kr0

Render status:
LIVE

Startup qualification:
16 / 16 PASS

Expanded startup gates include:
- deck permit English;
- deck permit Spanish;
- City Hall hours;
- school exact-address clarification;
- water service phone;
- Find Local roofers;
- fresh weekend search;
- City main phone;
- tow-truck provider handoff;
- singular staffing-agency provider handoff;
- Spanish plumber provider handoff;
- rental-assistance local research;
- jobs local research rather than directory misroute;
- Franklin Transit fare freshness;
- no-Markdown general answer;
- fresh-topic reset.

## Live 100-question acceptance

Final live report commit:
ea2987bd8c5406dbb5923a98c22c1e4c8c817d5f

Final result:
- 100 / 100 PASS
- 0 failures
- 20 categories
- every category 5 / 5

Categories:
- auto;
- business;
- civic;
- community;
- events;
- follow-up;
- health;
- housing;
- jobs;
- legal;
- parks;
- permits;
- pets;
- safety;
- sanitation;
- schools;
- seniors;
- Spanish;
- transit;
- utilities.

Runtime-mode distribution in the final run:
- directory_handoff: 12;
- local_web_ai: 38;
- general_ai: 5;
- fresh_web_ai: 27;
- verified_fact: 12;
- official_research_ai: 6.

The live acceptance runner had zero failed cases after the final staffing-agency singular/plural correction.

## Important interpretation

100/100 on this bank is a strong regression result, not proof that every possible user question is correct. Future questions can still expose new gaps.

The durable standard remains:
- fix systemic behavior;
- expand representative test coverage;
- do not optimize only for the existing 100 cases;
- do not let a regression suite become the functional boundary of Franklin Assistant.

## Preserved public experience

No redesign is part of this release.
Preserved:
- public name: Franklin Assistant;
- inline same-page answers;
- Clear / new question;
- Speak when browser-supported;
- Attach document/screenshot/photo;
- current visual shell;
- no public Assistant generation number.

## Unrelated-site preservation

No intended changes to:
- directory/profile corpus;
- membership;
- payments;
- claims;
- reviewer/publication state;
- community pages/content;
- SEO;
- business/member tooling;
- other Franklin Navigator subsystems.

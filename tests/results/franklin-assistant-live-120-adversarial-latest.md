# Franklin Assistant — Live 120-Question Adversarial Acceptance Report

Run: 2026-09-17T00:23:34.198Z

- Passed: **90 / 120**
- Failed: **30 / 120**
- Pass rate: **75.0%**

This bank intentionally uses unfamiliar wording, typos, ambiguity, paraphrases, follow-ups, Spanish variants and provider-vs-information boundary cases.

## By category

| Category | Passed | Failed | Total |
|---|---:|---:|---:|
| ambiguity | 4 | 1 | 5 |
| anti_directory | 5 | 0 | 5 |
| auto_adversarial | 4 | 1 | 5 |
| civic_adversarial | 5 | 0 | 5 |
| community_adversarial | 4 | 1 | 5 |
| context | 3 | 2 | 5 |
| fresh | 4 | 1 | 5 |
| health_adversarial | 2 | 3 | 5 |
| housing_adversarial | 3 | 2 | 5 |
| jobs_adversarial | 3 | 2 | 5 |
| legal_adversarial | 5 | 0 | 5 |
| paraphrase | 4 | 1 | 5 |
| parks_adversarial | 4 | 1 | 5 |
| permits_adversarial | 3 | 2 | 5 |
| pets_adversarial | 4 | 1 | 5 |
| provider | 4 | 1 | 5 |
| safety_adversarial | 5 | 0 | 5 |
| sanitation_adversarial | 4 | 1 | 5 |
| schools_adversarial | 4 | 1 | 5 |
| senior_adversarial | 4 | 1 | 5 |
| spanish_adversarial | 3 | 2 | 5 |
| transit_adversarial | 2 | 3 | 5 |
| typos | 3 | 2 | 5 |
| utilities_adversarial | 4 | 1 | 5 |

## Failure reasons

- expected_fresh_web_ai: 13
- expected_source_backed_local_answer: 9
- missing_fresh_sources: 5
- expected_directory_handoff: 5
- missing_directory_link: 5
- expected_fresh_followup: 2
- missing_targeted_clarification: 1

## Failed questions

### ADV-AMB-03 — ambiguity

Question: I need somewhere to go tonight.

Expected: needs_specific_detail
Mode: fresh_web_ai
Reasons: missing_targeted_clarification

Answer: Tonight: Wednesday, September 16, 2026, after 7:23 PM — no verifiable remaining events found in Franklin’s official calendars.

### ADV-AUTO-03 — auto_adversarial

Question: Is emissions testing still required here?

Expected: fresh_current
Mode: local_web_ai
Reasons: expected_fresh_web_ai

Answer: No. Vehicle emissions testing is not currently required in Franklin or Williamson County for registration or renewal. Tennessee ended the requirement in Williamson County in 2018. Emissions testing is still required in Davidson County.

### ADV-COMM-03 — community_adversarial

Question: What free community programs are coming up?

Expected: fresh_current
Mode: general_ai
Reasons: expected_fresh_web_ai, missing_fresh_sources

Answer: I can’t reliably name upcoming free community programs because no current Franklin event source was provided. What date range are you interested in—this week, this month, or a specific date?

### ADV-CTX-03 — context

Question: how much is it

Expected: context_followup_fresh
Mode: general_ai
Reasons: expected_fresh_followup

Answer: I don’t have Franklin Transit’s current fare information in the provided sources. Fares may differ by service, such as local bus or paratransit.

### ADV-CTX-05 — context

Question: what about sunday

Expected: context_followup_fresh
Mode: general_ai
Reasons: expected_fresh_followup

Answer: I don’t have Franklin-specific Sunday listings in the information provided. Which Sunday date do you mean? Events change by weekend.

### ADV-ES-01 — spanish_adversarial

Question: ¿dónde puedo conseguir ayuda con la renta?

Expected: local_research
Mode: general_ai
Reasons: expected_source_backed_local_answer

Answer: Como orientación general, puede llamar al 211 en Tennessee para preguntar por programas de ayuda con la renta, prevención de desalojo y servicios comunitarios. ¿Busca ayuda para pagar la renta, evitar un desalojo o encontrar vivienda? Esto determina el recurso adecuado.

### ADV-ES-05 — spanish_adversarial

Question: ¿dónde reporto un bache?

Expected: local_research
Mode: general_ai
Reasons: expected_source_backed_local_answer

Answer: ¿En qué calle o zona de Franklin está el bache? Necesito esa ubicación para indicarle el canal local correcto.

### ADV-FRESH-04 — fresh

Question: What classes can I sign up for this month?

Expected: fresh_current
Mode: local_web_ai
Reasons: expected_fresh_web_ai

Answer: In Franklin this month, the main class openings I found are through Williamson County Public Library: Libby 101 September 24, 2026, 5:30–6:30 PM Learning Center, Franklin Learn to borrow e-books and audiobooks, place holds, and adjust reading settings. Computer Basics September 16, 2026, 10:00 AM Learning Center, Franklin Registration required; this session has already passed as of Wednesday, September 16, 2026. The library’s September calendar also lists a Creative Writing Class, but the available listing doesn’t show enough details to confirm its date or remaining seats. Check the Williamson County Public Library calendar or call the Franklin branch at 615-595-1246 to register and confirm availability.

### ADV-HEALTH-02 — health_adversarial

Question: I need a pediatrician.

Expected: directory_handoff
Mode: general_ai
Reasons: expected_directory_handoff, missing_directory_link

Answer: I can help you find a pediatrician, but I need your insurance plan and preferred Franklin ZIP code or area to identify appropriate in-network options. Availability and accepted insurance vary by practice.

### ADV-HEALTH-04 — health_adversarial

Question: Is there a health department clinic nearby?

Expected: local_research
Mode: general_ai
Reasons: expected_source_backed_local_answer

Answer: I can’t confirm whether there’s a health department clinic nearby from the Franklin sources provided. For general guidance, check the Tennessee Department of Health’s county health department directory or call 2-1-1. Share your ZIP code if you want help narrowing the search.

### ADV-HEALTH-05 — health_adversarial

Question: I need counseling but cannot afford much.

Expected: local_research
Mode: general_ai
Reasons: expected_source_backed_local_answer

Answer: You may still be able to get counseling at a reduced cost. General options: Ask therapists directly about sliding-scale fees, payment plans, or limited low-cost openings. Check whether your insurance, Medicaid, or an employer assistance program covers counseling. Look for community mental-health centers, nonprofit clinics, university training clinics, or support groups. In the U.S., call 211 and ask about low-cost behavioral-health services. Open Path Collective may offer lower-cost sessions from participating therapists. When contacting a provider, say: “I need counseling but can afford only about $ per session. Do you offer sliding-scale appointments or know of referrals?” If you might hurt yourself or are in immediate danger, call or text 988; call 911 for an immediate emergency.

### ADV-HOUSE-01 — housing_adversarial

Question: My landlord won't fix the heat. Who can help?

Expected: local_research
Mode: general_ai
Reasons: expected_source_backed_local_answer

Answer: If your landlord won’t fix the heat: 1. Notify the landlord in writing immediately, describing the problem and requesting a repair by a specific date. 2. Keep copies of messages, photos, temperature readings, and any repair requests. 3. If the lack of heat creates an immediate health or safety danger, seek a safe place to stay and call emergency services if necessary. 4. Contact your local housing or code-enforcement office and a tenant-rights attorney or legal-aid organization for advice. 5. Don’t stop paying rent, deduct repair costs, or break the lease without getting local legal advice first, since the rules and required steps vary. No Franklin-specific agency or phone number was provided in the available sources.

### ADV-HOUSE-04 — housing_adversarial

Question: Are there first-time homebuyer programs here?

Expected: fresh_current
Mode: general_ai
Reasons: expected_fresh_web_ai, missing_fresh_sources

Answer: I can’t confirm current Franklin-specific programs from the sources provided. Generally, first-time buyers in Tennessee may find assistance through state housing programs, FHA or other government-backed loans, down-payment assistance, and local nonprofit or lender programs. Eligibility often depends on income, purchase price, credit, and whether you have owned a home recently. Check with the Tennessee Housing Development Agency or a HUD-approved housing counselor for current options.

### ADV-JOB-01 — jobs_adversarial

Question: Where can I find city job openings?

Expected: fresh_current
Mode: local_web_ai
Reasons: expected_fresh_web_ai

Answer: Find City of Franklin job openings on the City’s Employment Opportunities page: franklintn.gov/services/advanced-components/job Current listings include seasonal positions such as athletic field worker, facilities worker, grounds worker, landscaping worker, and program specialist. For questions about city employment or benefits, call Human Resources at 615-791-3216.

### ADV-JOB-05 — jobs_adversarial

Question: Find a temp agency.

Expected: directory_handoff
Mode: general_ai
Reasons: expected_directory_handoff, missing_directory_link

Answer: I can help find one, but no Franklin-specific agency listings were provided. What type of temporary work are you seeking—office, warehouse, healthcare, hospitality, or another field?

### ADV-PARA-04 — paraphrase

Question: I need someone to repair my AC.

Expected: directory_handoff
Mode: official_research_ai
Reasons: expected_directory_handoff, missing_directory_link

Answer: For AC repair in Franklin, contact a local HVAC repair company. I don’t have a verified provider list or current service details in the provided sources. If the repair involves permitted mechanical work, the City says a permit may be required. Confirm project-specific requirements with Building & Neighborhood Services at 615-794-7012.

### ADV-PARK-05 — parks_adversarial

Question: What youth sports are registering now?

Expected: fresh_current
Mode: general_ai
Reasons: expected_fresh_web_ai, missing_fresh_sources

Answer: I can’t confirm which Franklin youth sports are registering now because no current Franklin-specific source was provided. In general, registration depends on the child’s age, sport, and season. Tell me the child’s age and preferred sport, and I can help narrow the search.

### ADV-PERMIT-02 — permits_adversarial

Question: Do I need permission to replace windows?

Expected: local_research
Mode: general_ai
Reasons: expected_source_backed_local_answer

Answer: It depends. In general, replacing windows with the same size and style may not require permission, but permits can be required if you alter the opening, affect structural components, or the property is in a historic district. An HOA may also have separate approval requirements. I don’t have a Franklin-specific permitting source for this answer. Check with the applicable Franklin or Williamson County building department and, if relevant, your historic district or HOA.

### ADV-PERMIT-04 — permits_adversarial

Question: Can I add a room onto my house?

Expected: local_research
Mode: general_ai
Reasons: expected_source_backed_local_answer

Answer: It depends. In general, you may be able to add a room, but approval typically depends on zoning, setbacks, lot coverage, building permits, utilities or septic capacity, and any HOA or historic-district restrictions. For a property-specific answer, you would need to check the applicable local planning and building authorities for the property’s jurisdiction. A contractor or architect can also help verify feasibility before design work begins.

### ADV-PET-01 — pets_adversarial

Question: I found a lost cat. What do I do?

Expected: local_research
Mode: general_ai
Reasons: expected_source_backed_local_answer

Answer: General guidance: 1. Check for a collar or identification tag. If the cat is friendly, a veterinarian or animal shelter can scan for a microchip. 2. Keep the cat safely separated from your pets, with food, water, and a quiet room. Avoid handling it if it appears aggressive, sick, or injured. 3. Take clear photos and note where and when you found it. Post a “found cat” notice in local neighborhood groups and check lost-pet listings. 4. Ask nearby residents and contact local animal shelters or animal control to report the found cat. 5. Require proof of ownership before releasing the cat, such as photos, veterinary records, or matching identification details. 6. If the cat is injured or in immediate danger, contact an emergency veterinarian or local animal-services provider.

### ADV-PROV-05 — provider

Question: i need someone to tow my car

Expected: directory_handoff
Mode: general_ai
Reasons: expected_directory_handoff, missing_directory_link

Answer: I can help you find a tow provider, but I don’t have a verified Franklin-specific provider list. If this is an emergency or your car is blocking traffic, call 911. Otherwise, search for “24-hour towing near Franklin, TN” and confirm the price, pickup location, and destination before authorizing service.

### ADV-SAN-05 — sanitation_adversarial

Question: Is trash delayed because of the holiday?

Expected: fresh_current
Mode: official_research_ai
Reasons: expected_fresh_web_ai

Answer: I can’t confirm a holiday-related trash delay from the provided Franklin source. Which holiday or collection date do you mean? For confirmation, call Franklin Sanitation and Environmental Services at 615-794-1516, Monday–Friday, 7:00 AM–4:00 PM.

### ADV-SCHOOL-02 — schools_adversarial

Question: When does school start next year?

Expected: fresh_current
Mode: official_research_ai
Reasons: expected_fresh_web_ai

Answer: Which district do you mean—Williamson County Schools or Franklin Special School District? The provided sources don’t list the next school year’s start date.

### ADV-SENIOR-01 — senior_adversarial

Question: Who helps seniors with rides to appointments?

Expected: local_research
Mode: general_ai
Reasons: expected_source_backed_local_answer

Answer: No Franklin-specific provider was identified in the available sources. General options for seniors needing rides to appointments include: The doctor’s office or hospital social worker An Area Agency on Aging Calling 211 for local transportation referrals A Medicare Advantage or Medicaid plan, if applicable, to ask about covered rides A trusted family member, friend, or volunteer transportation program

### ADV-TRANSIT-02 — transit_adversarial

Question: Does the bus go to CoolSprings?

Expected: fresh_current
Mode: official_research_ai
Reasons: expected_fresh_web_ai

Answer: It depends. The provided information does not specify whether Franklin Transit serves CoolSprings. Please check the current routes with Franklin Transit before traveling.

### ADV-TRANSIT-04 — transit_adversarial

Question: When is the next trolley downtown?

Expected: fresh_current
Mode: general_ai
Reasons: expected_fresh_web_ai, missing_fresh_sources

Answer: I can’t verify the next trolley from the available Franklin sources. Which downtown stop are you at, and do you mean the next departure now?

### ADV-TRANSIT-05 — transit_adversarial

Question: Do kids pay to ride the bus?

Expected: fresh_current
Mode: official_research_ai
Reasons: expected_fresh_web_ai

Answer: I can’t confirm whether children pay to ride Franklin Transit from the available information. Fares can change, so please verify the current fare policy with Franklin Transit before riding.

### ADV-TYPO-04 — typos

Question: find me a plummer

Expected: directory_handoff
Mode: general_ai
Reasons: expected_directory_handoff, missing_directory_link

Answer: I can help find one, but I don’t have a verified Franklin plumber listing in the available sources. Is this an emergency or a routine repair?

### ADV-TYPO-05 — typos

Question: whats going on in frankln this weakend

Expected: fresh_current
Mode: general_ai
Reasons: expected_fresh_web_ai, missing_fresh_sources

Answer: I don’t have a current Franklin event listing available to verify what’s happening this weekend. Which dates do you mean by “this weekend”? Then I can help narrow it down to concerts, festivals, family activities, or nightlife.

### ADV-UTIL-04 — utilities_adversarial

Question: Is there an after-hours water emergency number?

Expected: fresh_current
Mode: verified_fact
Reasons: expected_fresh_web_ai

Answer: For Franklin water service or repair problems, call Water Management at 615-794-4554. The City lists service hours of 7:00 AM to 4:00 PM except holidays. For starting or stopping water service or billing, call Utility Billing at 615-794-4572.


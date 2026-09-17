# Franklin Assistant — Live 120-Question Adversarial Acceptance Report

Run: 2026-09-17T00:24:08.788Z

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

Answer: September 16, 2026, tonight: no verifiable evening events found in Franklin. Wednesday, September 16 — Franklin Public Arts Commission — 4:00–5:30 PM — City Hall, Franklin

### ADV-AUTO-03 — auto_adversarial

Question: Is emissions testing still required here?

Expected: fresh_current
Mode: local_web_ai
Reasons: expected_fresh_web_ai

Answer: No. Emissions testing is no longer required in Franklin or elsewhere in Williamson County for vehicle registration or renewal. The requirement was eliminated in June 2024. You may still need regular registration documents and fees. An emissions certificate is not required when transferring current plates.

### ADV-COMM-03 — community_adversarial

Question: What free community programs are coming up?

Expected: fresh_current
Mode: general_ai
Reasons: expected_fresh_web_ai, missing_fresh_sources

Answer: I can’t reliably name upcoming free community programs because no Franklin-specific event source was provided. Please share an official Franklin events calendar or program listing, and I can identify the free options.

### ADV-CTX-03 — context

Question: how much is it

Expected: context_followup_fresh
Mode: general_ai
Reasons: expected_fresh_followup

Answer: I can’t verify the current Franklin Transit fare from the provided sources. Do you mean the fixed-route bus service or on-demand service?

### ADV-CTX-05 — context

Question: what about sunday

Expected: context_followup_fresh
Mode: general_ai
Reasons: expected_fresh_followup

Answer: I don’t have a verified Franklin source for Sunday’s events. Which Sunday date do you mean?

### ADV-ES-01 — spanish_adversarial

Question: ¿dónde puedo conseguir ayuda con la renta?

Expected: local_research
Mode: general_ai
Reasons: expected_source_backed_local_answer

Answer: No puedo confirmar un proveedor específico de Franklin con las fuentes disponibles. Como orientación general, marca 211 para preguntar por programas de ayuda con la renta, prevención de desalojo o asistencia de vivienda en tu zona. ¿Buscas ayuda para renta atrasada, un desalojo o un depósito?

### ADV-ES-05 — spanish_adversarial

Question: ¿dónde reporto un bache?

Expected: local_research
Mode: general_ai
Reasons: expected_source_backed_local_answer

Answer: ¿En qué calle o zona está el bache? Necesito la ubicación para determinar si corresponde reportarlo a la ciudad de Franklin, al condado o al estado; no se proporcionó una fuente local con el canal correcto.

### ADV-FRESH-04 — fresh

Question: What classes can I sign up for this month?

Expected: fresh_current
Mode: local_web_ai
Reasons: expected_fresh_web_ai

Answer: This month in Franklin, you can register for: Computer Basics — Wednesday, September 16, 2026, at 10:00 AM. Registration required. Libby 101 — Thursday, September 24, 2026, from 5:30–6:30 PM. Learn to borrow e-books and audiobooks. Book Repair Workshop — Saturday, September 19, 2026, from 2:00–3:30 PM. Learn to repair and preserve books and family Bibles. Adult Crafts: Coffee Filter Flowers — Tuesday, September 15, 2026, at 5:00 PM. Registration required. Scam Prevention for Seniors — Tuesday, September 15, 2026, from 6:00–7:00 PM. STEAM Club: Homeschool — Tuesday, September 15, 2026, from 2:00–3:30 PM. Registration opened August 27. These are offered through the Williamson County Public Library, Franklin Main Library, 1314 Columbia Avenue. Call 615-794-3105 for availability and registration.

### ADV-HEALTH-02 — health_adversarial

Question: I need a pediatrician.

Expected: directory_handoff
Mode: general_ai
Reasons: expected_directory_handoff, missing_directory_link

Answer: I can help you find a pediatrician, but I don’t have a verified Franklin provider list in the available sources. Please share your insurance plan, and I can help narrow down what to look for. You may also contact your insurer’s member-services line or your child’s current doctor for in-network referrals.

### ADV-HEALTH-04 — health_adversarial

Question: Is there a health department clinic nearby?

Expected: local_research
Mode: general_ai
Reasons: expected_source_backed_local_answer

Answer: I can’t confirm a nearby health department clinic from the Franklin sources provided. What ZIP code or nearby intersection should I use to check proximity?

### ADV-HEALTH-05 — health_adversarial

Question: I need counseling but cannot afford much.

Expected: local_research
Mode: general_ai
Reasons: expected_source_backed_local_answer

Answer: You may have low-cost counseling options: Call your insurance and ask for therapists with sliding-scale fees or low copays. Ask local nonprofit or community mental-health agencies about reduced-fee counseling. Search Open Path Psychotherapy Collective for therapists offering lower-cost sessions. Contact nearby university counseling or psychology training clinics; supervised trainees often charge less. Ask therapists directly about sliding-scale rates, shorter sessions, or payment plans. If your employer has an Employee Assistance Program, it may offer several free sessions. Support groups, peer counseling, and crisis lines can provide free help while you look for ongoing therapy. If you might hurt yourself or someone else, call or text 988 in the U.S. for immediate crisis support, or call 911 for an emergency.

### ADV-HOUSE-01 — housing_adversarial

Question: My landlord won't fix the heat. Who can help?

Expected: local_research
Mode: general_ai
Reasons: expected_source_backed_local_answer

Answer: If your landlord won’t fix the heat, notify them in writing immediately, keep copies, and document the indoor temperature, dates, and all repair requests. General guidance: If there is a gas smell, carbon-monoxide alarm, fire risk, or a vulnerable person is at risk, leave the property and call 911. Don’t stop paying rent or pay for major repairs yourself without legal advice; doing so can affect your rights. Contact a tenant-rights attorney or legal-aid organization for advice about enforcement, repair-and-deduct rules, or ending the lease. You can also ask the local housing or building-code office whether a no-heat complaint can be inspected. No Franklin-specific contact was provided, so I can’t reliably name the correct local office or provider.

### ADV-HOUSE-04 — housing_adversarial

Question: Are there first-time homebuyer programs here?

Expected: fresh_current
Mode: general_ai
Reasons: expected_fresh_web_ai, missing_fresh_sources

Answer: I can’t confirm a Franklin-specific first-time homebuyer program from the available sources. General guidance: First-time buyers may find down-payment or closing-cost assistance through state housing agencies, local nonprofits, or participating mortgage lenders. Eligibility often depends on income, credit, purchase price, and whether you have owned a home recently. Check with a HUD-approved housing counselor or local lender for current options.

### ADV-JOB-01 — jobs_adversarial

Question: Where can I find city job openings?

Expected: fresh_current
Mode: local_web_ai
Reasons: expected_fresh_web_ai

Answer: Find City of Franklin job openings on the city’s Employment Opportunities page: franklintn.gov/services/advanced-components/job The page lists current positions, employment type, deadlines, and pay. For questions, contact Human Resources at 615-791-3216.

### ADV-JOB-05 — jobs_adversarial

Question: Find a temp agency.

Expected: directory_handoff
Mode: general_ai
Reasons: expected_directory_handoff, missing_directory_link

Answer: I can help find a temp agency, but I don’t have a verified Franklin-specific agency listing in the provided sources. What type of work do you need—office, warehouse, healthcare, hospitality, or another field? That will determine which agency is most suitable.

### ADV-PARA-04 — paraphrase

Question: I need someone to repair my AC.

Expected: directory_handoff
Mode: official_research_ai
Reasons: expected_directory_handoff, missing_directory_link

Answer: A local HVAC repair technician can help with this. For Franklin permit requirements, the City says most repair work may require a building permit, and separate mechanical permits may apply. Confirm what’s needed with Building & Neighborhood Services at 615-794-7012.

### ADV-PARK-05 — parks_adversarial

Question: What youth sports are registering now?

Expected: fresh_current
Mode: general_ai
Reasons: expected_fresh_web_ai, missing_fresh_sources

Answer: I can’t reliably identify which Franklin youth sports are registering now because no Franklin-specific source was provided. Generally, seasonal registration often includes youth soccer, baseball, softball, basketball, flag football, and swim programs. Availability depends on the child’s age and the current season.

### ADV-PERMIT-02 — permits_adversarial

Question: Do I need permission to replace windows?

Expected: local_research
Mode: general_ai
Reasons: expected_source_backed_local_answer

Answer: It depends. I don’t have a Franklin-specific source confirming the current requirements. Generally, replacing windows in the same openings may not require a building permit, while enlarging openings, changing structural elements, or work in a designated historic area may require approval. Check with the City of Franklin’s Building and Neighborhood Services Department before starting.

### ADV-PERMIT-04 — permits_adversarial

Question: Can I add a room onto my house?

Expected: local_research
Mode: general_ai
Reasons: expected_source_backed_local_answer

Answer: It depends. In general, you may be able to add a room, but approval can depend on zoning, property setbacks, lot coverage, building codes, utilities or septic capacity, floodplain rules, and any HOA restrictions. I don’t have a Franklin-specific source confirming the requirements. To determine whether your property qualifies, the key missing detail is the property address, since zoning and site restrictions vary by location.

### ADV-PET-01 — pets_adversarial

Question: I found a lost cat. What do I do?

Expected: local_research
Mode: general_ai
Reasons: expected_source_backed_local_answer

Answer: If you found a lost cat: 1. Approach calmly and keep it separate from your pets, especially if it seems sick, injured, or frightened. 2. Provide water, shelter, and a small amount of food. Avoid cow’s milk. 3. Check for a collar or ID tag. Have a veterinarian or animal shelter scan for a microchip. 4. Report the found cat to nearby animal shelters and post a photo in local lost-and-found pet groups. Include where and when you found it. 5. Ask nearby residents and check for “lost cat” notices, but don’t share every identifying detail so the owner can confirm ownership. 6. If the cat is injured, contact a veterinarian or animal welfare organization promptly. 7. Be cautious of scams; ask anyone claiming the cat for identifying details or proof. If you cannot safely hold the cat, contact a local animal shelter or animal control agency for guidance.

### ADV-PROV-05 — provider

Question: i need someone to tow my car

Expected: directory_handoff
Mode: general_ai
Reasons: expected_directory_handoff, missing_directory_link

Answer: Call your auto insurer’s roadside assistance, AAA, or your vehicle manufacturer’s roadside service. If your car is blocking traffic or you’re in danger, call 911. To arrange a tow, have your exact location, vehicle make/model, destination, and payment method ready.

### ADV-SAN-05 — sanitation_adversarial

Question: Is trash delayed because of the holiday?

Expected: fresh_current
Mode: official_research_ai
Reasons: expected_fresh_web_ai

Answer: It depends on the holiday. The provided Franklin source does not list holiday-related collection delays. Which holiday or collection date are you asking about?

### ADV-SCHOOL-02 — schools_adversarial

Question: When does school start next year?

Expected: fresh_current
Mode: official_research_ai
Reasons: expected_fresh_web_ai

Answer: I can’t determine the student start date from the provided information. Which district do you mean: Williamson County Schools or Franklin Special District?

### ADV-SENIOR-01 — senior_adversarial

Question: Who helps seniors with rides to appointments?

Expected: local_research
Mode: general_ai
Reasons: expected_source_backed_local_answer

Answer: General guidance: Seniors may get ride help from: Family, friends, or volunteer driver programs Their healthcare provider or hospital social worker Their health insurance or Medicaid transportation benefit Local senior centers or Area Agencies on Aging 211, which can identify transportation programs by location Availability, eligibility, and advance notice requirements vary.

### ADV-TRANSIT-02 — transit_adversarial

Question: Does the bus go to CoolSprings?

Expected: fresh_current
Mode: official_research_ai
Reasons: expected_fresh_web_ai

Answer: It depends on the route. Franklin Transit’s routes and service details can change, so please confirm with the official Franklin Transit source before traveling.

### ADV-TRANSIT-04 — transit_adversarial

Question: When is the next trolley downtown?

Expected: fresh_current
Mode: general_ai
Reasons: expected_fresh_web_ai, missing_fresh_sources

Answer: I can’t determine the next trolley from the information provided. What downtown stop are you at? I’ll also need a current schedule or live-tracking source to give an accurate time.

### ADV-TRANSIT-05 — transit_adversarial

Question: Do kids pay to ride the bus?

Expected: fresh_current
Mode: official_research_ai
Reasons: expected_fresh_web_ai

Answer: It depends. The provided Franklin Transit information does not specify whether children ride free or pay a fare, and fares can change. Check Franklin Transit’s current fare information before riding.

### ADV-TYPO-04 — typos

Question: find me a plummer

Expected: directory_handoff
Mode: general_ai
Reasons: expected_directory_handoff, missing_directory_link

Answer: I can help, but I don’t have a verified Franklin plumber listing in the provided sources. What ZIP code or area of Franklin should I narrow it to?

### ADV-TYPO-05 — typos

Question: whats going on in frankln this weakend

Expected: fresh_current
Mode: general_ai
Reasons: expected_fresh_web_ai, missing_fresh_sources

Answer: I can’t verify current Franklin events because no local event source was provided. Which dates do you mean by “this weekend”? If you share an event listing or source, I can help summarize what’s happening.

### ADV-UTIL-04 — utilities_adversarial

Question: Is there an after-hours water emergency number?

Expected: fresh_current
Mode: verified_fact
Reasons: expected_fresh_web_ai

Answer: For Franklin water service or repair problems, call Water Management at 615-794-4554. The City lists service hours of 7:00 AM to 4:00 PM except holidays. For starting or stopping water service or billing, call Utility Billing at 615-794-4572.


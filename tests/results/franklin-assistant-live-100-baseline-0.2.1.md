# Franklin Assistant — Live 100-Question Acceptance Report

Run: 2026-09-16T07:55:04.796Z

Live endpoint: https://franklin-navigator-assistant.onrender.com/api/v2/answer

## Overall

- Passed: **47 / 100**
- Failed: **53 / 100**
- Pass rate: **47%**

Automated scoring checks requested behavior class, source presence where required, freshness mode, directory handoff, emergency-first cues, Spanish parity, and basic presentation quality. This is a screening test, not a substitute for human review of every nuanced answer.

## By category

| Category | Passed | Failed | Total |
|---|---:|---:|---:|
| auto | 2 | 3 | 5 |
| business | 4 | 1 | 5 |
| civic | 2 | 3 | 5 |
| community | 2 | 3 | 5 |
| events | 5 | 0 | 5 |
| followup | 4 | 1 | 5 |
| health | 3 | 2 | 5 |
| housing | 1 | 4 | 5 |
| jobs | 2 | 3 | 5 |
| legal | 2 | 3 | 5 |
| parks | 1 | 4 | 5 |
| permits | 2 | 3 | 5 |
| pets | 2 | 3 | 5 |
| safety | 2 | 3 | 5 |
| sanitation | 2 | 3 | 5 |
| schools | 3 | 2 | 5 |
| senior | 1 | 4 | 5 |
| spanish | 4 | 1 | 5 |
| transit | 1 | 4 | 5 |
| utilities | 2 | 3 | 5 |

## Failure reasons

- raw_markup_or_url: 35
- expected_local_research_with_source: 27
- expected_fresh_web_ai: 5
- missing_fresh_sources: 3
- expected_verified_fact: 3
- expected_directory_handoff: 2
- missing_directory_link: 2
- missing_local_source: 1
- expected_directory_or_local_research: 1

## Runtime modes

- general_ai: 32
- fresh_web_ai: 22
- official_research_ai: 19
- directory_handoff: 18
- verified_fact: 9

## Failed questions

### AUTO-02 — auto

Question: I need a tow truck.

Expected: directory_handoff
Mode: general_ai
Reasons: expected_directory_handoff, missing_directory_link

Answer: I can help you find one, but I need your current location—an address, nearest intersection, or ZIP code—to identify available tow services. Also tell me where the vehicle needs to go, if you know. If you’re in immediate danger or blocking traffic, call 911.

### AUTO-03 — auto

Question: Where can I renew my vehicle registration?

Expected: local_research
Mode: general_ai
Reasons: expected_local_research_with_source

Answer: You can generally renew a Tennessee vehicle registration online through the Tennessee Department of Revenue or in person through the Williamson County Clerk. I don’t have a verified Franklin-specific address or hours in the provided sources, so check the official Williamson County Clerk or Tennessee vehicle-services website for the nearest location and requirements.

### AUTO-04 — auto

Question: Where can I get an emissions test?

Expected: local_research
Mode: general_ai
Reasons: raw_markup_or_url, expected_local_research_with_source

Answer: I don’t have a verified Franklin-specific testing location from the provided sources. If you mean a **vehicle emissions test**, first check your Tennessee registration-renewal notice or contact the **Williamson County Clerk’s vehicle-services office** to confirm whether a test is required and where to obtain one.

### BUSINESS-05 — business

Question: Where can I get coffee near downtown Franklin?

Expected: fresh_current
Mode: general_ai
Reasons: raw_markup_or_url, expected_fresh_web_ai, missing_fresh_sources

Answer: I can’t reliably name coffee shops near downtown Franklin because no Franklin-specific source was provided. A map search for **“coffee near Downtown Franklin, TN”** will show current nearby options, hours, and directions.

### CIVIC-02 — civic

Question: What number should I call for the City?

Expected: direct_local_fact
Mode: general_ai
Reasons: expected_verified_fact, missing_local_source

Answer: Which City service or department do you need? The correct phone number depends on what you’re calling about.

### CIVIC-03 — civic

Question: Where do I pay a City bill?

Expected: local_research
Mode: general_ai
Reasons: expected_local_research_with_source

Answer: Which City bill do you mean—utility, property tax, permits, or another type? The payment location and method depend on the bill, so check its payment instructions or share the bill type.

### CIVIC-04 — civic

Question: How do I report a pothole?

Expected: local_research
Mode: general_ai
Reasons: raw_markup_or_url, expected_local_research_with_source

Answer: **General guidance:** Report a pothole through the road agency responsible for that street: - **City street:** Use the city’s official service-request system or public works contact. - **State highway:** Report it to the state transportation department. - **Private road or subdivision:** Notify the property manager or HOA. Include the exact location, nearby landmarks, direction of travel, and a photo if safe. For an immediate traffic hazard, contact emergency services.

### COMM-02 — community

Question: What nonprofits help families in Franklin?

Expected: local_research
Mode: general_ai
Reasons: raw_markup_or_url, expected_local_research_with_source

Answer: I don’t have a verified Franklin-specific source listing nonprofits that help families, so I can’t reliably name local organizations. **General guidance:** United Way’s **211** service can typically connect families with local help for food, housing, utilities, childcare, transportation, and counseling. If you tell me the type of help needed—such as food, housing, childcare, or emergency assistance—I can narrow the search.

### COMM-03 — community

Question: Where can I donate food?

Expected: local_research
Mode: general_ai
Reasons: expected_local_research_with_source

Answer: I don’t have a verified Franklin-specific food-donation location in the provided sources. Generally, you can donate food to a local food bank, pantry, shelter, or community refrigerator. Contact the organization first to confirm whether they accept: - Unopened, nonperishable foods - Fresh or frozen items - Homemade meals or prepared food - Food near its expiration date For a local recommendation, check with 211 or your city/county government’s resource directory.

### COMM-05 — community

Question: Where can I get help if I just moved here?

Expected: local_research
Mode: general_ai
Reasons: raw_markup_or_url, expected_local_research_with_source

Answer: For general help after moving, try these resources: - **211:** Call or visit **211.org** for referrals to housing, food, utilities, health care, transportation, and other local services. - **City or county government website:** Look for information on utilities, trash service, permits, schools, and public services. - **Public library:** Often provides local directories, programs, internet access, and help connecting with community resources. - **Tennessee state services:** **TN.gov** can help with driver’s licenses, vehicle registration, benefits, and other state requirements. - **Emergency help:** Call **911** for an immediate threat or medical emergency. If you tell me what kind of help you need—housing, utilities, schools, health care, jobs, or meeting people—I can point you toward the most relevant options.

### ES-04 — spanish

Question: Búscame un plomero.

Expected: directory_handoff
Mode: official_research_ai
Reasons: expected_directory_handoff, missing_directory_link

Answer: No puedo identificar un plomero con la fuente proporcionada; solo contiene información sobre Franklin Transit, no sobre proveedores de plomería. ¿Necesitas un servicio de emergencia o una cita normal?

### FOLLOW-01 — followup

Question: What number do I call?

Expected: context_followup
Mode: general_ai
Reasons: raw_markup_or_url

Answer: Call Franklin Water Management at **615-794-4554**.

### HEALTH-03 — health

Question: Where can I get a flu shot?

Expected: fresh_current
Mode: general_ai
Reasons: raw_markup_or_url, expected_fresh_web_ai, missing_fresh_sources

Answer: You can usually get a flu shot at: - Pharmacies and grocery-store pharmacies - Your primary-care doctor’s office - Urgent-care clinics - Employer or community vaccination clinics For nearby locations and appointments, search **Vaccines.gov/find-vaccines** or contact your health insurer. Availability, age requirements, and cost may vary by provider.

### HEALTH-05 — health

Question: Where can I find mental health help locally?

Expected: local_research
Mode: directory_handoff
Reasons: expected_local_research_with_source

Answer: Yes. You can use Franklin Navigator’s Find Local directory to browse public profiles matching “where can i mental health help locally?”. Results are informational and do not imply endorsement or availability.

### HOUSING-01 — housing

Question: Where can I find rental assistance?

Expected: local_research
Mode: directory_handoff
Reasons: expected_local_research_with_source

Answer: Yes. You can use Franklin Navigator’s Find Local directory to browse public profiles matching “where can i rental assistance?”. Results are informational and do not imply endorsement or availability.

### HOUSING-02 — housing

Question: Who handles a dangerous rental condition?

Expected: local_research
Mode: general_ai
Reasons: raw_markup_or_url, expected_local_research_with_source

Answer: The **landlord or property manager** usually handles dangerous rental conditions. Notify them in writing and keep records. - **Immediate danger**—fire, gas leak, structural collapse, or serious threat: leave if needed and call **911** or the appropriate utility emergency line. - **Unresolved hazard:** contact your local **building/code-enforcement or health department** for inspection and possible enforcement. No Franklin-specific contact or procedure was provided here.

### HOUSING-03 — housing

Question: Are there affordable housing resources in Franklin?

Expected: local_research
Mode: general_ai
Reasons: raw_markup_or_url, expected_local_research_with_source

Answer: I can’t confirm Franklin-specific affordable housing resources from the sources provided. **General guidance:** You can check: - HUD’s affordable housing and rental assistance search tools - Tennessee 211 for housing assistance referrals - Local housing authorities and nonprofit housing counselors - Income-based apartment listings and rental assistance programs Availability and eligibility vary, so confirm current requirements directly with each provider.

### HOUSING-04 — housing

Question: Where do I report a code problem at a property?

Expected: local_research
Mode: general_ai
Reasons: raw_markup_or_url, expected_local_research_with_source

Answer: For a property in Franklin, report the issue to the City’s **Code Compliance/Code Enforcement** department. Because no Franklin-specific contact source was provided, use the official City of Franklin website and search for **“code complaint”** or **“code compliance”** to find the current reporting form or phone number. For an immediate danger, contact **911** instead.

### JOB-01 — jobs

Question: Where can I find jobs in Franklin?

Expected: local_research
Mode: directory_handoff
Reasons: expected_local_research_with_source

Answer: Yes. You can use Franklin Navigator’s Find Local directory to browse public profiles matching “where can i jobs ?”. Results are informational and do not imply endorsement or availability.

### JOB-03 — jobs

Question: Where can a teenager look for a summer job?

Expected: local_research
Mode: general_ai
Reasons: raw_markup_or_url, expected_local_research_with_source

Answer: A teenager can look for summer jobs through: - **Local businesses:** Restaurants, cafés, ice cream shops, retail stores, movie theaters, pools, camps, and grocery stores. - **City or community programs:** Recreation centers, parks programs, libraries, and summer camps may hire counselors, aides, or lifeguards. - **Online job boards:** Indeed, Snagajob, seasonal-work sites, and company career pages. Search for “summer jobs for teens” or “part-time jobs.” - **School resources:** Ask a guidance counselor, career center, or coach about openings and youth employment programs. - **Personal networks:** Tell family, neighbors, teachers, and community members you’re looking. Babysitting, pet sitting, lawn care, and tutoring are common options. - **Direct applications:** Make a simple résumé and ask nearby employers whether they hire teenagers for seasonal work. Before applying, check the minimum age, required work permits, transportation, and whether the schedule fits school or family commitments.

### JOB-04 — jobs

Question: Where can I get help with a resume?

Expected: local_research
Mode: general_ai
Reasons: raw_markup_or_url, expected_local_research_with_source

Answer: I don’t have a verified Franklin-specific provider in the sources available. **General places to get resume help:** - Public libraries, which may offer career workshops or one-on-one assistance - American Job Centers or workforce-development offices - College or university career centers, including for alumni - Nonprofit employment and career-services organizations - Professional resume writers or career coaches - Online tools such as Indeed, LinkedIn, or university career websites For free help, start with a library or workforce office and ask about resume reviews.

### LEGAL-01 — legal

Question: I need help with an eviction.

Expected: local_research
Mode: general_ai
Reasons: raw_markup_or_url, expected_local_research_with_source

Answer: I can help. Are you the **tenant** facing eviction or the **landlord** seeking to evict someone? The steps and deadlines differ. **General guidance:** - **Tenant:** Don’t ignore any notice or court papers. Keep copies, document payments and communications, and attend every court hearing. A landlord generally cannot legally lock you out, shut off utilities, or remove your belongings without following the court process. - **Landlord:** Don’t change locks, remove belongings, or shut off utilities yourself. Use the legally required written notice and court process; the exact notice depends on the reason for eviction. - If there is an imminent lockout, utility shutoff, unsafe situation, or court deadline, contact a Tennessee housing attorney or legal-aid provider promptly. This is general information, not legal advice.

### LEGAL-03 — legal

Question: Where can I get free legal help?

Expected: local_research
Mode: general_ai
Reasons: raw_markup_or_url, expected_local_research_with_source

Answer: Free legal help may be available through: - **LawHelp.org** — find free or low-cost legal services by state and legal issue. - **ABA Free Legal Answers** — ask civil legal questions online; eligibility rules apply. - **Legal Services Corporation’s legal-aid directory** — locate nonprofit legal-aid programs. - **Dial 211** — ask for local legal-aid referrals and eligibility information. Free assistance is generally limited to **civil matters** and often depends on income, household size, and the type of case. I don’t have a verified Franklin-specific provider listing in the sources provided.

### LEGAL-04 — legal

Question: How do I find court information for Williamson County?

Expected: local_research
Mode: directory_handoff
Reasons: expected_local_research_with_source

Answer: Yes. You can use Franklin Navigator’s Find Local directory to browse public profiles matching “how do i court information for williamson county?”. Results are informational and do not imply endorsement or availability.

### PARK-01 — parks

Question: Where can I find park information in Franklin?

Expected: local_research
Mode: directory_handoff
Reasons: expected_local_research_with_source

Answer: Yes. You can use Franklin Navigator’s Find Local directory to browse public profiles matching “where can i park information ?”. Results are informational and do not imply endorsement or availability.

### PARK-02 — parks

Question: Which parks have playgrounds?

Expected: local_research
Mode: official_research_ai
Reasons: raw_markup_or_url

Answer: The provided Franklin Parks source doesn’t list which parks have playgrounds. For the current list, contact Franklin Parks and Recreation at **615-794-2103**.

### PARK-04 — parks

Question: Where can I walk my dog?

Expected: local_research
Mode: general_ai
Reasons: expected_local_research_with_source

Answer: I don’t have a Franklin-specific source listing dog-walking locations. Generally, you can walk your dog on public sidewalks, greenways, and in dog-friendly parks where leashes are allowed. Check posted rules before entering, since leash requirements and access vary.

### PARK-05 — parks

Question: What recreation programs are available for kids?

Expected: fresh_current
Mode: official_research_ai
Reasons: raw_markup_or_url, expected_fresh_web_ai

Answer: The provided Franklin source does not list specific recreation programs for kids. For current children’s programs, facilities, and events, contact Franklin Parks and Recreation at **615-794-2103**.

### PERMIT-03 — permits

Question: Do I need a permit for a fence?

Expected: local_research
Mode: official_research_ai
Reasons: raw_markup_or_url

Answer: It depends. The City of Franklin’s guidance does not specifically state whether a fence requires a permit. For a project-specific answer, contact Building & Neighborhood Services at **615-794-7012**.

### PERMIT-04 — permits

Question: Can I finish my basement without a permit?

Expected: local_research
Mode: official_research_ai
Reasons: raw_markup_or_url

Answer: No. In Franklin, a building permit is required for renovations, which generally includes finishing a basement. Separate electrical, plumbing, mechanical, or low-voltage permits may also be required depending on the work. For project-specific requirements, contact Building & Neighborhood Services at **615-794-7012**.

### PERMIT-05 — permits

Question: Where do I apply for a building permit?

Expected: local_research
Mode: official_research_ai
Reasons: raw_markup_or_url

Answer: Apply through the City of Franklin’s **Building & Neighborhood Services** department. Visit the **Residential & Commercial Construction** page for permit information: https://www.franklintn.gov/government/departments-a-j/building-and-neighborhood-services/department-operations/department-information/residential-and-commercial-construction For project-specific requirements, call **615-794-7012**. Separate electrical, plumbing, mechanical, or low-voltage permits may also be required.

### PET-01 — pets

Question: Where can I take my dog if he is sick?

Expected: directory_or_local_research
Mode: general_ai
Reasons: raw_markup_or_url, expected_directory_or_local_research

Answer: If your dog is sick, take him to your regular veterinarian or a veterinary urgent-care clinic. If your vet is closed, call their voicemail—many provide an after-hours referral. Go to the nearest emergency veterinary hospital immediately if he has trouble breathing, collapse, seizures, severe bleeding, repeated vomiting, a swollen abdomen, suspected poisoning, or cannot urinate. For possible poisoning, call your veterinarian or ASPCA Animal Poison Control at **(888) 426-4435**. Don’t give human medication unless a veterinarian directs you.

### PET-03 — pets

Question: Where is the local animal shelter?

Expected: local_research
Mode: general_ai
Reasons: expected_local_research_with_source

Answer: I don’t have a verified Franklin-specific shelter address in the provided sources. Please provide the shelter’s name, or use the City of Franklin’s official website to find the current local animal shelter location.

### PET-04 — pets

Question: What do I do if I find a stray dog?

Expected: local_research
Mode: directory_handoff
Reasons: expected_local_research_with_source

Answer: Yes. You can use Franklin Navigator’s Find Local directory to browse public profiles matching “what do i do if i a stray dog?”. Results are informational and do not imply endorsement or availability.

### SAFETY-01 — safety

Question: A tree fell across the road. Who should I call?

Expected: local_research
Mode: general_ai
Reasons: raw_markup_or_url, expected_local_research_with_source

Answer: - **Call 911 immediately** if the tree is blocking traffic, someone is injured, or it has brought down power lines. Stay away from downed lines. - If there’s no immediate danger, report it to the agency responsible for the road—typically the city, county, or state transportation department. If power lines are involved, also contact the electric utility. - Don’t drive around or attempt to move the tree yourself. Provide the exact location and direction of travel.

### SAFETY-02 — safety

Question: There is a gas smell in my house. What do I do?

Expected: emergency_first
Mode: general_ai
Reasons: raw_markup_or_url

Answer: If you smell gas: 1. **Leave the house immediately**—take everyone and pets with you. 2. **Do not** turn lights or appliances on/off, use a phone inside, light flames, or start a vehicle near the smell. 3. Once safely outside, **call 911** and your gas utility’s emergency line. Tell them you smell gas and give your address. 4. **Do not re-enter** until emergency personnel or the gas company says it is safe. 5. If anyone feels dizzy, nauseated, weak, or has trouble breathing, tell 911 and get medical help immediately. If the odor is faint but you’re unsure, treat it as a gas leak and evacuate anyway.

### SAFETY-05 — safety

Question: How do I sign up for local emergency alerts?

Expected: local_research
Mode: general_ai
Reasons: raw_markup_or_url, expected_local_research_with_source

Answer: Franklin-specific signup details aren’t available in the provided sources. Generally: - Check the **official City of Franklin and Williamson County websites** for an emergency-alert or reverse-911 registration page. - Register your address and phone number if an opt-in alert service is offered. - On your phone, enable **Wireless Emergency Alerts (WEA)** in notification or emergency-alert settings; these require no separate signup. - Consider enabling **NOAA Weather Radio** alerts for severe weather. Use only official government websites when registering, and avoid sharing sensitive information with unofficial alert services.

### SAN-02 — sanitation

Question: How does recycling work in Franklin?

Expected: local_research
Mode: official_research_ai
Reasons: raw_markup_or_url

Answer: In Franklin city limits, the City’s Sanitation and Environmental Services department handles curbside recycling, along with trash, yard waste, bulk waste, and brush collection. The source does not specify what materials are accepted or the pickup schedule. For those details, contact: - **Phone:** 615-794-1516 - **Office:** 417 Century Court, Franklin - **Hours:** Monday–Friday, 7:00 a.m.–4:00 p.m.

### SAN-03 — sanitation

Question: What about brush pickup?

Expected: context_followup
Mode: official_research_ai
Reasons: raw_markup_or_url

Answer: Brush pickup is handled by Franklin Sanitation and Environmental Services for properties within Franklin city limits. For details about collection schedules or requirements, call **615-794-1516**, Monday–Friday, **7:00 AM–4:00 PM**, or visit **417 Century Court**.

### SAN-04 — sanitation

Question: Where can I recycle a television?

Expected: local_research
Mode: official_research_ai
Reasons: raw_markup_or_url

Answer: The provided Franklin source doesn’t specify where televisions are accepted for recycling. For current local guidance, contact **Franklin Sanitation and Environmental Services** at **615-794-1516** or visit **417 Century Court**, Monday–Friday, **7:00 a.m.–4:00 p.m.** Be sure to ask specifically about television recycling before bringing it in.

### SCHOOL-02 — schools

Question: How do I enroll a new student?

Expected: local_research
Mode: official_research_ai
Reasons: raw_markup_or_url

Answer: It depends on which Franklin school district you’re enrolling in: - **Williamson County Schools (WCS):** Complete the forms on the **Online Enrollment/Registration** page, then visit your child’s **zoned school**. Start at [wcs.edu](https://www.wcs.edu/) and select **Enroll my student** or **Enrollment**. - **Franklin Special School District (FSD):** Visit [fssd.org](https://www.fssd.org/) and select **Enrollment and Registration**. For WCS, you can also use the site’s **Map & School Zones** information to determine the zoned school.

### SCHOOL-04 — schools

Question: When is fall break?

Expected: fresh_current
Mode: general_ai
Reasons: expected_fresh_web_ai, missing_fresh_sources

Answer: It depends on the school district and school year. Which school or district do you mean?

### SENIOR-01 — senior

Question: What services are available for seniors in Franklin?

Expected: local_research
Mode: general_ai
Reasons: expected_local_research_with_source

Answer: I don’t have a Franklin-specific source available, so I can’t reliably name local providers or confirm which services are currently offered. In general, senior services may include: - Transportation and paratransit - Home-delivered meals and congregate dining - Home care, homemaker, and respite services - Health clinics, medication assistance, and wellness programs - Senior centers, recreation, and social activities - Housing assistance and home repairs - Caregiver support and adult day services - Legal, benefits, and long-term-care guidance If you tell me which type of service you need—and whether you mean Franklin, Tennessee—I can narrow the information appropriately.

### SENIOR-02 — senior

Question: Is there transportation for seniors?

Expected: local_research
Mode: official_research_ai
Reasons: raw_markup_or_url

Answer: Yes. Franklin Transit is a City-supported transportation service, and it may serve seniors. Routes, fares, operating hours, and accessibility details can change, so confirm current information with [Franklin Transit](https://www.franklintn.gov/government/departments-a-j/finance-administration).

### SENIOR-03 — senior

Question: Where can I find meal assistance for an older adult?

Expected: local_research
Mode: directory_handoff
Reasons: expected_local_research_with_source

Answer: Yes. You can use Franklin Navigator’s Find Local directory to browse public profiles matching “where can i meal assistance for an older adult?”. Results are informational and do not imply endorsement or availability.

### SENIOR-05 — senior

Question: Where can I find caregiver support?

Expected: local_research
Mode: directory_handoff
Reasons: expected_local_research_with_source

Answer: Yes. You can use Franklin Navigator’s Find Local directory to browse public profiles matching “where can i caregiver support?”. Results are informational and do not imply endorsement or availability.

### TRANSIT-01 — transit

Question: What public transportation is available in Franklin?

Expected: local_research
Mode: official_research_ai
Reasons: raw_markup_or_url

Answer: Franklin’s public transportation option is **Franklin Transit**, a City-supported service. Routes, fares, operating hours, and accessibility details can change, so confirm current information through the [City of Franklin’s official website](https://www.franklintn.gov/government/departments-a-j/finance-administration).

### TRANSIT-02 — transit

Question: Is there accessible transit service?

Expected: local_research
Mode: official_research_ai
Reasons: raw_markup_or_url

Answer: Yes. Franklin Transit is a City-supported transportation service, and accessible transit details are available through the official Franklin Transit source. Routes, fares, hours, and accessibility information can change, so confirm current details at the City of Franklin’s official website: https://www.franklintn.gov/government/departments-a-j/finance-administration

### TRANSIT-04 — transit

Question: How much does Franklin Transit cost?

Expected: fresh_current
Mode: official_research_ai
Reasons: raw_markup_or_url, expected_fresh_web_ai

Answer: Franklin Transit’s current fare isn’t listed in the provided source. Please confirm the latest fare on the [official Franklin Transit page](https://www.franklintn.gov/government/departments-a-j/finance-administration), since fares can change.

### TRANSIT-05 — transit

Question: Where is the nearest transit stop?

Expected: needs_specific_detail
Mode: official_research_ai
Reasons: raw_markup_or_url

Answer: What location in Franklin should I use as your starting point—an address, landmark, or intersection? The nearest transit stop depends on where you are. Franklin Transit details should be confirmed through the City’s official source: https://www.franklintn.gov/government/departments-a-j/finance-administration

### UTIL-02 — utilities

Question: How do I start water service at my new house?

Expected: direct_local_fact
Mode: official_research_ai
Reasons: raw_markup_or_url, expected_verified_fact

Answer: To start water service at your new house in Franklin, contact **Utility Billing at 615-794-4572**, Monday through Friday, **8:00 AM–5:00 PM**, except holidays. For water service or repair issues, call **615-794-4554**, **7:00 AM–4:00 PM**, except holidays.

### UTIL-03 — utilities

Question: My water bill seems wrong. Who handles that?

Expected: direct_local_fact
Mode: official_research_ai
Reasons: raw_markup_or_url, expected_verified_fact

Answer: Utility Billing handles water bill questions. Call **615-794-4572**, Monday–Friday, **8:00 a.m.–5:00 p.m.**, except holidays.

### UTIL-05 — utilities

Question: Where do I report a sewer problem?

Expected: local_research
Mode: official_research_ai
Reasons: raw_markup_or_url

Answer: Report a sewer problem to the City of Franklin’s Water Management Department at **615-794-4554**. The line is available **7:00 AM–4:00 PM, except holidays**.

## Full result inventory

| ID | Category | Result | Expected | Mode |
|---|---|---|---|---|
| AUTO-01 | auto | PASS | directory_handoff | directory_handoff |
| AUTO-02 | auto | FAIL | directory_handoff | general_ai |
| AUTO-03 | auto | FAIL | local_research | general_ai |
| AUTO-04 | auto | FAIL | local_research | general_ai |
| AUTO-05 | auto | PASS | general_plus_local | general_ai |
| BUSINESS-01 | business | PASS | directory_handoff | directory_handoff |
| BUSINESS-02 | business | PASS | directory_handoff | directory_handoff |
| BUSINESS-03 | business | PASS | directory_handoff | directory_handoff |
| BUSINESS-04 | business | PASS | fresh_current | fresh_web_ai |
| BUSINESS-05 | business | FAIL | fresh_current | general_ai |
| CIVIC-01 | civic | PASS | direct_local_fact | verified_fact |
| CIVIC-02 | civic | FAIL | direct_local_fact | general_ai |
| CIVIC-03 | civic | FAIL | local_research | general_ai |
| CIVIC-04 | civic | FAIL | local_research | general_ai |
| CIVIC-05 | civic | PASS | fresh_current | fresh_web_ai |
| COMM-01 | community | PASS | fresh_current | fresh_web_ai |
| COMM-02 | community | FAIL | local_research | general_ai |
| COMM-03 | community | FAIL | local_research | general_ai |
| COMM-04 | community | PASS | fresh_current | fresh_web_ai |
| COMM-05 | community | FAIL | local_research | general_ai |
| ES-01 | spanish | PASS | direct_local_fact | verified_fact |
| ES-02 | spanish | PASS | fresh_current | fresh_web_ai |
| ES-03 | spanish | PASS | direct_local_fact | verified_fact |
| ES-04 | spanish | FAIL | directory_handoff | official_research_ai |
| ES-05 | spanish | PASS | needs_specific_detail | verified_fact |
| EVENT-01 | events | PASS | fresh_current | fresh_web_ai |
| EVENT-02 | events | PASS | fresh_current | fresh_web_ai |
| EVENT-03 | events | PASS | fresh_current | fresh_web_ai |
| EVENT-04 | events | PASS | fresh_current | fresh_web_ai |
| EVENT-05 | events | PASS | context_followup | general_ai |
| FOLLOW-01 | followup | FAIL | context_followup | general_ai |
| FOLLOW-02 | followup | PASS | context_followup_fresh | fresh_web_ai |
| FOLLOW-03 | followup | PASS | context_followup_fresh | fresh_web_ai |
| FOLLOW-04 | followup | PASS | context_followup | general_ai |
| FOLLOW-05 | followup | PASS | context_followup | general_ai |
| HEALTH-01 | health | PASS | directory_or_local_research | directory_handoff |
| HEALTH-02 | health | PASS | directory_handoff | directory_handoff |
| HEALTH-03 | health | FAIL | fresh_current | general_ai |
| HEALTH-04 | health | PASS | fresh_current | fresh_web_ai |
| HEALTH-05 | health | FAIL | local_research | directory_handoff |
| HOUSING-01 | housing | FAIL | local_research | directory_handoff |
| HOUSING-02 | housing | FAIL | local_research | general_ai |
| HOUSING-03 | housing | FAIL | local_research | general_ai |
| HOUSING-04 | housing | FAIL | local_research | general_ai |
| HOUSING-05 | housing | PASS | directory_handoff | directory_handoff |
| JOB-01 | jobs | FAIL | local_research | directory_handoff |
| JOB-02 | jobs | PASS | fresh_current | fresh_web_ai |
| JOB-03 | jobs | FAIL | local_research | general_ai |
| JOB-04 | jobs | FAIL | local_research | general_ai |
| JOB-05 | jobs | PASS | directory_handoff | directory_handoff |
| LEGAL-01 | legal | FAIL | local_research | general_ai |
| LEGAL-02 | legal | PASS | directory_handoff | directory_handoff |
| LEGAL-03 | legal | FAIL | local_research | general_ai |
| LEGAL-04 | legal | FAIL | local_research | directory_handoff |
| LEGAL-05 | legal | PASS | general_plus_local | fresh_web_ai |
| PARK-01 | parks | FAIL | local_research | directory_handoff |
| PARK-02 | parks | FAIL | local_research | official_research_ai |
| PARK-03 | parks | PASS | fresh_current | fresh_web_ai |
| PARK-04 | parks | FAIL | local_research | general_ai |
| PARK-05 | parks | FAIL | fresh_current | official_research_ai |
| PERMIT-01 | permits | PASS | direct_local_fact | verified_fact |
| PERMIT-02 | permits | PASS | direct_local_fact | verified_fact |
| PERMIT-03 | permits | FAIL | local_research | official_research_ai |
| PERMIT-04 | permits | FAIL | local_research | official_research_ai |
| PERMIT-05 | permits | FAIL | local_research | official_research_ai |
| PET-01 | pets | FAIL | directory_or_local_research | general_ai |
| PET-02 | pets | PASS | directory_handoff | directory_handoff |
| PET-03 | pets | FAIL | local_research | general_ai |
| PET-04 | pets | FAIL | local_research | directory_handoff |
| PET-05 | pets | PASS | fresh_current | fresh_web_ai |
| SAFETY-01 | safety | FAIL | local_research | general_ai |
| SAFETY-02 | safety | FAIL | emergency_first | general_ai |
| SAFETY-03 | safety | PASS | emergency_first | fresh_web_ai |
| SAFETY-04 | safety | PASS | needs_specific_detail | general_ai |
| SAFETY-05 | safety | FAIL | local_research | general_ai |
| SAN-01 | sanitation | PASS | needs_specific_detail | official_research_ai |
| SAN-02 | sanitation | FAIL | local_research | official_research_ai |
| SAN-03 | sanitation | FAIL | context_followup | official_research_ai |
| SAN-04 | sanitation | FAIL | local_research | official_research_ai |
| SAN-05 | sanitation | PASS | fresh_current | fresh_web_ai |
| SCHOOL-01 | schools | PASS | needs_specific_detail | verified_fact |
| SCHOOL-02 | schools | FAIL | local_research | official_research_ai |
| SCHOOL-03 | schools | PASS | fresh_current | fresh_web_ai |
| SCHOOL-04 | schools | FAIL | fresh_current | general_ai |
| SCHOOL-05 | schools | PASS | context_followup | verified_fact |
| SENIOR-01 | senior | FAIL | local_research | general_ai |
| SENIOR-02 | senior | FAIL | local_research | official_research_ai |
| SENIOR-03 | senior | FAIL | local_research | directory_handoff |
| SENIOR-04 | senior | PASS | fresh_current | fresh_web_ai |
| SENIOR-05 | senior | FAIL | local_research | directory_handoff |
| TRANSIT-01 | transit | FAIL | local_research | official_research_ai |
| TRANSIT-02 | transit | FAIL | local_research | official_research_ai |
| TRANSIT-03 | transit | PASS | fresh_current | fresh_web_ai |
| TRANSIT-04 | transit | FAIL | fresh_current | official_research_ai |
| TRANSIT-05 | transit | FAIL | needs_specific_detail | official_research_ai |
| UTIL-01 | utilities | PASS | direct_local_fact | verified_fact |
| UTIL-02 | utilities | FAIL | direct_local_fact | official_research_ai |
| UTIL-03 | utilities | FAIL | direct_local_fact | official_research_ai |
| UTIL-04 | utilities | PASS | fresh_current | fresh_web_ai |
| UTIL-05 | utilities | FAIL | local_research | official_research_ai |


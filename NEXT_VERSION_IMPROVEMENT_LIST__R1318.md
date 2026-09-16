# NEXT VERSION IMPROVEMENT LIST — R1318

Release: FR-NAV1.30.18-HF3.13.0
Date: 2026-09-16

1. Expand question-responsiveness acceptance across the full Franklin taxonomy, including utilities, sanitation, schools, permits, civic information, parks/events, housing, healthcare, legal, jobs, businesses, pets, vehicles, home services and member/profile questions.
2. Add a true end-to-end browser test that types representative questions into the production chat UI and verifies the visible first answer, absence/presence of guided buttons, source-link behavior, follow-up context, and topic switching.
3. Measure privacy-safe aggregate non-answer behavior: generic-clarification rate, direct verified-answer rate, grounded-research rate and guide-render rate, without collecting raw resident question text.
4. Continue expanding deterministic verified-answer coverage where current official Franklin facts support it, while keeping time-sensitive or ambiguous questions on current research/LLM paths.
5. Add explicit false-positive tests proving factual questions do not trigger planning questionnaires and ordinary informational questions do not trigger provider/profile handoffs.
6. Expand Spanish deterministic-answer coverage and responsiveness parity beyond the current release gates.
7. Continue improving source freshness and point-of-use currentness for dynamic information such as events, meetings, schedules, deadlines and changing services.
8. Preserve both durable Assistant rules: universal conversation behavior and question responsiveness / verified-fact precedence.
9. Preserve all member, payment, claim, reviewer, publication, privacy, emergency/crisis and directory-neutrality controls.
10. Complete genuine $35/year checkout and genuine reviewed public member publication/readback only when an authorized real member exists; never manufacture evidence.

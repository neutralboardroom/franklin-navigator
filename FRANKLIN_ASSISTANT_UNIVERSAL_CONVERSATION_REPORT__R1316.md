# FRANKLIN ASSISTANT UNIVERSAL CONVERSATION REPORT — R1316

Release: FR-NAV1.30.16-HF3.12.8
Date: 2026-09-15

## Purpose

R1316 converts the R1315 roof-leak example from a narrow success case into a broader conversational reliability standard. Roofing remains one regression example only. The required behavior applies across qualified Franklin resident questions: give a useful direct answer, preserve relevant current-conversation context for natural follow-ups, avoid repeated generic clarification when enough context is already available, and use verified local profile/provider handoff only when the conversation actually indicates that need.

## Runtime qualification

Runtime branch: `franklin-r1293-established-answer-first`
Runtime commit: `9a39d18691f5145b5848ab25e292187fa68e77d2`
Render deploy: `dep-dakj2q0ae00c73bkbii0`
Status: LIVE

The runtime startup gate passed all required checks:
- grounded LLM verification: PASS
- research contract: PASS
- live API roof-permit smoke: PASS
- universal general conversation set: 10/10 PASS
- prior roof-leak two-turn regression: PASS
- combined startup qualification: PASS

The 10 general-conversation cases include six unrelated single-turn resident questions plus four multi-turn threads covering sanitation/recycling, parks, transportation, schools, water service, city meetings, brush-pickup follow-up, accessibility follow-up, phone-number follow-up and school-address follow-up.

## Browser conversation changes

Canonical controller: `/assets/franklin-assistant-r1316.js`

R1316 strengthens current-page conversation context for ordinary references and short continuations such as “it,” “that,” “those,” “what number,” “is there…,” “how…,” and similar English/Spanish follow-up forms. It also broadens conservative service inference for common real-world problem wording so a resident can move naturally from a described problem to a qualified local-service request without restating the entire subject.

Explicit new topics remain able to start a new subject. Provider/profile results are not shown merely because a prior service was discussed; the current conversation still has to indicate an actual provider/contact/service-action need.

## Preserved controls

R1316 preserves the 19,103-profile corpus, 254 Assistant routes, source gating, current-page-only raw chat continuity, no raw-chat persistence to My Franklin, English/Spanish entry points, directory authority, claim/payment/reviewer/publication controls, and the R1314 fail-closed real-member evidence standard.

The following remain pending real production evidence and are not manufactured:
1. first genuine new $35/year V6 customer checkout;
2. first genuine authorized member edit → submit → reviewer approval → public publication → exact public readback.

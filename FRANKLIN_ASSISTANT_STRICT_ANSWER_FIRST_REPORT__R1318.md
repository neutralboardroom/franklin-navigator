# FRANKLIN ASSISTANT STRICT ANSWER-FIRST RESPONSIVENESS REPORT — R1318

Release: FR-NAV1.30.18-HF3.13.0
Date: 2026-09-16
Status: QUALIFIED FOR PRODUCTION PROMOTION

## Defect that triggered R1318

An owner-observed public Franklin Assistant interaction asked:

"do i need a perit to repair my deck"

The Assistant returned a generic Franklin home-project response and an automatic project-type questionnaire instead of directly answering the permit question.

The response was locally grounded but not sufficiently responsive to the user's actual question. This exposed a release-gate weakness: prior acceptance could pass a response for being grounded and topical even when it did not directly answer the requested fact.

## Root cause

1. The runtime already contained a sufficiently verified deterministic Franklin permit answer.
2. The architecture nevertheless passed that verified answer through the LLM for rewriting.
3. The LLM could replace a direct deterministic answer with a broader generic workflow.
4. The browser controller automatically appended a guide/questionnaire after nearly every answered question.
5. Runtime acceptance emphasized grounding and topic relevance more than exact question responsiveness.

## R1318 corrective architecture

### Verified-fact precedence

When `knownAnswer()` has a sufficiently verified Franklin answer:
- the runtime now returns it directly;
- `answerMode = verified_known_direct`;
- `llmUsed = false`;
- official source metadata remains attached;
- the LLM is not allowed to rewrite the verified answer before display.

The LLM remains available for grounded research and synthesis when a deterministic verified answer does not exist.

### Direct deck answer

For deck repair permit questions, the verified English answer begins:

"Yes. For deck repair in Franklin, plan on needing a building permit."

It then states the City rule that permits are required for decks and most repair work, and gives Building & Neighborhood Services at 615-794-7012 for a minor/in-kind scope confirmation.

Spanish receives the corresponding direct verified answer.

### Guide suppression

The R1318 public controller no longer automatically appends a questionnaire to every factual answer.

A guide is now limited to situations where it materially helps, including:
- planning / next-step requests;
- explicit local-option/provider requests;
- application/permit-step requests;
- contact/website requests;
- document workflows;
- qualified service-action handoffs.

Ordinary factual questions can end with the answer.

## Durable governance

R1318 adds:

`DURABLE_RULE__QUESTION_RESPONSIVENESS_AND_VERIFIED_FACT_PRECEDENCE.md`

This is additive to:

`DURABLE_RULE__UNIVERSAL_FRANKLIN_ASSISTANT_CONVERSATION_STANDARD.md`

A response must now be both:
1. source-grounded/correct enough for its claim; and
2. responsive to the question actually asked.

## Runtime qualification

Final runtime commit:
`80827e5365c8d34ff2468431702bc3e02c556aff`

Runtime deploy:
`dep-dal2mqqd0e5s738b8eu0`

Final startup event:
`franklin_assistant_startup_qualified`

Final gates:
- llmOk = true
- researchOk = true
- liveOk = true
- generalConversationOk = true
- spanishConversationOk = true
- responsivenessOk = true
- roofLeakOk = true

Acceptance:
- English general conversation: 10 / 10 PASS
- Spanish conversation: 6 / 6 PASS
- exact-question responsiveness: 4 / 4 PASS
- roof leak -> repair regression: PASS
- research contract: PASS
- live API smoke: PASS

Exact responsiveness cases:
1. "do i need a permit to repair my deck" — PASS, verified_known_direct
2. "what time is City Hall open?" — PASS, verified_known_direct
3. "which school is this address zoned for?" — PASS, verified_known_direct and asks only for the exact street address genuinely needed
4. "¿necesito un permiso para reparar mi terraza?" — PASS, verified_known_direct

## Public source changes

- `/assets/franklin-assistant-r1318.js`
- R1318 loader in `/assets/hf36.js`
- cache-busted English/Spanish home and Assistant entry points
- source syntax checks PASS
- R1318 direct-answer responsiveness workflow added

## Preserved controls

R1318 does not weaken:
- 19,103-profile directory authority;
- 254 Assistant routes;
- current-page conversation privacy;
- no-invented-facts/source gating;
- emergency/crisis behavior;
- directory neutrality/no paid ranking;
- claim/representation controls;
- payment controls;
- reviewer/publication controls;
- R1314 real-member evidence policy.

The first genuine $35/year production checkout and first genuine authorized reviewed member publication/readback remain pending and must not be fabricated.

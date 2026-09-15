# FRANKLIN ASSISTANT BILINGUAL UNIVERSAL CONVERSATION REPORT — R1317

Release: FR-NAV1.30.17-HF3.12.9
Date: 2026-09-15
Status: QUALIFIED FOR PRODUCTION PROMOTION

## Owner rule

R1317 implements and preserves:
`DURABLE_RULE__UNIVERSAL_FRANKLIN_ASSISTANT_CONVERSATION_STANDARD.md`

A specific owner test example never defines the scope of Franklin Assistant behavior. Roofing remains only one regression example. The release standard is universal conversational behavior across qualified Franklin resident intents.

## Material changes

1. Added a reusable, directly testable browser context core:
   - `/assets/franklin-assistant-context-r1317.js`
   - preserves natural same-conversation references and short follow-ups;
   - supports English and Spanish continuation language;
   - prevents stale context from contaminating explicit fresh subjects;
   - conservatively infers qualified local-service context for service handoff.

2. Added R1317 public controller:
   - `/assets/franklin-assistant-r1317.js`
   - consumes the tested context core;
   - keeps provider/profile handoff conditional on actual service/provider action intent;
   - preserves answer-first behavior and current-page-only chat context.

3. Added privacy-safe categorical quality signals only:
   - answer_known
   - answer_research
   - answer_clarify
   - answer_other
   - runtime_failure
   - repeated_clarification
   - provider_handoff
   No raw resident question is added to quality telemetry or issue alerts.

4. Added fresh-topic reset regressions, including cases where a prior roof/plumbing conversation must not contaminate later City Hall or parks questions.

5. Expanded runtime official-source matching to bilingual English/Spanish terms across city contact, utility/water, permits, sanitation/recycling, meetings/calendar, parks, transit, schools and county/property sources.

6. Corrected official-source classification so trusted Franklin/Williamson/WCS/FSSD authority follows the source domain as well as seed provenance.

7. Corrected generic-clarification detection so legitimate partial uncertainty inside a substantive grounded answer is not mislabeled as a generic clarification loop. The rejection now targets the actual fallback pattern requiring both the failure phrase and the request for one more detail.

## Runtime qualification

Final runtime commit:
`3a9593c387bec8b5b2f0273931d96662c8e69df4`

Final runtime deploy:
`dep-dakjlv9594qs73eab8n0`

Final runtime status:
LIVE

Startup qualification:
PASS

Required gates:
- grounded LLM verification: PASS
- research contract: PASS
- live API roof-permit smoke: PASS
- English universal conversation set: 10 / 10 PASS
  - 6 unrelated single-turn resident questions
  - 4 multi-turn context threads
- Spanish conversation set: 6 / 6 PASS
  - 3 unrelated single-turn resident questions
  - 3 multi-turn context threads
- roof leak -> repair two-turn regression: PASS

Final startup event:
`franklin_assistant_startup_qualified`

Final event booleans:
- llmOk = true
- researchOk = true
- liveOk = true
- generalConversationOk = true
- spanishConversationOk = true
- roofLeakOk = true

## Fail-closed qualification history

Earlier R1317 attempts were NOT treated as production-qualified when the expanded gates exposed:
- brittle LLM wording assertions;
- Spanish source-grounding gaps caused by English-first official-source matching;
- an overly broad generic-clarification detector;
- official-domain sources reached through search not receiving official classification.

Those failures were corrected before production promotion. No 9/10 or partially grounded result was accepted as sufficient.

## Public browser/source acceptance

Source-side R1317 acceptance includes:
- shared context core syntax PASS;
- R1317 controller syntax PASS;
- loader syntax PASS;
- privacy-safe health code syntax PASS;
- context carry-forward regression PASS;
- fresh-topic reset regression PASS;
- English/Spanish continuation coverage;
- conservative provider/service handoff contract;
- cache-busted English/Spanish home and Assistant entry points.

Workflow:
`.github/workflows/r1317-assistant-conversation.yml`

No GitHub Actions success is claimed here unless separately recorded by GitHub. The release qualification claim is grounded in the verified runtime startup gate and source-level checks above.

## Preserved controls

R1317 does not weaken:
- 19,103-profile directory authority;
- 254 Assistant routes;
- source gating and no-invented-facts policy;
- emergency/crisis behavior;
- directory neutrality / no paid ranking;
- claim and representation controls;
- payment controls;
- reviewer/publication controls;
- R1314 fail-closed real-member evidence policy.

The first genuine $35/year production checkout and first genuine authorized reviewed member publication/readback remain pending real authorized users and must not be manufactured.

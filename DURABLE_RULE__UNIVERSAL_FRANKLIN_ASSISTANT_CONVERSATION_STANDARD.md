# DURABLE RULE — UNIVERSAL FRANKLIN ASSISTANT CONVERSATION STANDARD

Authority: Roger owner rule
Applies to: Franklin Navigator / Franklin Assistant and every future material successor until Roger explicitly changes it
Effective: 2026-09-15

## Core rule

A specific owner test example never defines the scope of Franklin Assistant behavior. Roofing was one test example only.

Franklin Assistant must work conversationally across all qualified Franklin resident intents and supported product areas. Users should be able to ask a normal first question, receive a useful direct answer, and continue naturally in the same conversation without restating information the Assistant already has.

## Required behavior

1. Preserve relevant current-conversation context for natural follow-ups, pronouns, short continuations, requests for phone/address/hours, comparisons, “what about…”, “what should I do next?”, and equivalent supported-language phrasing.
2. Do not repeatedly ask generic clarification questions when the existing conversation already supplies enough context to answer.
3. Allow an explicit new topic to replace stale context rather than contaminating the new answer.
4. Use verified Franklin routes, source-grounded research and directory/profile information according to their existing authority and freshness rules.
5. Show provider/profile handoffs only when the current conversation actually indicates a provider, contact or service-action need. Never infer a commercial/provider handoff merely from stale prior context.
6. Preserve English/Spanish parity and expand acceptance coverage in both languages.
7. Keep raw chat context current-page/session scoped under the existing privacy policy. Do not persist raw questions to My Franklin or telemetry solely for conversation-quality monitoring.
8. Monitor failures and quality regressions with privacy-safe categorical signals only; never place raw resident questions or sensitive content in issue alerts.
9. Every material Assistant release must test multiple unrelated resident domains and multi-turn threads. Passing one narrow example is never sufficient evidence of universal conversational reliability.
10. Preserve existing emergency/crisis behavior, source gating, no-invented-facts rule, directory neutrality, member/payment/reviewer/publication controls and all stronger successor rules.

## Release governance

Each material release must document:
- domains and conversation patterns exercised;
- single-turn and multi-turn acceptance counts;
- English/Spanish coverage;
- regression/failure results;
- any provider/profile handoff tests;
- privacy-safe monitoring changes;
- known gaps and the Next Version Improvement List.

This durable rule is a release gate. A future builder must not narrow the rule to roofing, home repair, or any other example category without Roger explicitly changing this owner rule.

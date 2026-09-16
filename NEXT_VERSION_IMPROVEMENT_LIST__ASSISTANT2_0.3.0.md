# NEXT VERSION IMPROVEMENT LIST — FRANKLIN ASSISTANT INTERNAL 0.3.0

1. Expand the acceptance bank beyond 100 questions, emphasizing paraphrases, misspellings, ambiguous wording, and multi-turn follow-ups so the current 100 cases never become the scope of the Assistant.
2. Add human-semantic review sampling on top of automated scoring, especially for local-resource answers where a technically sourced response may still be unhelpful or overly broad.
3. Add stronger source-quality weighting so first-party government/nonprofit sources outrank weaker local discovery sources when both are available.
4. Add source freshness/expiry rules for changing schedules, fares, school calendars, events, programs, hours, vaccines, restaurants and open-now queries.
5. Expand English/Spanish provider-intent normalization without broadening Find Local enough to misroute informational resource questions.
6. Add address/geolocation-aware workflows only when genuinely needed, with clear privacy boundaries and no unnecessary collection.
7. Improve current business/open-now discovery using trusted local evidence while preserving no-paid-ranking and no-endorsement rules.
8. Add browser-level end-to-end testing of same-page rendering for local_web_ai, fresh_web_ai, directory_handoff, verified_fact and multi-turn follow-up answers.
9. Add regression coverage for attachment questions and voice-entered questions without sending raw attachment text to web search.
10. Preserve public branding as "Franklin Assistant", inline same-page answers, Clear/Speak/Attach controls, and the clean-room architecture.
11. Preserve all unrelated Franklin Navigator functionality.
12. Continue recording exact live-run evidence for every material Assistant behavior release.

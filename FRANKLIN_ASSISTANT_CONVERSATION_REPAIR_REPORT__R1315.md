# FRANKLIN ASSISTANT CONVERSATION REPAIR REPORT — R1315

Release: FR-NAV1.30.15-HF3.12.7
Community: FRANKLIN_TN
Date: 2026-09-15

## User-visible failure reproduced from live evidence

The reported conversation was:
- "my roof is leaking."
- "i need it repaired."

The browser displayed the generic "I could not verify..." response twice.

Live Assistant runtime logs exposed the root cause without logging the user's raw question: the general research branch threw `research is not defined`. Known-answer smoke prompts still passed, which allowed the narrower roof-permit startup check to miss the broken general-question branch.

## Repair

Runtime commit: 8b0248bbf75da1d27f938bb4f77245c6f80dc48d
Runtime deploy: dep-dakg6mp42hec73afoob0
Runtime status: LIVE
Runtime release: FR-NAV1.30.15-HF3.12.7

Changes:
- restored the missing public/official research function;
- official Franklin seeds now remain usable when public-web search is temporarily unavailable;
- added a direct roof-leak/roof-repair grounding path so a simple urgent homeowner question receives useful safety-first guidance instead of an unnecessary interrogation;
- added an exact two-turn startup acceptance using "my roof is leaking." followed by "i need it repaired.";
- retained current-conversation context on the second turn;
- added a resilient browser fallback for roof leak/repair if the answer runtime is unavailable;
- added a cache-busted R1315 browser controller on the English and Spanish Assistant entry pages and Franklin home page.

## Live acceptance evidence

Runtime startup:
- LLM verification: PASS
- live roof-permit API smoke: PASS
- exact roof-leak two-turn smoke: PASS
- first turn HTTP 200 / llm_grounded_known
- second turn HTTP 200 / llm_grounded_known
- no "could not verify" / "one more detail" response in either acceptance turn

Browser acceptance:
- GitHub Actions run 34948063356: SUCCESS
- R1315 browser controller syntax: PASS
- global loader syntax: PASS
- English Assistant cache-bust contract: PASS
- Spanish Assistant cache-bust contract: PASS
- roof-leak fallback contract: PASS

## Durable lesson

Assistant acceptance cannot rely only on curated known-answer prompts. Every material Assistant runtime release should include at least one general non-known branch check and at least one short conversational follow-up check so a missing research/general-answer path cannot hide behind passing narrow smoke tests.

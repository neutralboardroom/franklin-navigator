# Next Version Improvement List — FR-NAV1.30.3-HF3.11.3

R1303 activates and verifies the configured OpenAI-backed language path while retaining Franklin grounding, deterministic/source-backed fallbacks, direct-answer UX, reading-first chat behavior, and accurate AI privacy disclosures.

1. Add privacy-safe aggregate launch monitoring for answer mode, OpenAI success/fallback rate, latency, timeouts and error class without logging resident question text.
2. Expand and refine the source-grounded answer set from actual launch questions, especially changing civic facts, events, schools, transportation, health, housing, permits and local-service discovery.
3. Continue mobile keyboard, Safari/iOS, Android/Chrome, screen-reader, Spanish, voice, attachment and long-conversation regression coverage.
4. Reconcile newer Profile Factory and Local Investigator candidates only after the required accepted SCC/consumer pointers and point-of-use currentness gates exist; do not self-accept candidates.
5. Add operator-visible budget/latency guardrails for OpenAI usage and preserve immediate source-backed fallback when the provider is unavailable.
6. Continue prompt-injection, unsafe legal/medical/financial guidance, hallucination, stale-source, privacy and cross-community leakage testing against the live grounded path.

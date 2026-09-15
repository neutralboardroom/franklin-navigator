# Next Version Improvement List — FR-NAV1.30.5-HF3.11.5

1. Add browser-level synthetic coverage for every major Assistant intent family: civic routes, permits, schools, events, transportation, health, legal, restaurants, home services, professional services and generic directory categories.
2. Add deterministic conversation fixtures for requested counts, “best/top” wording, “ok/yes/show me” continuations, website/phone/email follow-ups, source requests, application-link requests and topic switching.
3. Continue improving route ranking quality across all 254 Assistant routes while preserving direct answers first and avoiding unnecessary page pushing.
4. Add privacy-safe aggregate telemetry for route-intent detection, directory-hit success, OpenAI answer mode, fallback rate, latency and failed follow-up continuation without logging resident question text.
5. Continue expanding colloquial Spanish follow-ups and generic local-provider/category discovery beyond the fixed service vocabulary.
6. Reconcile newer Profile Factory and Local Investigator handoffs only through accepted authority/currentness gates; preserve Franklin community isolation and correction/suppression rules.

# NEXT VERSION IMPROVEMENT LIST — R1315

Release: FR-NAV1.30.15-HF3.12.7
Date: 2026-09-15

1. Expand live startup conversation acceptance beyond roof repair to several ordinary resident intents that exercise the general research/LLM branch.
2. Add a regression that explicitly fails startup qualification if the general research function is missing or throws.
3. Add response-quality checks that reject repeated generic clarification when the prior turn already supplies the needed context.
4. Continue improving local-service handoff so "I need it repaired" after a known home-service problem can smoothly offer relevant Franklin providers without forcing the user to restate the service.
5. Preserve answer-first behavior, same-conversation context, English/Spanish parity, privacy-safe logging, source gating and no unnecessary redirects.
6. Continue R1314 member-profile readiness work without weakening claim, payment, reviewer or publication controls.

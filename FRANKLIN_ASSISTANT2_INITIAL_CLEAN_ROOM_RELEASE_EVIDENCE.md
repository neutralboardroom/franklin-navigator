# FRANKLIN ASSISTANT 2 — INITIAL CLEAN-ROOM RELEASE EVIDENCE

Assistant version: FRANKLIN-ASSISTANT2-0.1.0
Franklin site release target: FR-NAV1.30.19-HF3.13.1
Date: 2026-09-16

## Scope

Assistant subsystem only. The rest of Franklin Navigator is preserved.

The current public visual shell is intentionally retained:
- same Franklin home layout;
- same Ask Franklin card;
- same textarea/button/chip presentation;
- same typography and general styling;
- same English/Spanish page structure.

## Retired Assistant 1 state

Public archive:
- branch: archive/franklin-assistant-v1-r1318
- commit: baec8d046e139cece05e980a2019bd5f3f3443b6

Runtime archive:
- branch: archive/franklin-assistant-v1-runtime-r1318
- commit: 80827e5365c8d34ff2468431702bc3e02c556aff

These archives are reference/rollback evidence. Assistant 2 does not import their controller/runtime architecture.

## Clean runtime

Runtime branch commit:
- d8d1f02d750696d384c7960df3d912366693e2b5

Runtime deploy:
- dep-dal2ti2d0e5s738bu6cg

Render status:
- LIVE

Runtime architecture:
- one endpoint: /api/v2/answer
- deterministic verified fact precedence;
- explicit Find Local handoff only for explicit find/search requests;
- small trusted official-source catalog;
- AI synthesis only when deterministic fact is unavailable;
- current-page conversation supplied by browser;
- no old guide/profile/router stack.

## Runtime self-test result

7 / 7 PASS:
1. English deck permit direct answer.
2. Spanish deck permit direct answer.
3. City Hall hours nuance.
4. School-zone exact-address clarification.
5. Franklin water-service phone.
6. Explicit Find Local roofer handoff.
7. Fresh-topic reset after unrelated prior context.

Final runtime event:
- assistant2_startup_qualified

## Clean browser controller

Canonical public controller:
- /assets/franklin-assistant-v2.js?v=assistant2-010

It:
- talks only to /api/v2/answer;
- stores conversation only in current-page memory;
- renders plain answer text;
- renders official-source links;
- renders a simple internal action only when the runtime returns one;
- does not import FranklinAssistantCore or old R12xx/R13xx controllers;
- does not use old guide/questionnaire/profile-injection logic.

## Public entry-point boundary

Exact committed-file validation: PASS.

Validated pages:
- / (English home)
- /es/ (Spanish home)
- /assistant/
- /es/asistente/

Each:
- loads exactly one clean Assistant 2 controller;
- does not load /assets/navigator-bot.js;
- cache-busts the updated hf36.js.

hf36.js:
- parses successfully;
- no longer invokes loadAssistantR1318().

The remaining r24/r27 presentation code cannot move Assistant 2 output because the clean controller marks its shell as the canonical active Assistant before those presentation scripts initialize.

## Unrelated-site preservation

No intended changes to:
- directory/profile corpus;
- profile pages;
- membership;
- payments;
- claims;
- reviewer/publication state;
- community pages;
- activities/events pages;
- Get It Done;
- My Franklin;
- SEO architecture;
- accessibility architecture;
- Spanish site outside Assistant entry wiring;
- business/member tooling;
- deployment settings.

## Known initial limits

Assistant 2 intentionally starts smaller than Assistant 1.
It does not yet restore:
- automatic profile cards;
- automatic guide/questionnaire routing;
- broad arbitrary web search;
- file analysis;
- complex service/provider inference;
- legacy custom routing layers.

Those features may only return after the core answer behavior is proven reliable and each feature can be added independently without reconnecting the retired stack.

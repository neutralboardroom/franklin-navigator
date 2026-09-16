# FRANKLIN ASSISTANT 2 — CLEAN-ROOM ARCHITECTURE

Version: FRANKLIN-ASSISTANT2-0.1.0
Date: 2026-09-16
Status: Initial clean rebuild

## Why this exists

Franklin Assistant 1 accumulated multiple overlapping browser and runtime layers over many releases. A user could ask a simple question and receive a generic workflow even when a direct verified answer already existed. The owner approved retiring that architecture and rebuilding the Assistant from scratch while preserving the rest of Franklin Navigator.

## Hard isolation boundary

Assistant 2 may reuse:
- the existing visual shell on Franklin home and Assistant pages;
- verified source facts and official source URLs;
- the existing Find Local directory as a neutral destination;
- existing accessibility, privacy and site styling.

Assistant 2 must NOT inherit or depend on:
- FranklinAssistantCore;
- FranklinAssistantR12xx/R13xx controller chains;
- navigator-bot.js routing logic;
- old guide/questionnaire selection;
- old profile injection/ranking logic;
- old conversation-context regex stack;
- old automatic dialog answer mover;
- old Assistant runtime decision tree.

The complete pre-rebuild public state is frozen at:
- branch: archive/franklin-assistant-v1-r1318
- commit: baec8d046e139cece05e980a2019bd5f3f3443b6

The complete pre-rebuild runtime is frozen at:
- branch: archive/franklin-assistant-v1-runtime-r1318
- commit: 80827e5365c8d34ff2468431702bc3e02c556aff

## Assistant 2 request flow

1. User asks a question in the existing Franklin visual form.
2. One clean browser controller sends:
   - current question;
   - language;
   - at most the recent current-page conversation.
3. One clean runtime endpoint handles the request.
4. Runtime precedence:
   - verified deterministic Franklin fact, when available;
   - explicit neutral Find Local handoff for an explicit find/search request;
   - official-source research using a small trusted source catalog;
   - AI synthesis constrained by those sources;
   - clearly labeled general guidance when local evidence is insufficient.
5. Browser displays:
   - the answer;
   - official source links when applicable;
   - a simple internal action link only when the user explicitly asked to find something.

## Non-negotiable behavior

- Answer the actual question first.
- Do not turn factual questions into generic questionnaires.
- Do not rewrite deterministic verified facts through the AI.
- Do not invent Franklin facts, hours, requirements, prices, events or providers.
- Ask one specific clarification only when it is genuinely required.
- Do not auto-inject providers or paid/member content into ordinary answers.
- Do not rank or endorse directory results.
- Keep conversation history current-page only.
- Do not send raw question text to analytics or issue monitoring.
- Changing Assistant 2 must not mutate unrelated Franklin site functionality.

## Public integration

The existing visual shell is intentionally preserved.
The four Assistant entry pages load:
- /assets/franklin-assistant-v2.js?v=assistant2-010

They no longer load:
- /assets/navigator-bot.js

hf36.js no longer invokes the legacy progressive Assistant loader.

## Initial qualification

Runtime self-tests cover:
- English deck-permit direct answer;
- Spanish deck-permit direct answer;
- City Hall hours nuance;
- address-dependent school clarification;
- Franklin water service phone;
- explicit Find Local roofer handoff;
- fresh-topic reset after unrelated prior conversation.

Public boundary tests verify:
- only the clean controller is wired at Assistant entry points;
- legacy navigator-bot is absent there;
- the clean controller does not import legacy Assistant cores;
- the old progressive loader is not invoked.

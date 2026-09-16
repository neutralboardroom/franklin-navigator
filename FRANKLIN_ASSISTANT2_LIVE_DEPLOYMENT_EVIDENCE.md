# FRANKLIN ASSISTANT 2 — LIVE DEPLOYMENT EVIDENCE

Date: 2026-09-16

## Public Franklin site

Release:
FR-NAV1.30.19-HF3.13.1

Assistant:
FRANKLIN-ASSISTANT2-0.1.0

Promotion commit:
67d4ffe26926e77707c6cf46adc3c0d3d376170c

Render public-site deploy:
dep-dal2uutbedkc73b2fqt0

Render status:
LIVE

## Assistant runtime

Runtime commit:
d8d1f02d750696d384c7960df3d912366693e2b5

Render runtime deploy:
dep-dal2ti2d0e5s738bu6cg

Runtime status:
LIVE

Runtime startup qualification:
7 / 7 PASS

## Public clean-room validation before deploy

PASS:
- clean Assistant 2 controller JavaScript parses;
- hf36.js parses;
- English home loads Assistant 2 exactly once;
- Spanish home loads Assistant 2 exactly once;
- English Assistant page loads Assistant 2 exactly once;
- Spanish Assistant page loads Assistant 2 exactly once;
- none of those four pages loads navigator-bot.js;
- Assistant 2 imports no FranklinAssistantCore / R12xx / R13xx controller;
- Assistant 2 contains no old guide/profile-injection stack;
- hf36.js does not invoke the legacy R1318 progressive Assistant loader.

## R1318 -> R1319 isolation comparison

The GitHub commit comparison showed only:
- Assistant 2 controller;
- one legacy-loader invocation removal;
- four Assistant entry-page script-reference changes;
- Assistant 2 tests/workflow;
- Assistant 2 architecture/evidence/next-version documents;
- production release metadata.

No directory/profile/member/payment/community/content implementation file was changed.

## Rollback archives

Public Assistant 1 archive:
archive/franklin-assistant-v1-r1318
baec8d046e139cece05e980a2019bd5f3f3443b6

Runtime Assistant 1 archive:
archive/franklin-assistant-v1-runtime-r1318
80827e5365c8d34ff2468431702bc3e02c556aff

## Verification limitation

The independent external page-scrape connector could not fetch the live page because its provider account had insufficient scrape credits. No independent scrape/browser verification is claimed here. Render's deployment record confirms that the exact promoted commit reached LIVE status.

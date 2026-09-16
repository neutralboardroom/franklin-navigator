# FRANKLIN ASSISTANT CURRENT-ANSWER PRESENTATION REPAIR — 0.2.1

Date: 2026-09-16
Public product name: Franklin Assistant
Internal build: FRANKLIN-ASSISTANT2-0.2.1
Franklin site release target: FR-NAV1.30.21-HF3.13.3

## Owner-observed defect

A live "what is happening in Franklin this weekend?" answer successfully retrieved current events, but the presentation was poor:
- raw Markdown markers such as ** appeared visibly;
- a long raw URL appeared inside the answer body;
- multiple events were packed into a dense paragraph;
- the same source domains appeared repeatedly;
- source names were shown as bare domains instead of clear labels.

## Repair

Fresh current-information answers now:
- request plain text only from the model;
- prohibit Markdown, asterisks, inline URLs and citation syntax in the answer body;
- sanitize residual Markdown/URLs server-side;
- preserve one summary line followed by one event/item per line;
- render the summary as a paragraph and event/item lines as a readable list;
- deduplicate sources by hostname;
- normalize source names to clear labels such as City of Franklin, Visit Franklin, Williamson County Parks & Recreation, Williamson County Public Library and Franklin Theatre.

Normal answers remain inline on the same page.

## Runtime qualification

Runtime commit:
e9ee3e3393d614c8102679e4d89b4ccac03f6dfb

Runtime deploy:
dep-dal40srm8hqs73er78c0

Runtime status:
LIVE

Startup qualification:
8 / 8 PASS

The fresh-weekend-search gate now also requires:
- no Markdown asterisks;
- no raw http/https URLs in the answer body;
- no duplicate source hostnames.

## Browser qualification

Canonical controller:
/assets/franklin-assistant.js?v=assistant-021

Checks:
- controller syntax PASS;
- loader syntax PASS;
- clean-room boundary test syntax PASS;
- all four Assistant entry pages load the canonical controller exactly once;
- no entry page loads navigator-bot.js;
- no entry page loads the retired v2-named public asset;
- event-list formatting present;
- source deduplication present;
- public global is FranklinAssistant, not FranklinAssistant2;
- no visible "Franklin Assistant 2" label in the controller.

## Scope isolation

No directory/profile/member/payment/claim/reviewer/community/content implementation file is intentionally changed by this repair.

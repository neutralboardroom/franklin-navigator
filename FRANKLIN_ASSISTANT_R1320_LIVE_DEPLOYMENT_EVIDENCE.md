# FRANKLIN ASSISTANT R1320 LIVE DEPLOYMENT EVIDENCE

Date: 2026-09-16

Public product name:
Franklin Assistant

Franklin site release:
FR-NAV1.30.20-HF3.13.2

Public promotion commit:
5d5950649f92b29fea7dc023383b493116013698

Public Render deploy:
dep-dal3dn6k1f9s73diehgg

Public deploy status:
LIVE

Runtime internal release:
FRANKLIN-ASSISTANT2-0.2.0

Runtime commit:
ec9ec0bfbb8dfb18074ec701541c6a5303fc5b6e

Runtime Render deploy:
dep-dal3cmad0e5s738dfc0g

Runtime status:
LIVE

Runtime startup qualification:
8 / 8 PASS

Validated behaviors:
- direct deck-permit answer;
- Spanish deck-permit answer;
- City Hall-hours nuance;
- school-zone exact-address clarification;
- water-service phone;
- explicit neutral Find Local roofer handoff;
- freshness-sensitive weekend search;
- fresh-topic reset.

Public presentation:
- user-facing name is Franklin Assistant;
- no visible generation number in controller UI;
- normal answers remain inline on the same page;
- no normal-answer popup/modal restored.

Restored controls:
- Clear / new question;
- Speak when the browser exposes SpeechRecognition/webkitSpeechRecognition;
- Attach document, screenshot or photo.

Attachment handling:
- browser/device text extraction;
- raw attachment contents are not submitted to web search in the current flow;
- 8 MB limit;
- supported: PDF, DOCX, TXT, MD, CSV, JSON, HTML, PNG, JPG/JPEG, WebP.

Fresh-information repair:
- freshness-sensitive questions invoke required web search;
- search is limited to governed Franklin/local domains;
- the Assistant is instructed to return actual matching dated items rather than only pointing to a calendar.

Repository isolation:
- changes are limited to the Franklin Assistant subsystem, its four entry-page script references, tests, evidence, durable presentation rule and release metadata;
- no unrelated product subsystem is intentionally changed.

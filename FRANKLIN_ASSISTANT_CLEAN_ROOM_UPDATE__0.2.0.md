# FRANKLIN ASSISTANT CLEAN-ROOM UPDATE — 2026-09-16

Public product name: Franklin Assistant
Internal build: FRANKLIN-ASSISTANT2-0.2.0
Franklin site release target: FR-NAV1.30.20-HF3.13.2

## Owner-directed presentation rules

- Publicly show only "Franklin Assistant".
- Keep internal generation/version names private from ordinary UI.
- Keep normal answers inline on the same page.
- Do not restore popup/modal answer presentation.

## Restored clean controls

The clean controller now provides:
- Clear / new question;
- Speak when browser SpeechRecognition / webkitSpeechRecognition is supported;
- Attach document, screenshot or photo.

Attachment types:
- PDF
- DOCX
- TXT
- MD
- CSV
- JSON
- HTML
- PNG
- JPG/JPEG
- WebP

Attachment size limit:
- 8 MB

Attachment handling:
- text extraction is performed in the browser/device;
- raw attachment contents are not submitted to Franklin web search in this flow;
- PDF uses pdf.js in-browser;
- DOCX uses mammoth in-browser;
- image text uses Tesseract.js in-browser;
- sensitive-data warning remains part of the product flow.

## Inline answer behavior

Answers remain in the existing Franklin page card/output area.
No normal answer is moved to a popup or modal.

## Current-information repair

The prior owner test:
"What is happening in Franklin this weekend?"

was insufficient because the Assistant only pointed to a calendar.

The runtime now detects freshness-sensitive questions such as:
- today
- tonight
- tomorrow
- this weekend
- this week
- current/latest events
- meetings/agendas
- right-now schedules

For these questions it performs a required current web search restricted to trusted Franklin/local domains and answers with actual matching current items when available, rather than merely telling the user to open a calendar.

Allowed search domains include:
- franklintn.gov
- visitfranklin.com
- wcparksandrec.com
- wcpltn.org
- franklintheatre.com
- wcs.edu
- fssd.org
- williamsoncounty-tn.gov
- franklinnavigator.com

The search is location-biased to Franklin, Tennessee.

## Runtime qualification

Runtime commit:
ec9ec0bfbb8dfb18074ec701541c6a5303fc5b6e

Runtime deploy:
dep-dal3cmad0e5s738dfc0g

Status:
LIVE

Startup qualification:
8 / 8 PASS

Tests:
1. deck permit — English
2. deck permit — Spanish
3. City Hall hours
4. school-zone exact-address clarification
5. water-service phone
6. explicit Find Local roofer handoff
7. fresh weekend search
8. fresh-topic reset

## Browser qualification

Canonical public controller:
/assets/franklin-assistant.js?v=assistant-020

Checks:
- JavaScript syntax PASS
- clean boundary test syntax PASS
- all four Assistant entry pages use the public controller name
- no entry page loads navigator-bot.js
- no entry page loads the retired v2-named public asset
- no FranklinAssistantCore dependency
- no old guide/profile-injection stack
- public-facing controller text does not contain "Franklin Assistant 2"
- Clear control present
- Speak implementation present
- Attach implementation present
- attachment-on-device mode present

## Unrelated product preservation

No intended changes to directory/profile data, member/payment/claim/reviewer state, community pages, SEO, content modules, business tooling, or other Franklin Navigator subsystems.

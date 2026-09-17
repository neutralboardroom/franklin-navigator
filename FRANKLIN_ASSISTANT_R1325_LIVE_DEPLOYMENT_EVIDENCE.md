# FRANKLIN ASSISTANT R1325 LIVE DEPLOYMENT EVIDENCE

Date: 2026-09-17

Release:
FR-NAV1.30.25-HF3.13.7

Promotion commit:
3e6d7845687233eeaeb527bf4f1a9628fe7351b0

Public Render deploy:
dep-dalk1qm1egvs73esiorg

Public deploy status:
LIVE

Internal Assistant controller:
FRANKLIN-ASSISTANT2-0.3.4

Public controller:
/assets/franklin-assistant.js?v=assistant-034

Owner-approved UX change:
- once a conversation begins, the visible conversation thread stays above;
- the same existing question form moves below the latest answer/results;
- the form label becomes "Ask a follow-up";
- Attach, Clear / new question, Speak and Ask Franklin move with the same composer;
- follow-up questions append to the same visible conversation;
- Clear / new question resets the thread and restores the original starting layout.

Design choice:
- the full composer is not made fixed/sticky because the attachment/privacy/voice controls would obscure long provider cards and other answer content on common laptop/mobile viewports;
- the composer instead remains directly after the newest conversation output.

Preserved behavior:
- public name remains Franklin Assistant;
- inline same-page answers;
- visible You / Franklin conversation turns;
- Clear / new question;
- Speak;
- Attach;
- inline provider profiles;
- provider relevance repair;
- directory integrity and suppression gates;
- no normal popup/modal answers;
- no unrelated Franklin product implementation intentionally changed.

Regression test:
tests/franklin-assistant-composer-layout.cjs

Next Version Improvement List:
NEXT_VERSION_IMPROVEMENT_LIST__ASSISTANT2_0.3.4.md

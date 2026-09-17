# FRANKLIN ASSISTANT FOLLOW-UP COMPOSER POSITION — INTERNAL 0.3.4

Date: 2026-09-17
Public product name: Franklin Assistant
Internal browser controller: FRANKLIN-ASSISTANT2-0.3.4
Franklin release target: FR-NAV1.30.25-HF3.13.7

## Owner-approved UX change

The prior layout kept the follow-up input at the top of the Assistant card while the visible conversation and provider results grew below it.

That made follow-up questions feel disconnected from the latest answer and forced unnecessary scrolling.

The approved interaction is now:

1. visible conversation history;
2. newest Franklin answer/results;
3. follow-up composer immediately below the conversation.

## Behavior

On the first submitted question:
- Franklin Assistant activates a conversation layout;
- a static conversation header remains above the thread;
- the existing form is moved below the live output;
- the visible form label becomes "Ask a follow-up";
- the textarea placeholder becomes "Ask a follow-up…";
- Attach, Clear / new question, Speak and Ask Franklin move with the same form;
- no duplicate form or duplicate controls are created.

Follow-up questions:
- append to the existing same-page thread;
- preserve recent current-page conversation context;
- leave the composer directly after the newest answer/results.

Clear / new question:
- clears the visible thread and current-page conversation context;
- restores the form to the original starting position;
- restores the original public label;
- returns the Assistant to its initial question state.

## Presentation choice

The composer is placed directly after the conversation rather than forced into a large floating/sticky panel.

Reason:
the current composer includes attachment, voice, privacy and reset controls. Making the entire block fixed/sticky would obscure a substantial part of long provider cards and current-information answers on common laptop/mobile viewports.

The durable user goal is preserved:
the follow-up input stays near the latest response without covering content.

## Validation

Controller syntax:
PASS

Source-level layout checks:
- activateConversationLayout present;
- restoreStartingLayout present;
- form moves after output;
- Clear restores form before output;
- follow-up label present;
- follow-up composer class present;
- all four Assistant entry pages cache-bust to assistant-034.

Regression test:
tests/franklin-assistant-composer-layout.cjs

## Preserved behavior

- public name remains Franklin Assistant;
- answers remain inline on the same page;
- visible You / Franklin conversation turns remain;
- Clear / new question remains;
- Speak remains;
- Attach remains;
- real inline provider matches remain;
- provider service relevance repair remains;
- Find Local / directory authority remains;
- no normal popup/modal is introduced.

## Unrelated-site preservation

No profile source facts, membership state, payments, claims, reviewer state, pricing, or unrelated Franklin Navigator implementation is intentionally changed.

# NEXT VERSION IMPROVEMENT LIST — FRANKLIN ASSISTANT INTERNAL 0.3.4

1. Add true browser-level interaction tests for first question -> answer -> follow-up composer at bottom -> second question -> second answer -> Clear reset.
2. Verify composer position on common laptop, mobile and narrow-width layouts without hiding long answers or provider cards.
3. Consider a compact sticky follow-up bar only if it can be implemented without obscuring content; do not make the full attachment/privacy block sticky.
4. Improve follow-up answers that refer to provider cards already shown, such as "which of these have websites?", "which can I call?", and "show me more".
5. Preserve provider-card context inside the current-page conversation without persisting raw chat after the page session.
6. Run and review the separate 120-question adversarial bank when live test infrastructure is available.
7. Expand provider relevance regressions across all supported service categories and address/place false-positive cases.
8. Preserve public Franklin Assistant branding, inline same-page conversation, Clear/Speak/Attach controls and no normal popup/modal answers.
9. Preserve all unrelated Franklin Navigator functionality and directory/profile authority.

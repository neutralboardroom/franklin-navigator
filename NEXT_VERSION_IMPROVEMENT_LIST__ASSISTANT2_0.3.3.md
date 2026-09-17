# NEXT VERSION IMPROVEMENT LIST — FRANKLIN ASSISTANT INTERNAL 0.3.3

1. Expand provider-service relevance regressions across plumbing, roofing, electrical, HVAC, dental, legal, veterinary, mechanics, restaurants, pharmacy, therapy, real estate, towing and staffing.
2. Add adversarial address/name tests proving service words embedded inside street names, company names or unrelated categories do not create false provider matches.
3. Run the 120-question adversarial Assistant bank when CI/execution infrastructure is available and keep its evidence separate from the original 100-question baseline.
4. Add browser-level tests that verify the inline provider cards and See more results use the same corrected relevance rules.
5. Improve provider synonym coverage only from observed real user wording; do not broaden matching by generic substrings.
6. Add field-aware ranking so exact service/category matches rank ahead of weaker name-only matches while preserving ordinary membership-neutral ranking.
7. Continue place/address search regression testing so stronger provider relevance never breaks legitimate location discovery.
8. Preserve public Franklin Assistant branding, same-page conversation, follow-ups, Clear/Speak/Attach controls and no normal popup/modal answers.
9. Preserve directory neutrality, suppression rules, source integrity checks and all unrelated Franklin Navigator functionality.

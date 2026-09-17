# NEXT VERSION IMPROVEMENT LIST — FRANKLIN ASSISTANT INTERNAL 0.3.2

1. Run the separate 120-question adversarial bank covering typos, paraphrases, ambiguity, provider-vs-information boundaries, follow-ups, freshness and Spanish variations; keep it separate from the original 100-question baseline.
2. Add browser-level tests that verify visible You/Franklin turns, multiple follow-ups, Clear/new question reset and scroll behavior.
3. Add browser-level tests that verify qualified provider requests render real profile matches when the directory is available and fail closed to Find Local when integrity/suppression checks fail.
4. Expand directory query synonyms for service categories only when evidence shows real user wording is not matching the existing profile corpus.
5. Add better handling for true proximity requests: never claim "closest" without adequate location evidence; ask for a location only when genuinely necessary.
6. Improve provider-card compactness on mobile while preserving readable profile names, public facts and source-neutrality.
7. Add "show more" continuity for provider follow-ups without losing the prior service category.
8. Continue testing ordinary assistance wording so commercial provider search does not override explicit free, volunteer, disability, senior or financial-assistance intent.
9. Preserve public branding as Franklin Assistant, same-page conversation, Clear/Speak/Attach controls and no normal popup/modal answers.
10. Preserve all unrelated Franklin Navigator functionality and directory/profile authority.

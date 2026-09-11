# Franklin Navigator — Next Version Improvement List
## FR-NAV1.23.0-HF3.4
## 2026-09-11

This list follows the full 19,358-page static audit and owner screenshot review that led to HF3.4. It is intentionally conservative: preserve working functionality, avoid change for the sake of change, and continue simplifying only where it materially improves resident or member value.

## Carry-forward priorities after HF3.4

1. **Owner live screenshot verification**
   - Recheck Sports, Bowling, Directory, Community Help Center, Business Dashboard, correction form, My Franklin, and representative public profiles on the owner's real 1366×768 laptop after deployment.
   - Treat any repeated issue as a shared-component defect, not a page-by-page patch.

2. **Community Explorer long-tail verification**
   - Continue testing all 50 Explorer pages in English and Spanish.
   - Keep useful local results in static HTML so the page remains usable with JavaScript disabled or degraded.
   - JavaScript should enhance filtering/shortlists, not be required to create the basic local-result experience.
   - Continue currentness rechecks through the authoritative Local Investigator/data handoff rather than inventing current program facts.

3. **Profile Factory reconciliation**
   - Continue source-backed duplicate and taxonomy reconciliation in Profile Factory.
   - Do not merge/delete canonical entities from the Platform without producer reconciliation.
   - Improve public display labels when source-backed producer-approved taxonomy becomes available.

4. **Member profile enrichment**
   - Continue materially expanding qualified member-profile depth: About, services, verified action links, hours, service area, accessibility, languages, gallery, official online presence, credentials, awards, experience, associations, education, publications/media, offers/events where applicable.
   - Do not fabricate ratings, reviews, endorsements, availability, prices, credentials, or trust badges.
   - Keep active-member `Similar local profiles` suppression limited to the member's own public profile; ordinary Directory ranking remains neutral.

5. **Verified Profile Factory link coverage**
   - Continue reducing verified website/action/social link gaps every material Profile Factory version.
   - Surface qualified links clearly on profiles without hiding high-intent contact actions.
   - Never create empty/unverified buttons.

6. **Navigation and page-density follow-through**
   - Maintain three core header actions plus a compact More menu unless owner testing shows a clearer alternative.
   - Keep secondary explanation, methodology, and specialist tools behind accessible disclosures where appropriate.
   - Audit long-tail general pages for redundant route grids, repeated sales CTAs, and oversized empty states.

7. **Everyday Help / long-list discovery**
   - Evaluate whether the 24-path Everyday Help surface benefits from a smaller default set plus search/expansion without hiding urgent or commonly needed routes.
   - Preserve direct official-source access and safety-first ordering.

8. **My Franklin**
   - Continue compacting empty saved states and improving first-value order without changing local-device privacy/storage semantics.
   - Preserve saved profiles, plans, reminders, Assistant outputs and address lookups.

9. **Accessibility and responsive QA**
   - Continue browser-level contrast checks, keyboard navigation, focus behavior, native disclosure usability, mobile overflow, reduced-motion behavior and screen-reader labeling.
   - Keep explicit dark-surface styling; do not reintroduce automatic transparent-background color guessing.

10. **Performance**
    - Continue removing obsolete presentation runtimes and duplicated DOM-mutation layers where static first-paint markup can do the job more reliably.
    - Track page load/runtime cost on high-traffic pages and large directory/profile surfaces.

11. **Public-language review**
    - Continue removing internal builder, pipeline, ingestion, canonicalization, consumer/producer, track-count and implementation language from resident-facing pages while preserving legitimate privacy, safety, currentness, neutrality and professional-boundary disclosures.

12. **English/Spanish parity**
    - Verify that any newly simplified or enriched component has equivalent Spanish routing, labels and functionality.
    - Improve awkward translated copy when owner/community review identifies it.

13. **Membership conversion clarity**
    - Keep the concrete pre-purchase comparison between ordinary and active Community Member profiles.
    - Continue explaining member value through real profile capabilities rather than abstract sales language.
    - Keep free factual corrections and public-profile removal conspicuously independent of membership/payment.

14. **Regression discipline**
    - Every material release must continue static full-site audit plus representative real-browser qualification before merge/deployment.
    - A release must fail if it introduces blank/light-on-light content, browser hangs, excessive primary navigation, missing profile contact actions, broken correction/removal routes, hidden urgent help, or JavaScript-required basic Explorer results.

No change for the sake of change. Preserve working capabilities and improve only when the change materially increases clarity, reliability, usefulness, accessibility, safety, performance, resident value, or paid-member value.

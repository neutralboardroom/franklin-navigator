# R1350 — No-JavaScript Rendered Related-Profile Relevance

- Predecessor: `FR-NAV1.30.49-HF3.13.31` (SCC D1 accepted).
- Defect: R1349 corrected broad-category related cards after JavaScript execution, but the raw profile HTML still contained category-only filler. Users with JavaScript disabled could still see those irrelevant cards.
- Scope measured from accepted predecessor: **1,184** broad umbrella-category profile pages with a static related-profile card.
- Fix: shared `dist/assets/hf36.css` now contains a deterministic guard keyed to the 12 accepted broad-category breadcrumb values already present in the static profile HTML. The broad card is hidden unless R1349's relevance runtime explicitly marks it `data-related-relevance="qualified-override"`.
- Daddy's Dogs therefore shows no unrelated category-only filler without JavaScript, while the qualified food/restaurant override remains visible when JavaScript runs.
- A specific-category control (M.L. Rose) remains unchanged and retains its related module.
- No canonical profile facts, categories, contacts, rankings, prices, membership, payment, Local Investigator facts, or outreach state changed.
- Permanent broad-category coverage/drift guard: `scripts/r1350-related-profile-nojs-map.py --check`.
- Permanent structural regression: `tests/r1350-related-profile-nojs.cjs`.
- Required browser regression: `scripts/r1350-related-profile-nojs-browser.mjs`.

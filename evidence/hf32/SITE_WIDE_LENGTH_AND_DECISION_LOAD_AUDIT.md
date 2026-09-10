# Franklin Navigator HF3.2 — Site-wide page-length and decision-load audit

This audit was requested by the owner after the live Sports page became so long that normal laptop review and navigation into Bowling Leagues became difficult. It is a binding input to the next Franklin material build, not a request to delete useful capability.

## Audit scope

- Exact HF3.1 public tree inspected: 19,355 public `index.html` pages.
- 19,103 repeated public profile pages were separated from the non-profile audit so their shared template would not hide problems elsewhere.
- 252 non-profile public pages were inspected for content length, number of major sections, headings, interactive controls, repeated cards, and visible-choice density.
- Owner review target remains the real laptop/browser viewport represented by the supplied approximately 1366 × 768 screenshots.

## Baseline distribution across the 252 non-profile pages

- Main-content words: median 272; 90th percentile 689; 95th percentile 733; maximum 2,046.
- Major sections: median 4; 90th/95th percentile 10; maximum 11.
- Interactive controls/links: median 43; 90th percentile 57; 95th percentile 67; maximum 102.
- Card-like elements: median 2; 90th percentile 8; 95th percentile 12; maximum 24.

## Pages/families that crossed one or more high-load thresholds

79 of 252 non-profile pages crossed at least one threshold for excessive text, excessive sections, excessive interaction count, excessive card count, or overall combined decision load.

- 38 Sports/deep-sports pages, including English and Spanish variants. These typically carry 10 major sections and about 57 interactive destinations each.
- 14 help/assistant hubs.
- 13 activities/learning hubs.
- 6 core pages (Homepage, Today, Get It Done and Spanish counterparts); these are already covered by owner-approved redesign items.
- 3 business/membership pages.
- 3 local-pathway pages.
- 2 additional utility/planning pages.

## Highest-load examples

- `everyday-help/`: 1,614 main-content words, 102 interactive destinations, 24 cards, 50 headings.
- `es/ayuda-cotidiana/`: 2,046 words, 102 interactive destinations, 24 cards, 50 headings.
- `community-help-center/`: 1,007 words, 10 sections, 79 interactive destinations, 17 cards, 28 headings.
- `es/centro-de-ayuda/`: 1,202 words, 10 sections, 79 interactive destinations, 17 cards, 28 headings.
- `live-local/`: 1,376 words, 84 interactive destinations, 12 cards, 28 headings.
- `business-membership/`: 18 cards.
- `navigator-growth-desk/`: 19 cards.
- `local-pathways/` and `es/caminos-locales/`: 15 cards each.
- The Sports/deep-sports family repeatedly uses 10-section pages even for narrow destinations such as Bowling, Tennis, Golf and other specific sports.

## Binding HF3.2 simplification rules

1. A narrow deep link must deliver the requested information first. A click into Bowling, Tennis, Housing help, a specific pathway, etc. must not lead first to another large generic navigation hub.
2. Ordinary public pages should normally present one primary task, one supporting route, and progressive disclosure for secondary material. Safety-critical/emergency actions remain exempt.
3. Do not place two large navigation grids on one page when one search/category control or compact selector can replace them.
4. Initial card grids should normally show no more than roughly 6–9 meaningful choices at once on the owner’s laptop unless browsing itself is the core task. Preserve remaining destinations behind search, a selector, pagination, or an explicit `See all` disclosure.
5. Pages with large result sets may keep rich results, but filter/search controls must be compact and must not consume substantial viewport height while scrolling.
6. Explanatory methodology, provenance, source mechanics, ranking policy, privacy implementation, release/process language and internal quality-control material belong behind optional disclosures unless required for safe action.
7. Do not show empty secondary modules such as a blank shortlist, empty saved-state panel, empty current-events block, or loading placeholders after the page has settled. Reveal them only when useful.
8. Avoid repeating the same warning or currentness instruction in the heading, body, card and action label. State it once clearly.
9. Repeated utilities such as Copy / Download / Print / Share should be grouped under one quiet utility control rather than shown as equal actions.
10. Business/organizer acquisition sections should not dominate resident task pages. Keep them compact and near the end, or route them to the business/member area.
11. Preserve the universal simplified header rather than allowing deep pages to expose alternate seven-item navigation structures.
12. Apply the same simplification and plain-language behavior to Spanish pages; do not solve English only.
13. Preserve every qualified route, profile fact, safety action, correction route, source record, and checkout/runtime capability. This is a presentation and information-architecture reduction, not a capability deletion.

## Family-level build targets

### Sports and deep sports (38 pages)
Reduce the repeated 10-section architecture to a direct sport/task result experience: concise hero → Search/Sport → relevant local options → optional More filters → current registrations/openings when available → compact before-you-register guidance → optional saved list → optional other sports. Remove duplicate generic navigation layers and large methodology/organizer blocks from the ordinary path.

### Help and Assistant hubs (14 pages)
Prioritize the user’s problem and the best next step. Reduce 17–24-card walls and 60–102 visible destinations by using category selectors, a smaller initial set of common needs, and progressive disclosure. Emergency and crisis choices remain directly visible.

### Activities and Learning hubs (13 pages)
Reduce repeated nine-section journeys. Put activity/learning choices first; place preparation, provenance, source mechanics, saved-list utilities and secondary cross-navigation later or under disclosure.

### Business / membership (3 pages)
Replace 15–19 equal card choices with a simple business-type selector or smaller first set. Keep one clear membership/growth action per section and avoid sales-choice overload.

### Local pathways (3 pages)
Replace 15-card pathway walls with search/category or a small first set plus `See all`. Deliver the selected pathway itself before generic cross-navigation.

### Core pages
Implement the separately owner-approved Homepage, Today, Get It Done, Find Local, public-profile and source-date rules already recorded in the next-version list.

## Acceptance target

After HF3.2, no major public page family should require a user to scroll through multiple navigation/catalog layers before reaching the information implied by the link they clicked. The owner should be able to navigate from Sports to Bowling and other deep topics reliably at normal laptop size without the page length itself becoming a usability obstacle.

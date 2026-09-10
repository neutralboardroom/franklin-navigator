# Franklin Navigator — FR-NAV1.22.0-HF3.3 Next Version Improvement List

Date: 2026-09-11
Owner-authorized build and deploy: YES
Base: newest accepted `main` at build start.

This release implements the complete accumulated owner review. Repeated defects must be fixed through shared components/site-wide rules rather than one-off page patches. Preserve every working capability unless explicitly replaced by a better equivalent.

## P0 — Community Explorer reliability
- Sports/Activities/Learning/Outdoors and all deep explorer routes must render a usable result experience without an indefinite Loading state.
- Use the accepted Franklin activity payload as a deterministic build-time/local fallback while preserving the normal network route for compatible freshness behavior.
- Critical explorer preload must execute before `community-explorer.js` and critical assets must be release-version pinned.
- Keep bounded retry/error handling; no permanent `Loading local sources…` or `Loading Franklin options…`.
- Finder/results must appear immediately after the compact hero.
- Collapse broad cross-navigation under `Explore other sports and activities`.
- Hide empty current sections, generic irrelevant facility/address blocks on scoped sport pages, and shortlist workspace until used.
- Deep pages with only a few results should not show redundant sport/audience/geography controls.
- No old/new explorer layout mixing or duplicate initialization.

## P0 — Site-wide visual system
- Fix all dark-surface contrast to WCAG-AA target; body text must never be dark gray on dark teal.
- Use proportional responsive heroes; ordinary pages must fit comfortably at 1366×768.
- Reduce excessive section padding/dead space while preserving readability and touch targets.
- Cap decorative/supporting image height; task/safety content comes before decorative imagery.
- Normalize responsive card grids; no awkward orphan rows where a better layout is possible.
- Compact empty states and hide inactive output actions until content exists.
- Replace literal `More ...`, loose plus signs and inconsistent disclosure affordances with one accessible disclosure pattern.
- Keep footer compact and useful.

## P0 — First-paint navigation
Canonical header must be present in HTML before enhancement, not rewritten after the user sees it:
- Ask Franklin Assistant
- Today
- Get It Done
- Find Local
- More

`More` contains Activities, Community, My Franklin, For businesses, Help Center and applicable equivalents. English/Spanish structure must remain stable.

## My Franklin
- Compact dashboard hero and cards.
- Preferences collapsed by default.
- Compact all empty saved-profile/plan/Assistant/reminder states.
- Avoid a short right rail leaving a long dead column; main workspace should reclaim width.
- Preserve local-device privacy/storage/reset, saved profiles, action plans, Assistant plans/checklists, reminders and address lookups.

## Business / membership sales
- Start with `Find or review my profile`; membership is an optional enhancement.
- Remove internal product/governance language from public pages.
- Single current Community Membership price: $35/year, annual renewal until canceled.
- Keep free factual corrections and public-profile removal visibly separate and free.
- Make membership value concrete: richer profile presentation, member-provided reviewed details, services, images, verified action links, community participation, growth tools and support where supported.
- Avoid repeated identical membership CTAs.

## Paid-member competitor-free profile benefit — owner rule
- Active qualifying paid Community Member profiles MUST NOT display `Similar local profiles`, `Browse more in this category` when part of that competitor module, or a replacement competitor/recommendation module.
- Ordinary non-member profiles retain Similar local profiles, lower on the page.
- Entitlement must come from authoritative active membership state.
- Active canceling remains entitled through the paid-through period; expired/inactive returns to ordinary presentation.
- Unknown entitlement fails closed to ordinary non-member presentation after the entitlement check; it must never invent active status.
- This benefit applies only to the member's own profile page. It does NOT alter Directory ranking, suppress competitors from search, change facts, credentials, safety information, corrections/removal, or imply endorsement.

### Pre-purchase disclosure — required
Show this benefit before purchase on:
1. For Businesses / Membership page
2. Free-vs-Member profile preview
3. Final $35/year decision area

Preferred plain-language message:
**Keep the focus on your business.** Active Community Member profiles do not show the Similar local profiles section, so visitors are not shown other local businesses on your profile page.

Supporting disclosure: Membership does not change ordinary Directory ranking or remove other businesses from Franklin Navigator.

## Public profile template — finished-profile standard
Every profile must look like a deliberately finished local profile page, not a raw database/admin record.

### First screen
- Business/professional/organization name
- useful normalized category/specialty
- concise entity-specific summary when available
- address/service area
- compact `Last checked`
- logo/photo only when qualified; otherwise subtle fallback
- ALL high-value verified contact/action routes visible directly, not buried under `More contact options`

Applicable visible actions include Website, Call, Email, Directions, Contact, Book/Schedule, Get a quote, Reserve, Order, Menu, Apply/Register and other category-appropriate verified actions.

Do not invent links or show empty/unverified controls. Lower-priority verified social/supporting links may use one `More verified links` disclosure if necessary.

### Entity-specific content
Replace generic `About this profile` boilerplate with actual source-backed/member-reviewed information where available. Rich profiles may include:
- About / biography
- Services / specialties / practice areas
- Hours
- Service area / locations and directions
- Pricing/payment information when voluntarily supplied/current/appropriate
- Languages
- Accessibility
- Credentials/licenses/certifications when source-backed
- Awards/honors when source-backed
- Experience/history
- Associations
- Education/training
- Projects/portfolio/case examples only where lawful and non-confidential
- Publications/media/speaking
- Gallery using authorized images
- Official online/social presence
- Offers/events/community participation with freshness/expiry

Sparse profiles should become shorter and cleaner rather than being padded with generic boilerplate.

### Paid member profile = rich modular mini-site
Use mature profile platforms such as Avvo only as a structural reference for completeness, not as a design/content copy. Active member profiles should feel like a polished mini-site with strong identity, contact actions, optional section navigation and populated modular sections.

Do NOT copy or fabricate Avvo/BBB/Zocdoc/Houzz proprietary ratings, reviews, badges, endorsements, credentials, availability or trust signals. Franklin must use only its real source-backed/member-reviewed information.

### Profile section navigation
When enough populated sections exist, show compact anchored/sticky section navigation (e.g. Overview, About, Services, Location, Photos, Online, Credentials, Experience, Offers & Events). Never show empty tabs.

### Similar profiles
- Non-member only, lower on page, maximum compact set before See more.
- Clearly category-related, not ranked/recommended.
- Never occupy the prime top action rail.

### Claim/correction/removal
Consolidate duplicate profile-management areas. Keep:
- Claim/manage this profile
- Suggest factual correction — free
- Request removal from public view — free
Claiming is separate from corrections/removal and does not rewrite source facts.

## Member Profile Studio / fulfillment
Expand the secure reviewed member-content system beyond summary/services/languages/website/contact/booking to support appropriate modular fields such as tagline, hours, service area, accessibility, pricing, experience, credentials, awards, associations, education, publications, offers/events, quote/menu/order/directions URLs, profile image URL, gallery URLs and official social links.

All member content remains subject to verified representation, active paid entitlement, authorization to publish, review, provenance, revision conflict protection and existing security rules. Public-source identity/credentials/facts stay separate.

## Reviews / ratings / endorsements
Do not create a fake review product to imitate Avvo. No invented Franklin rating, star count, endorsement badge or imported third-party reputation metric without a separately approved lawful/moderated product.

## Community Help Center
- Urgent help immediately after hero, before large imagery.
- Preserve 911, 988, 211, Poison Control and local domestic-violence help.
- Urgent section must pass dark contrast.
- Move/cap Pinkerton/supporting photo.
- Hide empty help-plan output and inactive Copy/Print until useful.
- Simplify privacy language while preserving actual privacy behavior.
- Remove internal architecture labels such as `16 DEEP...` and `15 DEEP...` from public UI.
- Keep deeper legal/health/home/auto tools but present them as optional deeper help.

## Directory / Find Local
- Search-led discovery instead of raw 19,103-record dump as the first experience.
- Search + Category primary; advanced filters preserved under disclosure.
- Small representative/popular initial sample; full pagination after search/filter or explicit browse.
- Compact sticky search bar and cards.
- `Source date` -> `Last checked` in public presentation.
- Remove public ingestion/geocoding implementation language such as `Public IRS filing address geocoded...` while preserving underlying provenance.
- Normalize public display taxonomy without mutating canonical producer data.
- Suspected duplicates/taxonomy conflicts go to Profile Factory; Platform does not merge/delete canonical entities on visual inference.
- Membership never changes ordinary Directory ranking.

## Public-language scrub
Remove public-facing builder/implementation terms including candidate/build identifiers, track/module counts, producer/consumer acceptance language, ingestion/canonicalization/geocoder/raw-list/product-governance jargon. Preserve legitimate privacy, currentness, neutral-ranking, non-endorsement, legal/medical/safety disclosures.

## Release identity
Every newly built HTML page, shared asset version, `PRODUCTION_RELEASE.json`, qualification evidence and deployed commit must identify FR-NAV1.22.0-HF3.3 consistently. Remove stale HF3.1/HF3.2 page markers in generated output.

## Accessibility / mobile / performance
- Keyboard navigation for header, disclosures, filters, profile actions and forms.
- visible focus states
- meaningful labels/landmarks/headings
- WCAG-AA contrast target
- responsive tests: 1366×768, 1440×900, 768×1024, 390×844
- no critical post-load layout rebuild
- no unnecessary duplicate runtime initialization
- below-the-fold images lazy-load
- loading failure degrades gracefully

## Required regression routes
- `/`
- `/today/`
- `/get-it-done/`
- `/sports/`
- `/sports/bowling/`
- one additional sport detail
- `/activities/`
- `/learning/` or `/outdoors/`
- `/community/`
- `/my-franklin/`
- `/business-dashboard/`
- `/membership-start/`
- `/member-profile-preview/`
- `/profile-studio/`
- `/community-help-center/`
- `/directory/`
- ordinary public profile
- active-member-capable public profile fixture
- Spanish Sports and Help Center equivalents

## Hard release gates
Fail the build if:
- explorer critical preload/payload/versioned loader is missing
- JS syntax fails
- active-member entitlement API contract is missing
- active-member Similar profiles suppression is missing
- non-member similar-profile presentation is removed globally
- high-value profile contact actions remain intentionally hidden by the new layer
- release markers are inconsistent
- dark-surface contrast contract is absent
- required safety routes/files disappear
- member editor does not preserve secure reviewed publication flow
- free correction/removal disappears
- profile facts/counts are mutated without Profile Factory input
- Directory membership neutrality drifts
- core English/Spanish routes disappear

## Evidence required before deployment
- exact static source commit
- exact membership-runtime commit
- qualification workflow results
- changed-file manifest
- explorer fallback/pinning receipt
- member-entitlement and Similar-profile behavior receipt
- public-profile contact visibility receipt
- release identity receipt
- no-loss/safety/commercial-invariants receipt
- rollback commits
- exact Render deploy IDs
- Next Version Improvement List in release

## Next release carry-forward
Any incomplete item remains on the next version list. No change for the sake of change; only changes that materially improve reliability, clarity, safety, usefulness, accessibility, performance, resident value or member value.
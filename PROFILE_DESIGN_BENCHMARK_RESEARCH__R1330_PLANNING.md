# Franklin Navigator profile-design benchmark research — R1330 planning

Date: 2026-09-18
Status: PLANNING_ONLY — no R1330 build started
Scope: public profile presentation + member profile media/editing UX

## Current live-profile observations

The current R1329 public profile is functionally complete but visually reads as a source record rather than a finished modern local-business/professional profile. The strongest issues are:

- initials tile looks like a placeholder when no owner image/logo exists;
- the hero lacks a strong visual/media layer;
- large bordered content cards create unnecessary vertical length and empty space;
- key actions are split between the hero and a later “Official Franklin Navigator links” block;
- trust/currentness information is useful but visually heavy relative to the profile identity;
- factual details are presented as oversized pill-like blocks rather than a compact “at a glance” summary;
- profile sections have weak visual differentiation between identity, practical facts, services, media and source evidence;
- the page does not yet feel meaningfully richer when owner-managed/member media is present.

## Current benchmark research

### Google Business Profile
Official source:
https://support.google.com/business/answer/6103862

Useful patterns:
- distinct logo and cover-photo roles;
- additional business photos/videos;
- profile media is managed after verification;
- image-first identity makes the business recognizable before reading details.

Adopt/adapt:
- support a clear profile image/logo slot and a separate optional cover/hero image;
- show an intentional fallback when no image is present;
- owner-supplied images remain reviewed before publication.

Do not copy:
- Google-specific location assumptions; Franklin profiles may be service-area/online/mailing-only and must preserve exact location semantics.

### Yelp
Official business material:
https://business.yelp.com/wp-content/uploads/2024/09/Drive-more-inquiries-appointment-with-Yelp-for-Brands.pdf

Useful patterns:
- top-of-profile action cluster;
- strong business info near identity;
- photos appear early;
- “from this business” content gives the owner a clear story area;
- enhanced profiles can control photo ordering.

Adopt/adapt:
- keep Call / Website / Email / Book / Quote / Order / Directions actions close to the profile name;
- move owner story/About and strongest media higher;
- allow qualified member media ordering where appropriate.

Do not copy:
- competitor advertising, sponsored placements or ad-removal mechanics.

### Nextdoor Business Pages
Official source:
https://business.nextdoor.com/en-us/getting-started/business-page

Useful patterns:
- local-first positioning;
- photos of the owner/team/work used to make a first impression;
- contact information is immediately practical;
- business story is written for neighbors rather than as a database record.

Adopt/adapt:
- make Franklin profile copy feel more human and local;
- prioritize real visual identity and public contact routes;
- keep neighborhood/community relevance visible without overloading the page.

Do not copy:
- recommendation/social-proof mechanics until Franklin has its own governed review/recommendation authority.

### Houzz professional profiles
Official sources:
https://pro.houzz.com/for-pros/feature-premium-profile
https://pro.houzz.com/pro-help/r/how-to-customize-your-houzz-profile-slideshow

Useful patterns:
- large visual portfolio/slideshow at the top;
- highlighted projects/media;
- clearer differentiation between basic identity and richer paid profile;
- credentials/badges and media are visually integrated rather than buried.

Adopt/adapt:
- richer Community Member profiles should look visibly richer through cover/media/gallery treatment;
- use a curated media strip/gallery rather than a generic empty box;
- maintain strict Franklin verification/review language for every badge, credential or owner-supplied item.

Do not copy:
- star ratings, featured reviews or hire counts without a Franklin-owned evidence/review system.

## Recommended Franklin profile design direction

### 1. Stronger hero
Desktop:
- optional wide cover/hero image across the profile header;
- square/circular logo, headshot or chosen profile image overlapping/anchored to the hero;
- name, category, Franklin/service-area line, claim/member state and currentness next to it;
- compact primary action row directly below identity.

Fallback:
- if no approved image exists, use a clean branded initials mark without making it look like an unfinished upload placeholder.

### 2. Explicit owner image choice
In Profile Studio, member preview and applicable claim/onboarding surfaces, use clear language:

**Profile image / logo**
“Upload your own logo or profile photo. Choose the image you want people to see on your Franklin profile. Businesses and organizations can use a logo or representative business photo; individual professionals can use a headshot or professional image. You can change it later. Images are reviewed before publication.”

For a separate hero image:
**Cover photo**
“Add an optional cover photo that represents your business, work, organization or practice.”

Do not imply that upload itself equals approval or publication.

### 3. Free vs member media boundary
Recommended:
- every authority-verified profile manager may supply one reviewed identity image/logo;
- Community Membership may add the richer cover image, gallery/media strip and expanded owner-provided profile content.

This keeps a trustworthy identity image from becoming a paid accuracy feature while preserving obvious member-profile value.

### 4. Cleaner information architecture
Replace the current long card stack with:
- Overview
- Services / What we do
- Photos / Media (when available)
- Practical details
- Official links
- Sources & listing details
- Manage this profile

Use open sections with subtle separators instead of putting every section inside a large bordered card.

### 5. Compact “At a glance”
Use a compact two-column or grid summary for:
- category;
- service area / actual location semantics;
- hours when available;
- languages/accessibility;
- public phone/email/website;
- verification/currentness.

Do not use oversized pill-like containers for full sentences.

### 6. Better action hierarchy
Top actions should use only verified/applicable routes:
- Website
- Call
- Email
- Book / appointment
- Quote / contact
- Order / menu
- Directions / location page

Secondary utilities:
- Save
- Share
- Copy link
- Print

Do not show empty/invented actions.

### 7. Remove routine sourcing/currentness metadata from the visible profile hero
Do not show a permanent top-of-profile box containing routine metadata such as:
- “Source-backed profile”
- “Checked [date]”
- “Representation is verified before management access”
- a dedicated Sources link inside a large hero-side card

Owner-approved visible state:
- show **Unclaimed profile** when applicable;
- pair it with a clear **Claim / manage this profile** action;
- after a genuine authority-verification event, show the appropriate claimed/managed state without implying endorsement.

Keep source dates, provenance, evidence, and representation-verification mechanics available in:
- the expandable **Sources & listing details** section;
- the claim/authority-verification journey where the explanation is operationally relevant;
- internal evidence/receipts.

This frees prime profile-header space for identity, image/logo, category, local context and useful actions while preserving transparency on demand.

### 8. Better owner/member story
Member profile should support a concise owner-provided “About” section near the top, clearly separated from source-backed facts and reviewed before publication.

### 9. Gallery presentation
When media exists:
- show a 3–5 image preview strip or balanced gallery near the top;
- let the authorized owner choose/order qualified media;
- open larger gallery/lightbox only when useful;
- preserve captions/alt text and rights/review state.

When no media exists:
- do not render a large empty gallery shell.

### 10. Entity-aware profiles
Business/organization:
- logo or representative business image;
- optional cover/media.

Individual professional:
- headshot or professional image;
- credentials/source links where applicable.

Nonprofit/community organization:
- organization logo or representative community image.

Government/public agency:
- official seal/logo only when source/licensing rules allow; otherwise clean source-backed identity.

### 11. Mobile
- identity image/logo and name visible immediately;
- action buttons wrap cleanly;
- no horizontal scrolling;
- media becomes swipeable/stacked;
- trust/currentness remains concise;
- source details remain below primary content.

## Explicit non-goals

- no changes merely to imitate competitors;
- no star ratings/reviews unless Franklin establishes a governed review system;
- no sponsored ranking;
- no fabricated availability, credentials or endorsement;
- no geocoding a mailing-only/service-area profile as a storefront;
- no owner-uploaded image published before required authority/review checks.


## Owner clarification — visible claim state vs. provenance

Owner approved keeping a simple visible claim state such as **Unclaimed profile** plus **Claim / manage this profile**. Owner does not want routine provenance/currentness text or source dates displayed prominently on every profile. Treat this as the default profile-presentation rule unless a particular regulated or safety-sensitive profile needs stronger visible source disclosure.

## Profile-image/upload requirement

Current Profile Studio only accepts a public image URL and explicitly says no file is uploaded there. That is not the desired final UX.

Next qualified implementation should, if the media pipeline can be made production-safe:
- provide an actual **Upload your own photo or logo** control;
- say clearly that the authorized profile manager can choose the image they want people to see;
- support a logo, headshot, or representative business/organization image depending on entity type;
- allow changing/replacing the chosen image later;
- preserve review/moderation, file-type/size validation, safe storage, rights/consent, malware/content handling and rollback;
- never imply that upload means immediate approval/publication.

If a secure production upload pipeline is not yet ready, do not fake a file-upload control; keep the public-URL fallback temporarily but explain the planned upload path clearly.

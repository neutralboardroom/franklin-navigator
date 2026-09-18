# R1330 Profile Design & Management Evidence

Release: **FR-NAV1.30.30-HF3.13.12 (R1330)**
Date: **2026-09-18**
Predecessor: **FR-NAV1.30.29-HF3.13.11 (R1329)**

## Material scope

R1330 improves the shared Franklin public-profile presentation and repairs the profile-management architecture so paid membership is not a prerequisite for ordinary profile ownership/management.

### Public profile presentation
- shared R1330 profile presentation layer applies across Franklin profile pages;
- routine hero-level source/currentness/date box is removed from ordinary presentation;
- provenance remains available under **Sources & listing details**;
- simple dynamic **Unclaimed profile / Claim or manage this profile** or **Managed profile / Manage this profile** state is shown;
- stronger identity image/logo treatment;
- reviewed Community Member cover/gallery projection;
- cleaner action hierarchy, facts and section composition;
- no ratings, reviews, paid ordinary ranking or fabricated trust signals added.

### Free profile management
A verified manager does **not** need Community Membership to:
- create/sign in to a Franklin account;
- connect a real current Franklin profile;
- request representation verification;
- view management state;
- view the public profile;
- submit a factual correction;
- request public-profile removal;
- upload/change/remove a reviewed profile image or logo;
- submit that image/logo for review;
- remove their own uploaded media even after paid membership ends.

A new free profile-access route is provided at:
- `/profile-access/`

The claim page now routes ordinary management to free profile access rather than membership enrollment.

### Optional paid Community Membership
Active Community Membership remains **$35/year** and adds richer profile value including:
- richer reviewed About/services/practical content;
- member action/official-online-presence enrichment;
- reviewed cover image;
- reviewed gallery positions;
- existing Community Member tools and presentation benefits.

Membership still does not buy:
- factual accuracy;
- ordinary Directory ranking;
- endorsement;
- guaranteed leads/customers/results.

## Reviewed media implementation

Backend branch: `franklin-commerce-runtime-r30`

New/updated components include:
- `data/member-profile-scope-overlay.json`
- `lib/profile-scope.js`
- `schema/006_member_media.sql`
- `lib/member-media.js`
- `lib/member-fulfillment.js`
- `lib/reviewer-console.js`
- `review/index.html`
- `review/app.js`
- `server.js`
- `scripts/owner-review-preflight.cjs`

Media states:
- DRAFT
- SUBMITTED
- CHANGES_REQUESTED
- PUBLISHED
- REMOVED

Media slots:
- PROFILE — free verified-manager feature
- COVER — active rich-profile membership required
- GALLERY — active rich-profile membership required

Security/trust controls:
- browser accepts JPG/PNG/WebP;
- browser re-renders to WebP before upload;
- backend validates RIFF/WebP structure;
- backend checks byte size and actual dimensions;
- maximum dimensions 3000 × 3000 and 9,000,000 pixels;
- EXIF/XMP rejected;
- animated WebP rejected;
- verified profile authority required;
- explicit publication-rights confirmation required;
- human review required before public publication;
- private drafts are not public.

## Scope convergence repair

R1329 added canonical public profile:
- `FR-ORG-b00c0ace7943973c` — Franklin Navigator

The existing membership base scope still contained 19,103 profiles and omitted that new canonical profile.

R1330 adds a bounded scope overlay and a shared loader so the membership runtime, claim validation and readiness tooling resolve the same **19,104** public-profile universe.

Profile-link creation now fails closed for a syntactically valid but out-of-scope/nonexistent profile ID.

## Current runtime deployment evidence

Render service:
- `franklin-navigator-membership`
- service ID: `srv-dabgvefqj5pc739vr4h0`

Exact backend commit:
- `84247d591754102a44a80a6b6e2e7666d1b900f9`

Exact deploy:
- `dep-dam9ve61egvs738mjgr0`

Deploy state:
- **LIVE**
- finished: **2026-09-18T02:20:03.717222Z**

Observed startup evidence:
- Render build successful;
- `npm run check` executed;
- syntax checks included new `member-media.js`, `profile-scope.js`, reviewer and fulfillment paths;
- `FRANKLIN_RUNTIME_LISTENING ready=true`;
- owner preflight reports:
  - `publicProfileScopeCount = 19104`;
  - reviewer control configured;
  - no fabricated real public member candidate;
  - no product mutations from the read-only preflight.

## Incident-ledger truth

At the R1330 runtime startup snapshot:
- open CRITICAL = 0;
- open HIGH = 3;
- noOpenP0P1 = false.

The safe startup logs do not expose enough category/code detail to attribute those three HIGH incidents. R1330 therefore does **not** claim they are resolved, does **not** claim they were caused by this release, and does **not** fabricate a diagnosis.

The runtime itself built, started and reported ready. Persistent incident-ledger follow-up remains separate from runtime startup qualification.

## Static/source qualification performed before public deploy

Changed JavaScript syntax/parse checks passed for:
- `dist/assets/member-profile-live.js`
- `dist/assets/membership-live.js`
- `dist/assets/r1330-profile.js`
- `dist/assets/hf310.js`
- `dist/assets/hf36.js`

Backend syntax/parse/startup checks passed for:
- `server.js`
- `lib/member-media.js`
- `lib/profile-scope.js`
- `lib/member-fulfillment.js`
- `lib/reviewer-console.js`
- `review/app.js`

## Human-action limitations

R1330 does not fabricate:
- a real business manager;
- authority approval;
- a paid customer;
- a real customer image;
- a real public media publication.

The following end-to-end proofs require genuine authorized human action and remain correctly unclaimed:
- first real non-member free-management lifecycle;
- first real manager profile-image publication lifecycle;
- first real active-member cover/gallery lifecycle.

## Research / design receipt

See:
- `R1330_PROFILE_BENCHMARK_ADOPTION_RECEIPT.md`

Required next-version list:
- `NEXT_VERSION_IMPROVEMENT_LIST__R1330.md`

## Pre-static-deploy source checkpoint

Main branch checkpoint when this evidence was created:
- `85b1a583bc25bc82f8690d17faf7683d9bb6783f`

A separate deployment receipt should record the exact public static deploy after Render promotion.


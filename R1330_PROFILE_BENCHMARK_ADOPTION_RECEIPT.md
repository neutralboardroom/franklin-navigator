# R1330 Profile Benchmark Adoption / Adaptation / Rejection Receipt

Release: **FR-NAV1.30.30-HF3.13.12 (R1330)**
Date: **2026-09-18**
Scope: Franklin Navigator public profile presentation + claim/manage/edit lifecycle + reviewed media.

## Owner-directed requirements

R1330 implements the approved requirements to:

- make public profile pages feel materially more complete and professionally designed;
- remove the routine source/currentness/date box from the top of every profile;
- keep a simple visible claim/management state and action;
- let an authorized manager upload a photo or logo of their choice;
- preserve source provenance lower on the page, on demand;
- research current competitor/business-profile presentation patterns and adopt/adapt only the useful ones;
- keep free profile management genuinely usable without Community Membership;
- keep Community Membership optional and valuable through richer profile content/media rather than paid accuracy/ranking.

## Current external benchmarking researched

Research date: **2026-09-18**

### Google Business Profile
Sources reviewed:
- Google Business Profile Help — “About Google Business Profile & brand profile”
- Google Business Profile Help — “Manage your Business Profile photos & videos”
- Google Business Profile Help — “Tips for business-specific photos on your Business Profile”

Observed useful patterns:
- verified managers can update profile information and media;
- photos are a first-class part of profile completeness;
- profile identity, contact/action access and practical business information are prominent;
- media publication is tied to verification/content rules rather than anonymous direct publishing.

### Nextdoor Business Pages
Sources reviewed:
- Nextdoor Business — “Create a Free Business Page on Nextdoor”
- Nextdoor Business — “Guide to claiming your Nextdoor Business Page”
- Nextdoor Business — “5 ways to refresh your Business Page to stay top of mind”

Observed useful patterns:
- free business claim/management exists independently of advertising;
- strong emphasis on profile logo, cover photo and representative business photography;
- guidance explicitly allows a business logo, the owner/person, storefront, work, products or services when appropriate;
- contact information and local identity are prominent;
- cover/gallery visuals make the page feel like a real local presence rather than a raw directory record.

### Yelp business profiles
Sources reviewed:
- Yelp for Brands — enhanced-profile feature materials / media kit

Observed useful patterns:
- visual identity/photo treatment near the top;
- immediate customer actions such as website/contact;
- concise business information followed by richer business-provided content;
- photo ordering and richer business story are treated as profile-enhancement value.

## ADOPTED

1. **Visual identity first**
   - profile image/logo receives materially stronger placement;
   - reviewed cover media is supported for active Community Members;
   - reviewed gallery media is supported for active Community Members.

2. **Action-first hero**
   - website/call/email and other legitimate verified actions remain prominent;
   - claim/manage is visible without competing with resident-facing actions.

3. **Cleaner information hierarchy**
   - hero -> identity/location -> actions -> at-a-glance facts -> richer sections -> management/source details;
   - source provenance no longer dominates the top of the profile.

4. **Free claim and management path**
   - claiming a profile and verifying representation no longer routes through paid membership enrollment;
   - a dedicated free profile-access route is introduced;
   - Profile Studio is free-first and membership-second.

5. **Owner-selected identity media**
   - verified managers can choose and upload their own representative photo/logo;
   - uploaded media remains private until explicitly submitted and approved.

6. **Compact modern content cards**
   - sections use restrained rectangular cards and clear spacing;
   - no decorative pill-heavy redesign and no visual churn for its own sake.

## ADAPTED

1. **Cover/gallery model**
   - adapted as optional Community Member value rather than making public accuracy dependent on payment.

2. **Manager media workflow**
   - unlike consumer platforms that may publish owner media directly after verification, Franklin keeps a human review/publish step.

3. **Free-manager scope**
   - source-backed factual corrections remain a reviewed correction workflow rather than allowing a manager to silently overwrite Profile Factory authority;
   - verified free managers still receive real management value: claim/access state, correction/removal controls, and reviewed profile photo/logo.

4. **Media handling**
   - browser-selected JPG/PNG/WebP is converted to metadata-stripped WebP before upload;
   - backend independently verifies type, byte size, dimensions, metadata/animation restrictions, account authority and slot entitlement;
   - media is durable in the membership database and publishes only after reviewer approval.

## REJECTED WITH CAUSE

1. **Ratings/reviews/recommendation counts**
   - not adopted because Franklin does not own a mature source-backed review/recommendation system for these profiles.

2. **Sponsored ranking or paid ordinary-directory placement**
   - rejected; Community Membership must not buy ordinary Directory ranking.

3. **Fabricated trust badges or implied endorsement**
   - rejected.

4. **Automatic owner overwrite of source-backed facts**
   - rejected to preserve canonical Profile Factory authority and correction review.

5. **Routine prominent “checked on [date]” hero box**
   - rejected from ordinary public presentation as unnecessary visual/internal provenance detail.
   - source provenance remains available under Sources & listing details.

6. **Copying competitor layouts or branding**
   - rejected. R1330 adopts useful interaction/design patterns only.

## Free vs Community Member management contract

### Verified profile manager — no paid membership required
- create/sign in to Franklin account;
- connect a real current Franklin profile;
- request representation verification;
- see management state;
- view public profile;
- submit factual correction request;
- submit public-profile removal request;
- upload/change/remove a reviewed profile image/logo;
- submit profile image/logo for human review;
- continue to use management/removal even after paid membership ends.

### Active Community Member
Includes all free management above, plus:
- richer reviewed About/services/practical profile content;
- member action links and official online-presence enrichment;
- reviewed cover image;
- reviewed gallery positions;
- other existing Community Member tools/benefits;
- existing no-Similar-local-profiles member presentation where applicable.

## Trust / security implementation

- accepted UI input: JPG, PNG, WebP;
- client re-renders chosen media to WebP, removing embedded metadata;
- server only accepts validated WebP bytes from the Franklin origin/session;
- server rejects malformed RIFF/WebP, unsupported metadata, animation, over-limit dimensions and over-limit byte sizes;
- public publishing requires verified profile authority;
- PROFILE image is free-management eligible;
- COVER/GALLERY submission requires active rich-profile entitlement;
- removal remains available to the verified manager even after paid membership ends;
- reviewer console gains a dedicated private media-review queue;
- public media is served only after reviewer publication.

## No-copy / no-novelty receipt

- **NO_COMPETITOR_COPYING = PASS**
- **NO_CHANGE_FOR_NOVELTY = PASS**
- **PAID_ACCURACY_GATE = FALSE**
- **FREE_MANAGEMENT_PATH = IMPLEMENTED**
- **MEDIA_REVIEW_REQUIRED = TRUE**
- **SOURCE_AUTHORITY_SEPARATION = PRESERVED**

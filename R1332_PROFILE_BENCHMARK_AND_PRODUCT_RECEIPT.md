# R1332 Profile Benchmark and Product Receipt

Date: 2026-09-18
Product: Franklin Navigator
Scope: public business/professional profile experience, ratings/reviews, paid-member gallery, paid-member Franklin Navigator offers

## Current benchmark research completed
Fresh online benchmarking was performed before this material profile release.

Reviewed patterns included:
- Google Business Profile: prominent business identity, location/contact actions, services, business photos, ratings/reviews, owner replies, offers/promotions.
- Yelp for Business: business information, portfolios/photos, services, review prominence, business responses and conversion actions.
- Other professional-profile patterns were considered for credentials, specialties, trust information and action-oriented layouts.

## Adopted/adapted
- Stronger action-first profile hero with larger identity media.
- More conventional finished-profile two-column desktop layout.
- Community ratings and written firsthand reviews.
- Rating summary and five-star distribution.
- One review per account/profile, no reviews of profiles the same account manages.
- Review reporting and moderation states.
- Verified profile-manager public responses to reviews.
- Review privacy and conflict-of-interest guidance.
- Special treatment for serious allegations/private information before publication.
- Public photo gallery for active paid Community Members, using the existing reviewed-media pipeline.
- Dedicated reviewed "Special offer for Franklin Navigator users" module for active paid Community Members.
- Offer headline, details, code, expiration, terms and optional offer link.
- Expired offers fail closed from public display.
- Gallery photo lightbox and more polished profile section hierarchy.
- Paid status does not affect factual accuracy, ordinary directory ranking or review score.

## Explicitly rejected / not adopted
- Pay-to-rank ordinary directory results.
- Pay-to-improve review scores.
- Incentivized positive reviews.
- Automatically publishing unreviewed member photos or promotional content.
- Fabricated testimonials, ratings, credentials, specialties or trust badges.
- Public display of internal source/provenance machinery as ordinary profile content.

## Safety and integrity boundaries
- Reviews must be firsthand.
- Special offers cannot be conditioned on positive reviews, review changes or review removal.
- Private client/patient/customer/case/account/payment information is prohibited.
- Serious allegations and private-information signals are held for moderation.
- Verified profile managers may respond, but responses cannot expose private information.
- Paid gallery/offer features are presentation and marketing benefits only.

## Main implementation
- Public profile UI: /assets/r1332-profile.js and /assets/r1332-profile.css
- Review API/schema: lib/reviews.js and schema/007_reviews.sql
- Paid member offers: member fulfillment fields + Profile Studio + /assets/r1332-member-offers.js
- Paid gallery: reviewed media pipeline surfaced more prominently in Profile Studio/public profiles
- Review guidelines: /review-guidelines/

# OWNER SUMMARY — R1337

Status: CANDIDATE_PENDING_EXACT_HEAD_QUALIFICATION

Successor: FR-NAV1.30.37-HF3.13.19
Predecessor: FR-NAV1.30.36-HF3.13.18
ACTIVE_EDITION: FRANKLIN_TN

R1337 fixes a real release-truth defect rather than making cosmetic version churn. The shared public loader is now the one canonical live release-identity writer; stale release overrides were removed from the paid-profile and active Assistant layers. Qualification now fails if an active feature layer tries to take release ownership again.

The same pass improves public profiles: paid-member photo controls/dialogs have accessible names, profile section wording is public-facing and consistent, and the new dynamic accessibility labels work in Spanish through the existing translation layer.

The newest owner instruction keeps the homepage unchanged except for the history heading: it now reads “Franklin Through Time.” “Then & Now” is removed, and the CI guard protects that exact heading without changing the section’s images, layout, links, colors, or spacing.

R1337 membership runtime source commit 476805319613cb0781c3a288200d58f3ee60ac5c is live on Render deploy dep-damg83id0e5s73fb7610 with LOCAL_RELEASE=FR-NAV1.30.37-HF3.13.19 and 29/29 startup tests passing.

PF15.28 wholesale promotion and LI42 publication remain correctly deferred behind their external acceptance/currentness gates. Smarter Justice was not used.

Owner action required: NONE for Local qualification/deployment. SCC promotion remains separate authority.

# FRANKLIN ASSISTANT PROVIDER RELEVANCE REPAIR — INTERNAL 0.3.3

Date: 2026-09-17
Public product name: Franklin Assistant
Internal browser controller: FRANKLIN-ASSISTANT2-0.3.3
Franklin release target: FR-NAV1.30.24-HF3.13.6

## Owner-observed defect

For the request:
"I need help mowing the lawn"

Franklin Assistant correctly showed two lawn-care profiles but also showed:
WHOLE CHILD SPEECH LLC
at LAWNVIEW LN.

The false match occurred because the shared directory matcher could satisfy a service query using unrelated field substrings:
- "lawn" from the address LAWNVIEW;
- "care" from a healthcare-related field.

That is not an acceptable service match.

## Systemic repair

The shared Franklin discovery matcher now detects recognized provider/service intents and requires the service concept to be present in:
- profile/business name;
- category; or
- type.

Location/address fields may still narrow a provider search, but may not independently create a provider/service match.

This repair applies to representative provider/service classes including:
- lawn/landscaping/mowing;
- plumbing;
- roofing;
- electrical;
- HVAC;
- dental;
- legal;
- veterinary;
- auto repair/mechanics;
- restaurants;
- pharmacies;
- pediatrics;
- therapy/counseling;
- real estate;
- towing;
- staffing/employment agencies;
- urgent care.

## Place-search preservation

The relevance gate uses whole service words/phrases so legitimate place/address searches remain available.

Synthetic regression:
- "lawn care" -> Franklin Lawn Care; Thrifty Lawn Care
- "lawn" -> Franklin Lawn Care; Thrifty Lawn Care
- "lawnview" -> WHOLE CHILD SPEECH LLC

Therefore the irrelevant profile is excluded from a lawn-service search but remains discoverable when a user actually searches its street/address text.

## Shared implementation

Updated:
- /assets/local-discovery-core.js
- Franklin Assistant loads the corrected core with a cache-busted URL
- English Find Local loads the corrected core with a cache-busted URL
- Spanish Find Local loads the corrected core with a cache-busted URL

The repair therefore applies consistently to:
- Franklin Assistant inline provider matches;
- Find Local directory searches.

## Regression evidence

Repository test:
tests/franklin-directory-service-relevance.cjs

Pre-promotion in-process synthetic execution:
PASS

Assertions:
1. lawn care excludes speech therapy;
2. lawn excludes speech therapy;
3. Lawnview address search still finds the speech-therapy profile.

## Preserved behavior

- Franklin Assistant visible same-page conversation thread;
- follow-up input;
- Clear / new question;
- Speak;
- Attach;
- up to 3 real inline provider matches;
- profile suppression checks;
- manifest/index SHA-256 verification;
- neutral non-paid, non-endorsed matching;
- full Find Local "See more matches" path;
- runtime remains the qualified FRANKLIN-ASSISTANT2-0.3.0 service runtime.

## Unrelated-site preservation

No profile source facts, membership state, payments, claims, reviewer state, pricing, or unrelated Franklin product subsystem is intentionally changed.

# Franklin Navigator → Profile Factory Reconciliation Handoff
## Directory identity/taxonomy observations from owner screenshot review
**Date:** 2026-09-11  
**Producer:** Franklin Navigator Platform presentation review  
**Consumer authority:** Franklin Profile Factory  
**Authority transfer:** NO

## Purpose

The Platform observed public directory presentations that may represent duplicate identities, legal-entity/trade-name relationships, or taxonomy inconsistencies. The Platform is not authorized to merge, delete, suppress, canonically rename or otherwise resolve Profile Factory identity records from screenshots alone.

This handoff asks the Profile Factory to perform source-backed identity resolution and return accepted corrections through the normal governed handoff path.

## Priority observations

### 1. `1799 Kitchen & Bar Room`
Owner review showed two nearby directory cards with the same apparent physical location rendered as:
- `1799 Kitchen & Bar Room` — category `Restaurant` — `130 2nd Ave North, Franklin, TN 37064`
- `1799 Kitchen & Bar Room` — category `American Restaurant` — `130 2nd Ave N`

**Requested Profile Factory review:** determine whether these are the same canonical entity with duplicated source rows / taxonomy variants, or legitimately separate profile projections. If the same entity, reconcile under normal evidence, alias and correction rules. Do not merge from name/address similarity alone.

### 2. `100% Chiropractic` / legal-entity variants
Owner review showed:
- `100% Chiropractic`
- `100% Chiropractic - Nolensville`
- `100 PERCENT CHIROPRACTIC NASHVILLE 1, LLC`
- `100 PERCENT CHIROPRACTIC NASHVILLE ONE LLC`

At least two variants displayed the same Franklin address family around `320 Liberty Pike`.

**Requested Profile Factory review:** resolve trade name, location, franchise/location and legal-entity relationships. Preserve distinct legal entities when genuinely distinct; use aliases/relationships rather than destructive merging when appropriate.

### 3. Taxonomy presentation
Owner review showed mixed public category forms including lower-case `organization`, lower-case `investing`, `Religion-Related`, `Non-Profit Organizations`, `Hospitalist`, and other source-taxonomy forms.

**Requested Profile Factory review:** determine which taxonomy values should be normalized canonically versus preserved as source-provenance categories. The Platform may title-case labels for readability, but must not silently alter canonical classification.

### 4. Public filing-address provenance wording
Some records expose evidence language similar to `Public IRS filing address geocoded in Williamson County: ...`.

**Requested Profile Factory review:** preserve full source/provenance internally. Where an address is qualified for public display, provide a consumer-safe presentation field/contract so the Platform can show `Public filing address` or another plain-language label without exposing ingestion/geocoding implementation wording.

## Platform action in FR-NAV1.21.0-HF3.2

- No canonical records were merged or deleted.
- No identity decision was made from screenshots.
- The Platform only improves public presentation: compact default browse, plain-language source labels, category capitalization for display, and removal of geocoding implementation phrasing.
- Canonical identity, taxonomy and source evidence remain owned by Profile Factory.

## Requested return contract

Return any accepted reconciliation with:
- stable profile identifiers,
- accepted canonical/alias relationship,
- evidence/source routes and dates,
- category/taxonomy result,
- address/display-field disposition,
- duplicate/suppression/correction propagation requirements,
- consumer-safe public labels where applicable,
- explicit acceptance/rejection receipt.

Do not infer membership, outreach consent, ranking, endorsement or availability from this handoff.

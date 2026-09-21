# R1354 Annual Community Member Recognition

## Paid recognition boundary

The $35/year Community Membership price is unchanged. Claiming a profile, factual corrections/removal, and basic profile management remain free.

Paid recognition is derived from authoritative active membership/entitlement state. A UI redirect or unverified payment event is not enough.

## Current and historical years

- The active qualifying year is explicit: e.g. `2026 Community Member`.
- Historical participation years are retained after lapse/cancellation.
- A historical year is never represented as current when authoritative membership is inactive.

## Public verification / QR destination

R1354 provides a stable Franklin-controlled `/membership-verification/` destination suitable for a decal QR code. The verification view is mobile-first and shows profile/business identity, current participation state/year, participation history and last update where appropriate.

It does **not** expose private mailing address data or embed tokens/secrets in the QR URL. It explains that Community Membership recognition is not a government license, professional certification, quality guarantee, ranking, or endorsement.

## Physical recognition

Digital recognition does not depend on physical inventory. The physical program defaults closed until owner/Revenue Engine enables a fulfillment program. When enabled, an eligible active paid member can request one current-year standard decal for a confirmed private mailing address, subject to program availability.

Fulfillment states: `NOT_ELIGIBLE`, `ELIGIBLE_ADDRESS_NEEDED`, `ELIGIBLE_READY`, `FULFILLMENT_REQUESTED`, `FULFILLED`, `REPLACEMENT_REVIEW`, `NOT_OFFERED`, `OUT_OF_STOCK`.

The data model enforces one profile/year recognition row and a maximum one standard fulfilled unit per year. Duplicate renewal/webhook processing must not create duplicate annual free-decal fulfillment.

A plaque is not included in the $35 plan and no plaque SKU/checkout was created.

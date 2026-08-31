# Franklin Navigator membership runtime

Franklin-only persistent account, checkout, subscription, entitlement, onboarding, support, and billing-state service for `FR-NAV1.0.0-CANDIDATE-R25`.

Key properties:

- exact 14-product / 84-price Franklin catalog;
- checkout redirect never grants access;
- signed, idempotent Stripe and SRE event ingestion;
- failure, grace, suspension, recovery, cancellation, termination, refund, and renewal handling;
- secure sessions, profile authority links, member assertions, first-value onboarding, support, and exception visibility;
- strict `FRANKLIN_TN` isolation;
- real checkout remains fail-closed until all 84 Payment Links, the live webhook secret, persistent Postgres, and customer billing portal are configured.

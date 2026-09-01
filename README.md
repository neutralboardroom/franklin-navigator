# Franklin Navigator commerce runtime

Franklin-isolated account, session, subscription, entitlement, onboarding and support runtime supporting public **FR-NAV1.10.0-CANDIDATE-R35**.

The runtime defaults to `COMMERCE_ENABLED=false`. A database connection or provider deployment cannot enable automated checkout and entitlement fulfillment by itself. The Revenue Engine must accept the exact ready-stage receipt before Local enables the controlled server-created Checkout Session path.

The bounded R35 public bridge uses three Stripe-hosted Payment Links while activation remains human-reviewed. The final runtime architecture uses exactly three authorized Franklin prices, server-created Checkout Sessions, signed Stripe/SRE event ingestion, Franklin-only Postgres persistence, Customer Portal access, restart persistence, backup/rollback evidence, and one explicitly payer-authorized controlled real transaction before automated fulfillment can be accepted as LIVE.

The retired 84-choice catalog and legacy Payment Link synchronization route must not return to the forward checkout path.

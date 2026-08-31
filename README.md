# Franklin Navigator commerce runtime

Franklin-isolated account, session, subscription, entitlement, onboarding and support runtime for **FR-NAV1.2.0-CANDIDATE-R27**.

The runtime defaults to `COMMERCE_ENABLED=false`. A payment-link mapping, database connection or provider deployment cannot open checkout by itself. The Revenue Engine must accept the exact ready-stage receipt before Local enables the controlled transaction path.

Production requires the Franklin-only Render Postgres database, all 84 authorized self-service mappings, Enterprise quote-only behavior, signed Stripe/SRE event ingestion, Customer Portal access, restart persistence, backup/rollback evidence and a successful controlled real membership transaction before general checkout opens.

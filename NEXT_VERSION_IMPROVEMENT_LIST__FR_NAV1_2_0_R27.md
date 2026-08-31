# Next Version Improvement List — Franklin Navigator R27

1. Deploy the Franklin-isolated membership web service from `franklin-commerce-runtime` in Virginia and bind it to the dedicated Franklin Postgres instance without exposing credentials.
2. Apply and verify the production schema, exact table inventory, isolation constraint, backups, restore rehearsal and rollback.
3. Synchronize all 84 live self-service Stripe prices or authorized checkout mappings; keep Enterprise quote-only.
4. Verify production Stripe/SRE webhook signatures, idempotency, replay protection, retries, dead letters and reconciliation.
5. Submit the exact `READY_FOR_SRE_LIVE_SWITCH_ACTIVATION` receipt to SRE 2.13 and require acceptance before enabling paid commerce.
6. Run one controlled real membership transaction through payment, Local entitlement, first value, Customer Portal and cancellation/refund reconciliation.
7. Open general checkout only after the controlled transaction passes; keep automated outreach and member campaign execution under their separate gates.
8. Add Spanish parity for the focused Ask Navigator business-choice dialog.
9. Add automated browser tests for focus trapping, Escape/backdrop close, mobile full-screen behavior and zero homepage layout shift.
10. Continue same-day currentness checks for homepage events and public business/member copy.

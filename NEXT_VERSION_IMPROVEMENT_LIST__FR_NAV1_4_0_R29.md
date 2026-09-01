# Next Version Improvement List — Franklin Navigator R29

1. Remove the Render workspace service-capacity blocker without deleting or repurposing another product; then create the Franklin-isolated `franklin-navigator-membership` web service with commerce initially disabled.
2. Bind the service securely to `franklin-navigator-membership-db`, apply/verify schema and durable rows, prove restart persistence, backup/restore and rollback, and keep secrets only in provider stores.
3. Reconcile the Local runtime away from legacy `franklin_payment_links` assumptions toward the SRE V6 server-created Checkout Session contract backed by the exact three provider Price IDs.
4. Complete non-charging end-to-end V6 lifecycle proof for monthly, annual and one-time 36-month Charter membership, including expiration reminders at 60/30/7 days.
5. Return the exact V6 READY receipt to SRE 2.16; require acceptance before enabling live Stripe event processing or any real checkout path.
6. Run one explicitly authorized controlled real transaction through payment, persistent entitlement, first value, Customer Portal/support, cancellation or refund reconciliation, and rollback evidence.
7. Open general public checkout only after `LIVE_PUBLIC_PAID_MEMBERSHIP_CHECKOUT_PASS`; change the primary CTA from `SHOW ME` to `ACTIVATE MY MEMBERSHIP` only then.
8. Consume PF15.8 only after the corrected embedded SCC handoff and Local consumer-acceptance evidence resolve the current hold; preserve 19,103 live profiles until then.
9. Perform LI V9 point-of-use validation and import only qualified, current Franklin records; suppress conflicts and expired dynamic items rather than publishing them automatically.
10. Continue the advanced donor-inheritance program from the verified Justice PRE120, Health v0.30/H26, Home v0.58/NAV7.2 read-only and Auto v1.9/A9 anchors; prioritize the next coherent whole-situation resident workflow rather than cosmetic expansion.
11. Add Spanish parity for Franklin Assistant’s focused whole-situation and business/community dialog where qualified translations can be safely completed.
12. Add production browser automation for Franklin Assistant dialog focus trapping, keyboard close, mobile full-screen behavior, member preview, pricing and SHOW ME pathways.

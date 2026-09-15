# Next Version Improvement List — FR-NAV1.30.8-HF3.12.0

1. Continue expanding site-wide instrumentation coverage as real launch traffic reveals additional high-friction workflows; do not treat monitoring as a one-version task.
2. Connect Franklin's signed issue handoff to the approved SRE / Owner Console external notification channel once that channel is explicitly configured and authorized. Do not invent an email, webhook or provider.
3. Add privacy-safe aggregate dashboards for workflow failure rate, latency, incident recurrence, claim completion, checkout completion, first-value completion and support escalation without storing raw user questions, passwords, tokens, payment credentials or unnecessary PII.
4. Add synthetic browser checks for real profile URL → claim → registration/sign-in → claim review → membership enrollment → member profile management → billing/support paths without making an unauthorized real charge.
5. Strengthen automatic incident recovery detection so system-derived incidents can move to RESOLVED after an independently verified recovery condition, while preserving history and recurrence evidence.
6. Continue adversarial monitoring tests for duplicate error storms, repeated/out-of-order Stripe events, wrong-community data, authorization boundaries, database/provider outages, alert retries, dead letters, checkout/entitlement inconsistencies and broken profile/claim URLs.
7. Add owner-console trend grouping and recommended next actions derived only from safe incident metadata.
8. Reconcile future Profile Factory and Local Investigator handoffs only through accepted authority/currentness gates while preserving Franklin community isolation.

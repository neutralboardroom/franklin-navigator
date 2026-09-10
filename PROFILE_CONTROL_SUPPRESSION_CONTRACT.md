# Franklin public-profile suppression consumer contract

`AUTHORITY_TRANSFER=false`

`dist/data/public-profile-suppressions.json` is the Local Community Platform public-suppression ledger. A Profile Factory refresh/reimport may refresh source facts, but it MUST NOT delete, ignore, or overwrite an active approved suppression. Public build/publish flows MUST apply this ledger after source/profile ingestion and before public publication.

A suppression is public-display state, not source destruction. Preserve lawful provenance, correction history, suppression history, fraud/security evidence, audit information, and legal holds only as legitimately required. Reinstatement requires an explicit reviewed action; source refresh alone is not reinstatement.

Free factual-correction and public-removal requests are separate from Community Membership and must never require payment.

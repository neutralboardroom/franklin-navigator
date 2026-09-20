# R1349 Related Local Profiles Relevance Repair

- Owner-reported live defect: Daddy’s Dogs displayed unrelated profiles because `Downtown Business or Organization` was treated as sufficient similarity.
- Site-wide rule: broad umbrella category equality has zero similarity value by itself.
- Locality is secondary only and never creates similarity.
- Broad profiles with no other qualified relevance signal show fewer/no related profiles rather than filler.
- Daddy’s Dogs has an explicit owner-qualified restaurant/food signal and is rendered with three Franklin food/restaurant neighbors: Back Yard Burgers, Burger Up Franklin, and Dog Haus.
- Ordering is alphabetical and independent of payment, membership, sponsorship, entitlement, or commercial state.
- Existing profile provenance, claim/correction/removal, community isolation, and ordinary unpaid ranking neutrality remain unchanged.
- Permanent regression: `tests/r1349-related-profile-relevance.cjs`.

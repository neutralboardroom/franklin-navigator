# NEXT VERSION IMPROVEMENT LIST — R1345

Only items not qualified to complete in R1345 belong here.

1. **Owner-specific live password-reset completion**
   - Outcome: prove the real owner receives the reset email, sets a chosen new password, remains tied to the exact selected profile, and reaches authority verification / Profile Center.
   - Why deferred: requires the owner's private email interaction and chosen password; builder tests cannot substitute for it.
   - Resume condition: owner performs the live interaction.
   - Priority: P0 live-owner verification.

2. **SCC acceptance/current-pointer reconciliation**
   - Outcome: record SCC acceptance/current-pointer state for the exact qualified release if/when SCC independently accepts it.
   - Why deferred: SCC is separate authority; Local must not self-accept.
   - Priority: P0 governance after qualification.

3. **Profile Factory / Local Investigator newer handoffs**
   - Outcome: consume newer qualified Franklin evidence without losing current profile/local truth.
   - Why deferred: no newer handoff was independently proven accepted for this Local release during this pass.
   - Priority: P1 after acceptance/currentness gates.

4. **Continue owner-fix visibility registry**
   - Outcome: every future owner-agreed user-facing fix is added to the permanent registry in the same release and receives visible/reachable regression evidence.
   - Why ongoing: this is a permanent release discipline, not a one-time task.
   - Priority: mandatory for every material release.

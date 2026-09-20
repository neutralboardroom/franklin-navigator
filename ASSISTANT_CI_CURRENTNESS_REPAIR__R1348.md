# R1348 Franklin Assistant CI Currentness Repair

The current product's authoritative qualification passed on R1347, but four older standalone Assistant workflows still failed whenever relevant Assistant/loader paths changed.

Observed failing workflow runs on current-era main history:
- R1315 browser acceptance: 35495626529
- R1316 conversation acceptance: 35495626513
- R1317 universal conversation acceptance: 35495626498
- Franklin Assistant clean-room boundary: 35495626531

The failures were caused by obsolete integration assumptions, including hard-coded hf36 query versions (frnav1315/1316/1317) and an obsolete canonical Assistant asset token (assistant-021). Restoring those old loaders would have been a regression.

R1348 preserves the historical behavior contracts in their original assets/tests but changes the workflows to verify the **current canonical Franklin Assistant integration** through the clean-room boundary. The clean-room test now accepts release-independent canonical asset version tokens while still rejecting retired navigator-bot/v2 controller paths.

A new permanent gate, `tests/r1348-assistant-workflow-currentness.cjs`, fails if the old stale loader pins return. The authoritative current-successor workflow runs this gate both in the source checkout and again after fresh exact-artifact extraction.

No resident-facing Assistant behavior, profile facts, pricing, membership, payment, entitlement, outreach, or other product authority is changed by this slice.

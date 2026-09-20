# R1346 Password Recovery and Async Feedback Test Report

The Local runtime now owns one password minimum constant: **8 characters**, maximum 256. Registration validates it before hashing, password-reset completion uses the same constant, and `hashPassword` enforces it. No forced character-class complexity rule was added.

Existing protections remain: single-use reset tokens, 30-minute lifetime, hashed stored tokens, IP/target throttling, generic account-existence response, prior-session invalidation, new signed-in session after success, and token transport in the URL fragment rather than a normal request query.

The first R1346 runtime deployment attempt (`dep-danlbmjtqb8s73ca34gg`) failed closed because an inherited regression test still asserted the R1345 runtime release string. The product tests for the new 8-character policy had passed. The stale assertion was corrected and the replacement deploy `dep-danlctp42hec73esjefg` reached **LIVE** from runtime commit `7d4cc9fb0f37abc89236c770b9e64405e0d13e38`.

The public UI additionally tests immediate loading/duplicate suppression for reset request, reset completion, profile connection and authority submission. Exact-head controlled-browser evidence is required before the static release qualifies.

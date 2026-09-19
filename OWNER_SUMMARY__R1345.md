# R1345 Owner Summary

Status: **CANDIDATE — exact-head qualification required**

R1345 turns the owner-approved “do not bury fixes” direction into a stronger permanent release gate.

The immediately preceding R1344 audit already checks the last ten Franklin releases, **R1335 through R1344**. It found and repaired four concrete later-layer regressions: stale Profile Studio wording, an unverified-user route that bypassed Profile Access, missing Spanish dynamic claim/recovery actions, and a correction/review claim action that was too easy to miss.

R1345 does not merely preserve those string checks. It adds a machine-readable protected-fix registry and scans actual non-print CSS rules for dangerous hiding/collapse behavior on protected actions and their critical parent containers. That specifically catches the class of problem where the correct button/text still exists in JavaScript or HTML but a later stylesheet makes it practically invisible.

The permanent visibility gate remains in both the normal qualification pass and the clean extracted exact-source artifact pass. New owner-approved user-facing fixes must be added to the registry in the same material release.

The R1345 membership/runtime lane is already live on commit `3503f7b3b58042ef0389537af313a1b3545ef23f`, Render deploy `dep-dan62krm8hqs73a6bqbg`. No membership behavior, pricing, payment, ranking, outreach, or Profile Factory authority was changed; the runtime advance is release identity only.

Public promotion remains blocked until the exact R1345 head passes qualification.

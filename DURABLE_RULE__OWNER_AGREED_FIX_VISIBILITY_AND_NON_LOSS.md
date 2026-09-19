# DURABLE RULE — OWNER-AGREED FIX VISIBILITY AND NON-LOSS

Rule ID: `FRANKLIN_OWNER_FIX_VISIBILITY_1`  
Authority: owner direction, 2026-09-19  
Builder: `LOCAL_COMMUNITY_PLATFORM`  
Applies to: Franklin Navigator and future Local Community Platform material releases unless explicitly superseded.

## Permanent rule

An owner-agreed user-facing fix, action, safeguard, wording correction, accessibility repair, routing repair, or trust boundary is not preserved merely because code still exists.

It is preserved only when the intended user can still **see it, understand it, and naturally reach/use it in the normal journey** at the priority level the owner approved.

Every future material release must:

1. retain every still-applicable protected fix in `OWNER_AGREED_FIX_VISIBILITY_REGISTRY.json`;
2. add every new owner-agreed user-facing fix to that registry in the same release;
3. run `tests/owner-agreed-fix-visibility.cjs` before qualification and again from the clean extracted release artifact;
4. fail closed if a protected action is hidden by CSS, JavaScript, responsive breakpoints, localization, account/member state, an experiment, stale template generation, or a later enhancement layer;
5. preserve exact-profile / exact-task context through claim, correction, recovery, support, and other protected continuations where applicable;
6. preserve English/Spanish parity for a protected action when that journey is bilingual;
7. keep primary actions visually prominent and secondary actions clearly available without confusing payment with factual truth, ownership, authority, or free correction/removal;
8. document any intentional replacement as an authorized replacement with equivalent-or-better user outcome and regression coverage.

A future version may reorganize presentation, but it may not bury, silently remove, or merely leave unreachable code for a protected fix.

## Release gate

A material release is not qualified if the permanent visibility test is missing from the canonical workflow, skipped in the clean-extraction pass, or fails for any protected item.

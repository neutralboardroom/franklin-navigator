# RECOVERY CHECKPOINT — R1336 TAKEOVER — 2026-09-18

Builder: LOCAL_COMMUNITY_PLATFORM
ACTIVE_EDITION: FRANKLIN_TN
Repository: neutralboardroom/franklin-navigator

## Exact takeover state
- Current main head at takeover: ce539408ce65d8961ab7c0571a3999416de2f2dc
- Current top-level PRODUCTION_RELEASE release before repair: FR-NAV1.30.35-HF3.13.17
- Last fully passing exact-head R1335 qualification run: 35308484758
- R1335 qualified head: e6e90726f13e5d2d78363a5539d7f77d1f7d750f
- R1335 exact artifact: FRANKLIN_NAVIGATOR__FR-NAV1.30.35-HF3.13.17__CURRENT_SUCCESSOR_EXACT_SOURCE.zip
- R1335 exact artifact SHA-256: 20728dfeabc446224f5e00effe22f9eee046d3daa3d12144f329e4690da37c86
- R1335 manifest SHA-256: 319f9a1ffe8365a3f9950a2e467a44cdf9554405d67b4de8c01a91301e12d2d0

## R1336 work already present in main
The unfinished R1336 source changes include:
- finished/public-facing Ask Franklin layout work;
- site-wide restrained semantic color-system refinements;
- active-section-only navigation treatment;
- current profile experience asset binding;
- public-facing language cleanup in profile and supporting pages;
- a public-language audit that currently passes 19,362 public pages with 0 findings.

## Exact current blocker
Qualification run 35323747673 fails only after earlier source/route/asset/public-language checks pass.
The failing step is `Site-wide Franklin color-system coverage`.

Root cause:
- current shared loader `dist/assets/hf36.js` correctly references `/assets/r1336-color-system.css?v=frnav1336`;
- the qualification workflow still hard-codes `r1335-color-system.css` and requires that old filename in the loader;
- therefore the workflow exits before running the full color-loader coverage check, artifact build, fresh extraction, or upload.

## Continuation rule
Do not discard or rebuild the R1336 UI/profile/language work. Repair release identity and qualification mechanics around the existing source. Then require a fresh exact-head qualification before deployment. Do not call source changes implemented live until the qualified exact source is deployed and live homepage, Ask Franklin, directory, and real profile routes are rechecked.

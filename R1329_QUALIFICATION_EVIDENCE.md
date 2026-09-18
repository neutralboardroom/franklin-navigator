# R1329 Qualification Evidence

Release: `FR-NAV1.30.29-HF3.13.11`

## Required user outcome

A search for **Franklin Navigator** on `/claim-profile/` must return the genuine PF15.28 profile `FR-ORG-b00c0ace7943973c`, allow selection/opening of its public profile, and preserve the ordinary authority-verification and optional $35/year membership lifecycle. R1328 live failed this outcome with “No matching profile found.”

## Implemented

- one exact PF15.28 profile overlay, duplicate-failing and edition-scoped;
- Find Local discovery merge;
- claim-profile compact search merge;
- membership enrollment compact search merge;
- source-backed public profile route;
- mailing-address-only safety semantics;
- seven verified official/action links, zero invented social links;
- Spanish membership entry route;
- profile and membership sitemap coverage;
- no fabricated claim, authority, payment, member, entitlement or publication state.

## Qualification gates

The seal process must record actual results for: JavaScript syntax checks, R1329 contracts, R1328 regression contracts, R1327 regression contracts, claim-search interaction, profile-count/duplicate checks, public-language scan, deterministic double-build, manifest coverage, safe paths, fresh extraction, and rerun of applicable tests from the fresh extraction.

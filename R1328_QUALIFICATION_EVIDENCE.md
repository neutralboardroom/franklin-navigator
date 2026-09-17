# R1328 Qualification Evidence

Release: `R1328 / FR-NAV1.30.28-HF3.13.10`
Builder: `LOCAL_COMMUNITY_PLATFORM`
Edition: `FRANKLIN_TN`
Execution base: `R1327 / FR-NAV1.30.27-HF3.13.9` at `9505238f7a8ba100fc7399b0e0ad4e2323215260`

## Material successor slice

R1328 improves the profile-to-membership journey without redesigning working Franklin surfaces:

- Direct membership setup now begins with choosing the public Franklin profile instead of exposing an unscoped account-first enrollment path.
- Choosing a listing is explicitly separated from representation/authority verification; checkout remains unavailable until the existing verification gate succeeds.
- Claim search reports match/no-match state more clearly and uses neutral “Choose profile” language rather than implying ownership.
- Enrollment progress is aligned to the safe sequence: choose profile → account → confirm representation → membership → benefits/billing.
- Enrollment reiterates the existing no-double-pay rule for uncertain payment outcomes.
- Member-profile preview links added by the prior release are URL-typed and remain clearly proposed/unverified until review succeeds.
- The current new-sale offer remains `$35/year` using `franklin_community_member_annual_v6`; retired legacy plan values are not restored.

## Authority and upstream disposition

- No Profile Factory dataset is changed. The current 19,103-profile projection is preserved; newer producer candidates remain `DEFER_WITH_CAUSE` until accepted consumer/current-pointer authority exists.
- No Local Investigator candidate is imported without accepted consumer/head-advance evidence.
- Smarter Justice is not used as a donor and no SJ runtime, state, code, data, profile, account, commerce, or writeback connection is created.
- Basic profile accuracy, factual corrections, and public-profile removal remain free. Ordinary Directory ranking remains membership-neutral.
- SCC acceptance is not self-asserted. The source package may qualify independently; accepted/current coordination remains SCC authority.

## Required source checks

The deterministic packager executes and binds these checks into `QUALIFICATION_RESULTS__R1328.json` inside the sealed ZIP:

1. `node --check dist/assets/r1328-quality.js`
2. `node --check dist/assets/franklin-established-positioning.js`
3. `node tests/r1327-screenshot-refinement.cjs`
4. `node tests/r1328-quality-contract.cjs`

The external seal workflow then extracts the exact final ZIP into a fresh empty directory and reruns the R1327 and R1328 contracts through `scripts/validate-r1328-package.py`. A failed source check, deterministic double-build comparison, manifest check, path/symlink safety check, or clean-extraction check fails the seal.

## Packaging contract

`scripts/package-r1328.py`:

- stages only tracked source members plus generated qualification/release receipts;
- rejects unsafe paths, symlinks and missing tracked members;
- creates a complete SHA-256/byte-count manifest, excluding only the manifest's own self-hash by explicit rule;
- normalizes archive timestamps and file permissions;
- builds two ZIPs independently and requires byte identity;
- stores final ZIP byte count/SHA-256 in external `R1328_BINARY_ATTESTATION.json`.

`RELEASE_RECEIPT__R1328.json`, `QUALIFICATION_RESULTS__R1328.json`, and `RELEASE_MANIFEST__R1328.json` are generated into the sealed package. Final deployment/live verification occurs after the qualified source package is sealed so the deployed commit and packaged source remain identical.

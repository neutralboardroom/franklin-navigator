# R1329 Franklin Navigator canonical profile integration evidence

Release: `FR-NAV1.30.29-HF3.13.11`
Predecessor: R1328 / `FR-NAV1.30.28-HF3.13.10`
Active edition: `FRANKLIN_TN`
Canonical Profile Factory source: `FR-PF-PLATFORM-15.28`
Canonical profile ID: `FR-ORG-b00c0ace7943973c`

## Qualified owner-directed integration

- Consumes only the exact real Franklin Navigator profile from PF15.28; it does not wholesale promote the broader 22,910-record snapshot.
- Preserves the canonical PF ID through public page, search, claim and membership resolution.
- Adds one real unclaimed/claimable profile; no test/control, claim, payment, entitlement or member state is transferred or fabricated.
- Keeps `2020 Fieldstone Pkwy, Ste 900, Franklin, TN 37069` explicitly as **Mailing address only** and does not map/geocode it as a physical office.
- Renders the seven PF-qualified official website/action links and zero social buttons because PF15.28 verified zero official social routes.
- Preserves free factual correction/removal and normal authority verification before checkout.
- Repairs the previously missing `/es/iniciar-membresia/` public route using the existing $35/year contract without asserting checkout state.

## Data architecture

The accepted 19,103-record discovery corpus remains byte-bound and unchanged. R1329 adds one integrity-checked targeted discovery overlay for the owner-directed PF15.28 profile and patches the Local discovery loader to merge exactly that one non-duplicate row. The claim/membership compact projection advances from 19,103 to 19,104 because those flows load the compact profile manifest directly.

## Authority

`AUTHORITY_TRANSFER=false`. Profile facts remain Profile Factory truth. Local owns rendering/search/claim/member integration. Smarter Justice donor material was not used. LI V42 remains producer-qualified with SCC gate pending and is not imported by this profile-specific release.

## Candidate verification completed

- R1329 source contracts: PASS.
- R1328 regression contracts: PASS.
- R1327 regression contracts: PASS.
- Discovery overlay decoder/search test: PASS after repairing a pre-commit `records` → `rows` adapter defect found by the deeper test.
- Desktop profile render (1365px): PASS, no horizontal overflow.
- Mobile profile render (390px): PASS, no horizontal overflow.
- Spanish membership mobile render (390px): PASS, no horizontal overflow.
- This evidence is candidate/source evidence and does not self-assert SCC acceptance or live verification.

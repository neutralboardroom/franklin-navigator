# R1330 Public Deployment Receipt

Release: **FR-NAV1.30.30-HF3.13.12 (R1330)**
Date: **2026-09-18**

## Public static deployment

Render service:
- name: `franklin-navigator`
- service ID: `srv-da8tg6rbc2fs73crru2g`
- branch: `main`
- publish path: `dist`
- auto-deploy: OFF

Exact deployed source commit:
- `e607031c7127e1e19f9cf69f4704ecb7d5050935`

Exact deploy:
- `dep-dama1suk1f9s73eptljg`

Render state:
- **LIVE**
- started: `2026-09-18T02:24:51.092582Z`
- finished: `2026-09-18T02:26:07.376721Z`

Render build evidence confirms:
- repository cloned from `neutralboardroom/franklin-navigator`;
- exact commit `e607031c7127e1e19f9cf69f4704ecb7d5050935` checked out from `main`;
- configured static-site build command executed;
- deployment reached Render `live` state.

## Dependent membership/profile runtime

Service:
- `franklin-navigator-membership`
- service ID: `srv-dabgvefqj5pc739vr4h0`

Exact deployed backend commit:
- `84247d591754102a44a80a6b6e2e7666d1b900f9`

Exact deploy:
- `dep-dam9ve61egvs738mjgr0`

Runtime state:
- **LIVE**
- finished: `2026-09-18T02:20:03.717222Z`
- startup syntax/check path: PASS
- runtime ready/listening: PASS
- combined current public profile scope: **19,104**

## Functional source qualification

Before public promotion, source checks confirmed:

- ordinary claim/manage actions route to `/profile-access/`, not directly into paid enrollment;
- `/profile-access/` runs the account/profile claim path in free profile-management mode;
- free profile management does not require paid Community Membership;
- Profile Studio checks current paid entitlement and renders richer member editing only when active;
- verified non-paying managers retain:
  - claim/access;
  - factual correction;
  - public-profile removal;
  - reviewed profile photo/logo management;
- active Community Members additionally receive richer profile content plus reviewed cover/gallery media;
- media removal remains available to the verified manager even after paid membership ends;
- profile link creation fails closed for profile IDs outside the current public scope.

## Public browser verification limitation

A narrow live browser verification was attempted after Render promotion for:
- the canonical Franklin Navigator profile;
- the free profile-access route;
- Profile Studio.

The available browser/scrape provider could not perform the requests because that provider account had insufficient credits. A second external fetch path could not access the pages from its environment.

Therefore this receipt **does not claim browser-executed live-DOM verification**.

What is verified:
- exact GitHub source state;
- exact Render deployment commit;
- exact Render live deployment state;
- runtime build/startup state;
- source-level route/gating contracts.

A human/browser visual acceptance pass remains appropriate, especially for:
- public profile layout at laptop/mobile widths;
- free account/claim flow;
- Profile Studio image picker;
- first genuine authorized profile-image submission/review/publication.

## Related evidence

- `R1330_PROFILE_DESIGN_MANAGEMENT_EVIDENCE.md`
- `R1330_PROFILE_BENCHMARK_ADOPTION_RECEIPT.md`
- `NEXT_VERSION_IMPROVEMENT_LIST__R1330.md`

## Release conclusion

**R1330 PUBLIC STATIC PROMOTION = COMPLETE / LIVE**

This receipt distinguishes deployment verification from browser-executed visual acceptance and does not fabricate unavailable human/customer lifecycle proof.

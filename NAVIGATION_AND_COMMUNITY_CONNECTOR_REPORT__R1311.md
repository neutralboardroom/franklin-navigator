# NAVIGATION AND COMMUNITY CONNECTOR REPORT — R1311

Release: FR-NAV1.30.11-HF3.12.3
Date: 2026-09-15

## Assistant-first public entry

Franklin Assistant remains the first usable public action at the top of the homepage for residents and other non-business users. The community-connector work surrounds and follows the Assistant instead of replacing it.

The new opening layer connects users immediately to Today in Franklin, Find Local, Get It Done, Things to Do, Community and My Franklin.

Business, professional and organization participation remains separate: public profile claiming/correction is free, while Community Membership is optional.

## Maximum-visible one-line header

The primary header must show the maximum practical number of useful destinations on one line. More is an overflow control, not the default home for useful navigation.

R1311 fixes the desktop condition shown in the owner screenshot where substantial unused horizontal space remained while My Franklin and Help Center were already hidden.

Implementation:
- preserve the R1310 measured-fit controller
- allow the desktop header to use up to 1480px of safe width
- keep the brand at left
- let primary navigation consume the available middle width
- place the language control after the navigation on desktop
- move only as many lower-priority items into More as actual rendered width requires
- preserve responsive tablet/mobile behavior
- continue reporting unresolved PRIMARY_NAV_OVERFLOW through the Franklin issue monitor

High-priority items remain visible as long as reasonably possible: Ask Franklin, Find Local, Get It Done and For Business.

Lower-priority candidates collapse only when necessary, starting with Help Center and My Franklin.

## Qualification

Current-successor qualification passed after the R1311 pathname syntax correction. The successful gate validates JavaScript syntax, R1311 navigation/community assets, route integrity, Assistant regressions, monitoring-loader presence and deterministic exact-source artifact construction.

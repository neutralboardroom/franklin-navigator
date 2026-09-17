# FRANKLIN ASSISTANT INLINE CONVERSATION + PROVIDER MATCHES — INTERNAL 0.3.2

Date: 2026-09-17
Public product name: Franklin Assistant
Internal browser controller: FRANKLIN-ASSISTANT2-0.3.2
Franklin release target: FR-NAV1.30.23-HF3.13.5

## Owner-observed defects

1. The submitted question disappeared when the answer appeared.
2. There was no obvious same-chat follow-up experience.
3. Provider/service requests such as "I need help mowing the lawn" stopped at a Find Local handoff instead of showing useful local matches directly.

## Conversation repair

Franklin Assistant now keeps a visible same-page conversation:
- each submitted question is shown as a "You" turn;
- the Franklin answer appears beneath it;
- the input becomes "Ask a follow-up…";
- follow-ups append to the same visible thread;
- recent turns continue to be sent as current-page-only context;
- Clear / new question resets the visible thread and conversation context;
- no popup/modal answer experience is introduced.

## Provider/service completion

For qualified provider/service intent:
- Franklin Assistant uses the existing Franklin Navigator public directory corpus;
- directory data is loaded only when needed;
- the existing discovery index SHA-256 from the live manifest is verified before use;
- the existing FranklinDiscoveryCore decoding and deterministic local matching rules are reused;
- the public profile suppression ledger is checked before any inline profile is shown;
- up to 3 matching profiles are rendered inline;
- each result may provide Open profile, Call and Website based only on listed public facts;
- "See more matches" opens the full Find Local search.

The inline list is explicitly informational:
- not a recommendation;
- not an endorsement;
- not an availability claim;
- not a paid ranking.

Provider follow-ups such as "show me more", "find someone near me", or "any others?" preserve the prior provider/service query within the current page conversation.

## Lawn-care interpretation

Ordinary wording such as "I need help mowing the lawn" is treated as a request for lawn-care/mowing service.

If the user explicitly indicates free help, volunteer help, disability/senior support, low income, or inability to afford service, the ordinary commercial-provider shortcut is not used and the Assistant can research assistance resources instead.

## Directory integration boundaries

The Assistant does not create a second directory or invent provider records.

It reuses:
- /data/discovery/manifest.json
- the manifest-bound discovery index
- /assets/local-discovery-core.js
- /data/public-profile-suppressions.json
- canonical /profiles/{id}/ pages
- the same deterministic local relevance logic used by Find Local

If directory integrity verification or suppression checking fails, inline provider results fail closed and the existing Find Local handoff remains available.

## Browser qualification

Checks before promotion:
- controller JavaScript syntax: PASS
- public label remains Franklin Assistant
- no visible "Franklin Assistant 2"
- inline thread rendering present
- Ask a follow-up placeholder present
- current-page history reset present
- directory manifest/index verification present
- suppression-ledger gate present
- inline profile renderer present
- provider follow-up continuity present

## Runtime

Runtime remains:
FRANKLIN-ASSISTANT2-0.3.0

Runtime commit:
ca038b9db8d2b09d8eacc1aa2f5d0c61bea22859

Runtime deploy:
dep-dal6bgdbedkc73be8kr0

Runtime status:
LIVE

Existing live qualification:
- startup: 16 / 16 PASS
- resident bank: 100 / 100 PASS

## Unrelated-site preservation

No directory/profile source data, member/payment/claim/reviewer state, community content, business tooling, or unrelated Franklin product implementation is intentionally changed by this release.

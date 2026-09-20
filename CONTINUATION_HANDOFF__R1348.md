# R1348 Continuation Handoff

Target release: `FR-NAV1.30.48-HF3.13.30`
Role: `LOCAL_COMMUNITY_PLATFORM`
Edition: `FRANKLIN_TN`
Predecessor: `FR-NAV1.30.47-HF3.13.29` / `063e9ce008726f9908d7f856ed37f9c974b97ad8`

R1348 repairs false-red historical Assistant CI without restoring retired Assistant wiring. Future builds must keep:
- `tests/r1348-assistant-workflow-currentness.cjs`;
- `tests/assistant2-clean-room-boundary.cjs`;
- R1315/R1316/R1317 historical behavior checks;
- current canonical Assistant integration rather than exact obsolete cache/version tokens;
- all R1347 whole-site and claim/account/recovery durability gates.

Do not consume LI V39 or a newer PF handoff from recency/version alone. Require the exact accepted consumer/currentness evidence first.

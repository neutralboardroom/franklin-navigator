# DEPLOYMENT AND ROLLBACK EVIDENCE — R1315

Release: FR-NAV1.30.15-HF3.12.7
Date: 2026-09-15

## Public static production

Service: franklin-navigator
Deploy: dep-dakg8eh5efls73dtm10g
Commit: adc30b4e607bef39919c8418e7e43c50f6c2874c
Status: LIVE
Finished: 2026-09-15T08:40:37.216777Z

This promotion includes the R1315 cache-busted Assistant browser controller and preserves the R1314 member-profile readiness controls.

## Assistant runtime production

Service: franklin-navigator-assistant
Deploy: dep-dakg6mp42hec73afoob0
Commit: 8b0248bbf75da1d27f938bb4f77245c6f80dc48d
Status: LIVE
Finished: 2026-09-15T08:36:18.812451Z

Runtime startup acceptance passed:
- grounded LLM verification;
- live roof-permit API smoke;
- exact two-turn "my roof is leaking." → "i need it repaired." smoke.

## Browser acceptance

GitHub Actions run: 34948063356
Conclusion: SUCCESS
Head: 138dce7408f725f874e94a25287bf2d1d715b616

## Rollback

Public rollback predecessor: FR-NAV1.30.14-HF3.12.6 / static deploy dep-dakg510ae00c73bb8qbg.
Assistant runtime rollback predecessor: commit ab36193f474db57e0dc4f1a703dbe9ad407990b1 / deploy dep-dak8p6ou01pc73e86rmg.

Rollback should be used only if R1315 creates a new regression; do not roll back merely to restore the previously broken general Assistant research path.

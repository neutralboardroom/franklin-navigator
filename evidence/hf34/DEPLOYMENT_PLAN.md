# HF3.4 Deployment Plan

1. Merge the qualified candidate branch into `main`.
2. Confirm merged `main` contains release `FR-NAV1.23.0-HF3.4` and exact generated candidate tree.
3. Manually trigger Render static service `srv-da8tg6rbc2fs73crru2g` in workspace `tea-d87bbcrtqb8s7394bmcg` (auto deploy is off).
4. Wait for Render status `live` and confirm the deployed commit equals the merged `main` commit.
5. Owner performs real-laptop hard-refresh review starting with Sports, Business Dashboard, Directory, Corrections and a public profile.
6. If a severe regression is found, rollback target is the prior live rollback commit `1da2b9b9c52a71291292e1ce4ebf3fc104502648` / deploy `dep-dahqp93m8hqs73d0q2vg`.

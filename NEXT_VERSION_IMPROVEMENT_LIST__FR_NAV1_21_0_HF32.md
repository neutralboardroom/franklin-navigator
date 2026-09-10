# Franklin Navigator — FR-NAV1.21.0-HF3.2-CANDIDATE
## Consolidated Owner Screenshot Review Pass
**Date:** 2026-09-11  
**Parent source:** `9f15657b6a06c394d83dcdff9620be40f4c59f31`  
**Writable lane:** `LOCAL_COMMUNITY_EDITION:FRANKLIN_TN`

## Purpose

This release converts repeated owner screenshot findings into shared Franklin Navigator component rules instead of page-by-page patches. It preserves product capabilities, public data authority, safety behavior, membership boundaries, free corrections/removal, source links, Spanish routes, and the existing Community Explorer loading repair.

## Owner-reviewed representative page families

- Sports / Community Explorer
- Bowling deep sports page
- Community
- My Franklin
- For Businesses / Community Membership
- Community Help Center / urgent help
- Find Local / Directory

These representative pages were used to identify defects that should be corrected site-wide wherever the same component pattern appears.

## Material improvements in this candidate

1. **Site-wide hero sizing**
   - Reduces oversized laptop H1 treatments on ordinary public pages.
   - Tightens hero padding while retaining clear hierarchy.
   - Includes narrower/mobile safeguards.

2. **Site-wide spacing and density**
   - Reduces oversized section padding and repeated dead space.
   - Compacts cards, footers, empty states and generated-output placeholders.
   - Keeps content readable and touch targets usable.

3. **Site-wide dark-surface contrast**
   - Repairs low-contrast text on urgent, history and other dark shared surfaces.
   - Preserves distinct high-contrast links and exceptions for white nested cards.

4. **Site-wide image-height discipline**
   - Prevents large supporting images from consuming a full laptop viewport.
   - Especially important on help/safety flows where urgent actions must appear first.

5. **Consistent action hierarchy**
   - Removes literal `More ...` / `More…` presentation.
   - Uses clean disclosure controls with consistent chevrons.
   - Favors one primary action plus a useful secondary action before overflow.

6. **Community Explorer / Sports / deep activity pages**
   - Keeps the bounded loading/retry repair from the predecessor.
   - Moves the actual local options finder directly after the hero.
   - Collapses generic cross-navigation under `Explore other sports and activities`.
   - Hides empty current-program sections after the data state settles.
   - Removes generic location blocks from scoped deep pages when they are not the actual result being viewed.
   - Hides oversized shortlist output until the user chooses to build one.
   - Hides redundant filter controls when only a very small result set exists.
   - Collapses listing methodology and hides organizer-only promotion from ordinary deep resident flows.

7. **My Franklin**
   - Converts the long two-column page into a full-width dashboard flow after a compact settings/address area.
   - Collapses preferences by default.
   - Compacts empty saved-profile, plan, Assistant and reminder states.
   - Preserves device-only storage and all existing save/reset capabilities.

8. **For Businesses**
   - Makes profile review the primary starting action and Community Membership secondary.
   - Replaces internal/product wording with public benefit language.
   - Centers the single `$35/year` Community Membership decision card.
   - Removes the duplicate standalone member-options CTA below the plan.
   - Collapses the process-heavy community path under `How it works`.
   - Preserves free factual corrections/removal and the rule that membership does not buy ranking or endorsement.

9. **Community Help Center**
   - Moves urgent help immediately below the Help Center hero.
   - Moves the large park image below the private help planner and materially caps its height.
   - Repairs urgent-section dark text contrast.
   - Hides Copy/Print while the plan is still empty.
   - Replaces implementation-facing track/count language with resident-facing wording.
   - Removes public presentation of internal counts such as `16 deep tracks`, `15 deep pathways`, `24 paths backed by 194 sources`, and `19,103` from ordinary help-card copy while preserving the underlying capabilities.
   - Preserves 911, 988, 211, Poison Control and domestic-violence safety routes.

10. **Find Local / Directory**
    - Keeps Search + Category as the primary controls.
    - Adds compact popular-search shortcuts.
    - Shows a representative default browse sample instead of visually presenting hundreds of pages as the primary experience.
    - Restores full result/pagination behavior as soon as a user searches or filters.
    - Tightens sticky controls and result-card density.
    - Rephrases `Source date` as `Last checked`.
    - Rephrases public IRS geocoding implementation text as a simple public filing address.
    - Uses public-only visual category capitalization while leaving canonical category data untouched.
    - Preserves Compare, Open profile, advanced filters, profile facts, membership-neutral ranking and all underlying directory records.

11. **Profile Factory authority boundary**
    - The Platform does not merge, delete or canonically deduplicate profiles based on visual similarity.
    - Suspected duplicate/identity/taxonomy examples observed during owner review are documented in a separate Profile Factory reconciliation handoff.

## Explicit no-loss / no-authority-transfer constraints

- No canonical Profile Factory records are changed by this release.
- No Local Investigator authority is absorbed.
- No customer account, payment, claim, membership, pricing, entitlement or outreach authority is transferred.
- No safety route is hidden behind membership or payment.
- No existing public correction/removal right is removed.
- Community isolation remains Franklin-only.
- Existing source-backed data files are not rewritten by presentation cleanup.
- Community Explorer loading remains bounded and fail-visible rather than hanging indefinitely.

# Next Version Improvement List

1. Continue owner screenshot review on the **deployed** FR-NAV1.21.0-HF3.2 candidate using a small regression set only: Home, Sports, Bowling, Community, My Franklin, For Businesses, Help Center, Directory and one public profile.
2. Verify the consolidated rules at the owner's normal laptop width and on a narrow/mobile viewport, with special attention to sticky headers, Spanish text expansion, card wrapping and disclosure menus.
3. Confirm the Help Center urgent strip appears before any large decorative image and that all urgent-section text is high-contrast.
4. Confirm Bowling and other scoped Explorer pages show real local options immediately after the compact hero, with generic sports/activity navigation collapsed.
5. Confirm Directory default browse shows only a small representative sample while all search/filter/pagination capability remains available once a query/filter is active.
6. Review one representative public profile for the same spacing, action-hierarchy, source-link and mobile rules before declaring shared visual convergence complete.
7. Send the separate Directory/Profile Factory reconciliation handoff to the Profile Factory workstream and consume only externally accepted identity/taxonomy corrections in a future Platform release.
8. If any visible header rewriting remains after deployment, move the canonical navigation structure earlier in the static render path rather than stacking another late runtime rewrite.
9. Continue removing public-facing internal implementation terminology wherever a representative regression check finds it; do not replace useful user information with vague copy.
10. Preserve “no changes for the sake of changes”: after the representative regression set is clean, stop broad cosmetic churn and return to product-value improvements.

# NEXT VERSION BUILD LIST — FRANKLIN NAVIGATOR

Started: 2026-09-22
Current deployed baseline: `FR-NAV1.30.58-HF3.13.40`
Owner live-review continuation: findings continue from the prior 192-item review.

This is the running owner-observed list for the **next material Local Community Platform version**. Do not implement merely for novelty. Preserve the whole-site no-regression/no-burial rule. Each new finding should be verified against the live deployed path and then dispositioned as FIX / PRESERVE / DEFER / NOT-REPRODUCED with evidence.

## Finding #193 — Assistant submit scroll position lands too low

**Owner evidence:** live Franklin Navigator screenshot, 2026-09-22.

**Observed behavior:** after entering a question in Franklin Assistant and pressing Enter, the page automatically scrolls too far down into the generated response. The viewport can land near the lower portion of the answer/action area, while the user's submitted question and the beginning of the Assistant answer are above the visible screen. The user then has to manually scroll upward to read the question and answer from the beginning.

**Desired outcome:** submitting a question should leave the user at a useful reading position where the just-submitted question and the beginning of the new Assistant answer are visible without requiring a corrective upward scroll.

**Implementation direction:**
- audit all post-submit focus, `scrollIntoView`, anchor, hash, response-render, and focus-management behavior in the Franklin Assistant flow;
- do not auto-scroll to the bottom of a newly rendered answer merely because action buttons/checklists are appended;
- after submit, prefer positioning the viewport at the submitted question / top of the new answer, with enough header offset that the first answer lines are not hidden by the sticky navigation;
- preserve keyboard submission and accessibility focus semantics without causing a second jump after streaming/render completion;
- prevent later-rendered cards, checklists, citations, or action controls from stealing focus or changing the user's scroll position unless the user explicitly activates them;
- verify desktop and mobile behavior, long and short answers, streamed and non-streamed answers, Enter submission and button submission, and answers containing checklists/action cards.

**Acceptance criteria:**
1. Pressing Enter on a question does not land the viewport at the lower part of the answer.
2. The submitted question remains visible or immediately adjacent to the top of the viewport.
3. The beginning of the new answer is visible without manual upward scrolling.
4. Sticky-header offset is respected.
5. No second scroll jump occurs when answer enhancements/cards finish rendering.
6. Keyboard focus remains accessible and predictable.
7. Existing Assistant functionality, saved checklists, My Franklin actions, citations, and answer content remain unchanged unless required for this fix.

**Priority:** P1 UX / Assistant readability.

**Status:** OPEN — owner-observed live defect.

# R1352 Next Version Improvement List

This list contains only work that is not safely complete in the current source pass.

## Dependency-bound follow-ups

1. **Requester notifications after reviewer decisions**
   - Outcome: send clear approval / more-information / rejection / revocation notice through an actually configured account/email channel.
   - Current state: account status is durable and refreshable; no unverified outbound-delivery claim is made.
   - Dependency: qualified notification provider/channel and delivery observability.
   - Authority: Local product implementation, subject to configured provider credentials.
   - Priority: P1.

2. **Production real-request continuation**
   - Outcome: resume the already-pending `FR-ORG-b00c0ace7943973c` request after R1352 deployment; authorized human reviewer evaluates the real evidence, then member verifies Profile Center edit/save/reload/public-review behavior.
   - Current state: source/runtime path is implemented and fixture-tested.
   - Dependency: deployed R1352 plus authorized human evidence judgment. The real request must not be used for destructive rejection/withdrawal tests.
   - Priority: P0 operational continuation, not another source feature.

3. **Reviewer operational observability**
   - Outcome: add bounded aging/decision-throughput metrics if current privacy-safe product analytics contracts authorize them.
   - Dependency: accepted analytics semantics; no private evidence content.
   - Priority: P2.

All other #1–86 claim/manage/reviewer items are either implemented in R1352, preserved by predecessor gates, or covered by the production-continuation dependency above. Do not create another reviewer backend.

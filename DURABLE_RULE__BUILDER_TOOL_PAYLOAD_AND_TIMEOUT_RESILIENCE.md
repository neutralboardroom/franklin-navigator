# Durable Rule — Builder Tool Payload and Timeout Resilience

Status: ACTIVE / OWNER-APPROVED / DURABLE
Applies to: Franklin Navigator and successor builder work. This rule should also be carried forward into universal SMARTER builder guidance where applicable.

## Purpose
Prevent avoidable message-delivery timeouts, stalled builder sessions, duplicate actions, and unnecessary context growth caused by oversized tool responses or repeated context recovery. Build scope must not be artificially reduced merely to avoid these failures.

## Required operating rules

1. Prefer targeted tool calls over broad discovery calls.
   - Do not load an entire tool schema when one narrowly named action is enough.
   - Do not list an entire external account, workspace, service inventory, repository tree, Library inventory, or deployment history when exact identifiers are already known.
   - Reuse previously verified workspace IDs, service IDs, repository names, branch names, file paths, deployment IDs, and other stable identifiers during the same build.

2. Avoid oversized retrieval payloads.
   - Fetch only the exact file, line range, service, deploy, commit, or resource needed for the current decision.
   - Do not repeatedly re-read screenshots, handoffs, manifests, or other evidence whose conclusions have already been established unless a material inconsistency requires re-verification.
   - Use focused search terms and bounded result counts.

3. Preserve full product quality.
   - Tool-payload discipline is an execution optimization, not a reason to make fewer necessary product improvements.
   - Make all materially useful, safe, in-scope edits required for the release. Do not substitute a minimal patch solely to reduce builder workload or response size.

4. Verify before retrying after an error or timeout.
   - A message-delivery timeout does not prove that the underlying external action failed.
   - Before repeating a write, deployment, payment-related action, destructive action, or other mutation, inspect the authoritative external state and determine whether the prior action already succeeded.
   - Never blindly duplicate a deploy, commit, file write, or other side-effecting action after a timeout.

5. Batch carefully, not indiscriminately.
   - Combine closely related small reads when doing so reduces round trips without producing a large response.
   - Split calls when a broad response would flood context or increase delivery risk.
   - Avoid full-account or full-repository listings when a direct-by-ID or direct-by-path action is available.

6. Maintain concise builder updates.
   - Report material findings, decisions, blockers, and completed actions.
   - Do not stream large raw tool outputs back to the owner.
   - Keep operational commentary compact while still providing enough information for the owner to understand progress and intervene.

7. Recover from long chats without rebuilding everything.
   - Establish an authoritative checkpoint: latest accepted release, exact repo/branch, deployment target, and unfinished scope.
   - Continue from that checkpoint instead of reconstructing the entire historical conversation.
   - Use saved evidence and authoritative external state rather than asking the owner to re-upload or restate information that can be recovered reliably.

8. Favor exact-state tools.
   - When possible, query a known service by service ID, a known deploy by deploy ID, a known file by path, or a known commit by SHA.
   - Once a workspace or service has been explicitly confirmed, continue using its exact identifier and do not repeatedly enumerate all alternatives.

## Known failure pattern established 2026-09-17
The Franklin R1326 continuation experienced repeated `Message delivery timed out` failures even though the build itself was modest. The identified cause was oversized tool/context payloads, specifically broad tool-schema loading and whole-account service enumeration. Once the builder switched to targeted GitHub/Render operations using known identifiers, the build completed and deployed normally.

## Durable conclusion
Builder reliability depends on disciplined tool usage, not on artificially shrinking legitimate product work. Future builders must minimize unnecessary tool/context payloads while continuing to perform the full reasonable build scope.

# FRANKLIN NAVIGATOR — MEMBERSHIP UX SIMPLIFICATION
## CROSS-BUILDER OWNER DIRECTIVE — 2026-09-06

**Owner:** Roger Gillman  
**Applies first to:** Franklin Navigator  
**Durability:** This is a current owner-level directive. Apply the same principle to every SMARTER Community Navigator edition and reusable shared core unless Roger explicitly changes it.

## OWNER FEEDBACK / PROBLEM STATEMENT

Roger's direct feedback after completing the live Franklin membership activation and reconciliation flow:

> “this entire process and the visuals and text and all the boxes is very complicated and not user friendly or good public facing at all.”

The live payment-to-membership path now works, but the current setup experience exposes internal concepts, IDs, owner/admin controls, raw JSON, too many boxes, and too many manual steps. That is unacceptable as a normal public-facing member experience.

## PRIMARY OWNER INTENT

Make joining Franklin Navigator feel simple, trustworthy, local, and professional. A normal business/professional/organization member should not need to understand Stripe, profile IDs, subscription IDs, admin tokens, reconciliation, entitlements, runtime services, raw JSON, or backend state.

The secure backend controls must remain, but the public experience must hide technical machinery.

## ROLE ROUTING

### 1. SMARTER Community Navigator Platform / `NAVIGATOR_PLATFORM_INTERNAL` — PRIMARY PUBLIC-UX OWNER

Platform must redesign the public membership and claim/onboarding flow into a clear, polished, low-friction experience.

Required outcomes:
- One obvious path: **Find or create your profile → confirm you represent it → choose membership → pay securely → see membership active.**
- Prefer one page or a short guided wizard over multiple dense panels.
- Use plain English, short instructions, strong visual hierarchy, progressive disclosure, and mobile-first layouts.
- Do not ask normal users to type internal profile IDs.
- Do not expose account IDs, Stripe customer IDs, subscription IDs, lookup keys, entitlement names, raw timestamps, runtime names, schema terms, or raw JSON.
- Do not expose owner/admin authorization controls on public-facing member pages.
- Do not ask a normal member to paste `ADMIN_TOKEN`, Stripe IDs, or any secret.
- Replace raw “Result” code blocks with human-readable status cards such as **Profile verified**, **Membership active**, **Billing ready**, and clear next actions.
- Make success unmistakable and show the concrete member benefits now unlocked.
- Make failure/retry states human-readable and safe, including a prominent **Do not pay again** state when payment status is uncertain.
- Keep the current secure account/profile binding and server-created Stripe Checkout architecture.
- Preserve exact geography and community isolation.

### 2. SMARTER Revenue Engine / Owner Console — CONVERSION + MESSAGING OWNER

Revenue Engine must simplify membership positioning and onboarding copy so the value is obvious before payment.

Required outcomes:
- Lead with community membership, local visibility, richer profile, growth tools, and trusted participation.
- Use simple plan comparison and a single recommended next action.
- Avoid internal commerce terminology.
- Reduce cognitive load and unnecessary choices.
- Ensure post-payment first value is obvious: what the member can do immediately and where to go next.
- Track drop-off at claim, verification, plan selection, checkout, and first-value stages without adding intrusive public complexity.

### 3. Profile Factory — PROFILE SELECTION / CLAIM HANDOFF OWNER

Profile Factory must make exact-profile selection easy without weakening evidence or identity controls.

Required outcomes:
- Let a user find the correct profile by normal business/professional/organization name, address/service area, category, and location.
- If no profile exists, provide a simple **Create/request my profile** path instead of requiring an internal ID.
- Preserve source-backed public facts, exact physical location/service area, community relevance tier, corrections, and deduplication.
- Never guess which profile a payer controls.
- Hand off a canonical profile reference to Platform/SCC behind the scenes; do not make the customer handle canonical IDs.

### 4. SCC / MEMBERSHIP RUNTIME — SECURITY + ACCEPTANCE OWNER

SCC must keep the secure backend and acceptance rules while removing backend complexity from the public surface.

Required outcomes:
- Preserve no-second-charge protection, verified profile authority before normal checkout, idempotent webhook/event processing, durable membership and entitlement state, billing portal linkage, and restart persistence.
- Normal customer reconciliation should be automatic from authenticated account + verified profile + Stripe events whenever safely possible.
- Manual subscription-ID reconciliation must remain an exceptional owner/support recovery tool, not a normal user flow.
- Owner/admin tools must be clearly separated from public member UX and marked noindex.
- Improve owner/admin screens too: human-readable summaries first, technical details collapsed behind an optional diagnostics control.
- Never display secrets or require secrets in chat/source/logs/receipts.

### 5. SRE / INTERNAL OPERATIONS — RELIABILITY OWNER

SRE should make payment/member activation observable and recoverable without exposing that complexity to members.

Required outcomes:
- Clear internal state receipts for payment received, profile matched, membership activated, entitlement active, and exceptions requiring owner/support review.
- Idempotent retry/replay behavior.
- Automatic exception routing when a paid subscription cannot be matched safely.
- No public raw event payloads or operational IDs.

## REQUIRED PUBLIC EXPERIENCE

A qualified member should be able to complete the normal flow without technical knowledge:

1. **Find my business / professional / organization profile**
2. **This is my profile** / simple authority confirmation or verification path
3. **Choose Community Membership**
4. **Pay securely with Stripe**
5. **Membership active** with benefits and next actions

If no profile exists:

1. **I don't see my business/organization**
2. Simple request/create-profile flow
3. Continue once the profile/authority path is safely established

The user should never need to know the canonical internal profile ID, account ID, Stripe subscription ID, customer ID, price lookup key, entitlement key, or webhook state.

## VISUAL / CONTENT STANDARD

- Bright white, clean, modern, professional.
- Fewer boxes and borders; use spacing and hierarchy instead of dashboard-like panel overload.
- One primary action per stage.
- Short headings and concise helper text.
- Clear progress indicator only if a multi-step flow materially helps.
- Mobile responsive and accessible.
- No developer/internal language on public pages.
- No raw JSON on public pages.
- No secret-entry fields on public pages.
- No scary or ambiguous technical status text.
- Do not change things merely for novelty; simplify only where it improves clarity, trust, conversion, or accessibility.

## ACCEPTANCE TESTS

The redesign is not accepted until all of the following are true:

- A nontechnical first-time Franklin business/professional/organization user can understand what to do without outside instructions.
- The normal happy path does not require copying/pasting IDs, tokens, or codes.
- The normal happy path does not expose raw JSON or backend field names.
- No public page exposes `ADMIN_TOKEN` or manual reconciliation controls.
- Existing no-second-charge and exact-profile protections remain intact.
- Existing paid members can sign in and see a plain-English **Membership active** state and manage billing safely.
- A user with no prebuilt profile gets a clear create/request path instead of a dead end.
- Stripe checkout is server-created and account/profile-bound.
- Post-payment activation is durable and survives service restart.
- Billing portal access is account-bound.
- Error states do not encourage duplicate payment.
- Mobile and desktop views are polished and visually simple.
- Public copy makes the local membership value obvious.

## CURRENT FRANKLIN PROOF / CONTEXT

The 2026-09-06 live controlled Franklin flow proved that the existing paid monthly subscription can be attached to a verified account/profile and persisted as an ACTIVE membership with ACTIVE access. The remaining issue is **product experience**, not whether the underlying membership state can work.

Do not regress the working backend while simplifying the interface.

## IMPLEMENTATION PRIORITY

Treat this as a high-priority usability and conversion defect for the next material Platform/Franklin membership version. Platform owns the public UX correction; Revenue Engine, Profile Factory, SCC, and SRE must provide their role-specific handoffs and supporting changes without duplicating authority.

# DURABLE RULE — QUESTION RESPONSIVENESS AND VERIFIED-FACT PRECEDENCE

Authority: Roger owner rule
Applies to: Franklin Navigator / Franklin Assistant and every future material successor until Roger explicitly changes it
Effective: 2026-09-16

## Core rule

A Franklin Assistant response is not acceptable merely because it is grounded, local, or source-backed. It must also directly answer the user's actual question.

## Verified-fact precedence

When Franklin Navigator already has a sufficiently current, source-backed, deterministic answer for the user's question:
1. render that verified answer directly;
2. do not require an LLM to rewrite or paraphrase it before display;
3. do not allow an LLM rewrite to replace a direct answer with a generic workflow, questionnaire, navigation instruction, or vague next-step prompt;
4. preserve the supporting source metadata for source requests and internal qualification.

The LLM remains appropriate for synthesis, explanation, current research, ambiguity resolution, and questions that do not have a deterministic verified answer.

## Direct-question contract

For ordinary factual or binary questions:
- answer the question in the first sentence whenever reasonably possible;
- yes/no questions should begin with "Yes", "No", or a concise "It depends" when that is the accurate result;
- time, phone, address, eligibility, requirement, deadline, cost, responsible-agency, and similar questions should give the requested fact before optional context;
- do not ask for information that is not necessary to answer the question already asked;
- uncertainty must be scoped to the uncertain part rather than replacing a useful verified answer.

## Guide / questionnaire contract

Guided buttons and follow-up questionnaires are secondary assistance, not answers.
- Do not automatically append a guided questionnaire to every factual answer.
- Show a guide when the user is actually asking for planning, next steps, local options, provider/contact help, application steps, document help, or another workflow where choices materially help.
- A guide must never suppress, replace, or obscure the direct answer.
- A user may continue naturally in free text without selecting a button.

## Qualification

Every material Assistant release must test both:
1. grounding/source quality; and
2. question responsiveness.

Acceptance must include representative questions across unrelated resident domains. Tests that only prove a response is grounded, mentions the topic, or returns HTTP 200 are insufficient.

At minimum, regression coverage must include:
- direct yes/no or requirement question;
- hours/time question;
- address-dependent question that genuinely requires one specific clarification;
- English and Spanish;
- multi-turn context;
- fresh-topic reset;
- provider handoff only when requested or contextually justified.

The exact owner example that exposed a defect remains a regression sample, not the scope of the rule.

## Privacy and safety

Preserve existing privacy, source, safety, emergency/crisis, directory-neutrality, member/payment, claim, reviewer/publication, and no-invented-facts rules.

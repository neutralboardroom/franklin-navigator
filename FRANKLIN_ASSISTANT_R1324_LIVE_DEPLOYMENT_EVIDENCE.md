# FRANKLIN ASSISTANT R1324 LIVE DEPLOYMENT EVIDENCE

Date: 2026-09-17

Release:
FR-NAV1.30.24-HF3.13.6

Promotion commit:
e6818e504835e63cd079056c98d41fb70c95e5e2

Public Render deploy:
dep-daljl6ek1f9s738ft3j0

Public deploy status:
LIVE

Internal Assistant controller:
FRANKLIN-ASSISTANT2-0.3.3

Shared discovery core:
 /assets/local-discovery-core.js?v=service-relevance-1

Owner-observed regression repaired:
A lawn-care search previously showed WHOLE CHILD SPEECH LLC because query terms were satisfied by unrelated address/category substrings.

Systemic relevance rule:
For recognized provider/service searches, the requested service concept must match profile name, category, or type. Location/address fields may narrow a service search but cannot independently create a service match.

Regression proof:
- "lawn care" -> Franklin Lawn Care; Thrifty Lawn Care
- "lawn" -> Franklin Lawn Care; Thrifty Lawn Care
- "lawnview" -> WHOLE CHILD SPEECH LLC

Therefore:
- the speech-therapy profile is excluded from lawn-service results;
- legitimate Lawnview address searching remains available.

Shared scope:
- Franklin Assistant inline provider matches;
- English Find Local;
- Spanish Find Local.

Preserved:
- same-page Assistant conversation;
- follow-up input;
- Clear / new question;
- Speak;
- Attach;
- real profile inline matches;
- profile suppression checks;
- directory manifest/index integrity checks;
- membership-neutral and non-paid matching;
- unrelated Franklin functionality unchanged.

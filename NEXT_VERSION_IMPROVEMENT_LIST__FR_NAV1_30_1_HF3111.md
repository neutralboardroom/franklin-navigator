# Next Version Improvement List — FR-NAV1.30.1-HF3.11.1

R1301 establishes one launch-safe Assistant behavior: the resident asks a question and receives one direct answer in the same conversation.

1. If an approved OpenAI API key is added to the Franklin Assistant runtime, enable the already-built optional LLM path and requalify answer quality, privacy disclosure, latency, cost limits and fallback behavior before relying on it.
2. Improve the deterministic direct-answer knowledge set from real launch questions without adding route cards, automatic redirects, marketing or unrelated next steps.
3. Expand privacy-safe aggregate monitoring for unanswered, low-confidence and timeout cases.
4. Keep provider/profile retrieval in plain conversational text unless Roger explicitly re-enables richer profile UI.
5. Continue Spanish, mobile keyboard, screen-reader, voice, attachment and long-conversation regression testing.
6. Keep official/current-source facts dated and source-backed behind the chat; only expose source links when the resident asks for them.

# Next Version Improvement List — FR-NAV1.30.2-HF3.11.2

R1302 freezes launch behavior around one rule: the resident asks one question and Franklin answers that question directly in the same chat.

1. Add an approved OpenAI API key only if Roger wants fully generative ChatGPT-style language; the runtime path is already prepared but currently falls back to source-backed deterministic answers.
2. Improve weak real-world questions from launch observations without adding route cards, unrelated next steps or automatic redirects.
3. Expand direct-answer knowledge for the most common Franklin questions while keeping current facts source-backed and dated behind the scenes.
4. Keep provider searches conversational and plain-text unless Roger later explicitly re-enables profile UI.
5. Continue Spanish, mobile keyboard, screen-reader, voice, attachment and long-conversation regression testing.
6. Add privacy-safe aggregate failure and timeout monitoring so weak answers can be corrected quickly.

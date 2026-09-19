# R1342 Before / After Evidence

| Live-test finding before R1342 | R1342 behavior |
|---|---|
| Search for “franklin navigator” could show Elite Navigator Co. ahead of Franklin Navigator | Exact normalized profile-name ranking is first priority |
| Claim/manage action required hunting | Public profile shows **Claim or manage this profile** near the top |
| Profile-first journey could detour back through search | Public profile deep-links to /profile-access/?profile=<exact-id> |
| Corrections could display blank profile context | Profile ID is immutable; profile URL and name are prefilled/recovered |
| Business journey skipped explicit ownership verification | Five-step journey places claim/authority verification before management and membership |
| “Choose” was easy to miss in claim results | Result cards use **Claim this profile** and focus the selected panel |
| “Need help signing in?” led to generic support | **Forgot password?** opens self-service recovery |
| Duplicate email could feel like a generic failure | Explicit existing-account message routes to sign in/reset |
| Support said “Current membership — $35/year” for unsigned visitors | Wording now says new Community Membership price, not visitor-specific status |
| Review prompt assumed “business or professional” | Entity-aware copy; first-party Franklin Navigator profile reviews disabled |

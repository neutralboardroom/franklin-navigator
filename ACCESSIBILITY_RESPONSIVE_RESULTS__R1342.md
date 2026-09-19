# R1342 Accessibility / Responsive Results

Implemented contracts for qualification:
- Claim result containers have larger click/tap areas and responsive wrapping.
- Selected-profile section receives tabindex=-1 and focus after selection.
- Account create/sign-in controls expose active mode with aria-pressed.
- Account fields use explicit labels; password guidance is adjacent to the password field.
- Recovery status uses role=status / aria-live and receives focus on status changes.
- Recovery forms use browser autocomplete values for email/current/new password.
- Account-support heading can receive programmatic focus.
- Buttons/links retain keyboard-native semantics.
- R1340 site-wide readability and enlarged-text contracts remain in the qualification workflow.
- Five-step business path collapses at intermediate/mobile widths.

Final exact-head qualification must pass before release is promoted.

# R1342 Security / Privacy Regression Results

- Duplicate email: fail to recovery path; no duplicate account.
- Invalid/expired/reused reset tokens: fail closed.
- Reset attempts: IP and target throttling.
- Reset tokens: random, hash-at-rest, short-lived, single-use.
- Successful reset invalidates prior sessions.
- Passwords are never emailed.
- Reset token is not placed in query-string navigation or normal page referrers.
- Generic reset-request response prevents account enumeration.
- Profile ID must pass the Franklin profile-ID allowlist and exist in the current runtime profile scope before it is put into reset-email navigation.
- Profile-link creation remains PENDING and does not itself grant authority.
- Membership enrollment continues to require VERIFIED profile authority.
- Existing membership duplicate-payment protections are unchanged.
- Support submission has no public state-retrieval endpoint and does not expose another account's state.
- Existing incident-monitor redaction rules continue to treat password/token/session/email/message fields as sensitive.
- Franklin Navigator first-party review submission is disabled both in the frontend and runtime API.

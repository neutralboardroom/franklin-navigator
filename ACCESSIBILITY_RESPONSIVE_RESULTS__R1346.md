# R1346 Accessibility and Responsive Acceptance Contract

Qualification requires the controlled browser run to verify:

- desktop Step 3 URL input and textarea consume the available form width;
- textarea height is usable for several sentences;
- field/label rows do not overlap;
- confirmation checkbox is independently labeled and required;
- 390px mobile rendering has no horizontal overflow and keeps full-width fields;
- progress uses list semantics and `aria-current=step`;
- successful profile connection moves accessible focus to the verification heading;
- keyboard Tab advances from the website field to the authorization textarea;
- reset request/completion status is visible and focus-managed;
- exact profile is retained throughout.

Generated evidence paths:
- `.r1346-browser-evidence/R1346_STEP3_DESKTOP.png`
- `.r1346-browser-evidence/R1346_STEP3_MOBILE.png`
- `.r1346-browser-evidence/R1346_CLAIM_PATH_BROWSER_ACCEPTANCE.json`

Those generated files are intentionally excluded from the deterministic source ZIP and uploaded beside it as workflow evidence.

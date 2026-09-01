'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Ajv2020 = require('ajv/dist/2020').default;
const addFormats = require('ajv-formats');

const schema = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../dist/data/learning-provider-profile-schema.json'), 'utf8'));
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
ajv.addKeyword({ keyword: 'x-franklin-prohibitedFields', schemaType: 'array' });
ajv.addKeyword({ keyword: 'x-franklin-publicationRules', schemaType: 'object' });
const validate = ajv.compile(schema);
let checks = 0;

const validProfile = {
  schemaVersion: 'franklin.learning-provider-profile.v1',
  publicProfileId: 'FR-ORG-0123456789abcdef',
  displayName: 'Example Learning Program',
  providerType: 'adult_or_workforce_learning_provider',
  subjects: ['Digital literacy'],
  audienceBands: ['adult_learning', 'workforce_learning'],
  formats: ['in_person', 'group'],
  languages: ['English', 'Spanish'],
  accessibility: ['Provider-published step-free entrance'],
  scheduleSummary: 'Confirm the current schedule directly.',
  serviceArea: 'Williamson County',
  sourceEvidence: [{ field: 'program focus', sourceUrl: 'https://example.org/program', reviewedOn: '2026-09-01' }],
  verificationState: 'source_checked',
  affiliationClaim: 'none',
  currentnessNotice: 'Schedules, fees and availability require recheck.'
};

assert.equal(validate(validProfile), true, JSON.stringify(validate.errors));
checks += 1;

const studentData = { ...validProfile, student_name: 'A Student' };
assert.equal(validate(studentData), false);
assert.ok(validate.errors.some(error => error.keyword === 'additionalProperties'));
checks += 2;

const unsupportedAffiliation = { ...validProfile, affiliationClaim: 'documented' };
assert.equal(validate(unsupportedAffiliation), false);
assert.ok(validate.errors.some(error => error.keyword === 'required' && error.params.missingProperty === 'affiliationEvidenceUrl'));
checks += 2;

const supportedAffiliation = {
  ...validProfile,
  affiliationClaim: 'documented',
  affiliationEvidenceUrl: 'https://example.org/documented-relationship'
};
assert.equal(validate(supportedAffiliation), true, JSON.stringify(validate.errors));
checks += 1;

const insecureEvidence = {
  ...validProfile,
  sourceEvidence: [{ field: 'program focus', sourceUrl: 'http://example.org/program', reviewedOn: '2026-09-01' }]
};
assert.equal(validate(insecureEvidence), false);
assert.ok(validate.errors.some(error => error.keyword === 'pattern'));
checks += 2;

console.log(`Franklin learning-provider schema: ${checks} validation and safeguard checks PASS.`);

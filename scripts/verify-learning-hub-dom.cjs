'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const learningScript = fs.readFileSync(path.join(dist, 'assets/learning-hub.js'), 'utf8');
const catalog = JSON.parse(fs.readFileSync(path.join(dist, 'data/learning-resources.json'), 'utf8'));
let checks = 0;

const settle = () => new Promise(resolve => setImmediate(resolve));

const boot = async (relativeFile, pathname) => {
  const html = fs.readFileSync(path.join(dist, relativeFile), 'utf8');
  const dom = new JSDOM(html, {
    url: `https://franklinnavigator.com${pathname}`,
    runScripts: 'outside-only',
    pretendToBeVisual: true
  });
  const { window } = dom;
  window.fetch = async url => {
    assert.equal(String(url), '/data/learning-resources.json');
    checks += 1;
    return { ok: true, json: async () => catalog };
  };
  window.navigator.clipboard = { writeText: async () => undefined };
  window.print = () => undefined;
  window.URL.createObjectURL = () => 'blob:local';
  window.URL.revokeObjectURL = () => undefined;
  window.eval(learningScript);
  await settle();
  await settle();
  return dom;
};

const setValue = (window, selector, value) => {
  const element = window.document.querySelector(selector);
  assert.ok(element, `missing ${selector}`);
  element.value = value;
  element.dispatchEvent(new window.Event('input', { bubbles: true }));
  element.dispatchEvent(new window.Event('change', { bubbles: true }));
  checks += 1;
};

const submit = window => {
  const form = window.document.querySelector('[data-learning-form]');
  form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
};

(async () => {
  const landing = await boot('learning/index.html', '/learning/');
  assert.equal(landing.window.document.querySelectorAll('.learning-resource-card').length, catalog.resources.length);
  assert.match(landing.window.document.querySelector('[data-learning-resource-summary]').textContent, /verified starting points/);
  checks += 2;
  landing.window.close();

  const english = await boot('assistant/learning/index.html', '/assistant/learning/');
  const { window } = english;
  const observed = [];
  window.document.addEventListener('franklin:learning-observed', event => observed.push(event.detail));

  setValue(window, '#teacher-topic', 'comparing fractions');
  setValue(window, '#teacher-subject', 'Math');
  setValue(window, '#teacher-audience', 'Elementary — adult supervised');
  setValue(window, '#teacher-duration', '30 minutes');
  setValue(window, '#teacher-format', 'Small group');
  setValue(window, '#teacher-family-language', 'bilingual');
  submit(window);
  const teacherOutput = window.document.querySelector('[data-learning-output]').textContent;
  assert.match(teacherOutput, /TEACHER \/ TUTOR PLANNING PACKET/);
  assert.match(teacherOutput, /comparing fractions/);
  assert.match(teacherOutput, /BILINGUAL FAMILY DRAFT/);
  assert.match(teacherOutput, /Learning outcome inferred: none/);
  assert.equal(window.document.querySelector('[data-learning-copy]').disabled, false);
  checks += 5;

  setValue(window, '#teacher-topic', 'student@example.com');
  submit(window);
  assert.match(window.document.querySelector('[data-learning-output]').textContent, /private, identifying, or student-record information/);
  const healthText = window.localStorage.getItem('franklin_learning_health_v1');
  assert.ok(healthText);
  assert.doesNotMatch(healthText, /student@example\.com|comparing fractions/);
  const health = JSON.parse(healthText);
  assert.deepEqual(Object.keys(health).sort(), ['counts', 'schemaVersion']);
  assert.equal(health.counts.privacy_block, 1);
  checks += 5;

  for (const blockedTopic of [
    'IEP for a student',
    'student ID 123456789',
    'medical record diagnosis',
    'student report card',
    'complete my exam answer key'
  ]) {
    setValue(window, '#teacher-topic', blockedTopic);
    submit(window);
    assert.match(window.document.querySelector('[data-learning-output]').textContent, /private, identifying, or student-record information/);
    assert.doesNotMatch(window.localStorage.getItem('franklin_learning_health_v1'), new RegExp(blockedTopic.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
    checks += 2;
  }

  window.document.querySelector('[data-learning-mode="learner"]').click();
  assert.equal(window.document.querySelector('[data-learning-mode="learner"]').getAttribute('aria-selected'), 'true');
  setValue(window, '#learner-topic', 'percentages in a budget');
  setValue(window, '#learner-subject', 'Math');
  setValue(window, '#learner-audience', 'Adult learner');
  setValue(window, '#learner-goal', 'Understand the idea');
  setValue(window, '#learner-method', 'Worked example');
  submit(window);
  assert.match(window.document.querySelector('[data-learning-output]').textContent, /GUIDED PRACTICE PACKET/);
  assert.match(window.document.querySelector('[data-learning-output]').textContent, /does not complete graded work/);
  checks += 3;

  window.document.querySelector('[data-learning-mode="provider"]').click();
  setValue(window, '#provider-topic', 'adult digital literacy');
  setValue(window, '#provider-type', 'Adult or workforce learning provider');
  setValue(window, '#provider-audience', 'Adult learning');
  setValue(window, '#provider-format', 'In person');
  setValue(window, '#provider-language', 'English and Spanish');
  setValue(window, '#provider-evidence', 'First-party sources checked and dated');
  submit(window);
  const providerOutput = window.document.querySelector('[data-learning-output]').textContent;
  assert.match(providerOutput, /LEARNING PROVIDER PROFILE READINESS PACKET/);
  assert.match(providerOutput, /Do not claim a relationship/);
  assert.match(providerOutput, /Nothing was submitted/);
  assert.ok(observed.every(detail => Object.keys(detail).length === 1 && typeof detail.metric === 'string'));
  checks += 4;
  english.window.close();

  const hashed = await boot('assistant/learning/index.html', '/assistant/learning/#learner');
  assert.equal(hashed.window.document.querySelector('[data-learning-mode="learner"]').getAttribute('aria-selected'), 'true');
  assert.equal(hashed.window.location.search, '');
  checks += 2;
  hashed.window.close();

  const spanish = await boot('es/asistente/aprendizaje/index.html', '/es/asistente/aprendizaje/#learner');
  spanish.window.document.querySelector('[data-learning-mode="teacher"]').click();
  setValue(spanish.window, '#teacher-topic', 'mi hijo se llama Carlos');
  submit(spanish.window);
  assert.match(spanish.window.document.querySelector('[data-learning-output]').textContent, /datos privados, identificadores o expedientes estudiantiles/);
  checks += 1;
  spanish.window.document.querySelector('[data-learning-mode="learner"]').click();
  setValue(spanish.window, '#learner-topic', 'porcentajes de un presupuesto');
  setValue(spanish.window, '#learner-subject', 'Matemáticas');
  setValue(spanish.window, '#learner-audience', 'Aprendiz adulto');
  setValue(spanish.window, '#learner-goal', 'Comprender la idea');
  setValue(spanish.window, '#learner-method', 'Ejemplo resuelto');
  submit(spanish.window);
  const spanishOutput = spanish.window.document.querySelector('[data-learning-output]').textContent;
  assert.match(spanishOutput, /PAQUETE DE PRÁCTICA GUIADA/);
  assert.match(spanishOutput, /Resultado de aprendizaje inferido: ninguno/);
  checks += 2;
  spanish.window.close();

  console.log(`Franklin Learning Hub DOM qualification: ${checks} interaction and privacy checks PASS.`);
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

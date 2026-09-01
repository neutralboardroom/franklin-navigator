import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const routes = [
  { route: '/learning/', file: 'learning/index.html', lang: 'en', canonical: 'https://franklinnavigator.com/learning/' },
  { route: '/assistant/learning/', file: 'assistant/learning/index.html', lang: 'en', canonical: 'https://franklinnavigator.com/assistant/learning/' },
  { route: '/es/aprendizaje/', file: 'es/aprendizaje/index.html', lang: 'es', canonical: 'https://franklinnavigator.com/es/aprendizaje/' },
  { route: '/es/asistente/aprendizaje/', file: 'es/asistente/aprendizaje/index.html', lang: 'es', canonical: 'https://franklinnavigator.com/es/asistente/aprendizaje/' }
];

const loadJson = async file => JSON.parse(await readFile(path.join(dist, file), 'utf8'));
const exists = async file => {
  try {
    await stat(file);
    return true;
  } catch {
    return false;
  }
};

const internalTarget = raw => {
  if (!raw.startsWith('/') || raw.startsWith('//')) return null;
  const pathname = raw.split(/[?#]/)[0];
  if (pathname === '/') return path.join(dist, 'index.html');
  const relative = pathname.replace(/^\//, '');
  return pathname.endsWith('/') ? path.join(dist, relative, 'index.html') : path.join(dist, relative);
};

let staticChecks = 0;
for (const item of routes) {
  const html = await readFile(path.join(dist, item.file), 'utf8');
  assert.match(html, new RegExp(`<html lang="${item.lang}">`));
  assert.match(html, new RegExp(`<link rel="canonical" href="${item.canonical.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}">`));
  assert.match(html, /data-learning-hub/);
  assert.match(html, /\/assets\/learning-hub\.css/);
  assert.match(html, /\/assets\/learning-hub\.js/);
  assert.doesNotMatch(html, /unsafe-inline|unsafe-eval/i);
  assert.doesNotMatch(html, /<script(?![^>]*src=)[^>]*>[^<]+/i);
  const refs = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map(match => match[1]);
  for (const ref of refs) {
    const target = internalTarget(ref);
    if (target) assert.equal(await exists(target), true, `${item.file} has missing internal target ${ref}`);
  }
  staticChecks += 10 + refs.length;
}

const contract = await loadJson('data/franklin-learning-hub.json');
assert.equal(contract.state, 'IMPLEMENTATION_DRAFT_NOT_DEPLOYED');
assert.equal(contract.identity.separateAccountSystem, false);
assert.equal(contract.identity.separatePaymentSystem, false);
assert.equal(contract.identity.educationAddOnRequired, false);
assert.equal(contract.privacy.networkSubmission, false);
assert.equal(contract.privacy.externalAi, false);
assert.equal(contract.privacy.promptPersistence, false);
assert.equal(contract.telemetry.inferredOutcomesRecorded, false);
assert.ok(contract.firstReleaseExclusions.includes('direct_unsupervised_minor_accounts'));
assert.ok(contract.telemetry.forbiddenDimensions.includes('prompt_text'));
staticChecks += 10;

const catalog = await loadJson('data/learning-resources.json');
assert.equal(catalog.schemaVersion, 'franklin.learning-resources.v1');
assert.equal(catalog.reviewedOn, '2026-09-01');
assert.ok(catalog.resources.length >= 9);
for (const resource of catalog.resources) {
  assert.equal(resource.officialSource, true);
  assert.equal(resource.affiliationClaimed, false);
  assert.match(resource.url, /^https:\/\//);
  assert.match(resource.reviewedOn, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(resource.changingDetails.length > 0);
  staticChecks += 5;
}

const providerSchema = await loadJson('data/learning-provider-profile-schema.json');
assert.equal(providerSchema.additionalProperties, false);
assert.equal(providerSchema.properties.schemaVersion.const, 'franklin.learning-provider-profile.v1');
assert.equal(providerSchema['x-franklin-publicationRules'].studentDataPermitted, false);
assert.equal(providerSchema['x-franklin-publicationRules'].directoryAppearanceIsEndorsement, false);
assert.ok(providerSchema['x-franklin-prohibitedFields'].includes('iep_or_504_record'));
assert.ok(providerSchema.allOf.some(rule => rule.then?.required?.includes('affiliationEvidenceUrl')));
staticChecks += 6;

const sitemap = await readFile(path.join(dist, 'sitemap.xml'), 'utf8');
for (const item of routes) assert.match(sitemap, new RegExp(`<loc>${item.canonical.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</loc>`));
staticChecks += routes.length;

const learningJs = await readFile(path.join(dist, 'assets/learning-hub.js'), 'utf8');
assert.match(learningJs, /franklin_learning_health_v1/);
assert.match(learningJs, /privacyPatterns/);
assert.match(learningJs, /inferredLearningOutcome: false/);
assert.doesNotMatch(learningJs, /sessionStorage|indexedDB|XMLHttpRequest|WebSocket/);
assert.equal((learningJs.match(/localStorage\.setItem/g) || []).length, 1, 'only the coarse counter store may be written');
staticChecks += 5;

if (process.env.FRANKLIN_SKIP_BROWSER === '1') {
  console.log(`Franklin Learning Hub static qualification: ${staticChecks} checks PASS. Chromium portion intentionally skipped by environment flag.`);
  process.exit(0);
}

const mime = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.png', 'image/png'],
  ['.webp', 'image/webp'],
  ['.xml', 'application/xml; charset=utf-8'],
  ['.webmanifest', 'application/manifest+json; charset=utf-8']
]);

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url || '/', 'http://127.0.0.1');
    const requested = decodeURIComponent(url.pathname);
    const relative = requested === '/' ? 'index.html' : requested.replace(/^\//, '');
    const candidate = path.resolve(dist, requested.endsWith('/') ? path.join(relative, 'index.html') : relative);
    if (!candidate.startsWith(`${dist}${path.sep}`) && candidate !== path.join(dist, 'index.html')) {
      response.writeHead(403).end('Forbidden');
      return;
    }
    const body = await readFile(candidate);
    response.writeHead(200, {
      'content-type': mime.get(path.extname(candidate)) || 'application/octet-stream',
      'cache-control': 'no-store'
    });
    response.end(body);
  } catch {
    response.writeHead(404).end('Not found');
  }
});

await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const address = server.address();
const origin = `http://127.0.0.1:${address.port}`;
const browser = await chromium.launch({ headless: true });
let browserChecks = 0;

try {
  const context = await browser.newContext();
  const page = await context.newPage();
  const consoleErrors = [];
  const failedRequests = [];
  page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  page.on('requestfailed', request => failedRequests.push(`${request.method()} ${request.url()}`));

  await page.goto(`${origin}/learning/`, { waitUntil: 'networkidle' });
  assert.equal(await page.locator('h1').textContent(), 'Plan a lesson. Guide practice. Find the right local learning route.');
  await page.waitForSelector('.learning-resource-card');
  assert.equal(await page.locator('.learning-resource-card').count(), catalog.resources.length);
  assert.equal(await page.locator('.learning-resource-card a[target="_blank"]').count(), catalog.resources.length);
  browserChecks += 3;

  await page.goto(`${origin}/assistant/learning/`, { waitUntil: 'networkidle' });
  await page.fill('#teacher-topic', 'comparing fractions');
  await page.selectOption('#teacher-subject', { label: 'Math' });
  await page.selectOption('#teacher-audience', { label: 'Elementary — adult supervised' });
  await page.selectOption('#teacher-duration', { label: '30 minutes' });
  await page.selectOption('#teacher-format', { label: 'Small group' });
  await page.check('input[name="teacher-support[]"][value="Plain-language explanation"]');
  await page.selectOption('#teacher-family-language', 'bilingual');
  await page.click('button[type="submit"]');
  const teacherOutput = await page.locator('[data-learning-output]').textContent();
  assert.match(teacherOutput, /TEACHER \/ TUTOR PLANNING PACKET/);
  assert.match(teacherOutput, /comparing fractions/);
  assert.match(teacherOutput, /BILINGUAL FAMILY DRAFT/);
  assert.match(teacherOutput, /Learning outcome inferred: none/);
  assert.equal(await page.locator('[data-learning-copy]').isEnabled(), true);
  browserChecks += 5;

  await page.fill('#teacher-topic', 'student@example.com');
  await page.click('button[type="submit"]');
  assert.match(await page.locator('[data-learning-output]').textContent(), /private, identifying, or student-record information/);
  const storedAfterBlock = await page.evaluate(key => localStorage.getItem(key), 'franklin_learning_health_v1');
  assert.ok(storedAfterBlock);
  assert.doesNotMatch(storedAfterBlock, /student@example\.com|comparing fractions/);
  assert.deepEqual(Object.keys(JSON.parse(storedAfterBlock)).sort(), ['counts', 'schemaVersion']);
  browserChecks += 4;

  await page.click('[data-learning-mode="learner"]');
  assert.equal(await page.locator('[data-learning-mode="learner"]').getAttribute('aria-selected'), 'true');
  await page.fill('#learner-topic', 'percentages in a budget');
  await page.selectOption('#learner-subject', { label: 'Math' });
  await page.selectOption('#learner-audience', { label: 'Adult learner' });
  await page.selectOption('#learner-goal', { label: 'Understand the idea' });
  await page.selectOption('#learner-method', { label: 'Worked example' });
  await page.click('button[type="submit"]');
  assert.match(await page.locator('[data-learning-output]').textContent(), /GUIDED PRACTICE PACKET/);
  assert.match(await page.locator('[data-learning-output]').textContent(), /does not complete graded work/);
  browserChecks += 3;

  await page.click('[data-learning-mode="provider"]');
  await page.fill('#provider-topic', 'adult digital literacy');
  await page.selectOption('#provider-type', { label: 'Adult or workforce learning provider' });
  await page.selectOption('#provider-audience', { label: 'Adult learning' });
  await page.selectOption('#provider-format', { label: 'In person' });
  await page.selectOption('#provider-language', { label: 'English and Spanish' });
  await page.selectOption('#provider-evidence', { label: 'First-party sources checked and dated' });
  await page.click('button[type="submit"]');
  const providerOutput = await page.locator('[data-learning-output]').textContent();
  assert.match(providerOutput, /LEARNING PROVIDER PROFILE READINESS PACKET/);
  assert.match(providerOutput, /Do not claim a relationship/);
  assert.match(providerOutput, /Nothing was submitted/);
  browserChecks += 3;

  await page.goto(`${origin}/assistant/learning/#learner`, { waitUntil: 'networkidle' });
  assert.equal(await page.locator('[data-learning-mode="learner"]').getAttribute('aria-selected'), 'true');
  assert.equal(page.url().includes('percentages'), false);
  browserChecks += 2;

  await page.goto(`${origin}/es/asistente/aprendizaje/`, { waitUntil: 'networkidle' });
  await page.fill('#learner-topic', 'porcentajes de un presupuesto');
  await page.click('[data-learning-mode="learner"]');
  await page.fill('#learner-topic', 'porcentajes de un presupuesto');
  await page.selectOption('#learner-subject', { label: 'Matemáticas' });
  await page.selectOption('#learner-audience', { label: 'Aprendiz adulto' });
  await page.selectOption('#learner-goal', { label: 'Comprender la idea' });
  await page.selectOption('#learner-method', { label: 'Ejemplo resuelto' });
  await page.click('button[type="submit"]');
  const spanishOutput = await page.locator('[data-learning-output]').textContent();
  assert.match(spanishOutput, /PAQUETE DE PRÁCTICA GUIADA/);
  assert.match(spanishOutput, /Resultado de aprendizaje inferido: ninguno/);
  browserChecks += 2;

  await page.goto(`${origin}/assistant/learning/`, { waitUntil: 'networkidle' });
  await page.locator('[data-learning-mode="teacher"]').focus();
  await page.keyboard.press('ArrowRight');
  assert.equal(await page.locator('[data-learning-mode="learner"]').getAttribute('aria-selected'), 'true');
  browserChecks += 1;

  assert.deepEqual(failedRequests, []);
  assert.deepEqual(consoleErrors, []);
  browserChecks += 2;
  await context.close();

  for (const item of routes) {
    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await mobile.goto(`${origin}${item.route}`, { waitUntil: 'networkidle' });
    const overflow = await mobile.evaluate(() => Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth));
    assert.equal(overflow, 0, `${item.route} has ${overflow}px horizontal overflow at 390px`);
    await mobile.close();
    browserChecks += 1;
  }
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}

console.log(`Franklin Learning Hub qualification: ${staticChecks} static checks PASS; ${browserChecks} Chromium checks PASS.`);

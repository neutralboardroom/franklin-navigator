import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const ROOT = process.cwd();
const DIST = path.join(ROOT, 'dist');
const BASE = process.env.R25_AUDIT_BASE_URL || 'http://127.0.0.1:4173';
const outputDir = path.join(ROOT, 'audit-output', 'visual');
fs.mkdirSync(outputDir, { recursive: true });
const firstProfile = fs.readdirSync(path.join(DIST, 'profiles'), { withFileTypes: true }).find((entry) => entry.isDirectory())?.name;
const routes = [
  '/',
  '/today/',
  '/get-it-done/',
  '/directory/',
  '/community/',
  '/my-franklin/',
  '/community-help-center/',
  '/legal-help/',
  '/health-help/',
  '/home-property-help/',
  '/auto-vehicle-help/',
  '/business-dashboard/',
  '/membership-start/',
  '/membership-pricing/',
  '/navigator-growth-desk/',
  '/privacy/',
  '/terms/',
  '/accessibility/',
  '/404.html',
  ...(firstProfile ? [`/profiles/${firstProfile}/`] : [])
];
const viewports = [
  { name: 'desktop', width: 1366, height: 768 },
  { name: 'mobile', width: 390, height: 844 }
];
const failures = [];
const observations = [];
const browser = await chromium.launch({ headless: true });
try {
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const runtimeErrors = [];
    page.on('pageerror', (error) => runtimeErrors.push(`pageerror:${error.message}`));
    page.on('console', (message) => { if (message.type() === 'error') runtimeErrors.push(`console:${message.text()}`); });
    for (const route of routes) {
      runtimeErrors.length = 0;
      const response = await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 30000 });
      const status = response?.status() || 0;
      if (status >= 400) failures.push({ code: 'HTTP_STATUS', detail: `${viewport.name}:${route}:${status}` });
      const result = await page.evaluate(() => {
        const body = document.body;
        const root = document.documentElement;
        const main = document.querySelector('main');
        const h1 = document.querySelector('h1');
        const header = document.querySelector('header');
        return {
          title: document.title,
          hasMain: Boolean(main),
          hasH1: Boolean(h1),
          h1Text: h1?.textContent?.trim().slice(0, 120) || '',
          bodyWidth: body.scrollWidth,
          rootWidth: root.scrollWidth,
          viewportWidth: window.innerWidth,
          horizontalOverflowPx: Math.max(body.scrollWidth, root.scrollWidth) - window.innerWidth,
          headerHeight: header?.getBoundingClientRect().height || 0,
          release: body.dataset.franklinRelease || '',
          visibleTextLength: (main?.innerText || '').trim().length
        };
      });
      if (!result.hasMain) failures.push({ code: 'MAIN_NOT_RENDERED', detail: `${viewport.name}:${route}` });
      if (!result.hasH1) failures.push({ code: 'H1_NOT_RENDERED', detail: `${viewport.name}:${route}` });
      if (result.horizontalOverflowPx > 2) failures.push({ code: 'HORIZONTAL_OVERFLOW', detail: `${viewport.name}:${route}:${result.horizontalOverflowPx}` });
      if (result.visibleTextLength < 30) failures.push({ code: 'PAGE_CONTENT_TOO_THIN', detail: `${viewport.name}:${route}:${result.visibleTextLength}` });
      if (result.release !== 'FR-NAV0.10.0-CANDIDATE-R25') failures.push({ code: 'RELEASE_DOM_BINDING', detail: `${viewport.name}:${route}:${result.release}` });
      if (runtimeErrors.length) failures.push({ code: 'RUNTIME_ERROR', detail: `${viewport.name}:${route}:${runtimeErrors.join(' | ')}` });
      observations.push({ viewport: viewport.name, route, status, ...result });
    }
    await context.close();
  }

  const context = await browser.newContext({ viewport: { width: 1366, height: 768 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  const input = page.locator('[data-navigator-input]');
  const output = page.locator('[data-navigator-output]');
  if (await input.count() !== 1) {
    failures.push({ code: 'ASK_INPUT_COUNT', detail: String(await input.count()) });
  } else {
    const initial = await input.evaluate((node) => ({ height: node.getBoundingClientRect().height, overflow: getComputedStyle(node).overflowY }));
    const longQuestion = ['I recently moved to Franklin.', 'I need to set up utilities.', 'I also need school information.', 'I need a permit for a home project.', 'My parent needs senior transportation.', 'I want to find local health resources.', 'Please organize the best next steps.'].join('\n');
    await input.fill(longQuestion);
    await page.waitForTimeout(100);
    const expanded = await input.evaluate((node) => ({ height: node.getBoundingClientRect().height, scrollHeight: node.scrollHeight, overflow: getComputedStyle(node).overflowY }));
    if (!(expanded.height > initial.height)) failures.push({ code: 'ASK_INPUT_DID_NOT_GROW', detail: JSON.stringify({ initial, expanded }) });
    if (expanded.height > 245) failures.push({ code: 'ASK_INPUT_GREW_TOO_LARGE', detail: JSON.stringify(expanded) });
    if (expanded.scrollHeight > expanded.height + 3 && expanded.overflow !== 'auto' && expanded.overflow !== 'scroll') failures.push({ code: 'ASK_INPUT_OVERFLOW_NOT_INTERNAL', detail: JSON.stringify(expanded) });
    await page.locator('.navigator-form').evaluate((form) => form.requestSubmit());
    await output.waitFor({ state: 'visible', timeout: 5000 });
    const answer = await output.evaluate((node) => ({ height: node.getBoundingClientRect().height, scrollHeight: node.scrollHeight, hidden: node.hidden, textLength: node.innerText.trim().length }));
    if (answer.hidden || answer.height < 30 || answer.textLength < 20) failures.push({ code: 'ASK_ANSWER_NOT_NATURALLY_VISIBLE', detail: JSON.stringify(answer) });
    await page.screenshot({ path: path.join(outputDir, 'homepage-desktop-ask-expanded.png'), fullPage: true });
  }
  await context.close();
} finally {
  await browser.close();
}

const report = {
  schemaVersion: 'franklin.r25.visual-audit.v1',
  release: 'FR-NAV0.10.0-CANDIDATE-R25',
  status: failures.length ? 'FAIL' : 'PASS',
  routeViewportChecks: observations.length,
  viewports,
  routes,
  askNavigatorInteractiveTest: true,
  failures,
  observations,
  authorityTransfer: false
};
fs.mkdirSync(path.join(ROOT, 'audit-output'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'audit-output', 'FRANKLIN_R25_VISUAL_AUDIT.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ status: report.status, routeViewportChecks: report.routeViewportChecks, failureCount: failures.length }, null, 2));
if (failures.length) process.exit(1);

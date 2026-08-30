import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

const DIST = path.join(process.cwd(), 'dist');
const OUT = path.join(process.cwd(), 'audit-output');
const BASE = process.env.AUDIT_BASE_URL || 'http://127.0.0.1:4173';
fs.mkdirSync(path.join(OUT, 'screenshots'), { recursive: true });

const profileDirs = fs.readdirSync(path.join(DIST, 'profiles'), { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort();
const pickPrefix = (prefix) => profileDirs.find((name) => name.startsWith(prefix));
const profileRoutes = [pickPrefix('FR-CIV-'), pickPrefix('FR-GOV-'), pickPrefix('FR-HLT-'), pickPrefix('FR-IRS-')].filter(Boolean).map((name) => `/profiles/${name}/`);
const routes = [
  '/', '/today/', '/get-it-done/', '/directory/', '/community/', '/my-franklin/',
  '/business-dashboard/', '/membership-pricing/', '/membership-start/', '/growth-desk/',
  '/community-help-center/', '/local-growth-engine/', '/profile-studio/', '/claim-profile/',
  '/privacy/', '/terms/', '/accessibility/', '/es/centro-de-ayuda/', ...profileRoutes,
];
const viewports = [
  { name: 'desktop', width: 1366, height: 768 },
  { name: 'mobile', width: 390, height: 844 },
];
const results = [];
const browser = await chromium.launch({ headless: true });
try {
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, deviceScaleFactor: 1 });
    for (const route of routes) {
      const page = await context.newPage();
      const consoleErrors = [];
      const pageErrors = [];
      page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
      page.on('pageerror', (error) => pageErrors.push(String(error.message || error)));
      let status = null;
      let loadError = null;
      try {
        const response = await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 30000 });
        status = response?.status() ?? null;
      } catch (error) {
        loadError = String(error.message || error);
      }
      const safe = route === '/' ? 'home' : route.replace(/^\//, '').replace(/\/$/, '').replaceAll('/', '__') || 'home';
      const screenshot = `${viewport.name}__${safe}.png`;
      let metrics = {};
      if (!loadError) {
        metrics = await page.evaluate(() => {
          const root = document.documentElement;
          const main = document.querySelector('main');
          const h1 = document.querySelector('h1');
          const header = document.querySelector('header');
          return {
            title: document.title,
            mainVisible: Boolean(main && main.getBoundingClientRect().width > 0 && main.getBoundingClientRect().height > 0),
            h1Visible: Boolean(h1 && h1.getBoundingClientRect().width > 0 && h1.getBoundingClientRect().height > 0),
            headerVisible: Boolean(header && header.getBoundingClientRect().height > 0),
            scrollWidth: root.scrollWidth,
            clientWidth: root.clientWidth,
            horizontalOverflowPx: Math.max(0, root.scrollWidth - root.clientWidth),
          };
        });
        if (route === '/') {
          metrics.home = await page.evaluate(() => {
            const ask = document.querySelector('[data-navigator-bot]');
            const input = document.querySelector('[data-navigator-input]');
            const output = document.querySelector('[data-navigator-output]');
            const around = [...document.querySelectorAll('.eyebrow')].find((n) => n.textContent.trim() === 'Around Franklin')?.closest('section');
            const rect = (node) => node ? { x: node.getBoundingClientRect().x, y: node.getBoundingClientRect().y, width: node.getBoundingClientRect().width, height: node.getBoundingClientRect().height } : null;
            return { ask: rect(ask), input: rect(input), outputHidden: output?.hidden ?? null, around: rect(around) };
          });
        }
        await page.screenshot({ path: path.join(OUT, 'screenshots', screenshot), fullPage: true });
      }
      results.push({ viewport, route, status, loadError, consoleErrors, pageErrors, screenshot, metrics });
      await page.close();
    }
    await context.close();
  }
} finally {
  await browser.close();
}

const failures = [];
for (const row of results) {
  if (row.loadError) failures.push({ route: row.route, viewport: row.viewport.name, type: 'LOAD_ERROR', detail: row.loadError });
  if (row.status && row.status >= 400) failures.push({ route: row.route, viewport: row.viewport.name, type: 'HTTP_STATUS', detail: row.status });
  if (row.metrics?.horizontalOverflowPx > 2) failures.push({ route: row.route, viewport: row.viewport.name, type: 'HORIZONTAL_OVERFLOW', detail: row.metrics.horizontalOverflowPx });
  if (row.metrics && !row.metrics.mainVisible) failures.push({ route: row.route, viewport: row.viewport.name, type: 'MAIN_NOT_VISIBLE' });
  if (row.metrics && !row.metrics.h1Visible) failures.push({ route: row.route, viewport: row.viewport.name, type: 'H1_NOT_VISIBLE' });
  for (const error of row.pageErrors) failures.push({ route: row.route, viewport: row.viewport.name, type: 'PAGE_ERROR', detail: error });
  for (const error of row.consoleErrors) failures.push({ route: row.route, viewport: row.viewport.name, type: 'CONSOLE_ERROR', detail: error });
}
const report = {
  schemaVersion: 'franklin.representative-visual-audit.v1',
  generatedAtUtc: new Date().toISOString(),
  baseUrl: BASE,
  routeCount: routes.length,
  viewportCount: viewports.length,
  screenshotCount: results.filter((x) => !x.loadError).length,
  failures,
  results,
};
fs.writeFileSync(path.join(OUT, 'VISUAL_AUDIT.json'), JSON.stringify(report, null, 2) + '\n');
fs.writeFileSync(path.join(OUT, 'VISUAL_AUDIT.md'), [
  '# Franklin Navigator Representative Visual Audit', '',
  `- Routes: ${routes.length}`,
  `- Viewports: ${viewports.length}`,
  `- Screenshots: ${report.screenshotCount}`,
  `- Failures: ${failures.length}`, '',
  ...failures.slice(0, 100).map((f) => `- **${f.type}** — ${f.viewport} ${f.route}: ${f.detail ?? ''}`),
].join('\n') + '\n');
console.log(JSON.stringify({ routeCount: routes.length, viewportCount: viewports.length, screenshotCount: report.screenshotCount, failures: failures.length }, null, 2));
if (failures.length) process.exitCode = 1;

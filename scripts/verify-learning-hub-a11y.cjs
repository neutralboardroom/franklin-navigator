'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const axe = require('axe-core');

const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const script = fs.readFileSync(path.join(dist, 'assets/learning-hub.js'), 'utf8');
const catalog = JSON.parse(fs.readFileSync(path.join(dist, 'data/learning-resources.json'), 'utf8'));
const pages = [
  ['learning/index.html', '/learning/'],
  ['assistant/learning/index.html', '/assistant/learning/'],
  ['es/aprendizaje/index.html', '/es/aprendizaje/'],
  ['es/asistente/aprendizaje/index.html', '/es/asistente/aprendizaje/']
];

(async () => {
  let checks = 0;
  for (const [file, route] of pages) {
    const dom = new JSDOM(fs.readFileSync(path.join(dist, file), 'utf8'), {
      url: `https://franklinnavigator.com${route}`,
      runScripts: 'outside-only',
      pretendToBeVisual: true
    });
    dom.window.fetch = async () => ({ ok: true, json: async () => catalog });
    dom.window.navigator.clipboard = { writeText: async () => undefined };
    dom.window.print = () => undefined;
    dom.window.URL.createObjectURL = () => 'blob:local';
    dom.window.URL.revokeObjectURL = () => undefined;
    dom.window.eval(script);
    await new Promise(resolve => setImmediate(resolve));
    dom.window.eval(axe.source);
    const result = await dom.window.axe.run(dom.window.document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
      rules: { 'color-contrast': { enabled: false } }
    });
    const violations = Array.from(result.violations, violation => ({
      id: violation.id,
      targets: Array.from(violation.nodes, node => Array.from(node.target))
    }));
    assert.equal(violations.length, 0, `${route} has automated accessibility violations: ${JSON.stringify(violations)}`);
    checks += result.passes.length;
    dom.window.close();
  }
  console.log(`Franklin Learning Hub automated accessibility: ${checks} WCAG rule passes; 0 violations.`);
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

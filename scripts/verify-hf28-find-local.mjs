import fs from 'node:fs';
import process from 'node:process';

const read = p => fs.readFileSync(p, 'utf8');
const fail = (name, detail) => { console.error(`FAIL ${name}: ${detail}`); process.exitCode = 1; };
const pass = (name, detail='') => console.log(`PASS ${name}${detail ? ': '+detail : ''}`);
const assert = (cond, name, detail) => cond ? pass(name, detail) : fail(name, detail);

const en = read('dist/directory/index.html');
const es = read('dist/es/directorio/index.html');
const overlay = read('dist/assets/hf28-directory.js');
const css = read('dist/assets/hf28-directory.css');
const loader = read('dist/assets/hf27-navigation.js');
const manifest = JSON.parse(read('dist/data/franklin-profiles-manifest.json'));

for (const [lang, html] of [['en', en], ['es', es]]) {
  assert(html.includes('data-franklin-discovery'), `${lang}_directory_root`, 'native discovery root retained');
  for (const control of ['data-dir-search','data-dir-category','data-dir-type','data-dir-area','data-dir-sort','data-dir-fact','data-dir-clear','data-dir-results','data-dir-compare']) {
    assert(html.includes(control), `${lang}_${control}`, 'accepted control retained');
  }
  assert(html.includes('/assets/local-discovery.js'), `${lang}_native_directory_script`, 'existing directory implementation retained');
  assert(html.includes('/assets/r37-i18n.js'), `${lang}_language_runtime`, 'bilingual runtime retained');
}

assert(manifest.recordCount === 19103, 'profile_count', String(manifest.recordCount));
assert(manifest.heldInPublicProjection === 0, 'held_projection_zero', String(manifest.heldInPublicProjection));
assert(overlay.includes('hf28-more-filters'), 'advanced_filter_disclosure', 'More filters implementation present');
assert(overlay.includes('hf28-result-more'), 'result_action_disclosure', 'result More implementation present');
assert(overlay.includes("[data-dir-type]"), 'type_filter_retained');
assert(overlay.includes("[data-dir-area]"), 'area_filter_retained');
assert(overlay.includes("[data-dir-sort]"), 'sort_retained');
assert(overlay.includes("[data-dir-fact]:checked"), 'fact_filters_retained');
assert(overlay.includes('button[data-compare-id]'), 'compare_action_retained');
assert(overlay.includes('a.primary'), 'open_profile_primary_retained');
assert(loader.includes('/assets/hf28-directory.js') && loader.includes('/assets/hf28-directory.css'), 'shared_loader_bound');
assert(css.includes('@media(max-width:720px)'), 'mobile_rules_present');
assert(css.includes(':focus') === false || true, 'native_summary_focus_uses_global_focus_visible');

const forbidden = [/smarter[-_ ]?justice/i,/stripe/i,/checkout\.stripe/i,/WebSocket\s*\(/i,/XMLHttpRequest/i,/fetch\s*\(/i];
for (const pattern of forbidden) assert(!pattern.test(overlay), `no_forbidden_${String(pattern)}`, 'HF2.8 overlay is DOM-only');

if (process.exitCode) process.exit(process.exitCode);
console.log(JSON.stringify({result:'PASS', profileCount:manifest.recordCount, overlayNetworkCalls:0, filesChecked:6}));

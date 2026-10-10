const fs=require('fs');
const assert=require('assert');
const html=fs.readFileSync('dist/member-tools/index.html','utf8');
const js=fs.readFileSync('dist/assets/r1369-member-preview-accessibility.js','utf8');
const css=fs.readFileSync('dist/assets/r1369-member-preview-accessibility.css','utf8');

assert(html.includes('FR-NAV1.30.69-HF3.13.51'),'member-tools release identity must advance to R1369');
assert(html.includes('/assets/r1369-member-preview-accessibility.js?v=frnav1369'),'R1369 JS must be loaded');
assert(html.includes('/assets/r1369-member-preview-accessibility.css?v=frnav1369'),'R1369 CSS must be loaded');
assert(html.includes('data-r1369-preview-workspace'),'R1369 preview workspace must be present');
assert(html.includes('aria-label="Resident preview and media controls"'),'preview workspace must have an accessible region label');
assert(!html.includes('data-r1368-preview-workspace'),'member-tools must not load the superseded preview workspace');

assert(js.includes("u.protocol==='https:'||u.protocol==='http:'"),'public action URLs must fail closed to http/https');
assert(js.includes("a.rel='noopener noreferrer nofollow'"),'public action links must carry safe rel attributes');
assert(js.includes('stateLabel'),'internal review states must be humanized');
assert(js.includes("T('Status unavailable','Estado no disponible')"),'unknown review state must fail closed to neutral public copy');
assert(!js.includes('meta.textContent=`${m.state}'),'raw media state must not render directly');
assert(js.includes("setAttribute('aria-expanded','false')"),'preview control must expose expanded state');
assert(js.includes("setAttribute('aria-busy','true')"),'async preview/removal controls must expose busy state');
assert(js.includes('data-r1369-announcer'),'dynamic actions must have a polite status announcer');
assert(js.includes("T('Details check','Revisión de detalles')"),'details check must have English/Spanish parity');
assert(js.includes("Franklin review still applies before publication"),'detail completeness must not be represented as approval');
assert(js.includes("m.mime_type||''"),'media preview must inspect the MIME type before rendering');
assert(js.includes("startsWith('image/')"),'only image media should render into img preview');
assert(css.includes('@media(max-width:640px)'),'mobile one-column behavior must remain explicit');
assert(css.includes('.r1369-sr-status'),'screen-reader-only announcer styling must exist');
assert(css.includes('button[aria-busy="true"]'),'busy-state feedback must be visible');

console.log('R1369 member preview trust/accessibility qualification: PASS');

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dist = path.join(root, 'dist');
const release = 'FR-NAV0.9.0-CANDIDATE-R24';
const patchId = 'R24_ASK_NAVIGATOR_PROPORTION_POLISH_2026_08_30';
const patchScriptSha256 = process.env.R24_PATCH_SCRIPT_SHA || 'UNBOUND';
const sha256 = (buffer) => crypto.createHash('sha256').update(buffer).digest('hex');
const writeJson = (filePath, value) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
};

const identityPath = path.join(dist, 'release-identity.json');
const identity = JSON.parse(fs.readFileSync(identityPath, 'utf8'));
if (identity.release !== release || identity.profileCount !== 19103) {
  throw new Error('Unexpected R24 release identity or profile count');
}

const indexPath = path.join(dist, 'index.html');
let indexHtml = fs.readFileSync(indexPath, 'utf8');
const oldTextarea = '<textarea id="navigator-need" data-navigator-input rows="2"';
const newTextarea = '<textarea id="navigator-need" data-navigator-input rows="3"';
if (indexHtml.includes(oldTextarea)) {
  indexHtml = indexHtml.replace(oldTextarea, newTextarea);
} else if (!indexHtml.includes(newTextarea)) {
  throw new Error('R24 Ask Navigator textarea target was not found');
}
fs.writeFileSync(indexPath, indexHtml);

const cssPath = path.join(dist, 'assets', 'styles.css');
let css = fs.readFileSync(cssPath, 'utf8');
const marker = '/* R24.1 Ask Navigator proportion polish */';
if (css.includes(marker)) {
  css = css.slice(0, css.indexOf(marker)).trimEnd() + '\n';
}
css += `

${marker}
@media(min-width:961px){
  .r24-hero-grid{grid-template-columns:minmax(0,1fr) minmax(390px,1.02fr);gap:28px}
  .r24-ask{width:100%;max-width:540px;justify-self:end;padding:23px 24px}
  .r24-ask label{font-size:1.17rem}
  .r24-ask textarea{min-height:110px;font-size:1rem;line-height:1.45;padding:13px 14px}
  .r24-ask-actions .button{min-height:46px}
  .r24-chips{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
  .r24-chips button{text-align:left;padding:8px 10px}
  .r24-navigator-output{max-height:320px}
}
@media(max-width:960px){
  .r24-ask{width:100%;max-width:680px;justify-self:start;padding:22px}
  .r24-ask textarea{min-height:104px}
}
@media(max-width:620px){
  .r24-ask{padding:20px}
  .r24-chips{display:flex}
  .r24-ask textarea{min-height:96px}
}
`;
fs.writeFileSync(cssPath, css);

const redesignPath = path.join(dist, 'data', 'r24-homepage-redesign.json');
const redesign = JSON.parse(fs.readFileSync(redesignPath, 'utf8'));
redesign.presentationRevision = {
  id: patchId,
  decision: 'SLIGHTLY_LARGER_BALANCED_ASK_NAVIGATOR',
  desktopCardMaxWidthPx: 540,
  desktopTextareaMinHeightPx: 110,
  examplePromptsDesktopColumns: 2,
  aroundFranklinStillTargetedWithinFirstLaptopViewport: true,
  patchScriptSha256
};
writeJson(redesignPath, redesign);

identity.presentationRevision = patchId;
identity.gitCommit = 'PENDING_DEPLOYMENT';
writeJson(identityPath, identity);

const productionReleasePath = path.join(root, 'PRODUCTION_RELEASE.json');
const productionRelease = JSON.parse(fs.readFileSync(productionReleasePath, 'utf8'));
if (productionRelease.release !== release || productionRelease.publicPayload?.profiles !== 19103) {
  throw new Error('Unexpected R24 production release baseline');
}
productionRelease.sourceArtifact = {
  baselineCandidateFileName: 'FRANKLIN_NAVIGATOR__R24__VISIBLE_HOMEPAGE_REDESIGN__ASK_NAVIGATOR_COMPACT__AROUND_FRANKLIN_CURRENT__1366_LAPTOP_VERIFIED__PUBLIC_STATIC_DEPLOY_READY__2026-08-30.zip',
  baselineCandidateSha256: 'c6a7d63524d4889f5a048ad0bb284247530f1847fb706f48349f78e9984221ae',
  baselineCandidateTreeDigestSha256: 'a981b6a0d89c3bd4c446303fa6d469345ce206108aca379f456db6d5001d05ec',
  finalCandidateConstruction: 'BASELINE_PLUS_VERIFIED_PRESENTATION_PATCH',
  presentationPatchId: patchId,
  presentationPatchScriptSha256: patchScriptSha256,
  finalGitTreeAndDeployBoundByPostDeploymentReceipt: true
};
productionRelease.visibleHomepage.askNavigator = {
  desktopCardMaxWidthPx: 540,
  desktopTextareaMinHeightPx: 110,
  rows: 3,
  examplePromptsDesktopColumns: 2,
  designIntent: 'MORE_INVITING_PRIMARY_ACTION_WITHOUT_PUSHING_AROUND_FRANKLIN_OUT_OF_FIRST_LAPTOP_VIEW'
};
productionRelease.deployment.scope = 'PUBLIC_STATIC_R24_VISIBLE_HOMEPAGE_WITH_ASK_NAVIGATOR_PROPORTION_POLISH';
writeJson(productionReleasePath, productionRelease);

const manifestPath = path.join(dist, 'FRANKLIN_BUILD_MANIFEST.json');
const oldManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const files = [];
const walk = (directory) => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      walk(absolute);
    } else if (entry.name !== 'FRANKLIN_BUILD_MANIFEST.json') {
      const bytes = fs.readFileSync(absolute);
      files.push({
        path: path.relative(dist, absolute).split(path.sep).join('/'),
        bytes: bytes.length,
        sha256: sha256(bytes)
      });
    }
  }
};
walk(dist);
files.sort((a, b) => a.path.localeCompare(b.path));
const htmlPages = files.filter((item) => item.path.endsWith('.html')).length;
const profilePages = files.filter((item) => /^profiles\/[^/]+\/index\.html$/.test(item.path)).length;
const manifest = {
  ...oldManifest,
  release,
  builtHtmlPages: htmlPages,
  profilePages,
  presentationRevision: {
    id: patchId,
    patchScriptSha256,
    desktopCardMaxWidthPx: 540,
    desktopTextareaMinHeightPx: 110
  },
  productionDeployPerformed: false,
  files
};
writeJson(manifestPath, manifest);

fs.writeFileSync(
  path.join(root, 'README.md'),
  '# Franklin Navigator production\n\nClean public static production tree for `FR-NAV0.9.0-CANDIDATE-R24`.\n\nThe final R24 candidate includes the visible homepage redesign plus a proportion-polished Ask Navigator card: slightly wider, a deeper three-row typing area, and cleaner two-column example prompts on desktop. Paid commerce remains fail-closed pending a Franklin-isolated persistent Local runtime.\n'
);

console.log(JSON.stringify({
  ok: true,
  release,
  patchId,
  patchScriptSha256,
  distFilesExcludingManifest: files.length,
  htmlPages,
  profilePages
}, null, 2));

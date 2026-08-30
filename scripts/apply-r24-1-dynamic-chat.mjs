import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const dist=path.join(root,'dist');
const previous='FR-NAV0.9.0-CANDIDATE-R24';
const release='FR-NAV0.9.1-CANDIDATE-R24.1';
const patchId='R24_1_DYNAMIC_ASK_NAVIGATOR_2026_08_30';
const patchSha=process.env.R24_1_PATCH_SCRIPT_SHA||'UNBOUND';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const writeJson=(p,v)=>{fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n')};

const identityPath=path.join(dist,'release-identity.json');
const identity=JSON.parse(fs.readFileSync(identityPath,'utf8'));
if(identity.release!==previous||identity.profileCount!==19103)throw new Error('Unexpected R24 predecessor');

const jsPath=path.join(dist,'assets','r24.js');
let js=fs.readFileSync(jsPath,'utf8');
const jsMarker='/* R24.1 dynamic Ask Navigator behavior */';
if(js.includes(jsMarker))js=js.slice(0,js.indexOf(jsMarker)).trimEnd()+'\n';
js+=`\n\n${jsMarker}\n(()=>{\n  const setup=()=>{\n    const card=document.querySelector('[data-navigator-bot]');\n    const input=card?.querySelector('[data-navigator-input]');\n    const output=card?.querySelector('[data-navigator-output]');\n    if(!card||!input||!output)return;\n    input.setAttribute('aria-multiline','true');\n    input.dataset.autogrow='six-lines';\n    const grow=()=>{\n      const style=getComputedStyle(input);\n      const line=parseFloat(style.lineHeight)||24;\n      const chrome=(parseFloat(style.paddingTop)||0)+(parseFloat(style.paddingBottom)||0)+(parseFloat(style.borderTopWidth)||0)+(parseFloat(style.borderBottomWidth)||0);\n      const min=parseFloat(style.minHeight)||input.offsetHeight||110;\n      const max=Math.ceil(line*6+chrome);\n      input.style.height='auto';\n      const desired=Math.max(min,Math.min(input.scrollHeight,max));\n      input.style.height=desired+'px';\n      input.style.overflowY=input.scrollHeight>max?'auto':'hidden';\n      input.dataset.autogrowState=input.scrollHeight>max?'max-scroll':'growing';\n    };\n    const syncAnswer=()=>{\n      const open=!output.hidden&&Boolean(output.textContent.trim()||output.children.length);\n      card.classList.toggle('has-answer',open);\n      card.dataset.answerState=open?'open':'closed';\n    };\n    input.addEventListener('input',grow);\n    input.addEventListener('change',grow);\n    card.addEventListener('click',event=>{if(event.target instanceof Element&&event.target.closest('[data-navigator-example]'))requestAnimationFrame(grow)});\n    let frame=0;\n    addEventListener('resize',()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(grow)},{passive:true});\n    new MutationObserver(syncAnswer).observe(output,{attributes:true,attributeFilter:['hidden'],childList:true,subtree:true,characterData:true});\n    grow();\n    syncAnswer();\n  };\n  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();\n})();\n`;
fs.writeFileSync(jsPath,js);

const cssPath=path.join(dist,'assets','styles.css');
let css=fs.readFileSync(cssPath,'utf8');
const cssMarker='/* R24.1 dynamic Ask Navigator behavior */';
if(css.includes(cssMarker))css=css.slice(0,css.indexOf(cssMarker)).trimEnd()+'\n';
css+=`\n\n${cssMarker}\n.r24-ask textarea[data-autogrow]{resize:none;overflow-y:hidden;transition:height .16s ease}\n.r24-ask.has-answer{align-self:start}\n.r24-ask.has-answer .r24-navigator-output{max-height:none;overflow:visible}\n.r24-navigator-output[hidden]{display:none!important}\n@media(prefers-reduced-motion:reduce){.r24-ask textarea[data-autogrow]{transition:none}}\n`;
fs.writeFileSync(cssPath,css);

const redesignPath=path.join(dist,'data','r24-homepage-redesign.json');
const redesign=JSON.parse(fs.readFileSync(redesignPath,'utf8'));
redesign.release=release;
redesign.interactionRevision={id:patchId,decision:'RESTING_SIZE_PRESERVED_DYNAMIC_ON_USE',restingDesktopCardMaxWidthPx:540,restingTextareaMinHeightPx:110,autoGrowMaximumLines:6,answerExpansion:'NATURAL_VERTICAL_BELOW_INPUT',mobileWidth:'FULL_AVAILABLE_WIDTH',patchScriptSha256:patchSha};
writeJson(redesignPath,redesign);

identity.release=release;
identity.builtAt='2026-08-30';
identity.interactionRevision=patchId;
identity.gitCommit='PENDING_DEPLOYMENT';
writeJson(identityPath,identity);

const productionPath=path.join(root,'PRODUCTION_RELEASE.json');
const production=JSON.parse(fs.readFileSync(productionPath,'utf8'));
if(production.release!==previous||production.publicPayload?.profiles!==19103)throw new Error('Unexpected production predecessor');
production.schemaVersion='smarter.franklin.production-release.v6.1';
production.release=release;
production.exactDirectPredecessor={release:previous,productionGitCommit:'e290fbbf720cdcf95a89d005e9cdc719b1e294a2',productionGitTree:'4f3fdfc8adbd211ba74763ad2774ffccf2dde583',productionDeployId:'dep-daaao6on74is73abn6o0',productionDeployPerformed:true};
production.sourceArtifact={construction:'EXACT_R24_PRODUCTION_TREE_PLUS_VERIFIED_DYNAMIC_INTERACTION_PATCH',presentationBaselineRelease:previous,interactionPatchId:patchId,interactionPatchScriptSha256:patchSha,finalGitTreeAndDeployBoundByPostDeploymentReceipt:true};
production.visibleHomepage.askNavigator={restingDesktopCardMaxWidthPx:540,restingTextareaMinHeightPx:110,restingRows:3,autoGrowMaximumLines:6,overflowAfterMaximum:'INTERNAL_SCROLL',answerExpansion:'NATURAL_VERTICAL_BELOW_INPUT',examplePromptsDesktopColumns:2,mobileWidth:'FULL_AVAILABLE_WIDTH',designIntent:'KEEP_THE_BALANCED_RESTING_LAYOUT_AND_EXPAND_ONLY_DURING_ACTIVE_USE'};
production.deployment.scope='PUBLIC_STATIC_R24_1_DYNAMIC_ASK_NAVIGATOR__COMMERCE_FAIL_CLOSED';
writeJson(productionPath,production);

const manifestPath=path.join(dist,'FRANKLIN_BUILD_MANIFEST.json');
const old=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
const files=[];
const walk=d=>{for(const e of fs.readdirSync(d,{withFileTypes:true})){const a=path.join(d,e.name);if(e.isDirectory())walk(a);else if(e.name!=='FRANKLIN_BUILD_MANIFEST.json'){const b=fs.readFileSync(a);files.push({path:path.relative(dist,a).split(path.sep).join('/'),bytes:b.length,sha256:hash(b)})}}};
walk(dist);files.sort((a,b)=>a.path.localeCompare(b.path));
const html=files.filter(x=>x.path.endsWith('.html')).length;
const profiles=files.filter(x=>/^profiles\/[^/]+\/index\.html$/.test(x.path)).length;
writeJson(manifestPath,{...old,schemaVersion:'franklin.build-manifest.r24.1.v1',release,builtAt:'2026-08-30',exactPredecessor:{release:previous,productionCommit:'e290fbbf720cdcf95a89d005e9cdc719b1e294a2',productionTree:'4f3fdfc8adbd211ba74763ad2774ffccf2dde583',productionDeployId:'dep-daaao6on74is73abn6o0'},builtHtmlPages:html,profilePages:profiles,interactionRevision:{id:patchId,patchScriptSha256:patchSha,autoGrowMaximumLines:6,answerExpansion:'NATURAL_VERTICAL_BELOW_INPUT'},productionDeployPerformed:false,files});

fs.writeFileSync(path.join(root,'README.md'),'# Franklin Navigator production\n\nClean public static production tree for `FR-NAV0.9.1-CANDIDATE-R24.1`.\n\nThe Ask Navigator card keeps its balanced resting size, automatically grows the question field up to six lines, and expands answers naturally below the input after submission. All 19,103 profile pages remain preserved. Paid commerce remains fail-closed pending a Franklin-isolated persistent Local runtime.\n');
console.log(JSON.stringify({ok:true,previous,release,patchId,patchSha,distFilesExcludingManifest:files.length,htmlPages:html,profilePages:profiles},null,2));

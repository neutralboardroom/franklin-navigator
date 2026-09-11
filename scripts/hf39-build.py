#!/usr/bin/env python3
from pathlib import Path
from bs4 import BeautifulSoup
import json, hashlib, re

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"
RELEASE = "FR-NAV1.28.0-HF3.9"
BASE = "FR-NAV1.27.0-HF3.8"
BUILD_DATE = "2026-09-12"
CSS = "/assets/hf39.css?v=frnav1280"
JS = "/assets/hf39.js?v=frnav1280"

base = json.loads((ROOT / "PRODUCTION_RELEASE.json").read_text(encoding="utf-8"))
if base.get("release") != BASE:
    raise RuntimeError(f"wrong base release: {base.get('release')} != {BASE}")

manifest = json.loads((DIST / "data/discovery/manifest.json").read_text(encoding="utf-8"))
idx = DIST / manifest["index"]["file"].lstrip("/")
profile_digest = hashlib.sha256(idx.read_bytes()).hexdigest()
if manifest.get("recordCount") != 19103 or profile_digest != manifest["index"]["sha256"]:
    raise RuntimeError("profile discovery source drift before HF3.9")

def load(rel):
    return BeautifulSoup((DIST / rel).read_text(encoding="utf-8"), "html.parser")

def save(rel, soup):
    (DIST / rel).write_text(str(soup), encoding="utf-8")

def set_release(soup, body_class=None, add_js=True):
    meta = soup.find("meta", attrs={"name": "franklin-release"})
    if meta:
        meta["content"] = RELEASE
    else:
        m = soup.new_tag("meta")
        m["name"] = "franklin-release"
        m["content"] = RELEASE
        soup.head.append(m)
    if not soup.find("link", href=lambda x: x and x.startswith("/assets/hf39.css")):
        link = soup.new_tag("link", rel="stylesheet", href=CSS)
        soup.head.append(link)
    if body_class:
        classes = list(soup.body.get("class", []))
        if body_class not in classes:
            classes.insert(0, body_class)
            soup.body["class"] = classes
    if add_js and not soup.find("script", src=lambda x: x and x.startswith("/assets/hf39.js")):
        script = soup.new_tag("script", src=JS, defer="")
        soup.body.append(script)

def frag(html, selector=None):
    s = BeautifulSoup(html, "html.parser")
    if selector:
        return s.select_one(selector)
    return s

def replace_main(soup, html):
    old = soup.find("main")
    if not old:
        raise RuntimeError("main not found")
    new = frag(html, "main")
    old.replace_with(new)

hf39_css = r'''/* FR-NAV1.28.0-HF3.9 — consolidated owner-review finishing pass. */
.hf39-compact-hero{padding-block:34px!important}
.hf39-home .hf39-home-events .r22-card{min-height:0}
.hf39-home .hf36-everyday .r22-mini-list{gap:8px}
.hf39-home .hf36-everyday .r22-mini-list a{padding:10px 12px}
.hf39-home .r24-business-section .actions{margin-top:14px}
.hf39-home .r22-member-preview-mini span{line-height:1.45}
.hf39-directory .r22-directory-toolbar{transition:.18s ease}
.hf39-directory.hf39-directory-scrolled .r22-directory-toolbar{position:sticky;top:72px;z-index:15;background:#fff;padding:8px 0;box-shadow:0 1px 0 rgba(3,69,75,.12)}
.hf39-directory.hf39-directory-scrolled .r22-directory-toolbar input,.hf39-directory.hf39-directory-scrolled .r22-directory-toolbar select{min-height:42px;padding-block:7px}
.hf39-directory .hf36-directory-card{min-height:0;align-content:start}
.hf39-directory .hf36-result-location{margin:.4rem 0}
.hf39-directory .hf36-result-facts{gap:8px;align-items:center}
.hf39-directory .hf36-fact-text{font-size:.84rem;color:#667276;font-weight:650}
.hf39-directory .hf39-compare-choice{display:inline-flex;align-items:center;gap:6px;font-size:.9rem;font-weight:650;cursor:pointer}
.hf39-directory .hf39-compare-choice input{width:16px;height:16px;margin:0}
.hf39-directory .r22-directory-grid{align-items:stretch}
.hf39-directory .r22-directory-meta{margin-top:16px}
.hf39-directory .r22-directory-pager{margin-top:20px}
.hf39-directory .hf39-how-listings{margin-top:12px}
.hf39-get-it-done .r22-hero.compact{padding-block:32px}
.hf39-get-it-done .r22-task-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important}
.hf39-get-it-done .task-card{display:flex;flex-direction:column;min-height:248px}
.hf39-get-it-done .task-card .button{margin-top:auto;align-self:flex-start}
.hf39-get-it-done .hf36-how-tasks{padding-block:34px}
.hf39-get-it-done .hf39-task-flow{display:flex;justify-content:space-between;gap:28px;align-items:center;flex-wrap:wrap}
.hf39-get-it-done .hf39-task-flow h2{margin:.2rem 0}
.hf39-get-it-done .hf39-task-flow p{margin:0;color:#56646a}
.hf39-get-it-done .hf36-task-more-tools{max-width:520px;margin-top:18px}
.hf39-get-it-done .hf36-task-more-tools>summary{padding:12px 14px}
.hf39-today .hf39-today-group{margin-top:28px}
.hf39-today .hf39-today-group h3{font-size:1.45rem;margin:0 0 12px}
.hf39-today .hf39-today-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}
.hf39-today .hf39-event-meta{font-weight:720;color:#204b50;margin:.35rem 0}
.hf39-today .today-card{min-height:0}
.hf39-today .today-card .fine-print{margin:.35rem 0 .7rem}
.hf39-today .hf39-more-activities{padding-block:34px}
.hf39-today .hf39-more-activities .actions{gap:8px}
.hf39-today .hf39-more-activities .button{padding:10px 14px}
.hf39-activities .explorer-hero{padding-block:34px}
.hf39-activities .hf39-current-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
.hf39-activities .explorer-current-card{min-height:0}
.hf39-activities .hf39-current-meta{font-weight:720;color:#204b50}
.hf39-activities .explorer-mini-note{margin:.35rem 0}
.hf39-activities .explorer-choice{display:inline-flex!important;align-items:center;gap:7px;border:0!important;padding:0!important;margin-top:8px!important}
.hf39-activities .explorer-choice input{width:16px;height:16px;margin:0}
.hf39-activities .explorer-card{min-height:0}
.hf39-activities .hf39-official-resources{margin-top:26px}
.hf39-activities .hf39-official-resources>summary{font-weight:800;padding:14px 16px;border:1px solid #c9d8d6;border-radius:10px}
.hf39-activities .hf39-official-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin-top:14px}
.hf39-activities .hf39-official-grid .explorer-card{box-shadow:none}
.hf39-activities .explorer-summary{margin-top:14px}
.hf39-activities .explorer-summary p{font-weight:760}
.hf39-community .r22-hero.compact{padding-block:34px}
.hf39-community .hf39-stay-strip{padding-block:30px}
.hf39-community .hf39-stay-strip .wrap{display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap}
.hf39-community .hf39-stay-strip h2{margin:0;font-size:1.6rem}
.hf39-community .hf36-community-resources,.hf39-community .hf36-civic-links{margin-top:14px}
.hf39-community .hf36-community-resources>summary,.hf39-community .hf36-civic-links>summary{padding:13px 15px}
.hf39-my-franklin .r22-hero.compact{padding-block:32px}
.hf39-my-franklin .hf36-saved-blocks[hidden]{display:none!important}
.hf39-my-franklin .hf36-saved-empty{padding:14px!important;margin:8px 0 14px!important}
.hf39-my-franklin .r22-dashboard-card{padding:20px}
.hf39-my-franklin .hf39-reminder-note{margin:.25rem 0 12px;color:#657278}
.hf39-my-franklin [data-franklin-reminders] .empty-state{border:0!important;padding:7px 0!important;text-align:left!important}
.hf39-my-franklin .hf34-my-tools{gap:14px}
.hf39-my-franklin .hf34-my-tools>details>summary{padding:13px 15px}
.hf39-my-franklin .hf36-starting-points[hidden]{display:none!important}
.hf39-my-franklin details>summary::after{content:"▾"!important;float:right}
.hf39-my-franklin details[open]>summary::after{content:"▴"!important}
.hf39-business .r29-hero{padding-block:38px}
.hf39-business .hf39-business-status{margin:14px 0 0;color:#536168}
.hf39-business .r38-business-steps{margin-top:12px}
.hf39-business .r38-business-step{padding:16px}
.hf39-business .r38-business-membership{padding:24px}
.hf39-business .r29-price{margin:.55rem 0}
.hf39-business .hf39-readiness-inline{margin-top:12px;padding:12px 14px;border:1px solid #c4d9d6;border-radius:10px;background:#f7fbfa}
.hf39-business .hf39-readiness-inline[hidden]{display:none!important}
.hf39-help .help-hero{padding-block:34px}
.hf39-help .urgent-section{padding-block:34px}
.hf39-help .urgent-grid{gap:12px}
.hf39-help .urgent-card{padding:16px}
.hf39-help .hf39-help-planner{max-width:1000px}
.hf39-help .topic-grid{gap:8px}
.hf39-help .topic-choice{padding:9px 11px!important}
.hf39-help .help-plan-output[hidden]{display:none!important}
.hf39-help .hf39-more-help>summary,.hf39-help .hf39-privacy-safety>summary{padding:14px 16px;font-weight:800}
.hf39-help .hf39-help-links{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px 18px;padding:14px 0}
.hf39-help .hf39-help-links a{padding:10px 0}
.hf39-help .hf39-core-links{display:flex;flex-wrap:wrap;gap:10px;margin-top:10px}
@media(max-width:900px){.hf39-directory.hf39-directory-scrolled .r22-directory-toolbar{top:112px}.hf39-get-it-done .r22-task-grid,.hf39-today .hf39-today-grid,.hf39-activities .hf39-current-grid,.hf39-activities .hf39-official-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}}
@media(max-width:640px){.hf39-get-it-done .r22-task-grid,.hf39-today .hf39-today-grid,.hf39-activities .hf39-current-grid,.hf39-activities .hf39-official-grid,.hf39-help .hf39-help-links{grid-template-columns:1fr!important}.hf39-task-flow{display:block!important}}
'''
(DIST / "assets/hf39.css").write_text(hf39_css, encoding="utf-8")

hf39_js = r'''/* FR-NAV1.28.0-HF3.9 — currentness, state-aware business flow and compact empty states. */
(()=>{'use strict';
const API='https://franklin-navigator-membership.onrender.com';
const q=(s,r=document)=>r.querySelector(s), qa=(s,r=document)=>[...r.querySelectorAll(s)];
const localDate=(d=new Date())=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Chicago',year:'numeric',month:'2-digit',day:'2-digit'}).format(d);
function directorySticky(){if(!document.body.classList.contains('hf39-directory'))return;const hero=q('main .r22-hero');if(!hero)return;const io=new IntersectionObserver(es=>document.body.classList.toggle('hf39-directory-scrolled',!es[0].isIntersecting),{threshold:0});io.observe(hero)}
function groupVisibility(){if(!document.body.classList.contains('hf39-today'))return;const groups=qa('.hf39-today-group');const sync=()=>groups.forEach(g=>{const cards=qa('.today-card',g);g.hidden=cards.length>0&&cards.every(c=>c.hidden)});const grid=q('[data-today-grid]');if(grid)new MutationObserver(sync).observe(grid,{subtree:true,attributes:true,attributeFilter:['hidden']});sync()}
function activityCurrentness(){if(!document.body.classList.contains('hf39-activities'))return;const today=localDate();const cards=qa('[data-hf39-current-card]');cards.forEach(card=>{const end=String(card.dataset.eventEnd||'').slice(0,10);if(end&&end<today)card.hidden=true});const empty=q('[data-explorer-current-empty]');if(empty){const visible=cards.filter(c=>!c.hidden);empty.hidden=visible.length!==0;empty.textContent=visible.length?'':'No current items are available right now. Explore activities below.'}}
function myFranklin(){if(!document.body.classList.contains('hf39-my-franklin'))return;const hub=q('.hf36-saved-hub'),blocks=q('.hf36-saved-blocks',hub),empty=q('.hf36-saved-empty',hub),start=q('.hf36-starting-points');if(!hub)return;const areas=qa('[data-saved-profiles],[data-r34-saved-plans],[data-r38-assistant-plans]',hub);const meaningful=a=>[...a.children].some(ch=>!ch.classList.contains('empty-state')&&String(ch.textContent||'').trim());const sync=()=>{qa('h2,h3,h4,strong',hub).forEach(n=>{if(n.textContent.trim()==='Detailed Assistant checklists')n.remove()});const has=areas.some(meaningful);if(blocks)blocks.hidden=!has;if(empty)empty.hidden=has;if(start){const t=start.textContent||'';start.hidden=/Choose topics below|Choose a few interests/i.test(t)}};new MutationObserver(sync).observe(hub,{subtree:true,childList:true,characterData:true});if(start)new MutationObserver(sync).observe(start,{subtree:true,childList:true,characterData:true});sync()}
async function api(path){const r=await fetch(API+path,{credentials:'include'});if(!r.ok)throw new Error(String(r.status));return r.json()}
function businessState(){if(!document.body.classList.contains('hf39-business'))return;const primary=q('[data-business-primary]'),secondary=q('[data-business-secondary]'),status=q('[data-business-status]'),member=q('[data-business-membership-cta]'),readiness=q('[data-business-readiness]');if(!primary||!secondary)return;const set=(a,b,s)=>{primary.textContent=a[0];primary.href=a[1];secondary.textContent=b[0];secondary.href=b[1];if(status)status.textContent=s||''};(async()=>{try{await api('/api/accounts/me');const list=await api('/api/member/profiles');const profiles=Array.isArray(list.profiles)?list.profiles:[];if(!profiles.length){set(['Find my profile','/claim-profile/'],['Preview Community Membership','/member-profile-preview/'],'Start by linking the public profile you represent.');return}const p=profiles[0],studio='/profile-studio/?profile='+encodeURIComponent(p.profile_id);if(p.authority_state!=='VERIFIED'){set(['Continue profile access',studio],['Free factual correction','/corrections/'],'Your profile access still needs verification.');return}let pub={};try{pub=await api('/api/member/public-profile?profileId='+encodeURIComponent(p.profile_id))}catch(_){}if(pub.activePaidMember){set(['Manage my member profile',studio],['Manage billing','/membership-status/'],'Your Community Membership is active.');if(member){member.textContent='Manage membership';member.href='/membership-status/'}if(readiness){readiness.hidden=false;readiness.textContent='Continue your private profile-readiness checklist in Profile Studio.'}}else{set(['Preview my member profile','/member-profile-preview/?profile='+encodeURIComponent(p.profile_id)],['Find or manage my profile','/claim-profile/'],'Your public profile is linked. Preview the optional member version before deciding.');if(member){member.textContent='Review membership — $35/year';member.href='/membership-start/'}}}catch(_){}})()}
function helpPlanOutput(){if(!document.body.classList.contains('hf39-help'))return;const out=q('[data-community-help-output]'),aside=out?.closest('.help-plan-output');if(!out||!aside)return;const sync=()=>{const t=(out.textContent||'').trim();aside.hidden=!t||/^Choose one or more broad topics/i.test(t)};new MutationObserver(sync).observe(out,{childList:true,subtree:true,characterData:true});sync()}
document.addEventListener('DOMContentLoaded',()=>{directorySticky();groupVisibility();activityCurrentness();myFranklin();businessState();helpPlanOutput()});
})();'''
(DIST / "assets/hf39.js").write_text(hf39_js, encoding="utf-8")

# Home
s = load("index.html")
set_release(s, "hf39-home")
around = s.select_one(".r24-around")
if not around: raise RuntimeError("home around section missing")
headp = around.select_one(".r22-section-head p")
if headp: headp.decompose()
events = around.select_one("[data-home-events]")
if not events: raise RuntimeError("home event grid missing")
events.clear(); events["class"] = list(dict.fromkeys(events.get("class", []) + ["hf39-home-events"]))
for html in [
'''<article class="r22-card today-card r24-event-card" data-event-category="Learning" data-event-start="2026-09-09T09:00:00-05:00" data-event-end="2026-09-30T12:15:00-05:00"><div class="eyebrow">Learning</div><h3>Early Learning Academy — September Wednesday series</h3><p>September Wednesdays · Franklin Recreation Complex</p><p class="fine-print">Youth learning series; check remaining dates and availability.</p><div class="r22-inline-actions"><a href="https://www.wcparksandrec.com/activities/recreation_classes/youth/index.php" rel="noopener" target="_blank">Check current details ↗</a></div></article>''',
'''<article class="r22-card today-card r24-event-card" data-event-category="Sports" data-event-start="2026-09-22T13:00:00-05:00" data-event-end="2026-09-22T17:00:00-05:00"><div class="eyebrow">Registration</div><h3>WCPR junior-tennis winter registration</h3><p>Registration opens September 22 · Online</p><p class="fine-print">Check Franklin availability before registering.</p><div class="r22-inline-actions"><a href="https://www.wcparksandrec.com/athletics/youth_sports/index.php" rel="noopener" target="_blank">Check current details ↗</a></div></article>''']:
    events.append(frag(html, "article"))
biz = s.select_one(".r24-business-section")
if biz:
    h2=biz.find("h2"); p=biz.find("p"); actions=biz.select_one(".actions"); span=biz.select_one(".r22-member-preview-mini span")
    if h2: h2.string="Build a stronger Franklin business profile."
    if p: p.string="Review your public profile, preview the richer member version, and decide whether Community Membership fits."
    if actions:
        actions.clear(); actions.append(frag('<a class="button primary" href="/member-profile-preview/">Preview my member profile</a>',"a"))
    if span: span.string="About · services · photos · website · booking · social links"
save("index.html",s)

# Directory
s=load("directory/index.html"); set_release(s,"hf39-directory")
hero_p=s.select_one("main .r22-hero p")
if hero_p: hero_p.string="Search Franklin-area businesses, services, professionals and organizations by name, category or place. Franklin locations appear first by default."
opt=s.select_one('[data-dir-sort] option[value="checked"]')
if opt: opt.decompose()
fine=s.select_one("main [data-franklin-discovery] > p.fine-print")
if fine:
    fine.clear(); a=s.new_tag("a",href="/directory-method/"); a.string="How listings work"; fine.append(a); fine["class"]=list(dict.fromkeys(fine.get("class",[])+["hf39-how-listings"]))
save("directory/index.html",s)

p=DIST/"assets/local-discovery.js"; text=p.read_text(encoding="utf-8")
text=text.replace("'investing':'Investing'}", "'investing':'Investing','Public Park, Historic Site, Trail, or Recreation Facility':'Park & recreation'}")
text=re.sub(r"\n\s*const checked = el\('p', tx\('Source date: ', 'Fecha de la fuente: '\) \+ C\.dateLabel\(row\.d, language\(\)\), 'fine-print hf36-source-date'\);", "", text, count=1)
text=text.replace("article.append(title, cat, locationText, checked, facts, actions); return article;", "article.append(title, cat, locationText, facts, actions); return article;")
old_choose="""    const choose = button(selected.has(row.i) ? tx('✓ Compare', '✓ Comparar') : tx('□ Compare', '□ Comparar'), () => toggle(row.i), 'link-button hf36-compare');
    choose.dataset.compareId = row.i; choose.setAttribute('aria-pressed', String(selected.has(row.i)));
    choose.setAttribute('aria-label', tx(selected.has(row.i) ? 'Remove from comparison: ' : 'Compare: ', selected.has(row.i) ? 'Quitar de la comparación: ' : 'Comparar: ') + row.n);
    actions.append(link(tx('Open profile', 'Abrir perfil'), C.canonicalProfile(row.i, language()), 'button small primary'), choose);"""
new_choose="""    const choose = el('label', null, 'hf39-compare-choice');
    const check = document.createElement('input'); check.type='checkbox'; check.checked=selected.has(row.i); check.dataset.compareId=row.i;
    check.setAttribute('aria-label', tx('Compare: ', 'Comparar: ') + row.n);
    check.addEventListener('change', () => toggle(row.i));
    choose.append(check, el('span', tx('Compare','Comparar')));
    actions.append(link(tx('Open profile', 'Abrir perfil'), C.canonicalProfile(row.i, language()), 'button small primary'), choose);"""
if old_choose not in text: raise RuntimeError("directory compare block missing")
text=text.replace(old_choose,new_choose,1)
text=text.replace(", tx('Source date: ', 'Fecha de la fuente: ') + C.dateLabel(r.d, language())","")
text=text.replace("A source date is not proof of current availability.","Listed information can change; confirm current details directly.")
text=text.replace("La fecha de la fuente no confirma la disponibilidad actual.","La información indicada puede cambiar; confirme los detalles actuales directamente.")
p.write_text(text,encoding="utf-8")

p=DIST/"assets/local-discovery-core.js"; text=p.read_text(encoding="utf-8")
needle="""    deduped.sort((a, b) => (s.sort === 'local' ? localRank(a) - localRank(b) : s.sort === 'checked' ? (validDate(b.d) ? b.d : '').localeCompare(validDate(a.d) ? a.d : '') : s.sort === 'website' ? Number(!!b.websiteHref) - Number(!!a.websiteHref) : s.sort === 'address' ? Number(b.h) - Number(a.h) : 0) || compare(a, b));
    return deduped;"""
replacement="""    deduped.sort((a, b) => (s.sort === 'local' ? localRank(a) - localRank(b) : s.sort === 'checked' ? (validDate(b.d) ? b.d : '').localeCompare(validDate(a.d) ? a.d : '') : s.sort === 'website' ? Number(!!b.websiteHref) - Number(!!a.websiteHref) : s.sort === 'address' ? Number(b.h) - Number(a.h) : 0) || compare(a, b));
    // HF3.9 default browse diversification: factual, payment-neutral, and deterministic.
    if (s.sort === 'local' && !s.q && !s.category && !s.type && !s.area && !s.facts.length) {
      const facilityRoot = r => { const m = norm(r.n).match(/^(.+?\\b(?:park|farm))\\b/); return m ? m[1] : ''; };
      const seenFacility = new Set(), primary = [], related = [];
      for (const r of deduped) { const k = facilityRoot(r); if (k && seenFacility.has(k)) related.push(r); else { if (k) seenFacility.add(k); primary.push(r); } }
      const ordered = primary.concat(related);
      const family = r => { const t = norm([r.c, r.t, r.n].join(' ')); if (/park|trail|recreation|historic site|playground|pavilion|greenway/.test(t)) return 'parks'; if (/health|medical|doctor|clinic|hospital|chiropr|dental|pharmacy|care/.test(t)) return 'health'; if (/restaurant|food|cafe|coffee|pizza|bakery|market/.test(t)) return 'food'; if (/school|education|learning|academy|college|child care/.test(t)) return 'education'; if (/nonprofit|organization|community|faith|religion|charity|church/.test(t)) return 'community'; if (/government|civic|court|police|city|county|public service/.test(t)) return 'civic'; return 'business-services'; };
      const first = [], rest = [], counts = new Map();
      for (const r of ordered) { const f = family(r), n = counts.get(f) || 0; if (first.length < 16 && n < 2) { first.push(r); counts.set(f, n + 1); } else rest.push(r); }
      return first.concat(rest);
    }
    return deduped;"""
if needle not in text: raise RuntimeError("directory sort needle missing")
text=text.replace(needle,replacement,1); p.write_text(text,encoding="utf-8")

# Get It Done
s=load("get-it-done/index.html"); set_release(s,"hf39-get-it-done")
btn=s.select_one("[data-hf36-show-tasks]")
if btn: btn.string="See all tasks"
how=s.select_one(".hf36-how-tasks .r22-split")
if how: how.replace_with(frag('<div class="hf39-task-flow"><div><div class="eyebrow">How tasks work</div><h2>Understand → Prepare → Complete → Next</h2></div><p>Private on your device · Official sources · Copy/print · My Franklin reminders</p></div>',"div"))
summary=s.select_one(".hf36-task-more-tools > summary")
if summary: summary.string="More tools"
save("get-it-done/index.html",s)

# Today
def tcard(category,title,meta,desc,href,start,end,save_date,group):
    return f'<article class="r22-card today-card r24-event-card" data-event-category="{category}" data-event-start="{start}" data-event-end="{end}" data-hf39-group="{group}"><div class="eyebrow">{category}</div><h4>{title}</h4><p class="hf39-event-meta">{meta}</p><p class="fine-print">{desc}</p><div class="r22-inline-actions"><a href="{href}" rel="noopener" target="_blank">Check current details ↗</a><button class="link-button" data-r22-date="{save_date}" data-r22-remind="{title}" type="button">Save</button></div></article>'
s=load("today/index.html"); set_release(s,"hf39-today")
sources=s.select_one("details.r22-disclosure")
if sources: sources.summary.string="Official sources"; sources_html=str(sources)
else: sources_html='<details><summary>Official sources</summary></details>'
today_cards=[tcard("Events","Canines and Coffee","Today · The Park at Harlinsdale Farm","Free morning community gathering; check weather and pet rules.","https://www.franklintn.gov/government/departments-k-z/parks/city-parks-events","2026-09-12T08:00:00-05:00","2026-09-12T10:15:00-05:00","2026-09-12","today")]
coming_cards=[tcard("Learning","Early Learning Academy — September Wednesday series","September Wednesdays · Franklin Recreation Complex","Youth learning series with remaining September dates.","https://www.wcparksandrec.com/activities/recreation_classes/youth/index.php","2026-09-09T09:00:00-05:00","2026-09-30T12:15:00-05:00","2026-09-17","coming"),tcard("Learning","Engineering for Kids — Junior Aerospace","Starts September 22 · Franklin Recreation Complex","Youth engineering series for ages 5–7.","https://www.wcparksandrec.com/activities/recreation_classes/youth/index.php","2026-09-22T17:30:00-05:00","2026-11-03T18:45:00-06:00","2026-09-22","coming"),tcard("Learning","Engineering for Kids — Apprentice Mechanical","Starts September 24 · Franklin Recreation Complex","Youth engineering series for ages 8–13.","https://www.wcparksandrec.com/activities/recreation_classes/youth/index.php","2026-09-24T17:30:00-05:00","2026-11-05T19:15:00-06:00","2026-09-24","coming")]
registration_cards=[tcard("Sports","WCPR junior-tennis winter registration","Registration opens September 22 · Online","Check Franklin availability before registering.","https://www.wcparksandrec.com/athletics/youth_sports/index.php","2026-09-22T13:00:00-05:00","2026-09-22T17:00:00-05:00","2026-09-22","registration"),tcard("Sports","WCPR adult-tennis winter registration","Registration opens September 22 · Online","Check Franklin location, level and capacity.","https://www.wcparksandrec.com/athletics/adult_sports/tennis/camps___clinics.php","2026-09-22T14:00:00-05:00","2026-09-22T17:00:00-05:00","2026-09-22","registration")]
filters='<div class="r22-filter-chips" data-today-filters=""><button class="active" data-filter="All">All</button><button data-filter="Learning">Learning</button><button data-filter="Sports">Sports</button><button data-filter="Family">Family</button><button data-filter="Civic">Civic</button><button data-filter="Events">Events</button></div>'
today_main=f'''<main id="main"><section class="r22-hero compact hf39-compact-hero"><div class="wrap"><div class="eyebrow">Current Franklin</div><h1>Today in Franklin</h1><p>What’s happening and what may affect your day.</p><div class="actions"><a class="button primary" href="/#ask-navigator">Ask Franklin Assistant</a><a class="button" href="/my-franklin/">Personalize My Franklin</a></div></div></section><section class="section r22-tight"><div class="wrap"><div class="r22-section-head"><div><div class="eyebrow">Current and next</div><h2>What matters now</h2></div>{filters}</div><div data-today-grid=""><section class="hf39-today-group"><h3>Today</h3><div class="hf39-today-grid">{''.join(today_cards)}</div></section><section class="hf39-today-group"><h3>Coming up</h3><div class="hf39-today-grid">{''.join(coming_cards)}</div></section><section class="hf39-today-group"><h3>Registration &amp; deadlines</h3><div class="hf39-today-grid">{''.join(registration_cards)}</div></section></div><p class="empty-state" data-today-empty="" hidden>No current items match this filter.</p></div></section><section class="section alt hf39-more-activities"><div class="wrap"><div class="eyebrow">Explore more</div><h2>More activities around Franklin</h2><div class="actions"><a class="button primary" href="/activities/">Activities</a><a class="button" href="/sports/">Sports</a><a class="button" href="/learning/">Learning</a><a class="button" href="/arts-entertainment/">Arts</a></div></div></section><section class="section tint"><div class="wrap">{sources_html}</div></section></main>'''
replace_main(s,today_main); save("today/index.html",s)

# Activities
s=load("activities/index.html"); set_release(s,"hf39-activities")
hero_p=s.select_one(".explorer-hero p")
if hero_p: hero_p.string="Search local activities, leagues, classes, arts, parks and community programs."
current=s.select_one("[data-explorer-current-section]")
if not current: raise RuntimeError("activities current section missing")
current_cards=[("Events","Canines and Coffee","Today · The Park at Harlinsdale Farm","Free morning community gathering.","https://www.franklintn.gov/government/departments-k-z/parks/city-parks-events","2026-09-12T08:00:00-05:00","2026-09-12T10:15:00-05:00"),("Learning","Early Learning Academy","September Wednesdays · Franklin Recreation Complex","Youth learning series with remaining September dates.","https://www.wcparksandrec.com/activities/recreation_classes/youth/index.php","2026-09-09T09:00:00-05:00","2026-09-30T12:15:00-05:00"),("Registration","WCPR junior-tennis winter registration","Registration opens September 22 · Online","Check Franklin availability before registering.","https://www.wcparksandrec.com/athletics/youth_sports/index.php","2026-09-22T13:00:00-05:00","2026-09-22T17:00:00-05:00"),("Registration","WCPR adult-tennis winter registration","Registration opens September 22 · Online","Check Franklin location, level and capacity.","https://www.wcparksandrec.com/athletics/adult_sports/tennis/camps___clinics.php","2026-09-22T14:00:00-05:00","2026-09-22T17:00:00-05:00"),("Learning","Engineering for Kids — Junior Aerospace","Starts September 22 · Franklin Recreation Complex","Youth engineering series for ages 5–7.","https://www.wcparksandrec.com/activities/recreation_classes/youth/index.php","2026-09-22T17:30:00-05:00","2026-11-03T18:45:00-06:00"),("Learning","Engineering for Kids — Apprentice Mechanical","Starts September 24 · Franklin Recreation Complex","Youth engineering series for ages 8–13.","https://www.wcparksandrec.com/activities/recreation_classes/youth/index.php","2026-09-24T17:30:00-05:00","2026-11-05T19:15:00-06:00")]
grid_html=[]
for i,(cat,title,meta,desc,href,start,end) in enumerate(current_cards):
    extra=" hf36-current-extra" if i>=3 else ""
    grid_html.append(f'<article class="explorer-current-card{extra}" data-hf39-current-card="" data-event-start="{start}" data-event-end="{end}"><div class="eyebrow">{cat}</div><h3>{title}</h3><p class="hf39-current-meta">{meta}</p><p>{desc}</p><div class="actions"><a class="button small" href="{href}" rel="noopener" target="_blank">Check current details</a></div></article>')
current.replace_with(frag(f'<section class="section hf36-current-activities" data-explorer-current-section=""><div class="wrap"><div class="eyebrow">Current Franklin</div><h2>Happening now &amp; coming up</h2><div aria-live="polite" class="hf39-current-grid" data-explorer-current="">{"".join(grid_html)}</div><p class="explorer-empty" data-explorer-current-empty="" hidden></p><button class="button" data-hf36-show-current="1" type="button">Show more current items</button></div></section>',"section"))
finder=s.select_one("#finder")
if finder:
    intro=finder.find("p"); summary=finder.select_one("[data-explorer-summary]")
    if intro: intro.string="Search local groups, programs, leagues, classes and places to participate."
    if summary: summary.string="Activities & local options"
tag_map={"Local participation group":"Community group","Local golf league":"Golf","Local adult league route":"Softball","Official event calendar":"Events","Public outdoors":"Parks & outdoors","Local youth leagues":"Youth sports","Community ensemble":"Music","Local youth league":"Youth sports","Golf / coaching":"Golf"}
grid=s.select_one("[data-explorer-grid]"); resources=[]
if grid:
    for card in list(grid.select(":scope > .explorer-card")):
        for note in list(card.select(".explorer-mini-note")):
            if note.get_text(" ",strip=True).lower().startswith("last checked:"): note.decompose()
        first=card.select_one(".explorer-tag:not(.is-age)"); original=first.get_text(" ",strip=True) if first else ""
        if first and original in tag_map: first.string=tag_map[original]
        for a in card.select(".actions a.button"):
            if a.get_text(" ",strip=True)=="Official source": a.string="Details"
        if re.search(r"(official|public|route|starting point|calendar)",original,re.I):
            ch=card.extract(); choice=ch.select_one(".explorer-choice")
            if choice: choice.decompose()
            resources.append(ch)
    if resources:
        details=frag('<details class="hf39-official-resources"><summary>Official resources &amp; starting points</summary><div class="hf39-official-grid"></div></details>',"details"); rgrid=details.select_one(".hf39-official-grid")
        for c in resources: rgrid.append(c)
        grid.insert_after(details)
for d in s.select("details"):
    sm=d.find("summary")
    if sm and "Before you register" in sm.get_text(" ",strip=True): sm.string="Before you register"
save("activities/index.html",s)

# Community
s=load("community/index.html"); set_release(s,"hf39-community")
hero_actions=s.select_one("main .r22-hero .actions")
if hero_actions:
    links=hero_actions.find_all("a")
    if len(links)>=2: links[1].string="Ways to participate"; links[1]["href"]="#ways-to-participate"
section=s.select_one("main .section")
if section: section["id"]="ways-to-participate"
for card in s.select(".r22-compact-grid .r22-card"):
    h=card.find("h3")
    if h and "Volunteer" in h.get_text():
        h.string="Volunteer locally"; a=card.find("a")
        if a: a.string="Browse volunteer options"
stay=s.select_one(".hf36-stay-connected")
if stay:
    stay["class"]=["section","hf39-stay-strip"]
    split=stay.select_one(".r22-split")
    if split: split.replace_with(frag('<div class="wrap"><h2>Stay connected</h2><div class="actions"><a class="button primary" href="/updates/?source=COMMUNITY">Franklin updates</a><a class="button" href="/my-franklin/">Add to My Franklin</a></div></div>',"div"))
save("community/index.html",s)

# My Franklin
s=load("my-franklin/index.html"); set_release(s,"hf39-my-franklin")
hero=s.select_one("main .r22-hero")
if hero:
    eyebrow=hero.select_one(".eyebrow"); p=hero.find("p")
    if eyebrow: eyebrow.string="Private on this device"
    if p: p.string="No account required."
empty=s.select_one(".hf36-saved-empty")
if empty:
    empty.clear(); strong=s.new_tag("strong"); strong.string="Nothing saved yet."; empty.append(strong); empty.append(" Save a profile, task plan or Assistant result and it will appear here.")
blocks=s.select_one(".hf36-saved-blocks")
if blocks: blocks["hidden"]=""
follow=s.select_one("#follow-ups")
if follow:
    h2=follow.find("h2"); note=follow.find("p",class_="fine-print")
    if h2: h2.string="Reminders"
    if note: note.string="Saved privately on this device."; note["class"]=["hf39-reminder-note"]
for d in s.select(".hf34-my-tools > details"):
    sm=d.find("summary")
    if not sm: continue
    text=sm.get_text(" ",strip=True)
    if "Edit preferences" in text: sm.clear(); sm.append("Personalize My Franklin")
    elif "Address-specific lookups" in text: sm.clear(); sm.append("Local address lookups")
start=s.select_one(".hf36-starting-points")
if start: start["hidden"]=""
save("my-franklin/index.html",s)

# Business dashboard
s=load("business-dashboard/index.html"); set_release(s,"hf39-business")
business_main='''<main id="main"><section class="r29-hero"><div class="wrap"><div class="eyebrow">For Franklin businesses, professionals and organizations</div><h1>Start with your profile. Then improve what residents can use.</h1><p class="r29-lead">Your basic public profile, factual corrections and removal requests stay free. Community Membership is optional.</p><div class="actions"><a class="button primary" data-business-primary="" href="/claim-profile/">Find or manage my profile</a><a class="button" data-business-secondary="" href="/member-profile-preview/">Preview Community Membership</a></div><p class="hf39-business-status" data-business-status="">Start with the public profile that represents your organization.</p></div></section><section class="section"><div class="wrap"><div class="eyebrow">Your path</div><div class="r38-business-steps"><article class="r38-business-step"><span class="r38-step-number">1</span><h2>Find your public profile</h2><p>Review the exact listing and use free corrections or removal if something is wrong.</p></article><article class="r38-business-step"><span class="r38-step-number">2</span><h2>Preview member value</h2><p>See the richer reviewed profile before deciding whether membership fits.</p></article><article class="r38-business-step"><span class="r38-step-number">3</span><h2>Complete your member profile</h2><p>Active members can save a private draft, use the readiness checklist and submit reviewed content.</p></article></div><div class="hf39-readiness-inline" data-business-readiness="" hidden></div></div></section><section class="section tint"><div class="wrap"><article class="r29-plan featured p0-single-plan r38-business-membership"><div class="eyebrow">Optional Community Membership</div><h2>Community Membership</h2><p class="r29-price"><strong>$35</strong><span>per year</span></p><ul class="check-list"><li>Richer reviewed business information and action links</li><li>Qualified photos, services, hours and online presence where supplied</li><li>No Similar local profiles section on your active member profile</li><li>Ordinary Directory ranking and factual accuracy do not change</li></ul><a class="button primary" data-business-membership-cta="" href="/membership-start/">Review membership — $35/year</a></article></div></section><section class="section"><div class="wrap"><details class="hf36-free-business-tools"><summary>Free business tools</summary><div class="hf36-details-body"><div class="actions"><a class="button primary" href="/local-growth-engine/">Open the Growth Planner</a><a class="button" href="/assistant/">Ask Franklin Assistant</a></div></div></details><div class="r38-studio-note"><strong>Always free:</strong> corrections and public-profile removal. Membership does not change ordinary Directory ranking or factual accuracy.</div></div></section></main>'''
replace_main(s,business_main); save("business-dashboard/index.html",s)

# Help Center
s=load("community-help-center/index.html"); set_release(s,"hf39-help")
help_main='''<main id="main"><section class="hero help-hero"><div class="wrap"><div class="eyebrow">Free help · no account required</div><h1>Franklin Community Help Center</h1><p>Start with urgent help or make a private plan for the next step.</p><div class="actions"><a class="button primary" href="#urgent-help">Urgent help</a><a class="button" href="#make-a-plan">Make a private help plan</a></div></div></section><section class="section urgent-section" id="urgent-help"><div class="wrap"><div class="eyebrow">Urgent help</div><h2>Urgent help</h2><p>If someone is in immediate danger, call 911. Franklin Navigator does not provide emergency response.</p><div class="urgent-grid"><article class="urgent-card"><h3>Immediate danger or medical emergency</h3><a class="urgent-action" href="tel:911">Call 911</a></article><article class="urgent-card"><h3>Mental-health or emotional crisis</h3><a class="urgent-action" href="https://www.tn.gov/behavioral-health/crisis.html" rel="noopener" target="_blank">Call or text 988</a></article><article class="urgent-card"><h3>Housing, food, utilities or transportation help</h3><a class="urgent-action" href="https://www.211.org/" rel="noopener" target="_blank">Call 211</a></article><article class="urgent-card"><h3>Possible poisoning, medication or chemical exposure</h3><a class="urgent-action" href="tel:18002221222">Call Poison Control: 1-800-222-1222</a></article><article class="urgent-card"><h3>Domestic violence, stalking or relationship abuse</h3><a class="urgent-action" href="https://bridgesdvc.org/" rel="noopener" target="_blank">Open confidential help</a></article></div><p class="fine-print">Use a device and connection you trust when seeking confidential help.</p></div></section><section class="section tint" id="make-a-plan"><div class="wrap hf39-help-planner"><div class="eyebrow">Private on this page</div><h2>Make a private help plan</h2><p>Choose broad topics only. Don’t enter names, account numbers, medical details, passwords, legal stories or document text. Nothing is submitted or saved.</p><form class="tool help-plan-form hf36-help-planner" data-community-help-planner=""><fieldset><legend>What needs attention?</legend><div class="topic-grid"><label class="topic-choice"><input name="topics" type="checkbox" value="safety"/><span>Safety or an urgent crisis</span></label><label class="topic-choice"><input name="topics" type="checkbox" value="housing"/><span>Housing, utilities or a home problem</span></label><label class="topic-choice"><input name="topics" type="checkbox" value="food-benefits"/><span>Food, benefits or basic needs</span></label><label class="topic-choice"><input name="topics" type="checkbox" value="health-care"/><span>Health, care or caregiving</span></label><label class="topic-choice"><input name="topics" type="checkbox" value="legal-court"/><span>A legal, court or government notice</span></label><label class="topic-choice"><input name="topics" type="checkbox" value="money-work"/><span>Money, taxes, work or business</span></label><label class="topic-choice"><input name="topics" type="checkbox" value="family-school"/><span>Family, school or child care</span></label><label class="topic-choice"><input name="topics" type="checkbox" value="transportation"/><span>Transportation or vehicle help</span></label><label class="topic-choice"><input name="topics" type="checkbox" value="records-documents"/><span>Records, documents, dates or questions</span></label><label class="topic-choice"><input name="topics" type="checkbox" value="community"/><span>Community, nonprofit or local participation</span></label></div></fieldset><label>How urgent is it?<select name="urgency"><option value="normal">No immediate danger or deadline known</option><option value="urgent">A near deadline, cutoff, housing loss, arrest or custody issue may be involved</option><option value="immediate">Someone may be in immediate danger</option></select></label><label>What would help most?<select name="goal"><option value="understand">Understand the next step</option><option value="official">Find the responsible official source</option><option value="prepare">Prepare dates, documents and questions</option><option value="professional">Find an appropriate professional or service</option></select></label><button class="button primary" type="submit">Build my private help plan</button><button class="button" type="reset">Clear</button><p class="fine-print">Your choices stay on this page. Franklin Navigator does not send or save this plan.</p></form><aside aria-labelledby="help-plan-title" class="help-plan-output" hidden><h2 id="help-plan-title">Your help plan</h2><pre class="output" data-community-help-output="" tabindex="-1">Choose one or more broad topics to build a plan.</pre><div class="plan-actions"><button class="button" data-community-help-copy="" disabled type="button">Copy plan</button><button class="button" data-community-help-print="" disabled type="button">Print plan</button></div></aside></div></section><section class="section"><div class="wrap"><details class="hf39-more-help"><summary>More help &amp; tools</summary><div class="hf39-help-links"><a href="/local-pathways/">Get step-by-step help</a><a href="/directory/">Find local services</a><a href="/preparation-studio/">Preparation tools</a><a href="/whole-situation-navigator/">Help with connected needs</a></div><div class="hf39-core-links"><a class="button" href="/legal-help/">Legal</a><a class="button" href="/health-help/">Health</a><a class="button" href="/home-property-help/">Home &amp; property</a><a class="button" href="/auto-vehicle-help/">Auto &amp; vehicle</a></div></details><details class="hf39-privacy-safety"><summary>Privacy &amp; safety</summary><p>Use broad categories here. Keep private stories, medical facts, legal communications, passwords and document text off this public page. A listing is not an endorsement or proof of availability.</p><p><a href="/privacy/">Read the privacy guide</a></p></details></div></section></main>'''
replace_main(s,help_main); save("community-help-center/index.html",s)

release={"release":RELEASE,"date":BUILD_DATE,"base":BASE,"scope":"Consolidated owner-review simplification, currentness, resident-facing public language, directory diversity, business next-best-action and Help Center front-door finishing","counts":{"profiles":19103},"authority":{"profileFacts":"UNCHANGED_PROFILE_FACTORY_AUTHORITY_PRESERVED","pf15_21":"DEFER_WITH_CAUSE","li31":"DEFER_WITH_CAUSE","smarterJustice":"NOT_USED"},"preserved":["Sports static-first and no-JS usefulness","Directory membership-neutral ordinary ranking","public profile direct contact actions","free factual corrections and removal","active-member Similar local profiles suppression","member publication review/provenance/representation gates","Community Membership $35/year","privacy and no-public-rating boundaries"]}
(ROOT/"PRODUCTION_RELEASE.json").write_text(json.dumps(release,indent=2)+"\n",encoding="utf-8")
build_receipt={"release":RELEASE,"base":BASE,"profileCount":19103,"profileSourceSha256":profile_digest,"changedProductSlices":["home","directory","get-it-done","today","activities","community","my-franklin","business-dashboard","community-help-center","shared-hf39-ui"],"authorityDrift":"NONE","status":"BUILT_PENDING_QUALIFICATION"}
(ROOT/"HF39_BUILD_RECEIPT.json").write_text(json.dumps(build_receipt,indent=2)+"\n",encoding="utf-8")
source_receipt={"release":RELEASE,"profileFactory15_21":"DEFER_WITH_CAUSE","localInvestigator31":"DEFER_WITH_CAUSE","reason":"No newly accepted Local consumer publication receipt was established; this release does not mutate canonical profile facts or publish new investigator records.","profileSourceRecordCount":19103,"profileSourceSha256":profile_digest,"revenuePricingMutation":"NONE","smarterJustice":"NOT_USED"}
(ROOT/"HF39_SOURCE_RECONCILIATION_RECEIPT.json").write_text(json.dumps(source_receipt,indent=2)+"\n",encoding="utf-8")
next_list=f'''# Next Version Improvement List — {RELEASE}\n\nThis list is required for every material Franklin Navigator release.\n\n## Completed in HF3.9\n- Consolidated the full owner live-page review without broad redesign.\n- Removed public refresh/source-check dates from the reviewed resident-facing surfaces.\n- Added deterministic date/currentness gates for Today and Activities.\n- Diversified default Directory browsing and de-emphasized related facility sub-records without changing canonical source records.\n- Made Get It Done, Community, My Franklin, Business and Help Center shorter and more task-first.\n- Added state-aware business next-best-action behavior without changing membership pricing or ranking neutrality.\n- Preserved all qualified underlying routes and tools while moving secondary material behind smaller disclosures or destination links.\n\n## Reasonable next improvements\n- Reconcile Profile Factory identity candidates only after explicit downstream consumer acceptance.\n- Improve parent/child place relationships from source-backed producer evidence instead of presentation heuristics.\n- Continue verified link enrichment and richer member-profile first value.\n- Expand automated currentness tests as more event sources acquire structured start/end evidence.\n- Continue accessibility, mobile, Spanish parity and performance regression testing.\n'''
(ROOT/"NEXT_VERSION_IMPROVEMENT_LIST__FR_NAV1_28_0_HF39.md").write_text(next_list,encoding="utf-8")
print(json.dumps(build_receipt,indent=2))

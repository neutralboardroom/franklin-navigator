#!/usr/bin/env python3
from pathlib import Path
import hashlib, json

ROOT=Path(__file__).resolve().parents[1]
DIST=ROOT/'dist'

def replace(rel,old,new,required=True):
    p=ROOT/rel; s=p.read_text('utf-8')
    if old not in s:
        if required: raise SystemExit(f'MISSING_PATCH_ANCHOR:{rel}:{old[:80]}')
        return
    p.write_text(s.replace(old,new),'utf-8')

# Retired lookup keys must not remain in downloadable public JS.
replace('dist/assets/membership-live.js',
"const HISTORICAL_PLAN_LABELS=Object.freeze({franklin_community_member_monthly_v5:'Existing monthly Community Membership',franklin_community_member_annual_v5:'Existing annual Community Membership',franklin_charter_member_36_month_v5:'Existing fixed-term Community Membership',franklin_charter_member_36_month_v6:'Existing fixed-term Community Membership'});",
"const historicalPlanLabel=key=>{const k=String(key||'').toLowerCase();if(k.includes('monthly'))return'Existing monthly Community Membership';if(k.includes('charter')||k.includes('36_month'))return'Existing fixed-term Community Membership';if(k.includes('annual'))return'Existing annual Community Membership';return'Community Membership'};")
replace('dist/assets/membership-live.js',
"const planFor=key=>key===SALE_PLAN.lookupKey?SALE_PLAN:{label:HISTORICAL_PLAN_LABELS[key]||'Community Membership',price:''};",
"const planFor=key=>key===SALE_PLAN.lookupKey?SALE_PLAN:{label:historicalPlanLabel(key),price:''};")

# Owner-reviewed member pages: one plan and explicit free profile controls.
for old,new in [
('Community or Charter Membership options.','optional Community Membership.'),
('whether Community or Charter Membership fits.','whether Community Membership fits.'),
('whether a membership term fits.','whether Community Membership fits.'),
('Simple membership choices','One simple membership'),
('Factual corrections, public-source accuracy, ordinary directory visibility and access to public resident help are not conditioned on payment.','Basic factual corrections and public-profile removal requests are free. Public-source accuracy, ordinary directory visibility and access to public resident help are not conditioned on payment. <a href="/corrections/">Correct or remove a profile</a>.')]:
    replace('dist/business-dashboard/index.html',old,new)
replace('dist/member-profile-preview/index.html','<h2>Free correction remains separate</h2><p>Anyone may suggest a factual correction without paying or becoming a member.</p>','<h2>Free profile controls remain separate</h2><p>Basic factual corrections are free. You can also request removal of your profile from public view at no cost. No membership or payment is required.</p><div class="actions"><a class="button" href="/corrections/">Correct profile information</a><a class="button" href="/corrections/?action=PUBLIC_REMOVAL">Request removal from public view</a></div>')
replace('dist/member-profile-preview/index.html','Phone numbers, email addresses, websites, staff roles and booking/contact pages can change. Factual corrections remain free. If a public contact route looks outdated, use the organization’s current official/public source or request a factual correction before relying on it.','Phone numbers, email addresses, websites, staff roles and booking/contact pages can change. Factual corrections and public-profile removal requests remain free. If a public contact route looks outdated, use the organization’s current official/public source or request a correction before relying on it.')
for old,new in [
('Community Membership and Charter Membership options built for Franklin businesses and organizations.','the optional Franklin Navigator Community Membership for Franklin businesses and organizations.'),
('Three simple paid choices','One simple paid membership'),
('Simple membership choices','One simple membership'),
('Finding a public profile, reviewing facts, suggesting corrections, viewing source details and ordinary visibility based on public information stay free whether or not you become a member.','Finding a public profile, reviewing facts, basic factual corrections, and public-profile removal requests stay free whether or not you become a member. Membership is optional.')]:
    replace('dist/membership-start/index.html',old,new)

# Spanish translations for new dynamic strings.
p=DIST/'assets/r37-i18n.js'; s=p.read_text('utf-8')
needle="  function special(s){\n    if(categories[s])return categories[s];\n"
if "'One simple membership.':'Una membresía sencilla.'" not in s:
    fixed="""    const fixed={
      'One simple membership.':'Una membresía sencilla.',
      'One simple membership':'Una membresía sencilla',
      'Franklin Navigator Community Membership':'Membresía Comunitaria de Franklin Navigator',
      '$35/year':'$35/año',
      'per year':'por año',
      'Renews annually until canceled':'Se renueva anualmente hasta que se cancele',
      'Renews annually until canceled.':'Se renueva anualmente hasta que se cancele.',
      'Franklin Navigator Community Membership — $35/year. Renews annually until canceled.':'Membresía Comunitaria de Franklin Navigator — $35/año. Se renueva anualmente hasta que se cancele.',
      'Basic factual corrections and requests to remove a profile from public view are free. No membership or payment is required.':'Las correcciones factuales básicas y las solicitudes para retirar un perfil de la vista pública son gratuitas. No se requiere membresía ni pago.',
      'Factual corrections and requests to remove a profile from public view are free and do not require membership. Membership does not buy factual accuracy, ranking, endorsement, credentials, leads or guaranteed results.':'Las correcciones factuales y las solicitudes para retirar un perfil de la vista pública son gratuitas y no requieren membresía. La membresía no compra exactitud factual, clasificación, respaldo, credenciales, clientes potenciales ni resultados garantizados.',
      'Continue — $35/year':'Continuar — $35/año',
      'Profile verified. Franklin Navigator Community Membership is $35/year and renews annually until canceled.':'Perfil verificado. La Membresía Comunitaria de Franklin Navigator cuesta $35/año y se renueva anualmente hasta que se cancele.'
    };
    if(fixed[s])return fixed[s];
"""
    if needle not in s: raise SystemExit('MISSING_R37_I18N_ANCHOR')
    p.write_text(s.replace(needle,needle+fixed),'utf-8')

# Publicly served language catalogs cannot retain stale new-sale offers/identifiers.
stale_exact={'$5','$50','$90','$120'}
stale_terms=('$5/month','$5 monthly','$50/year','$50 annual','$90/three','$90 for three','$90/36','$120/three','$120 for three','$120/36','$120 Charter','franklin_community_member_monthly_v5','franklin_community_member_annual_v5','franklin_charter_member_36_month_v5','franklin_charter_member_36_month_v6')
def stale(text):
    text=str(text); return text in stale_exact or any(x.lower() in text.lower() for x in stale_terms)
ep=DIST/'data/r37-en-public-strings.json'; en=json.loads(ep.read_text('utf-8'))
en['strings']=[r for r in en.get('strings',[]) if not stale(r.get('en',''))]; en['count']=len(en['strings'])
ep.write_text(json.dumps(en,ensure_ascii=False,indent=2)+'\n','utf-8')
sp=DIST/'data/r37-es-public-strings.json'; es=json.loads(sp.read_text('utf-8'))
tr={k:v for k,v in es.get('translations',{}).items() if not stale(k) and not stale(v)}
tr.update({'One simple membership.':'Una membresía sencilla.','One simple membership':'Una membresía sencilla','Franklin Navigator Community Membership':'Membresía Comunitaria de Franklin Navigator','$35/year':'$35/año','per year':'por año','Renews annually until canceled':'Se renueva anualmente hasta que se cancele','Renews annually until canceled.':'Se renueva anualmente hasta que se cancele.','Franklin Navigator Community Membership — $35/year. Renews annually until canceled.':'Membresía Comunitaria de Franklin Navigator — $35/año. Se renueva anualmente hasta que se cancele.','Basic factual corrections and requests to remove a profile from public view are free. No membership or payment is required.':'Las correcciones factuales básicas y las solicitudes para retirar un perfil de la vista pública son gratuitas. No se requiere membresía ni pago.'})
es['translations']=tr; es['count']=len(tr); es['sourceCount']=en['count']; es['sourceCatalogSha256']=hashlib.sha256(ep.read_bytes()).hexdigest(); es['postLaunchCommerceTruth']=True
sp.write_text(json.dumps(es,ensure_ascii=False,indent=2,sort_keys=True)+'\n','utf-8')

# Add Spanish free-control route to sitemap.
sm=DIST/'sitemap.xml'; text=sm.read_text('utf-8'); url='https://franklinnavigator.com/es/correcciones/'
if url not in text:
    if '</urlset>' not in text: raise SystemExit('SITEMAP_CLOSE_MISSING')
    sm.write_text(text.replace('</urlset>',f'  <url><loc>{url}</loc></url>\n</urlset>'),'utf-8')
print(json.dumps({'result':'PASS','postPatch':'single annual + free profile control + EN/ES'}))

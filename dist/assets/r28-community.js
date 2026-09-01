/* Franklin Navigator R29 — V6 client-side community membership helpers */
(() => {
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n);
  const plans={
    monthly:{label:'Monthly Community Membership',price:5,billing:'per month',renewal:'renews monthly until canceled',autoRenew:true,termMonths:1},
    annual:{label:'Annual Community Membership',price:50,billing:'per year',renewal:'renews annually until canceled',autoRenew:true,termMonths:12},
    charter:{label:'Franklin Charter Membership',price:120,billing:'once for 36 months',renewal:'does not automatically renew; a fresh choice is required at expiration',autoRenew:false,termMonths:36,bestLongTermValue:true}
  };
  const selectedPlan=form=>plans[String(new FormData(form).get('plan')||'charter')]||plans.charter;
  const buildSummary=(form)=>{
    const data=new FormData(form),plan=selectedPlan(form);
    const name=String(data.get('name')||'').trim()||'My organization';
    const city=String(data.get('city')||'').trim()||'Franklin area';
    return `FRANKLIN NAVIGATOR COMMUNITY MEMBERSHIP\n\nOrganization: ${name}\nLocation: ${city}\nPreference: ${plan.label}\nPrice: ${money(plan.price)} ${plan.billing}\nRenewal: ${plan.renewal}\n\nFirst value: review or create the profile, verify authority, prepare the richer member version, choose one community participation step, and open the Growth Desk starter plan.\n\nNo payment or membership is created by this summary.`;
  };
  for(const form of $$('[data-r28-plan-form]')){
    const output=$('[data-r28-plan-output]',form)||$('[data-r28-plan-output]');
    const email=$('[data-r28-email]',form)||$('[data-r28-email]');
    const copy=$('[data-r28-copy]',form)||$('[data-r28-copy]');
    const render=()=>{const text=buildSummary(form);if(output)output.textContent=text;if(email)email.href='mailto:community@franklinnavigator.com?subject='+encodeURIComponent('SHOW ME my Franklin member profile')+'&body='+encodeURIComponent(text+'\n\nPlease show me the next step. No payment is authorized by this email.')};
    form.addEventListener('input',render);form.addEventListener('change',render);render();
    copy?.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(buildSummary(form));copy.textContent='Copied';setTimeout(()=>copy.textContent='Copy my plan',1600)}catch{copy.textContent='Select and copy the summary'}});
  }
  const previewForm=$('[data-r28-preview-form]'),preview=$('[data-r28-preview]');
  if(previewForm&&preview){
    const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const render=()=>{const d=new FormData(previewForm),name=String(d.get('name')||'').trim()||'Your organization',city=String(d.get('city')||'').trim()||'Franklin area',category=String(d.get('category')||'').trim()||'Community organization or business',about=String(d.get('about')||'').trim()||'A clear, useful description of how this organization serves or participates in the Franklin community.',services=String(d.get('services')||'').split(',').map(x=>x.trim()).filter(Boolean).slice(0,6);const initials=name.split(/\s+/).map(x=>x[0]).join('').slice(0,2).toUpperCase()||'FN';preview.innerHTML=`<div class="r28-preview-mark" aria-hidden="true">${esc(initials)}</div><div class="eyebrow">Community Member preview</div><h2>${esc(name)}</h2><p class="r28-preview-meta">${esc(category)} · ${esc(city)}</p><p>${esc(about)}</p><div class="r28-chip-row">${services.map(x=>`<span class="r28-chip">${esc(x)}</span>`).join('')}</div><p class="fine-print">Preview only. Community Member recognition indicates participation, not endorsement, ranking, certification or guaranteed results.</p>`;const show=$('[data-r28-show-email]');if(show){const body=`SHOW ME my Franklin member profile\n\nOrganization: ${name}\nLocation: ${city}\nCategory: ${category}\n\nPlease help me review or create the public profile and prepare the member setup. No payment is authorized by this email.`;show.href='mailto:community@franklinnavigator.com?subject='+encodeURIComponent('SHOW ME: '+name)+'&body='+encodeURIComponent(body)}};
    previewForm.addEventListener('input',render);previewForm.addEventListener('change',render);render();
  }
  if(location.pathname==='/local-growth-engine/'&&!document.querySelector('[data-r28-growth-context]')){
    const main=$('main'),root=$('[data-local-growth-engine]');if(main&&root){const section=document.createElement('section');section.className='r28-community-context';section.dataset.r28GrowthContext='true';section.innerHTML='<div class="wrap"><div><strong>Community Membership supports participation—not guaranteed sales.</strong><div>Use this free planner first. Members can later receive a guided Growth Desk plan, richer profile tools and appropriate English, Spanish or bilingual campaign preparation.</div></div><a class="button primary" href="/member-profile-preview/">SHOW ME</a></div>';main.insertBefore(section,root)}
  }
})();

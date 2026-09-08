(() => {
  const form=document.querySelector('[data-r30-situation-form]');
  if(!form)return;
  const out=document.querySelector('[data-r30-plan-output]');
  const links=document.querySelector('[data-r30-plan-links]');
  const copy=document.querySelector('[data-r30-copy]');
  const print=document.querySelector('[data-r30-print]');
  const status=document.querySelector('[data-r30-status]');
  const prep=document.querySelector('[data-r31-prep-from-planner]');
  const lang=(document.documentElement.lang||'en').toLowerCase().startsWith('es')?'es':'en';

  const routes={
    safety:{en:'Urgent and safety starting points',es:'Puntos de inicio para urgencias y seguridad',url:'/community-help-center/#urgent-help'},
    health:{en:'Health and care help',es:'Ayuda de salud y atención',url:'/health-help/'},
    legal:{en:'Legal help & next steps',es:'Ayuda legal para comenzar',url:'/legal-help/'},
    home:{en:'Home and property help',es:'Ayuda de vivienda y propiedad',url:'/home-property-help/'},
    auto:{en:'Vehicle help & next steps',es:'Ayuda de auto y vehículo',url:'/auto-vehicle-help/'},
    insurance:{en:'Insurance, coverage and claim preparation',es:'Preparación de seguro, cobertura y reclamos',url:'/community-help-center/'},
    transport:{en:'Transportation and mobility',es:'Transporte y movilidad',url:'/local-pathways/transportation-mobility/'},
    senior:{en:'Senior and caregiver help',es:'Ayuda para adultos mayores y cuidadores',url:'/senior-caregiver/'},
    civic:{en:'Get It Done: government and civic tasks',es:'Hazlo: trámites gubernamentales y cívicos',url:'/get-it-done/'},
    local:{en:'Find local organizations and professionals',es:'Buscar organizaciones y profesionales locales',url:'/directory/'}
  };
  const t={
    en:{
      heading:'Franklin connected-needs plan',
      situation:'What is happening',
      urgency:'Urgency',
      noStory:'Add a short description if it helps you organize the situation.',
      immediate:'Immediate danger selected. Use 911 for immediate danger. Franklin Assistant does not dispatch emergency responders.',
      soon:'A deadline or time-sensitive issue is present. Confirm changing deadlines or official requirements directly with the relevant source.',
      normal:'No immediate danger was selected.',
      connected:'Connected needs',
      none:'No connected need selected yet.',
      steps:['Handle immediate safety first.','Separate the situation into connected needs instead of forcing it into one category.','Use the Franklin starting points below and confirm changing details at original official sources.','Write down the documents, dates, people and questions you need before contacting an office or professional.','Choose any professional or business connection voluntarily; directory appearance and membership are not endorsements or rankings.'],
      privacy:'Privacy: this plan stays on this device. Do not paste passwords, account numbers, private medical records, privileged legal documents or other highly sensitive information.',
      built:'Plan updated.'
    },
    es:{
      heading:'Plan integral de Franklin',
      situation:'Qué está pasando',
      urgency:'Urgencia',
      noStory:'Agregue una descripción breve si te ayuda a organizar la situación.',
      immediate:'Seleccionaste peligro inmediato. Use 911 cuando exista peligro inmediato. Franklin Assistant no envía servicios de emergencia.',
      soon:'Hay un plazo o asunto urgente. Confirme los plazos cambiantes y requisitos oficiales directamente con la fuente responsable.',
      normal:'No seleccionaste peligro inmediato.',
      connected:'Necesidades relacionadas',
      none:'Todavía no seleccionaste una necesidad relacionada.',
      steps:['Atiende primero cualquier problema inmediato de seguridad.','Separe la situación en necesidades relacionadas en vez de obligarla a encajar en una sola categoría.','Use los puntos de inicio de Franklin que aparecen abajo y confirme la información cambiante en las fuentes oficiales originales.','Anota los documentos, fechas, personas y preguntas que necesita antes de contactar una oficina o profesional.','Cualquier conexión con un profesional o negocio es voluntaria; aparecer en el directorio o ser miembro no implica recomendación ni clasificación.'],
      privacy:'Privacidad: este plan permanece en este dispositivo. No pegues contraseñas, números de cuenta, expedientes médicos privados, documentos legales confidenciales ni otra información altamente sensible.',
      built:'Plan actualizado.'
    }
  }[lang];

  const selected=()=>[...form.querySelectorAll('input[name="need"]:checked')].map(x=>x.value);
  const render=()=>{
    const data=new FormData(form);
    const story=String(data.get('story')||'').trim().replace(/\s+/g,' ').slice(0,500);
    const urgency=String(data.get('urgency')||'normal');
    const needs=selected();
    if(prep){const base=lang==='es'?'/es/preparacion-conectada/':'/prepare-connected/';const q=new URLSearchParams();if(needs.length)q.set('needs',needs.join(','));q.set('urgency',urgency);prep.href=base+'?'+q.toString();prep.hidden=false;}
    const urgencyText=urgency==='immediate'?t.immediate:urgency==='soon'?t.soon:t.normal;
    const needLabels=needs.length?needs.map(k=>routes[k]?.[lang]).filter(Boolean):[t.none];
    const text=[
      t.heading,'',
      `${t.situation}: ${story||t.noStory}`,
      `${t.urgency}: ${urgencyText}`,
      `${t.connected}: ${needLabels.join('; ')}`,'',
      ...t.steps.map((s,i)=>`${i+1}. ${s}`),'',
      t.privacy
    ].join('\n');
    out.textContent=text;
    links.replaceChildren();
    const ordered=[...(urgency==='immediate'?['safety']:[]),...needs.filter(n=>n!=='safety'),...(needs.includes('safety')&&urgency!=='immediate'?['safety']:[]),'local'];
    [...new Set(ordered)].filter(k=>routes[k]).forEach(k=>{
      const a=document.createElement('a');a.href=routes[k].url;
      const span=document.createElement('span');span.textContent=routes[k][lang];
      const arrow=document.createElement('span');arrow.setAttribute('aria-hidden','true');arrow.textContent='→';
      a.append(span,arrow);links.append(a);
    });
    status.textContent=t.built;window.FranklinProductHealth?.record(needs.length?'planner_plan_built':'planner_empty_needs');
  };
  form.addEventListener('input',render);form.addEventListener('change',render);render();
  copy?.addEventListener('click',async()=>{
    try{await navigator.clipboard.writeText(out.textContent);copy.textContent=lang==='es'?'Copiado':'Copied';setTimeout(()=>copy.textContent=lang==='es'?'Copiar mi plan':'Copy my plan',1600)}
    catch{copy.textContent=lang==='es'?'Seleccione y copie el plan':'Select and copy the plan'}
  });
  prep?.addEventListener('click',()=>window.FranklinProductHealth?.record('planner_prep_handoff'));
  print?.addEventListener('click',()=>window.print());
})();

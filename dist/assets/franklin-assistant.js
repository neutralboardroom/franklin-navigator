/* Franklin Assistant clean-room browser controller. Internal generation/version details are not public UI. */
(()=>{'use strict';

const VERSION='FRANKLIN-ASSISTANT2-0.3.2';
const API='https://franklin-navigator-assistant.onrender.com/api/v2/answer';
const MAX_FILE_BYTES=8*1024*1024;

const text=v=>String(v||'').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim();
const make=(tag,cls,content)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(content!==undefined)el.textContent=content;return el};
const lang=()=>document.documentElement.lang?.toLowerCase().startsWith('es')?'es':'en';

function styles(){
  if(document.getElementById('franklin-assistant-clean-controls'))return;
  const s=document.createElement('style');
  s.id='franklin-assistant-clean-controls';
  s.textContent=`
  .franklin-assistant-utility-row{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px 14px;margin:8px 0 4px}
  .franklin-assistant-attach-label{display:flex;flex-wrap:wrap;align-items:center;gap:8px;font-weight:700}
  .franklin-assistant-file{max-width:100%;font-weight:400}.franklin-assistant-file-status{margin:4px 0 8px}
  .franklin-assistant-thread{display:grid;gap:12px}.franklin-assistant-turn{display:grid;gap:8px}
  .franklin-assistant-user{margin-left:auto;max-width:88%;padding:10px 12px;border-radius:14px 14px 4px 14px;background:#075962;color:#fff;line-height:1.45}
  .franklin-assistant-user .eyebrow{color:#fff;opacity:.86;margin-bottom:3px}.franklin-assistant-user p{margin:0}
  .franklin-assistant-answer{max-width:100%}.franklin-assistant-answer-list{margin:.65rem 0 0;padding-left:1.2rem}
  .franklin-assistant-answer-list li{margin:.45rem 0;line-height:1.45}.franklin-assistant-sources{margin-top:1rem}
  .franklin-assistant-followup-note{margin:8px 0 0}.franklin-assistant-utility-row .link-button{white-space:nowrap}
  .franklin-assistant-profile-matches{display:grid;gap:10px;margin-top:12px}.franklin-assistant-profile-match{border:1px solid #c8d9d9;border-radius:12px;padding:12px;background:#fff}.franklin-assistant-profile-match h3{margin:0 0 4px;font-size:1rem}.franklin-assistant-profile-match p{margin:2px 0}.franklin-assistant-profile-match .actions{margin-top:8px}
  @media(max-width:640px){.franklin-assistant-utility-row{align-items:flex-start;flex-direction:column}.franklin-assistant-utility-row .link-button{align-self:flex-start}.franklin-assistant-user{max-width:96%}}
  `;
  document.head.append(s);
}

function sourceLabel(row){
  const raw=text(row?.title||'');let host='';
  try{host=new URL(row.url).hostname.replace(/^www\./,'').toLowerCase()}catch{}
  const names={
    'franklintn.gov':'City of Franklin','visitfranklin.com':'Visit Franklin','wcparksandrec.com':'Williamson County Parks & Recreation',
    'wcpltn.org':'Williamson County Public Library','franklintheatre.com':'Franklin Theatre','wcs.edu':'Williamson County Schools',
    'fssd.org':'Franklin Special School District','williamsoncounty-tn.gov':'Williamson County','franklinnavigator.com':'Franklin Navigator',
    'franklintransit.org':'Franklin Transit','adoptwcac.org':'Williamson County Animal Center','tn.gov':'State of Tennessee',
    'tncourts.gov':'Tennessee Courts','las.org':'Legal Aid Society','tba.org':'Tennessee Bar Association','jobs4tn.gov':'Jobs4TN',
    'vaccines.gov':'Vaccines.gov','211.org':'211'
  };
  if(!raw||raw===host||raw==='www.'+host)return names[host]||host||'Source';
  return raw;
}
function sourceList(sources,language){
  const seen=new Set(),rows=[];
  for(const row of Array.isArray(sources)?sources:[]){
    if(!row?.url)continue;let host='';try{host=new URL(row.url).hostname.replace(/^www\./,'').toLowerCase()}catch{}
    const key=host||row.url;if(seen.has(key))continue;seen.add(key);rows.push(row);
  }
  if(!rows.length)return null;
  const wrap=make('div','franklin-assistant-sources');wrap.append(make('div','fine-print',language==='es'?'Fuentes':'Sources'));
  const actions=make('div','actions');
  for(const row of rows.slice(0,5)){const a=document.createElement('a');a.href=row.url;a.target='_blank';a.rel='noopener';a.textContent=sourceLabel(row);actions.append(a)}
  wrap.append(actions);return wrap;
}
function answerLines(value){return String(value||'').replace(/\r/g,'').replace(/\*\*/g,'').replace(/https?:\/\/\S+/gi,'').split(/\n+/).map(x=>text(x.replace(/^\s*[-*•]+\s*/,''))).filter(Boolean)}
function sensitive(v){return /(\b\d{3}-\d{2}-\d{4}\b|social security|ssn|routing number|account number|medical record number|patient id|password|passcode|numero de cuenta|seguro social|contrase[nñ]a)/i.test(String(v||''))}
function sentences(v){return text(v).split(/(?<=[.!?])\s+/).map(x=>x.trim()).filter(x=>x.length>=24&&x.length<=520)}
function documentAnswer(raw,question,language){
  const body=String(raw||'').slice(0,100000),q=text(question),ss=sentences(body);
  const words=[...new Set(q.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9\s]/g,' ').split(/\s+/).filter(x=>x.length>3))].slice(0,12);
  const dates=[...new Set((body.match(/\b(?:\d{1,2}[/-]){2}\d{2,4}\b|\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2}(?:,\s*\d{4})?/gi)||[]))].slice(0,6);
  const money=[...new Set((body.match(/\$\s?\d[\d,]*(?:\.\d{2})?/g)||[]))].slice(0,6);
  const ranked=ss.map(x=>({x,score:words.reduce((n,w)=>n+(x.toLowerCase().includes(w)?5:0),0)})).sort((a,b)=>b.score-a.score);
  const picked=(q?ranked.filter(r=>r.score>0):ranked).slice(0,3).map(r=>r.x),out=[language==='es'?'Leí el archivo en este dispositivo.':'I read the file on this device.'];
  if(dates.length)out.push((language==='es'?'Fechas encontradas: ':'Dates found: ')+dates.join(', ')+'.');
  if(money.length)out.push((language==='es'?'Montos encontrados: ':'Amounts found: ')+money.join(', ')+'.');
  if(picked.length)out.push((language==='es'?'Texto más relevante: ':'Most relevant text: ')+picked.join(' '));
  else out.push(language==='es'?'No pude identificar suficiente texto útil en el archivo.':'I could not identify enough useful text in the file.');
  if(sensitive(body))out.push(language==='es'?'Este archivo parece contener información sensible; evite compartir más de lo necesario.':'This file appears to contain sensitive information; avoid sharing more than necessary.');
  return out.join(' ');
}
function loadScript(src,key,globalName){
  if(globalName&&window[globalName])return Promise.resolve(window[globalName]);
  return new Promise((resolve,reject)=>{const old=document.querySelector('script[data-franklin-assistant-lib="'+key+'"]');if(old){old.addEventListener('load',()=>resolve(globalName?window[globalName]:true),{once:true});old.addEventListener('error',reject,{once:true});return}const s=document.createElement('script');s.src=src;s.async=true;s.crossOrigin='anonymous';s.dataset.franklinAssistantLib=key;s.onload=()=>resolve(globalName?window[globalName]:true);s.onerror=reject;document.head.append(s)});
}
async function extractAttachment(file,language,onProgress){
  if(file.size>MAX_FILE_BYTES)throw new Error('FILE_TOO_LARGE');const name=file.name.toLowerCase(),type=file.type||'';
  if(type.startsWith('text/')||/\.(txt|md|csv|json|html?)$/.test(name))return (await file.text()).slice(0,100000);
  if(type==='application/pdf'||name.endsWith('.pdf')){const pdfjs=await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@6.3.289/build/pdf.mjs');pdfjs.GlobalWorkerOptions.workerSrc='https://cdn.jsdelivr.net/npm/pdfjs-dist@6.3.289/build/pdf.worker.mjs';const doc=await pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise;let out='';for(let i=1;i<=Math.min(doc.numPages,30);i++){const p=await doc.getPage(i),c=await p.getTextContent();out+='\n'+c.items.map(x=>x.str).join(' ');if(out.length>100000)break}return out.slice(0,100000)}
  if(/wordprocessingml/.test(type)||name.endsWith('.docx')){await loadScript('https://cdn.jsdelivr.net/npm/mammoth@1.12.2/mammoth.browser.min.js','mammoth','mammoth');const r=await window.mammoth.extractRawText({arrayBuffer:await file.arrayBuffer()});return String(r.value||'').slice(0,100000)}
  if(type.startsWith('image/')||/\.(png|jpe?g|webp|bmp)$/.test(name)){await loadScript('https://cdn.jsdelivr.net/npm/tesseract.js@7.0.0/dist/tesseract.min.js','tesseract','Tesseract');const r=await window.Tesseract.recognize(file,language==='es'?'spa':'eng',{logger:m=>{if(m.status==='recognizing text'&&typeof m.progress==='number')onProgress?.(Math.round(m.progress*100))}});return String(r.data?.text||'').slice(0,100000)}
  throw new Error('UNSUPPORTED_FILE');
}


let assistantDirectoryRowsPromise;
async function assistantDirectoryRows(){
  if(assistantDirectoryRowsPromise)return assistantDirectoryRowsPromise;
  assistantDirectoryRowsPromise=(async()=>{
    await loadScript('/assets/local-discovery-core.js','assistant-directory-core','FranklinDiscoveryCore');
    const C=window.FranklinDiscoveryCore;
    if(!C||!window.crypto?.subtle)throw new Error('DIRECTORY_CORE_UNAVAILABLE');

    const manifestResponse=await fetch('/data/discovery/manifest.json',{credentials:'omit',cache:'no-cache',referrerPolicy:'no-referrer'});
    if(!manifestResponse.ok)throw new Error('DIRECTORY_MANIFEST_UNAVAILABLE');
    const manifest=await manifestResponse.json();
    if(manifest?.community!==C.EDITION||manifest?.schemaVersion!=='franklin.discovery-manifest.v1'||!manifest?.index?.file||!/^[a-f0-9]{64}$/.test(String(manifest?.index?.sha256||'')))throw new Error('DIRECTORY_MANIFEST_INVALID');

    const indexResponse=await fetch(manifest.index.file,{credentials:'omit',cache:'no-cache',referrerPolicy:'no-referrer'});
    if(!indexResponse.ok)throw new Error('DIRECTORY_INDEX_UNAVAILABLE');
    const bytes=await indexResponse.arrayBuffer();
    if(bytes.byteLength>12000000)throw new Error('DIRECTORY_INDEX_TOO_LARGE');
    const digest=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');
    if(digest!==manifest.index.sha256)throw new Error('DIRECTORY_INDEX_CHANGED');
    const raw=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
    let rows=C.decodeIndex(raw);

    const suppressionResponse=await fetch('/data/public-profile-suppressions.json',{cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer'});
    if(!suppressionResponse.ok)throw new Error('SUPPRESSION_LEDGER_UNAVAILABLE');
    const suppressionData=await suppressionResponse.json();
    const suppressed=new Set((suppressionData.entries||[]).filter(x=>x&&x.status==='SUPPRESSED').map(x=>x.profileId));
    rows=rows.filter(r=>!suppressed.has(r.i));
    return rows;
  })().catch(error=>{assistantDirectoryRowsPromise=null;throw error});
  return assistantDirectoryRowsPromise;
}

function directoryQueryFromData(data){
  for(const row of Array.isArray(data?.links)?data.links:[]){
    try{
      const u=new URL(row.url,location.origin),q=text(u.searchParams.get('q')||'');
      if(q)return q;
    }catch{}
  }
  return '';
}
function directoryQueryVariants(query){
  const q=text(query).toLowerCase();
  const out=[query];
  const add=v=>{if(v&&!out.some(x=>x.toLowerCase()===v.toLowerCase()))out.push(v)};
  if(/lawn|mow|grass|yard|césped|cesped|jard[ií]n/.test(q)){add('landscaping');add('lawn');add('mowing')}
  if(/hvac|heating|air conditioning/.test(q)){add('HVAC');add('heating air conditioning')}
  if(/tow|towing/.test(q))add('towing');
  if(/staffing|temp agency/.test(q)){add('staffing');add('employment agency')}
  return out.slice(0,4);
}
async function enrichDirectoryHandoff(data,language){
  if(String(data?.mode||'')!=='directory_handoff')return data;
  try{
    const query=directoryQueryFromData(data);
    if(!query)return data;
    const C=window.FranklinDiscoveryCore||await loadScript('/assets/local-discovery-core.js','assistant-directory-core','FranklinDiscoveryCore');
    const rows=await assistantDirectoryRows();
    let matches=[];
    for(const variant of directoryQueryVariants(query)){
      matches=C.matchRows(rows,{q:variant,sort:'local',page:1});
      if(matches.length)break;
    }
    if(!matches.length)return data;
    const profiles=matches.slice(0,3).map(r=>({
      id:r.i,
      name:r.n,
      category:r.c||r.t||'',
      location:r.l||r.g||'',
      profile:C.canonicalProfile(r.i,language),
      phone:r.p||'',
      phoneHref:r.phoneHref||'',
      websiteHref:r.websiteHref||''
    }));
    return {
      ...data,
      answer:language==='es'
        ?'Encontré perfiles locales que coinciden con su solicitud. Estos resultados son informativos, no son recomendaciones ni clasificaciones pagadas; confirme directamente el servicio, precio y disponibilidad.'
        :'I found local profiles that match what you asked for. These are informational matches, not recommendations or paid rankings; confirm the service, price, and availability directly.',
      profiles,
      directoryQuery:query
    };
  }catch{
    return data;
  }
}

function ordinaryLawnService(question,language){
  const q=text(question).toLowerCase();
  const lawn=/\b(mow(?:ing)?|lawn mow(?:ing)?|lawn care|yard work|landscap(?:e|ing)|cut (?:my |the )?grass)\b/.test(q);
  const assistance=/\b(free|volunteer|disability|disabled|senior|elderly|financial assistance|cannot afford|can't afford|low income|ayuda gratis|voluntario|discapacidad|adulto mayor|no puedo pagar)\b/.test(q);
  const wantsHelp=/\b(need help|need someone|looking for|find|someone to|help me|necesito ayuda|necesito alguien|busco|buscar)\b/.test(q);
  if(!(lawn&&wantsHelp&&!assistance))return null;
  const label=language==='es'?'cuidado del césped':'lawn care';
  return {answer:language==='es'?'Puede usar Buscar Local de Franklin Navigator para encontrar servicios de cuidado del césped. Los resultados son informativos y no implican recomendación ni disponibilidad.':'You can use Franklin Navigator’s Find Local directory to browse lawn-care and mowing services. Results are informational and do not imply endorsement or availability.',mode:'directory_handoff',sources:[],links:[{label:language==='es'?'Buscar cuidado del césped':'Find lawn care',url:(language==='es'?'/es/directorio/?q=':'/directory/?q=')+encodeURIComponent(label)}]};
}

function install(root){
  if(root.dataset.franklinAssistant==='1')return;
  const form=root.querySelector('form'),input=root.querySelector('[data-navigator-input]'),output=root.querySelector('[data-navigator-output]');if(!form||!input||!output)return;
  styles();root.dataset.franklinAssistant='1';root.dataset.franklinAssistantR1296='1';root.dataset.franklinAssistantVersion=VERSION;
  const language=lang(),history=[];let busy=false,attachment=null,recognition=null,statusTurn=null;
  output.classList.add('franklin-assistant-thread');

  const utility=make('div','franklin-assistant-utility-row'),attachLabel=make('label','franklin-assistant-attach-label',language==='es'?'Adjuntar documento, captura o foto (opcional)':'Attach a document, screenshot or photo (optional)'),attachInput=document.createElement('input');
  attachInput.type='file';attachInput.accept='.pdf,.docx,.txt,.md,.csv,.json,.html,image/png,image/jpeg,image/webp';attachInput.className='franklin-assistant-file';attachLabel.append(attachInput);
  const clearButton=make('button','link-button',language==='es'?'Limpiar / nueva pregunta':'Clear / new question');clearButton.type='button';utility.append(attachLabel,clearButton);input.insertAdjacentElement('afterend',utility);
  const attachStatus=make('div','fine-print franklin-assistant-file-status','');attachStatus.setAttribute('aria-live','polite');utility.insertAdjacentElement('afterend',attachStatus);
  const removeFile=make('button','link-button franklin-assistant-remove-file',language==='es'?'Quitar archivo':'Remove attachment');removeFile.type='button';removeFile.hidden=true;attachStatus.insertAdjacentElement('afterend',removeFile);
  const voiceButton=form.querySelector('[data-navigator-voice]'),voiceStatus=form.querySelector('[data-navigator-voice-status]'),SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;

  const setBusy=value=>{busy=value;const submit=form.querySelector('button[type="submit"]');if(submit){submit.disabled=value;submit.setAttribute('aria-busy',value?'true':'false')}input.disabled=value;attachInput.disabled=value;clearButton.disabled=value};
  const addUser=question=>{output.hidden=false;const turn=make('section','franklin-assistant-turn'),bubble=make('div','franklin-assistant-user');bubble.append(make('div','eyebrow',language==='es'?'Usted':'You'),make('p','',question));turn.append(bubble);output.append(turn);return turn};
  const addStatus=message=>{const turn=make('section','franklin-assistant-turn'),card=make('article','navigator-result franklin-assistant-answer');card.append(make('div','eyebrow','Franklin Assistant'),make('p','',message));turn.append(card);output.append(turn);statusTurn=turn;return turn};
  const answerCard=data=>{const card=make('article','navigator-result franklin-assistant-answer');card.dataset.assistantMode=String(data.mode||'');card.append(make('div','eyebrow',language==='es'?'Respuesta de Franklin':'Franklin answer'));const lines=answerLines(data.answer);if(String(data.mode||'')==='fresh_web_ai'&&lines.length>1){card.append(make('p','',lines[0]));const list=make('ul','franklin-assistant-answer-list');for(const line of lines.slice(1,8))list.append(make('li','',line));card.append(list)}else card.append(make('p','',lines.join(' ')||text(data.answer)));const profiles=Array.isArray(data.profiles)?data.profiles:[];if(profiles.length){const wrap=make('div','franklin-assistant-profile-matches');wrap.append(make('div','fine-print',language==='es'?'Perfiles locales coincidentes':'Matching local profiles'));for(const p of profiles){const item=make('section','franklin-assistant-profile-match');item.append(make('h3','',p.name));if(p.category)item.append(make('p','fine-print',p.category));if(p.location)item.append(make('p','',p.location));const actions=make('div','actions');const open=document.createElement('a');open.className='button small primary';open.href=p.profile;open.textContent=language==='es'?'Abrir perfil':'Open profile';actions.append(open);if(p.phoneHref){const call=document.createElement('a');call.className='button small';call.href=p.phoneHref;call.textContent=language==='es'?'Llamar':'Call';actions.append(call)}if(p.websiteHref){const site=document.createElement('a');site.className='button small';site.href=p.websiteHref;site.target='_blank';site.rel='noopener';site.textContent=language==='es'?'Sitio web':'Website';actions.append(site)}item.append(actions);wrap.append(item)}card.append(wrap)}const sources=sourceList(data.sources,language);if(sources)card.append(sources);const links=Array.isArray(data.links)?data.links.filter(x=>x&&x.url&&x.label):[];if(links.length){const actions=make('div','actions');for(const row of links.slice(0,3)){const a=document.createElement('a');a.className='button';a.href=row.url;a.textContent=profiles.length?(language==='es'?'Ver más coincidencias':'See more matches'):row.label;actions.append(a)}card.append(actions)}return card};
  const finishTurn=(question,data)=>{if(statusTurn){statusTurn.remove();statusTurn=null}const turn=make('section','franklin-assistant-turn');turn.append(answerCard(data));output.append(turn);history.push({role:'user',content:question},{role:'assistant',content:text(data.answer)});if(history.length>12)history.splice(0,history.length-12);input.value='';input.placeholder=language==='es'?'Haga una pregunta de seguimiento…':'Ask a follow-up…';input.focus();turn.scrollIntoView({block:'nearest',behavior:'smooth'})};
  const clearAll=()=>{history.splice(0);attachment=null;attachInput.value='';attachStatus.textContent='';removeFile.hidden=true;input.value='';input.placeholder=language==='es'?'Pregunte sobre Franklin…':'Ask about Franklin…';output.replaceChildren();output.hidden=true;if(recognition){try{recognition.stop()}catch{}recognition=null}if(voiceStatus)voiceStatus.textContent='';input.focus()};

  clearButton.addEventListener('click',clearAll);removeFile.addEventListener('click',()=>{attachment=null;attachInput.value='';attachStatus.textContent='';removeFile.hidden=true;input.focus()});
  if(voiceButton&&SpeechRecognition){voiceButton.hidden=false;voiceButton.addEventListener('click',()=>{if(recognition){try{recognition.stop()}catch{}return}recognition=new SpeechRecognition();recognition.lang=language==='es'?'es-US':'en-US';recognition.interimResults=false;recognition.maxAlternatives=1;if(voiceStatus)voiceStatus.textContent=language==='es'?'Escuchando…':'Listening…';voiceButton.setAttribute('aria-pressed','true');recognition.onresult=e=>{const said=text(e.results?.[0]?.[0]?.transcript||'');if(said){input.value=said;input.focus()}};recognition.onerror=()=>{if(voiceStatus)voiceStatus.textContent=language==='es'?'No pude escuchar la pregunta. Puede escribirla.':'I could not hear the question. You can type it instead.'};recognition.onend=()=>{recognition=null;voiceButton.setAttribute('aria-pressed','false');if(voiceStatus&&!/No pude|could not/i.test(voiceStatus.textContent||''))voiceStatus.textContent=''};recognition.start()})}
  attachInput.addEventListener('change',async()=>{const file=attachInput.files?.[0];attachment=null;removeFile.hidden=true;if(!file){attachStatus.textContent='';return}attachStatus.textContent=(language==='es'?'Leyendo ':'Reading ')+file.name+'…';try{const extracted=await extractAttachment(file,language,p=>attachStatus.textContent=(language==='es'?'Leyendo ':'Reading ')+file.name+'… '+p+'%');if(!text(extracted))throw new Error('NO_TEXT');attachment={name:file.name,type:file.type,text:extracted};attachStatus.textContent=language==='es'?file.name+' está listo. El texto permanece en este dispositivo.':file.name+' is ready. Its text stays on this device.';removeFile.hidden=false}catch(error){attachment=null;attachInput.value='';attachStatus.textContent=error.message==='FILE_TOO_LARGE'?(language==='es'?'Use un archivo menor de 8 MB.':'Use a file under 8 MB.'):(language==='es'?'No pude leer suficiente texto de ese archivo.':'I could not read enough text from that file.')}});

  const ask=async raw=>{const question=text(raw).slice(0,600);if(busy||!question)return;setBusy(true);addUser(question);addStatus(language==='es'?'Buscando una respuesta clara…':'Finding a clear answer…');try{let data;if(attachment){data={answer:documentAnswer(attachment.text,question,language),mode:'attachment_on_device',sources:[],links:[]}}else{data=ordinaryLawnService(question,language);if(!data){const response=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question,language,history:history.slice(-6)})});data=await response.json().catch(()=>({}));if(!response.ok||data?.ok!==true||!data?.answer)throw new Error(data?.error||'ANSWER_UNAVAILABLE')}}data=await enrichDirectoryHandoff(data,language);finishTurn(question,data)}catch{if(statusTurn){statusTurn.remove();statusTurn=null}const turn=make('section','franklin-assistant-turn');turn.append(answerCard({answer:language==='es'?'No pude completar esa respuesta en este momento. Inténtelo de nuevo en un momento.':'I could not complete that answer right now. Please try again in a moment.',mode:'error',sources:[],links:[]}));output.append(turn);input.value=question;input.focus()}finally{setBusy(false)}};

  form.addEventListener('submit',event=>{event.preventDefault();event.stopImmediatePropagation();ask(input.value)},true);
  root.addEventListener('click',event=>{const button=event.target.closest?.('[data-navigator-example]');if(!button)return;event.preventDefault();event.stopImmediatePropagation();const q=text(button.dataset.navigatorExample||button.textContent);input.value=q;ask(q)},true);
  root.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey&&event.target===input){event.preventDefault();form.requestSubmit()}});
  window.FranklinAssistant=Object.freeze({version:VERSION,ask,clear:clearAll,history:()=>history.map(row=>({...row}))});
}
function start(){document.querySelectorAll('[data-navigator-bot]').forEach(install)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
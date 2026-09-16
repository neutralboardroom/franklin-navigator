/* Franklin Assistant clean-room browser controller. Internal generation/version details are not public UI. */
(()=>{'use strict';

const VERSION='FRANKLIN-ASSISTANT2-0.2.1';
const API='https://franklin-navigator-assistant.onrender.com/api/v2/answer';
const MAX_FILE_BYTES=8*1024*1024;

function pageLanguage(){
  return document.documentElement.lang?.toLowerCase().startsWith('es')?'es':'en';
}
function text(v){return String(v||'').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim()}
function make(tag,className,content){
  const el=document.createElement(tag);
  if(className)el.className=className;
  if(content!==undefined)el.textContent=content;
  return el;
}
function ensureUtilityStyles(){
  if(document.getElementById('franklin-assistant-clean-controls'))return;
  const style=document.createElement('style');
  style.id='franklin-assistant-clean-controls';
  style.textContent=`
    .franklin-assistant-utility-row{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px 14px;margin:8px 0 4px}
    .franklin-assistant-attach-label{display:flex;flex-wrap:wrap;align-items:center;gap:8px;font-weight:700}
    .franklin-assistant-file{max-width:100%;font-weight:400}
    .franklin-assistant-file-status{margin:4px 0 8px}
    .franklin-assistant-answer-list{margin:.65rem 0 0;padding-left:1.2rem}
    .franklin-assistant-answer-list li{margin:.45rem 0;line-height:1.45}
    .franklin-assistant-sources{margin-top:1rem}
    .franklin-assistant-utility-row .link-button{white-space:nowrap}
    @media(max-width:640px){.franklin-assistant-utility-row{align-items:flex-start;flex-direction:column}.franklin-assistant-utility-row .link-button{align-self:flex-start}}
  `;
  document.head.append(style);
}
function sourceLabel(row){
  const raw=text(row?.title||'');
  let host='';
  try{host=new URL(row.url).hostname.replace(/^www\./,'').toLowerCase()}catch{}
  const map={
    'franklintn.gov':'City of Franklin',
    'visitfranklin.com':'Visit Franklin',
    'wcparksandrec.com':'Williamson County Parks & Recreation',
    'wcpltn.org':'Williamson County Public Library',
    'franklintheatre.com':'Franklin Theatre',
    'wcs.edu':'Williamson County Schools',
    'fssd.org':'Franklin Special School District',
    'williamsoncounty-tn.gov':'Williamson County',
    'franklinnavigator.com':'Franklin Navigator'
  };
  if(!raw||raw===host||raw==='www.'+host)return map[host]||host||'Source';
  return raw;
}
function sourceList(sources,lang){
  const seen=new Set();
  const rows=[];
  for(const row of Array.isArray(sources)?sources:[]){
    if(!row?.url)continue;
    let host='';
    try{host=new URL(row.url).hostname.replace(/^www\./,'').toLowerCase()}catch{}
    const key=host||row.url;
    if(seen.has(key))continue;
    seen.add(key);
    rows.push(row);
  }
  if(!rows.length)return null;
  const wrap=make('div','franklin-assistant-sources');
  wrap.append(make('div','fine-print',lang==='es'?'Fuentes':'Sources'));
  const actions=make('div','actions');
  for(const row of rows.slice(0,5)){
    const a=document.createElement('a');
    a.href=row.url;
    a.target='_blank';
    a.rel='noopener';
    a.textContent=sourceLabel(row);
    actions.append(a);
  }
  wrap.append(actions);
  return wrap;
}
function answerLines(value){
  return String(value||'')
    .replace(/\r/g,'')
    .replace(/\*\*/g,'')
    .replace(/https?:\/\/\S+/gi,'')
    .split(/\n+/)
    .map(line=>text(line.replace(/^\s*[-*•]+\s*/,'')))
    .filter(Boolean);
}
function hasSensitiveText(v){
  return /(\b\d{3}-\d{2}-\d{4}\b|social security|ssn|routing number|account number|medical record number|patient id|password|passcode|numero de cuenta|seguro social|contrase[nñ]a)/i.test(String(v||''));
}
function sentences(v){
  return text(v).split(/(?<=[.!?])\s+/).map(x=>x.trim()).filter(x=>x.length>=24&&x.length<=520);
}
function documentAnswer(raw,question,lang){
  const body=String(raw||'').slice(0,100000);
  const q=text(question);
  const ss=sentences(body);
  const words=[...new Set(q.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9\s]/g,' ').split(/\s+/).filter(x=>x.length>3))].slice(0,12);
  const dates=[...new Set((body.match(/\b(?:\d{1,2}[/-]){2}\d{2,4}\b|\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2}(?:,\s*\d{4})?/gi)||[]))].slice(0,6);
  const money=[...new Set((body.match(/\$\s?\d[\d,]*(?:\.\d{2})?/g)||[]))].slice(0,6);
  const ranked=ss.map(x=>({
    x,
    score:words.reduce((n,w)=>n+(x.toLowerCase().includes(w)?5:0),0)+
      (/deadline|due|date|amount|phone|address|fecha|plazo|monto|telefono|direccion/i.test(q)&&/\d|\$/.test(x)?6:0)
  })).sort((a,b)=>b.score-a.score);
  const picked=(q?ranked.filter(r=>r.score>0).slice(0,3):ranked.slice(0,3)).map(r=>r.x);
  const out=[lang==='es'?'Leí el archivo en este dispositivo.':'I read the file on this device.'];
  if(dates.length)out.push((lang==='es'?'Fechas encontradas: ':'Dates found: ')+dates.join(', ')+'.');
  if(money.length)out.push((lang==='es'?'Montos encontrados: ':'Amounts found: ')+money.join(', ')+'.');
  if(picked.length)out.push((lang==='es'?'Texto más relevante: ':'Most relevant text: ')+picked.join(' '));
  else out.push(lang==='es'?'No pude identificar suficiente texto útil en el archivo.':'I could not identify enough useful text in the file.');
  if(hasSensitiveText(body))out.push(lang==='es'?'Este archivo parece contener información sensible; evite compartir más de lo necesario.':'This file appears to contain sensitive information; avoid sharing more than necessary.');
  return out.join(' ');
}
function loadScript(src,key,globalName){
  if(globalName&&window[globalName])return Promise.resolve(window[globalName]);
  return new Promise((resolve,reject)=>{
    const old=document.querySelector('script[data-franklin-assistant-lib="'+key+'"]');
    if(old){
      old.addEventListener('load',()=>resolve(globalName?window[globalName]:true),{once:true});
      old.addEventListener('error',reject,{once:true});
      return;
    }
    const script=document.createElement('script');
    script.src=src;
    script.async=true;
    script.crossOrigin='anonymous';
    script.dataset.franklinAssistantLib=key;
    script.addEventListener('load',()=>resolve(globalName?window[globalName]:true),{once:true});
    script.addEventListener('error',reject,{once:true});
    document.head.append(script);
  });
}
async function extractAttachment(file,lang,onProgress){
  if(file.size>MAX_FILE_BYTES)throw new Error('FILE_TOO_LARGE');
  const name=file.name.toLowerCase(),type=file.type||'';
  if(type.startsWith('text/')||/\.(txt|md|csv|json|html?)$/.test(name))return (await file.text()).slice(0,100000);
  if(type==='application/pdf'||name.endsWith('.pdf')){
    const pdfjs=await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@6.3.289/build/pdf.mjs');
    pdfjs.GlobalWorkerOptions.workerSrc='https://cdn.jsdelivr.net/npm/pdfjs-dist@6.3.289/build/pdf.worker.mjs';
    const doc=await pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise;
    let out='';
    for(let i=1;i<=Math.min(doc.numPages,30);i++){
      const page=await doc.getPage(i),pageText=await page.getTextContent();
      out+='\n'+pageText.items.map(x=>x.str).join(' ');
      if(out.length>100000)break;
    }
    return out.slice(0,100000);
  }
  if(/wordprocessingml/.test(type)||name.endsWith('.docx')){
    await loadScript('https://cdn.jsdelivr.net/npm/mammoth@1.12.2/mammoth.browser.min.js','mammoth','mammoth');
    const result=await window.mammoth.extractRawText({arrayBuffer:await file.arrayBuffer()});
    return String(result.value||'').slice(0,100000);
  }
  if(type.startsWith('image/')||/\.(png|jpe?g|webp|bmp)$/.test(name)){
    await loadScript('https://cdn.jsdelivr.net/npm/tesseract.js@7.0.0/dist/tesseract.min.js','tesseract','Tesseract');
    const result=await window.Tesseract.recognize(file,lang==='es'?'spa':'eng',{logger:m=>{
      if(m.status==='recognizing text'&&typeof m.progress==='number')onProgress?.(Math.round(m.progress*100));
    }});
    return String(result.data?.text||'').slice(0,100000);
  }
  throw new Error('UNSUPPORTED_FILE');
}

function install(root){
  if(root.dataset.franklinAssistant==='1')return;
  const form=root.querySelector('form');
  const input=root.querySelector('[data-navigator-input]');
  const output=root.querySelector('[data-navigator-output]');
  if(!form||!input||!output)return;

  ensureUtilityStyles();
  root.dataset.franklinAssistant='1';
  root.dataset.franklinAssistantR1296='1';
  root.dataset.franklinAssistantVersion=VERSION;

  const lang=pageLanguage();
  const history=[];
  let busy=false,attachment=null,recognition=null;

  const utility=make('div','franklin-assistant-utility-row');
  const attachLabel=make('label','franklin-assistant-attach-label',lang==='es'?'Adjuntar documento, captura o foto (opcional)':'Attach a document, screenshot or photo (optional)');
  const attachInput=document.createElement('input');
  attachInput.type='file';
  attachInput.accept='.pdf,.docx,.txt,.md,.csv,.json,.html,image/png,image/jpeg,image/webp';
  attachInput.className='franklin-assistant-file';
  attachLabel.append(attachInput);
  const clearButton=make('button','link-button',lang==='es'?'Limpiar / nueva pregunta':'Clear / new question');
  clearButton.type='button';
  clearButton.dataset.assistantClear='1';
  utility.append(attachLabel,clearButton);
  input.insertAdjacentElement('afterend',utility);

  const attachStatus=make('div','fine-print franklin-assistant-file-status','');
  attachStatus.setAttribute('aria-live','polite');
  utility.insertAdjacentElement('afterend',attachStatus);

  const removeFile=make('button','link-button franklin-assistant-remove-file',lang==='es'?'Quitar archivo':'Remove attachment');
  removeFile.type='button';
  removeFile.hidden=true;
  attachStatus.insertAdjacentElement('afterend',removeFile);

  const voiceButton=form.querySelector('[data-navigator-voice]');
  const voiceStatus=form.querySelector('[data-navigator-voice-status]');
  const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;

  const setBusy=value=>{
    busy=value;
    const submit=form.querySelector('button[type="submit"]');
    if(submit){
      submit.disabled=value;
      submit.setAttribute('aria-busy',value?'true':'false');
    }
    input.disabled=value;
    attachInput.disabled=value;
    clearButton.disabled=value;
  };

  const showStatus=message=>{
    output.hidden=false;
    output.replaceChildren();
    const card=make('article','navigator-result franklin-assistant-answer');
    card.append(make('div','eyebrow','Franklin Assistant'));
    card.append(make('p','',message));
    output.append(card);
    output.focus();
  };

  const renderAnswer=(question,data)=>{
    output.hidden=false;
    output.replaceChildren();
    const card=make('article','navigator-result franklin-assistant-answer');
    card.dataset.assistantMode=String(data.mode||'');
    card.append(make('div','eyebrow',lang==='es'?'Respuesta de Franklin':'Franklin answer'));

    const lines=answerLines(data.answer);
    if(String(data.mode||'')==='fresh_web_ai'&&lines.length>1){
      card.append(make('p','',lines[0]));
      const list=make('ul','franklin-assistant-answer-list');
      for(const line of lines.slice(1,8))list.append(make('li','',line));
      card.append(list);
    }else{
      card.append(make('p','',lines.join(' ')||text(data.answer)));
    }

    const sources=sourceList(data.sources,lang);
    if(sources)card.append(sources);

    const links=Array.isArray(data.links)?data.links.filter(x=>x&&x.url&&x.label):[];
    if(links.length){
      const actions=make('div','actions');
      for(const row of links.slice(0,3)){
        const a=document.createElement('a');
        a.className='button';
        a.href=row.url;
        a.textContent=row.label;
        actions.append(a);
      }
      card.append(actions);
    }
    output.append(card);
    output.focus();
    if(question){
      history.push({role:'user',content:question});
      history.push({role:'assistant',content:text(data.answer)});
      if(history.length>12)history.splice(0,history.length-12);
    }
  };

  const clearAll=()=>{
    history.splice(0,history.length);
    attachment=null;
    attachInput.value='';
    attachStatus.textContent='';
    removeFile.hidden=true;
    input.value='';
    output.replaceChildren();
    output.hidden=true;
    if(recognition){try{recognition.stop()}catch{}recognition=null}
    if(voiceStatus)voiceStatus.textContent='';
    input.focus();
  };

  clearButton.addEventListener('click',clearAll);
  removeFile.addEventListener('click',()=>{
    attachment=null;
    attachInput.value='';
    attachStatus.textContent='';
    removeFile.hidden=true;
    input.focus();
  });

  if(voiceButton&&SpeechRecognition){
    voiceButton.hidden=false;
    voiceButton.addEventListener('click',()=>{
      if(recognition){try{recognition.stop()}catch{}return}
      recognition=new SpeechRecognition();
      recognition.lang=lang==='es'?'es-US':'en-US';
      recognition.interimResults=false;
      recognition.maxAlternatives=1;
      if(voiceStatus)voiceStatus.textContent=lang==='es'?'Escuchando…':'Listening…';
      voiceButton.setAttribute('aria-pressed','true');
      recognition.onresult=event=>{
        const spoken=text(event.results?.[0]?.[0]?.transcript||'');
        if(spoken){input.value=spoken;input.focus()}
      };
      recognition.onerror=()=>{
        if(voiceStatus)voiceStatus.textContent=lang==='es'?'No pude escuchar la pregunta. Puede escribirla.':'I could not hear the question. You can type it instead.';
      };
      recognition.onend=()=>{
        recognition=null;
        voiceButton.setAttribute('aria-pressed','false');
        if(voiceStatus&&!/No pude|could not/i.test(voiceStatus.textContent||''))voiceStatus.textContent='';
      };
      recognition.start();
    });
  }

  attachInput.addEventListener('change',async()=>{
    const file=attachInput.files?.[0];
    attachment=null;
    removeFile.hidden=true;
    if(!file){attachStatus.textContent='';return}
    attachStatus.textContent=(lang==='es'?'Leyendo ':'Reading ')+file.name+(lang==='es'?' en este dispositivo…':' on this device…');
    try{
      const extracted=await extractAttachment(file,lang,p=>{
        attachStatus.textContent=(lang==='es'?'Leyendo ':'Reading ')+file.name+'… '+p+'%';
      });
      if(!text(extracted))throw new Error('NO_TEXT');
      attachment={name:file.name,type:file.type,text:extracted};
      attachStatus.textContent=lang==='es'
        ?file.name+' está listo. El texto permanece en este dispositivo.'
        :file.name+' is ready. Its text stays on this device.';
      removeFile.hidden=false;
    }catch(error){
      attachment=null;
      attachInput.value='';
      attachStatus.textContent=error.message==='FILE_TOO_LARGE'
        ?(lang==='es'?'Use un archivo menor de 8 MB.':'Use a file under 8 MB.')
        :error.message==='UNSUPPORTED_FILE'
          ?(lang==='es'?'Pruebe PDF, DOCX, texto, PNG, JPG o WebP.':'Try PDF, DOCX, text, PNG, JPG or WebP.')
          :(lang==='es'?'No pude leer suficiente texto de ese archivo.':'I could not read enough text from that file.');
    }
  });

  const ask=async(raw)=>{
    const question=text(raw).slice(0,600);
    if(busy)return;

    if(attachment){
      setBusy(true);
      try{
        const answer=documentAnswer(attachment.text,question,lang);
        renderAnswer(question||attachment.name,{
          answer,
          mode:'attachment_on_device',
          sources:[],
          links:[]
        });
      }finally{
        setBusy(false);
      }
      return;
    }

    if(!question)return;

    setBusy(true);
    showStatus(lang==='es'?'Buscando una respuesta clara…':'Finding a clear answer…');
    try{
      const response=await fetch(API,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          question,
          language:lang,
          history:history.slice(-6)
        })
      });
      const data=await response.json().catch(()=>({}));
      if(!response.ok||data?.ok!==true||!data?.answer)throw new Error(data?.error||'ANSWER_UNAVAILABLE');
      renderAnswer(question,data);
    }catch{
      showStatus(lang==='es'
        ?'No pude completar esa respuesta en este momento. Inténtelo de nuevo en un momento.'
        :'I could not complete that answer right now. Please try again in a moment.');
    }finally{
      setBusy(false);
    }
  };

  form.addEventListener('submit',event=>{
    event.preventDefault();
    event.stopImmediatePropagation();
    const question=input.value;
    input.value='';
    ask(question);
  },true);

  root.addEventListener('click',event=>{
    const button=event.target.closest?.('[data-navigator-example]');
    if(!button)return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const question=text(button.dataset.navigatorExample||button.textContent);
    input.value=question;
    ask(question);
  },true);

  root.addEventListener('keydown',event=>{
    if(event.key==='Enter'&&!event.shiftKey&&event.target===input){
      event.preventDefault();
      form.requestSubmit();
    }
  });

  window.FranklinAssistant=Object.freeze({
    version:VERSION,
    ask,
    clear:clearAll,
    history:()=>history.map(row=>({...row}))
  });
}

function start(){
  document.querySelectorAll('[data-navigator-bot]').forEach(install);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
else start();

})();
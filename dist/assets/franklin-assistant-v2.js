/* Franklin Assistant 2 — clean-room browser controller. Visual shell is supplied by the existing Franklin site. */
(()=>{'use strict';

const VERSION='FRANKLIN-ASSISTANT2-0.1.0';
const API='https://franklin-navigator-assistant.onrender.com/api/v2/answer';

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

function sourceList(sources,lang){
  const rows=Array.isArray(sources)?sources.filter(x=>x&&x.url&&x.title):[];
  if(!rows.length)return null;
  const wrap=make('div','franklin-assistant2-sources');
  wrap.append(make('div','fine-print',lang==='es'?'Fuentes oficiales':'Official sources'));
  const actions=make('div','actions');
  for(const row of rows.slice(0,3)){
    const a=document.createElement('a');
    a.href=row.url;
    a.target='_blank';
    a.rel='noopener';
    a.textContent=row.title;
    actions.append(a);
  }
  wrap.append(actions);
  return wrap;
}

function install(root){
  if(root.dataset.franklinAssistant2==='1')return;
  const form=root.querySelector('form');
  const input=root.querySelector('[data-navigator-input]');
  const output=root.querySelector('[data-navigator-output]');
  if(!form||!input||!output)return;

  root.dataset.franklinAssistant2='1';
  root.dataset.franklinAssistantR1296='1';
  root.dataset.franklinAssistantVersion=VERSION;

  const lang=pageLanguage();
  const history=[];
  let busy=false;

  const setBusy=value=>{
    busy=value;
    const submit=form.querySelector('button[type="submit"]');
    if(submit){
      submit.disabled=value;
      submit.setAttribute('aria-busy',value?'true':'false');
    }
    input.disabled=value;
  };

  const showStatus=message=>{
    output.hidden=false;
    output.replaceChildren();
    const card=make('article','navigator-result franklin-assistant-answer');
    card.append(make('div','eyebrow','Franklin Assistant 2'));
    card.append(make('p','',message));
    output.append(card);
    output.focus();
  };

  const renderAnswer=(question,data)=>{
    output.hidden=false;
    output.replaceChildren();

    const card=make('article','navigator-result franklin-assistant-answer');
    card.dataset.assistant2Mode=String(data.mode||'');
    card.append(make('div','eyebrow',lang==='es'?'Respuesta de Franklin':'Franklin answer'));
    card.append(make('p','',text(data.answer)));

    const sources=sourceList(data.sources,lang);
    if(sources)card.append(sources);

    output.append(card);
    output.focus();

    history.push({role:'user',content:question});
    history.push({role:'assistant',content:text(data.answer)});
    if(history.length>12)history.splice(0,history.length-12);
  };

  const ask=async(raw)=>{
    const question=text(raw).slice(0,600);
    if(!question||busy)return;

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

  window.FranklinAssistant2=Object.freeze({
    version:VERSION,
    ask,
    history:()=>history.map(row=>({...row}))
  });
}

function start(){
  document.querySelectorAll('[data-navigator-bot]').forEach(install);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
else start();

})();
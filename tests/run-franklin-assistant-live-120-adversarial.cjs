'use strict';
const fs=require('node:fs');

const API=process.env.FRANKLIN_ASSISTANT_API||'https://franklin-navigator-assistant.onrender.com/api/v2/answer';
const shard=Number(process.env.SHARD_INDEX||0);
const shardCount=Number(process.env.SHARD_COUNT||6);
const bank=JSON.parse(fs.readFileSync('tests/franklin-assistant-adversarial-acceptance-bank.json','utf8'));

function langFor(row){
  return /^ADV-ES-/.test(row.id)||row.category.includes('spanish')||/[¿¡áéíóúñ]/i.test(row.question)?'es':'en';
}
function spanishEnough(s){
  return /\b(para|puede|puedo|necesita|necesito|llame|agua|permiso|escuela|buscar|franklin|horario|eventos|direcci[oó]n|servicio|ayuda|d[oó]nde|mec[aá]nico|bache)\b/i.test(s);
}
function hostCount(sources){
  const hs=new Set();
  for(const row of Array.isArray(sources)?sources:[]){
    try{hs.add(new URL(row.url).hostname.replace(/^www\./,''))}catch{}
  }
  return hs.size;
}
function basicQuality(data){
  const answer=String(data?.answer||'').trim();
  const reasons=[];
  if(data?.ok!==true)reasons.push('api_not_ok');
  if(answer.length<20)reasons.push('answer_too_short');
  if(/\*\*|https?:\/\//i.test(answer))reasons.push('raw_markup_or_url');
  if(/I do not yet have enough verified local information/i.test(answer))reasons.push('insufficient_local_evidence');
  return reasons;
}
function clarifies(answer,data){
  return Boolean(data?.needsDetail)
    || /\?|which|what kind|what type|what do you mean|tell me|need (the|your)|address|location|department|service|case|court|permit|water issue|more detail|direcci[oó]n|qu[eé] tipo|cu[aá]l|d[ií]game|necesito/i.test(answer);
}
function emergencyEnough(answer){
  return /911|emergency|emergencia|leave|evacuate|salga|stay away|do not approach|don't approach|call (police|fire|the utility|911)|llame|downed (wire|line)|gas company|treat .* as .* stop/i.test(answer);
}

function score(row,data){
  const answer=String(data?.answer||'').trim();
  const mode=String(data?.mode||'');
  const sources=Array.isArray(data?.sources)?data.sources:[];
  const links=Array.isArray(data?.links)?data.links:[];
  const reasons=basicQuality(data);
  const fail=r=>{if(!reasons.includes(r))reasons.push(r)};
  const sourced=new Set(['verified_fact','official_research_ai','local_web_ai','fresh_web_ai','official_snapshot']);

  switch(row.expected){
    case 'fresh_current':
      if(mode!=='fresh_web_ai')fail('expected_fresh_web_ai');
      if(!sources.length)fail('missing_fresh_sources');
      if(hostCount(sources)!==sources.length)fail('duplicate_source_hosts');
      break;
    case 'context_followup_fresh':
      if(mode!=='fresh_web_ai')fail('expected_fresh_followup');
      break;
    case 'directory_handoff':
      if(mode!=='directory_handoff')fail('expected_directory_handoff');
      if(!links.length)fail('missing_directory_link');
      break;
    case 'local_research':
      if(!(sourced.has(mode)&&sources.length))fail('expected_source_backed_local_answer');
      if(mode==='directory_handoff')fail('informational_question_misrouted_to_directory');
      break;
    case 'needs_specific_detail':
      if(!clarifies(answer,data))fail('missing_targeted_clarification');
      break;
    case 'emergency_first':
      if(!emergencyEnough(answer))fail('missing_emergency_first_action');
      break;
    case 'context_followup':
      if(mode==='insufficient_local_evidence')fail('lost_conversation_context');
      if(/name the Franklin service|reformulate|rephrase/i.test(answer))fail('asked_to_restate_context');
      break;
    case 'general_plus_local':
      if(mode==='insufficient_local_evidence')fail('insufficient_general_plus_local');
      break;
  }

  if(row.category.includes('spanish')&&!spanishEnough(answer))fail('spanish_parity_failure');
  return {pass:reasons.length===0,reasons};
}

async function sleep(ms){return new Promise(r=>setTimeout(r,ms))}
async function ask(row){
  const body={
    question:row.question,
    language:langFor(row),
    history:Array.isArray(row.history)?row.history:[]
  };
  let last={};
  for(let attempt=1;attempt<=3;attempt++){
    try{
      const ctl=new AbortController();
      const timer=setTimeout(()=>ctl.abort(),45000);
      const response=await fetch(API,{
        method:'POST',
        headers:{'Content-Type':'application/json','User-Agent':'Franklin-Assistant-Adversarial-Acceptance/1.0'},
        body:JSON.stringify(body),
        signal:ctl.signal
      });
      clearTimeout(timer);
      const data=await response.json().catch(()=>({}));
      last={httpStatus:response.status,...data};
      if(response.ok&&data?.ok===true)return last;
      if(response.status===429){await sleep(15000*attempt);continue}
      if(response.status>=500){await sleep(3000*attempt);continue}
      return last;
    }catch(error){
      last={ok:false,error:error?.name==='AbortError'?'TIMEOUT':String(error?.message||error)};
      await sleep(2000*attempt);
    }
  }
  return last;
}

(async()=>{
  const selected=bank.cases.filter((_,i)=>i%shardCount===shard);
  const results=[];
  for(const row of selected){
    const started=Date.now();
    const data=await ask(row);
    const verdict=score(row,data);
    results.push({
      id:row.id,category:row.category,question:row.question,expected:row.expected,
      pass:verdict.pass,reasons:verdict.reasons,httpStatus:data.httpStatus||null,
      mode:data.mode||null,answer:String(data.answer||''),sources:Array.isArray(data.sources)?data.sources:[],
      links:Array.isArray(data.links)?data.links:[],needsDetail:Boolean(data.needsDetail),
      elapsedMs:Date.now()-started
    });
    process.stdout.write(JSON.stringify({id:row.id,pass:verdict.pass,mode:data.mode||null,reasons:verdict.reasons})+'\n');
    await sleep(350);
  }
  fs.mkdirSync('adversarial-live-test-results',{recursive:true});
  fs.writeFileSync('adversarial-live-test-results/shard-'+shard+'.json',JSON.stringify({
    shard,shardCount,runAt:new Date().toISOString(),count:results.length,results
  },null,2)+'\n');
  console.log(JSON.stringify({shard,passed:results.filter(x=>x.pass).length,total:results.length}));
})().catch(error=>{console.error(error);process.exit(1)});

// ADVERSARIAL_RUN_TRIGGER_2026_09_17

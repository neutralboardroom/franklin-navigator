'use strict';
(()=>{
  const urgent=raw=>/\b(911|emergency|immediate danger|not breathing|cannot breathe|can't breathe|chest pain|overdose|gas leak|suicide|988|mental health crisis|emergencia|peligro inmediato|no respira|no puedo respirar|dolor de pecho|sobredosis|fuga de gas|suicidio|crisis de salud mental)\b/.test(String(raw||'').toLowerCase());
  const clearPractical=bot=>{const host=bot?.querySelector?.('[data-r40-practical]');if(host){host.replaceChildren();host.hidden=true}};
  const bind=bot=>{if(!bot||bot.dataset.r40SafetyGuard)return;bot.dataset.r40SafetyGuard='1';const form=bot.querySelector('form'),input=bot.querySelector('[data-navigator-input]'),output=bot.querySelector('[data-navigator-output]');if(!form||!input)return;const enforce=()=>{if(urgent(input.value))clearPractical(bot)};form.addEventListener('submit',()=>setTimeout(enforce,30));if(output)new MutationObserver(enforce).observe(output,{childList:true,subtree:true});};
  const mount=()=>document.querySelectorAll('[data-navigator-bot]').forEach(bind);
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',mount):mount();
  window.FranklinR40SafetyGuard=Object.freeze({urgent,version:'FR-NAV1.15.0-HF2.4-CANDIDATE'});
})();

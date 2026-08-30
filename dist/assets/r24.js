(() => {
  const qsa=(s,r=document)=>[...r.querySelectorAll(s)];
  const revealAskFromQuery=()=>{const q=new URLSearchParams(location.search).get('ask');if(!q)return;const input=document.querySelector('[data-navigator-input]');const form=input?.closest('form');if(input&&form){input.value=q;requestAnimationFrame(()=>form.requestSubmit())}};
  const renderHomeEvents=()=>{const grid=document.querySelector('[data-home-events]');if(!grid)return;const now=Date.now();let shown=0;for(const card of qsa('[data-event-end]',grid)){const end=Date.parse(card.dataset.eventEnd||'');const expired=Number.isFinite(end)&&end<now;const visible=!expired&&shown<3;card.hidden=!visible;if(visible)shown++;}const empty=document.querySelector('[data-home-events-empty]');if(empty)empty.hidden=shown!==0;};
  document.addEventListener('DOMContentLoaded',()=>{renderHomeEvents();revealAskFromQuery();setInterval(renderHomeEvents,60000)});
})();

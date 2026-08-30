(() => {
  const qsa=(s,r=document)=>[...r.querySelectorAll(s)];
  const revealAskFromQuery=()=>{const q=new URLSearchParams(location.search).get('ask');if(!q)return;const input=document.querySelector('[data-navigator-input]');const form=input?.closest('form');if(input&&form){input.value=q;requestAnimationFrame(()=>form.requestSubmit())}};
  const renderHomeEvents=()=>{const grid=document.querySelector('[data-home-events]');if(!grid)return;const now=Date.now();let shown=0;for(const card of qsa('[data-event-end]',grid)){const end=Date.parse(card.dataset.eventEnd||'');const expired=Number.isFinite(end)&&end<now;const visible=!expired&&shown<3;card.hidden=!visible;if(visible)shown++;}const empty=document.querySelector('[data-home-events-empty]');if(empty)empty.hidden=shown!==0;};
  document.addEventListener('DOMContentLoaded',()=>{renderHomeEvents();revealAskFromQuery();setInterval(renderHomeEvents,60000)});
})();


/* R24.1 dynamic Ask Navigator behavior */
(()=>{
  const setup=()=>{
    const card=document.querySelector('[data-navigator-bot]');
    const input=card?.querySelector('[data-navigator-input]');
    const output=card?.querySelector('[data-navigator-output]');
    if(!card||!input||!output)return;
    input.setAttribute('aria-multiline','true');
    input.dataset.autogrow='six-lines';
    const grow=()=>{
      const style=getComputedStyle(input);
      const line=parseFloat(style.lineHeight)||24;
      const chrome=(parseFloat(style.paddingTop)||0)+(parseFloat(style.paddingBottom)||0)+(parseFloat(style.borderTopWidth)||0)+(parseFloat(style.borderBottomWidth)||0);
      const min=parseFloat(style.minHeight)||input.offsetHeight||110;
      const max=Math.ceil(line*6+chrome);
      input.style.height='auto';
      const desired=Math.max(min,Math.min(input.scrollHeight,max));
      input.style.height=desired+'px';
      input.style.overflowY=input.scrollHeight>max?'auto':'hidden';
      input.dataset.autogrowState=input.scrollHeight>max?'max-scroll':'growing';
    };
    const syncAnswer=()=>{
      const open=!output.hidden&&Boolean(output.textContent.trim()||output.children.length);
      card.classList.toggle('has-answer',open);
      card.dataset.answerState=open?'open':'closed';
    };
    input.addEventListener('input',grow);
    input.addEventListener('change',grow);
    card.addEventListener('click',event=>{if(event.target instanceof Element&&event.target.closest('[data-navigator-example]'))requestAnimationFrame(grow)});
    let frame=0;
    addEventListener('resize',()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(grow)},{passive:true});
    new MutationObserver(syncAnswer).observe(output,{attributes:true,attributeFilter:['hidden'],childList:true,subtree:true,characterData:true});
    grow();
    syncAnswer();
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup,{once:true});else setup();
})();

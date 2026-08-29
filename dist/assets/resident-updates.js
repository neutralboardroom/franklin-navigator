(()=>{
  const form=document.querySelector('[data-resident-updates-form]');
  if(!form)return;
  const status=document.querySelector('[data-resident-updates-status]');
  const sourceField=form.querySelector('[data-resident-updates-source]');
  const allowed=new Set(['WEBSITE','EVENT_QR','MEMBER_DISPLAY_QR','AMBASSADOR','COMMUNITY_PARTNER']);
  const raw=(new URLSearchParams(location.search).get('source')||'WEBSITE').trim().toUpperCase();
  const source=allowed.has(raw)?raw:'WEBSITE';
  sourceField.value=source;
  const setStatus=(msg)=>{if(status){status.textContent=msg;status.focus?.();}};
  form.addEventListener('submit',event=>{
    event.preventDefault();
    const email=String(new FormData(form).get('email')||'').trim();
    const consent=form.querySelector('input[name="consent"]').checked;
    if(!email||!form.querySelector('input[name="email"]').checkValidity()){setStatus('Enter a valid email address first.');return;}
    if(!consent){setStatus('Please choose the consent box if you want to request Franklin updates.');return;}
    const subject='Franklin Navigator updates opt-in request';
    const body=[
      'Please add me to the Franklin Navigator resident/community updates list.',
      '',
      `Email: ${email}`,
      `Source: ${source}`,
      'Consent: I explicitly requested Franklin Navigator community/product marketing updates and understand I can unsubscribe.',
      '',
      'This request was prepared on franklinnavigator.com. Please send this email to complete the request.'
    ].join('\n');
    setStatus('Your email app is opening with a prepared opt-in request. Nothing has been sent by Franklin Navigator. Send the email if you want to complete the request.');
    location.href=`mailto:community@franklinnavigator.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
})();

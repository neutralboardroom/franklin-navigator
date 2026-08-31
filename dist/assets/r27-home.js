/* Franklin R27 focused Ask Navigator answer experience */
(() => {
  const BUSINESS_INTENT = /\b(grow my business|business growth|more local customers|market(?:ing)? my business|promote my business|local visibility|business profile|claim my profile|membership plans?)\b/i;

  const setup = () => {
    const card = document.querySelector('[data-navigator-bot]');
    const input = card?.querySelector('[data-navigator-input]');
    const output = card?.querySelector('[data-navigator-output]');
    const form = input?.closest('form');
    if (!card || !input || !output || !form || document.querySelector('[data-r27-navigator-dialog]')) return;

    const dialog = document.createElement('dialog');
    dialog.className = 'r27-navigator-dialog';
    dialog.dataset.r27NavigatorDialog = 'true';
    dialog.setAttribute('aria-labelledby', 'r27-navigator-title');
    dialog.innerHTML = `
      <div class="r27-navigator-shell">
        <div class="r27-navigator-head">
          <div>
            <div class="eyebrow">Your Franklin next step</div>
            <h2 id="r27-navigator-title">Choose what you want to do now.</h2>
          </div>
          <button class="r27-navigator-close" type="button" aria-label="Close answer">×</button>
        </div>
        <div class="r27-navigator-body" data-r27-navigator-body></div>
      </div>`;
    document.body.append(dialog);

    const body = dialog.querySelector('[data-r27-navigator-body]');
    const title = dialog.querySelector('#r27-navigator-title');
    const close = dialog.querySelector('.r27-navigator-close');
    let returnFocus = input;
    let moving = false;

    const openDialog = () => {
      document.body.classList.add('r27-dialog-open');
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
      requestAnimationFrame(() => close.focus());
    };

    const closeDialog = () => {
      if (dialog.open && typeof dialog.close === 'function') dialog.close();
      else {
        dialog.removeAttribute('open');
        document.body.classList.remove('r27-dialog-open');
        returnFocus?.focus?.();
      }
    };

    const addQuestion = (text) => {
      if (!text) return;
      const summary = document.createElement('p');
      summary.className = 'r27-navigator-question';
      summary.textContent = `You asked: ${text}`;
      body.append(summary);
    };

    const showBusinessChoices = (question) => {
      moving = true;
      title.textContent = 'How would you like to grow your Franklin business?';
      body.replaceChildren();
      addQuestion(question);
      const choice = document.createElement('section');
      choice.className = 'r27-business-choice';
      choice.innerHTML = `
        <h3>Start with the outcome you need.</h3>
        <p>Open one focused workspace instead of expanding a long answer below the homepage.</p>
        <div class="r27-business-actions">
          <a class="button primary" href="/local-growth-engine/">Build my growth plan</a>
          <a class="button" href="/claim-profile/">Find or review my profile</a>
          <a class="button" href="/membership-start/">See membership and pricing</a>
          <a class="button" href="/business-dashboard/">Open my business dashboard</a>
        </div>
        <p class="r27-business-note">Membership improves eligible profile and growth tools. It does not guarantee ranking, customers, leads, sales or results.</p>`;
      body.append(choice);
      output.hidden = true;
      output.replaceChildren();
      card.classList.remove('has-answer');
      card.dataset.answerState = 'dialog';
      openDialog();
      moving = false;
    };

    const showGeneratedAnswer = () => {
      if (moving || output.hidden || !String(output.textContent || '').trim()) return;
      moving = true;
      title.textContent = 'Here are your Franklin next steps.';
      body.replaceChildren();
      addQuestion(input.value.trim());
      for (const node of [...output.childNodes]) body.append(node.cloneNode(true));
      output.hidden = true;
      output.replaceChildren();
      card.classList.remove('has-answer');
      card.dataset.answerState = 'dialog';
      openDialog();
      moving = false;
    };

    form.addEventListener('submit', (event) => {
      const question = input.value.trim();
      if (!BUSINESS_INTENT.test(question)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      returnFocus = input;
      showBusinessChoices(question || 'Grow my business');
    }, true);

    card.addEventListener('click', (event) => {
      const trigger = event.target instanceof Element ? event.target.closest('button,a') : null;
      if (trigger) returnFocus = trigger;
    }, true);

    const observer = new MutationObserver(() => queueMicrotask(showGeneratedAnswer));
    observer.observe(output, {
      attributes: true,
      attributeFilter: ['hidden'],
      childList: true,
      subtree: true,
      characterData: true
    });

    close.addEventListener('click', closeDialog);
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) closeDialog();
    });
    dialog.addEventListener('close', () => {
      document.body.classList.remove('r27-dialog-open');
      if (returnFocus instanceof HTMLElement) requestAnimationFrame(() => returnFocus.focus());
    });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup, { once: true });
  else setup();
})();

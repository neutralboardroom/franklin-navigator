(() => {
  'use strict';

  const pageLanguage = document.documentElement.lang === 'es' ? 'es' : 'en';
  const q = (selector, root = document) => root.querySelector(selector);
  const qa = (selector, root = document) => [...root.querySelectorAll(selector)];
  const healthKey = 'franklin_learning_health_v1';
  const observedMetricAllowlist = new Set([
    'hub_open',
    'mode_teacher_open',
    'mode_learner_open',
    'mode_provider_open',
    'packet_created',
    'privacy_block',
    'packet_copied',
    'packet_downloaded',
    'packet_printed',
    'official_source_open'
  ]);

  const text = {
    en: {
      source: 'Official or first-party source',
      reviewed: 'Catalog reviewed',
      recheck: 'Recheck changing details at the source',
      open: 'Open official source',
      resourcesLoading: 'Loading verified starting points…',
      resourcesError: 'The verified-source catalog could not load. Please try again shortly.',
      resourcesEmpty: 'No source matches those broad filters. Try a different audience or shorter search.',
      allAudiences: 'All audiences',
      copied: 'Copied',
      copy: 'Copy packet',
      privacyClear: 'No likely private record details detected. The text still stays only in this page.',
      privacyEmpty: 'Use a broad topic or concept only. Do not enter a person’s name or record details.',
      privacyBlocked: 'That entry may contain private, identifying, or student-record information. Remove it and use only a broad topic or concept.',
      chooseMode: 'Choose a mode and complete the broad fields to create a packet.',
      required: 'Complete the broad topic and required choices. Do not enter a person’s details.',
      downloadName: 'franklin-learning-packet.json',
      devicePackets: 'Packets created',
      deviceSources: 'Official sources opened',
      deviceBlocks: 'Privacy blocks',
      outcomes: 'Learning outcomes inferred',
      none: 'None',
      clearCounters: 'Clear device counters',
      countersCleared: 'Device counters cleared.'
    },
    es: {
      source: 'Fuente oficial o de primera fuente',
      reviewed: 'Catálogo revisado',
      recheck: 'Confirme los detalles cambiantes en la fuente',
      open: 'Abrir fuente oficial',
      resourcesLoading: 'Cargando puntos de partida verificados…',
      resourcesError: 'No se pudo cargar el catálogo de fuentes verificadas. Inténtelo de nuevo en breve.',
      resourcesEmpty: 'Ninguna fuente coincide con esos filtros generales. Pruebe otro público o una búsqueda más corta.',
      allAudiences: 'Todos los públicos',
      copied: 'Copiado',
      copy: 'Copiar paquete',
      privacyClear: 'No se detectaron posibles datos privados. El texto permanece únicamente en esta página.',
      privacyEmpty: 'Use solo un tema o concepto general. No escriba el nombre ni los expedientes de una persona.',
      privacyBlocked: 'La entrada puede contener datos privados, identificadores o expedientes estudiantiles. Elimínelos y use solo un tema o concepto general.',
      chooseMode: 'Elija un modo y complete los campos generales para crear un paquete.',
      required: 'Complete el tema general y las opciones requeridas. No escriba datos de una persona.',
      downloadName: 'paquete-aprendizaje-franklin.json',
      devicePackets: 'Paquetes creados',
      deviceSources: 'Fuentes oficiales abiertas',
      deviceBlocks: 'Bloqueos de privacidad',
      outcomes: 'Resultados de aprendizaje inferidos',
      none: 'Ninguno',
      clearCounters: 'Borrar contadores del dispositivo',
      countersCleared: 'Se borraron los contadores del dispositivo.'
    }
  }[pageLanguage];

  const emptyHealth = () => ({
    schemaVersion: 'franklin.learning-health.local.v1',
    counts: Object.fromEntries([...observedMetricAllowlist].map(metric => [metric, 0]))
  });

  const readHealth = () => {
    try {
      const parsed = JSON.parse(localStorage.getItem(healthKey) || 'null');
      if (!parsed || parsed.schemaVersion !== 'franklin.learning-health.local.v1' || typeof parsed.counts !== 'object') {
        return emptyHealth();
      }
      const clean = emptyHealth();
      for (const metric of observedMetricAllowlist) {
        const count = Number(parsed.counts[metric]);
        clean.counts[metric] = Number.isSafeInteger(count) && count >= 0 ? Math.min(count, 999999) : 0;
      }
      return clean;
    } catch {
      return emptyHealth();
    }
  };

  const renderHealth = () => {
    const root = q('[data-learning-health-summary]');
    if (!root) return;
    const health = readHealth();
    const values = {
      packets: health.counts.packet_created,
      sources: health.counts.official_source_open,
      blocks: health.counts.privacy_block
    };
    for (const [key, value] of Object.entries(values)) {
      const target = q(`[data-learning-health="${key}"]`, root);
      if (target) target.textContent = value.toLocaleString(pageLanguage === 'es' ? 'es-US' : 'en-US');
    }
  };

  const recordObserved = metric => {
    if (!observedMetricAllowlist.has(metric)) return;
    try {
      const health = readHealth();
      health.counts[metric] = Math.min(health.counts[metric] + 1, 999999);
      localStorage.setItem(healthKey, JSON.stringify(health));
    } catch {
      // Storage may be unavailable. Learning tools still work without telemetry.
    }
    document.dispatchEvent(new CustomEvent('franklin:learning-observed', { detail: { metric } }));
    renderHealth();
  };

  if (document.body.hasAttribute('data-learning-hub')) recordObserved('hub_open');

  const privacyPatterns = [
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
    /(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/,
    /\b\d{3}-\d{2}-\d{4}\b/,
    /\b(?:student|pupil|child|learner|estudiante|alumno|alumna|niño|niña)\s+(?:name|named|id|number|email|phone|nombre|identificaci[oó]n|correo|tel[eé]fono)\b/i,
    /\b(?:password|passcode|login|username|contrase[nñ]a|c[oó]digo de acceso|usuario)\b/i,
    /\b(?:IEP|504 plan|504 record|individualized education program|plan 504|programa educativo individualizado)\b/i,
    /\b(?:diagnosis|diagnosed|medical record|health record|disability record|therapy record|diagn[oó]stico|expediente m[eé]dico|registro de salud|discapacidad)\b/i,
    /\b(?:discipline record|suspension record|expulsion record|expediente disciplinario|suspensi[oó]n|expulsi[oó]n)\b/i,
    /\b(?:report card|transcript|student grade|test score|assessment score|boleta de calificaciones|expediente acad[eé]mico|nota del estudiante|puntaje)\b/i,
    /\b(?:date of birth|birth date|fecha de nacimiento|home address|street address|direcci[oó]n particular)\b/i,
    /\b(?:answer this test|take this test|complete my exam|restricted test|test answer key|contesta este examen|haz mi examen|clave restringida)\b/i,
    /\b(?:my student is|my child is|mi estudiante es|mi hijo se llama|mi hija se llama)\s+[A-ZÁÉÍÓÚÑ][\p{L}'’-]+/iu
  ];

  const cleanTopic = value => String(value || '').replace(/\s+/g, ' ').trim().slice(0, 80);
  const privacyCheck = value => {
    const clean = cleanTopic(value);
    if (!clean) return { ok: false, empty: true, value: '' };
    return { ok: !privacyPatterns.some(pattern => pattern.test(clean)), empty: false, value: clean };
  };

  const createElement = (tag, attributes = {}, value = '') => {
    const element = document.createElement(tag);
    for (const [name, attributeValue] of Object.entries(attributes)) {
      if (name === 'class') element.className = attributeValue;
      else element.setAttribute(name, attributeValue);
    }
    if (value) element.textContent = value;
    return element;
  };

  const setupResources = root => {
    const grid = q('[data-learning-resource-grid]', root);
    if (!grid) return;
    const search = q('[data-learning-resource-search]', root);
    const audience = q('[data-learning-resource-audience]', root);
    const summary = q('[data-learning-resource-summary]', root);
    grid.textContent = text.resourcesLoading;
    let resources = [];
    let reviewedOn = '';

    const render = () => {
      const needle = String(search?.value || '').trim().toLowerCase();
      const chosenAudience = String(audience?.value || '');
      const filtered = resources.filter(resource => {
        const searchable = `${resource.name} ${resource.nameEs} ${resource.summary} ${resource.summaryEs} ${resource.topics.join(' ')}`.toLowerCase();
        return (!needle || searchable.includes(needle)) && (!chosenAudience || resource.audiences.includes(chosenAudience));
      });
      grid.replaceChildren();
      if (!filtered.length) {
        grid.append(createElement('p', { class: 'learning-empty' }, text.resourcesEmpty));
      }
      for (const resource of filtered) {
        const card = createElement('article', { class: 'card learning-resource-card' });
        const heading = createElement('h3', {}, pageLanguage === 'es' ? resource.nameEs : resource.name);
        const description = createElement('p', {}, pageLanguage === 'es' ? resource.summaryEs : resource.summary);
        const badges = createElement('div', { class: 'learning-source-row' });
        badges.append(
          createElement('span', { class: 'learning-source-badge' }, text.source),
          createElement('span', { class: 'learning-source-badge' }, resource.area)
        );
        const currentness = createElement('p', { class: 'meta' }, `${text.reviewed}: ${resource.reviewedOn} · ${text.recheck}.`);
        const actions = createElement('div', { class: 'actions' });
        const link = createElement('a', {
          class: 'button small',
          href: resource.url,
          target: '_blank',
          rel: 'noopener'
        }, text.open);
        link.addEventListener('click', () => recordObserved('official_source_open'));
        actions.append(link);
        card.append(heading, description, badges, currentness, actions);
        grid.append(card);
      }
      if (summary) {
        const prefix = pageLanguage === 'es' ? 'Mostrando' : 'Showing';
        const suffix = pageLanguage === 'es' ? 'puntos de partida verificados' : 'verified starting points';
        summary.textContent = `${prefix} ${filtered.length} de ${resources.length} ${suffix} · ${text.reviewed}: ${reviewedOn}.`;
      }
    };

    fetch('/data/learning-resources.json', { credentials: 'same-origin' })
      .then(response => {
        if (!response.ok) throw new Error('catalog unavailable');
        return response.json();
      })
      .then(payload => {
        if (payload.schemaVersion !== 'franklin.learning-resources.v1' || !Array.isArray(payload.resources)) {
          throw new Error('catalog invalid');
        }
        resources = payload.resources.filter(resource => resource.officialSource === true && resource.affiliationClaimed === false);
        reviewedOn = payload.reviewedOn;
        render();
      })
      .catch(() => {
        grid.textContent = text.resourcesError;
        if (summary) summary.textContent = '';
      });

    search?.addEventListener('input', render);
    audience?.addEventListener('change', render);
  };

  qa('[data-learning-resources]').forEach(setupResources);

  const downloadJson = (filename, payload) => {
    const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const studio = q('[data-learning-studio]');
  if (studio) {
    const form = q('[data-learning-form]', studio);
    const modeButtons = qa('[data-learning-mode]', studio);
    const panels = qa('[data-learning-panel]', studio);
    const output = q('[data-learning-output]', studio);
    const outputStatus = q('[data-learning-output-status]', studio);
    const copyButton = q('[data-learning-copy]', studio);
    const downloadButton = q('[data-learning-download]', studio);
    const printButton = q('[data-learning-print]', studio);
    const privacyStatus = q('[data-learning-privacy-status]', studio);
    let activeMode = 'teacher';
    let packet = null;

    const modeLabels = {
      en: { teacher: 'Teacher / tutor', learner: 'Adult learner / parent-supervised practice', provider: 'Learning provider readiness' },
      es: { teacher: 'Docente / tutor', learner: 'Aprendiz adulto / práctica supervisada', provider: 'Preparación del proveedor educativo' }
    }[pageLanguage];

    const field = name => q(`[name="${name}"]`, form);
    const value = name => String(field(name)?.value || '').trim();
    const values = name => qa(`[name="${name}"]:checked`, form).map(input => input.value);
    const setButtons = enabled => {
      copyButton.disabled = !enabled;
      downloadButton.disabled = !enabled;
      printButton.disabled = !enabled;
    };
    const resetOutput = () => {
      packet = null;
      output.textContent = text.chooseMode;
      outputStatus.textContent = pageLanguage === 'es' ? 'Sin enviar · solo en este dispositivo' : 'Not submitted · this device only';
      setButtons(false);
    };

    const showMode = mode => {
      if (!['teacher', 'learner', 'provider'].includes(mode)) return;
      activeMode = mode;
      for (const button of modeButtons) {
        const selected = button.dataset.learningMode === mode;
        button.setAttribute('aria-selected', String(selected));
        button.tabIndex = selected ? 0 : -1;
      }
      for (const panel of panels) panel.hidden = panel.dataset.learningPanel !== mode;
      q(`[data-learning-panel="${mode}"]`, studio)?.focus({ preventScroll: true });
      recordObserved(`mode_${mode}_open`);
      resetOutput();
      updatePrivacy();
    };

    modeButtons.forEach((button, index) => {
      button.addEventListener('click', () => showMode(button.dataset.learningMode));
      button.addEventListener('keydown', event => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const nextIndex = event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? modeButtons.length - 1
            : (index + (event.key === 'ArrowRight' ? 1 : -1) + modeButtons.length) % modeButtons.length;
        modeButtons[nextIndex].focus();
        showMode(modeButtons[nextIndex].dataset.learningMode);
      });
    });

    const activeTopicInput = () => field(`${activeMode}-topic`);
    const updatePrivacy = () => {
      const check = privacyCheck(activeTopicInput()?.value);
      privacyStatus.classList.toggle('is-blocked', !check.ok && !check.empty);
      privacyStatus.textContent = check.empty ? text.privacyEmpty : check.ok ? text.privacyClear : text.privacyBlocked;
      return check;
    };

    for (const name of ['teacher-topic', 'learner-topic', 'provider-topic']) {
      field(name)?.addEventListener('input', updatePrivacy);
    }

    const familyDraft = planLanguage => {
      if (planLanguage === 'none') return [];
      if (planLanguage === 'spanish') {
        return [
          '',
          'BORRADOR BREVE PARA LA FAMILIA',
          'Hoy practicamos una idea general con ejemplos y una verificación breve. Pregunte al aprendiz qué estrategia usó y qué le gustaría practicar después. Confirme las instrucciones o fechas vigentes directamente con el docente o programa.'
        ];
      }
      return [
        '',
        'BILINGUAL FAMILY DRAFT / BORRADOR BILINGÜE PARA LA FAMILIA',
        'EN: Today we practiced one broad idea with examples and a short check. Ask the learner which strategy helped and what they want to practice next.',
        'ES: Hoy practicamos una idea general con ejemplos y una verificación breve. Pregunte al aprendiz qué estrategia le ayudó y qué quiere practicar después.',
        'Confirm current instructions or dates directly with the teacher or program. / Confirme las instrucciones o fechas vigentes directamente con el docente o programa.'
      ];
    };

    const teacherPacket = topic => {
      const subject = value('teacher-subject');
      const audience = value('teacher-audience');
      const duration = value('teacher-duration');
      const format = value('teacher-format');
      const supports = values('teacher-support[]');
      const standardState = value('teacher-standard');
      const planLanguage = value('teacher-family-language');
      if (!subject || !audience || !duration || !format) return null;
      const lines = pageLanguage === 'es'
        ? [
            'PAQUETE DE PLANIFICACIÓN PARA DOCENTE / TUTOR', '',
            `Tema general: ${topic}`, `Materia: ${subject}`, `Público general: ${audience}`, `Duración: ${duration}`, `Formato: ${format}`, '',
            'OBJETIVO BORRADOR',
            `Al terminar, el grupo podrá explicar ${topic}, practicarlo con un ejemplo nuevo y describir la estrategia utilizada.`, '',
            'SECUENCIA SUGERIDA',
            '1. Activación: conecte el tema con conocimiento previo sin pedir historias privadas.',
            '2. Enseñanza breve: modele una explicación clara y un ejemplo original.',
            '3. Práctica guiada: ofrezca una pista a la vez y pida que el aprendiz explique su razonamiento.',
            '4. Práctica independiente o colaborativa: use una pregunta nueva, no una evaluación restringida.',
            '5. Verificación: pida una explicación, ejemplo o reflexión breve; no convierta esto en una calificación automática.',
            '6. Cierre: anote qué volver a enseñar y qué comprobar con la fuente responsable.'
          ]
        : [
            'TEACHER / TUTOR PLANNING PACKET', '',
            `Broad topic: ${topic}`, `Subject: ${subject}`, `Broad audience: ${audience}`, `Time: ${duration}`, `Format: ${format}`, '',
            'DRAFT OBJECTIVE',
            `By the end, learners can explain ${topic}, practice it with a new example, and describe the strategy they used.`, '',
            'SUGGESTED SEQUENCE',
            '1. Activate: connect the topic to prior knowledge without asking for private stories.',
            '2. Teach briefly: model a plain-language explanation and one original example.',
            '3. Guide practice: give one hint at a time and ask the learner to explain their reasoning.',
            '4. Practice independently or together: use a new prompt, not a restricted assessment.',
            '5. Check understanding: ask for an explanation, example, or short reflection; do not turn this into an automated grade.',
            '6. Close: note what to reteach and what to verify with the responsible source.'
          ];
      lines.push('', pageLanguage === 'es' ? 'APOYOS SELECCIONADOS' : 'SELECTED SUPPORTS');
      (supports.length ? supports : [pageLanguage === 'es' ? 'Ninguno seleccionado' : 'None selected']).forEach(item => lines.push(`- ${item}`));
      lines.push('', pageLanguage === 'es' ? 'VERIFICACIONES Y LÍMITES' : 'CHECKS AND LIMITS');
      lines.push(
        standardState === 'verified'
          ? pageLanguage === 'es'
            ? '- El usuario indicó que tiene una fuente vigente de estándares de Tennessee. Cite el código y texto exactos desde esa fuente; Franklin no infiere alineación.'
            : '- The user indicated they have a current Tennessee standards source. Cite its exact code and wording from that source; Franklin does not infer alignment.'
          : pageLanguage === 'es'
            ? '- No se afirmó alineación con estándares. Verifique el documento vigente de Tennessee si necesita esa afirmación.'
            : '- No standards alignment is claimed. Verify the current Tennessee document if that claim is needed.',
        pageLanguage === 'es'
          ? '- Use materiales originales, con licencia o de dominio público; no reproduzca cuadernos, bancos de respuestas ni pruebas restringidas.'
          : '- Use original, licensed, or public-domain material; do not reproduce copyrighted workbooks, answer banks, or restricted tests.',
        pageLanguage === 'es'
          ? '- Las decisiones sobre calificación, adaptación, colocación o servicios permanecen con el docente, familia y organización responsables.'
          : '- Grading, accommodation, placement, and service decisions stay with the responsible educator, family, and organization.'
      );
      lines.push(...familyDraft(planLanguage));
      return { lines, selections: { subject, audience, duration, format, supports, standardState, planLanguage } };
    };

    const learnerPacket = topic => {
      const subject = value('learner-subject');
      const audience = value('learner-audience');
      const goal = value('learner-goal');
      const method = value('learner-method');
      if (!subject || !audience || !goal || !method) return null;
      const lines = pageLanguage === 'es'
        ? [
            'PAQUETE DE PRÁCTICA GUIADA', '',
            `Tema general: ${topic}`, `Área: ${subject}`, `Uso: ${audience}`, `Meta: ${goal}`, `Método preferido: ${method}`, '',
            'CICLO DE APRENDIZAJE',
            `1. Enseñar: explique ${topic} en palabras sencillas y defina una idea clave.`,
            '2. Mostrar: cree un ejemplo nuevo y explique cada paso.',
            '3. Intentar: resuelva una práctica parecida sin usar una evaluación activa.',
            '4. Pista: si se atasca, revele solo el siguiente paso o haga una pregunta guía.',
            '5. Verificar: explique por qué funciona la estrategia y pruebe un ejemplo distinto.',
            '6. Reflexionar: anote qué fue claro, qué necesita práctica y cuál será el próximo paso.', '',
            'LÍMITES',
            '- Esto enseña y guía práctica; no completa trabajo evaluado, exámenes ni pruebas restringidas.',
            '- No se guarda un perfil, historial, calificación ni resultado del aprendiz.',
            '- Para menores, un padre, tutor o educador adulto debe supervisar el uso.',
            '- Verifique fechas, requisitos, programas y recursos directamente en la fuente responsable.'
          ]
        : [
            'GUIDED PRACTICE PACKET', '',
            `Broad topic: ${topic}`, `Area: ${subject}`, `Use: ${audience}`, `Goal: ${goal}`, `Preferred method: ${method}`, '',
            'LEARNING LOOP',
            `1. Teach: explain ${topic} in plain language and define one key idea.`,
            '2. Show: create one new example and talk through each step.',
            '3. Try: work a similar practice prompt that is not an active assessment.',
            '4. Hint: if stuck, reveal only the next step or ask one guiding question.',
            '5. Check: explain why the strategy works and try a different example.',
            '6. Reflect: note what was clear, what needs practice, and the next small step.', '',
            'BOUNDARIES',
            '- This teaches and guides practice; it does not complete graded work, exams, or restricted tests.',
            '- No learner profile, history, grade, score, or outcome is stored.',
            '- For minors, a parent, guardian, or adult educator must supervise use.',
            '- Verify dates, requirements, programs, and resources directly with the responsible source.'
          ];
      return { lines, selections: { subject, audience, goal, method } };
    };

    const providerPacket = topic => {
      const providerType = value('provider-type');
      const audience = value('provider-audience');
      const format = value('provider-format');
      const language = value('provider-language');
      const evidence = value('provider-evidence');
      if (!providerType || !audience || !format || !language || !evidence) return null;
      const lines = pageLanguage === 'es'
        ? [
            'PAQUETE DE PREPARACIÓN DEL PERFIL EDUCATIVO', '',
            `Enfoque general: ${topic}`, `Tipo de proveedor: ${providerType}`, `Público general: ${audience}`, `Formato: ${format}`, `Idioma: ${language}`, '',
            'CAMPOS PÚBLICOS PARA PREPARAR',
            '1. Vincule el ID de perfil público existente de Franklin; no cree un ID de estudiante o familia.',
            '2. Confirme el nombre público y tipo de proveedor desde una fuente de primera parte.',
            '3. Enumere materias, grupos de edad generales, formato, idiomas y área de servicio.',
            '4. Publique únicamente datos de accesibilidad que el proveedor haya hecho públicos; no publique diagnósticos ni adaptaciones de un aprendiz.',
            '5. Marque horarios, disponibilidad, tarifas y contactos para volver a confirmarlos en la fuente original.',
            '6. Adjunte una URL HTTPS y fecha de revisión para cada afirmación material.', '',
            'EVIDENCIA Y AFILIACIÓN',
            `- Estado de evidencia elegido: ${evidence}.`,
            '- No afirme relación con una escuela, distrito, biblioteca, gobierno u otra organización sin una fuente directa que la documente.',
            '- La aparición en el directorio, el orden y el pago no son recomendaciones, clasificaciones ni prueba de idoneidad.',
            '- No incluya nombres de estudiantes, inscripciones, calificaciones, expedientes, resultados ni testimonios de menores.', '',
            'PRÓXIMO PASO',
            '- Revise el esquema público de perfil educativo de Franklin y prepare únicamente hechos verificables. Nada se envió desde esta herramienta.'
          ]
        : [
            'LEARNING PROVIDER PROFILE READINESS PACKET', '',
            `Broad focus: ${topic}`, `Provider type: ${providerType}`, `Broad audience: ${audience}`, `Format: ${format}`, `Language: ${language}`, '',
            'PUBLIC FIELDS TO PREPARE',
            '1. Link the existing Franklin public profile ID; never create a student or household identifier.',
            '2. Confirm the public display name and provider type from a first-party source.',
            '3. List subjects, broad age bands, format, languages, and service area.',
            '4. Publish only accessibility facts the provider has made public; never publish a learner diagnosis or accommodation record.',
            '5. Mark schedules, availability, fees, and contacts for recheck at the original source.',
            '6. Attach an HTTPS source URL and review date for every material claim.', '',
            'EVIDENCE AND AFFILIATION',
            `- Selected evidence state: ${evidence}.`,
            '- Do not claim a relationship with a school, district, library, government, or other organization without a direct source documenting it.',
            '- Directory appearance, order, and payment are not endorsements, rankings, or proof of fit.',
            '- Do not include student names, enrollment, grades, records, outcomes, or minor testimonials.', '',
            'NEXT STEP',
            '- Review the public Franklin learning-provider schema and prepare verifiable facts only. Nothing was submitted from this tool.'
          ];
      return { lines, selections: { providerType, audience, format, language, evidence } };
    };

    form.addEventListener('submit', event => {
      event.preventDefault();
      const check = updatePrivacy();
      if (!check.ok) {
        if (!check.empty) recordObserved('privacy_block');
        output.textContent = check.empty ? text.required : text.privacyBlocked;
        output.focus();
        return;
      }
      const built = activeMode === 'teacher'
        ? teacherPacket(check.value)
        : activeMode === 'learner'
          ? learnerPacket(check.value)
          : providerPacket(check.value);
      if (!built) {
        output.textContent = text.required;
        output.focus();
        return;
      }
      const privacyLines = pageLanguage === 'es'
        ? [
            '', 'PRIVACIDAD Y ESTADO',
            '- Preparado en este dispositivo; no enviado, cargado ni guardado por Franklin.',
            '- Sin IA externa, cuenta nueva, perfil de menor, historial persistente ni decisión automatizada.',
            '- Los contadores opcionales del dispositivo registran solo acciones generales, nunca el tema ni el contenido del paquete.',
            '- Resultado de aprendizaje inferido: ninguno.'
          ]
        : [
            '', 'PRIVACY AND STATUS',
            '- Prepared on this device; not submitted, uploaded, or saved by Franklin.',
            '- No external AI, new account, minor profile, persistent history, or automated decision.',
            '- Optional device counters record only broad tool actions, never the topic or packet content.',
            '- Learning outcome inferred: none.'
          ];
      built.lines.push(...privacyLines);
      packet = {
        schemaVersion: 'franklin.learning-packet.local.v1',
        state: 'PREPARED_ON_DEVICE_NOT_SUBMITTED',
        edition: 'FRANKLIN_TN',
        assistantMode: 'learning',
        toolMode: activeMode,
        modeLabel: modeLabels[activeMode],
        broadTopic: check.value,
        selections: built.selections,
        packetText: built.lines.join('\n'),
        privacy: {
          networkSubmission: false,
          browserStorage: false,
          externalAi: false,
          fileUpload: false,
          minorProfile: false,
          inferredLearningOutcome: false
        }
      };
      output.textContent = packet.packetText;
      outputStatus.textContent = pageLanguage === 'es' ? 'Preparado · no enviado' : 'Prepared · not submitted';
      setButtons(true);
      recordObserved('packet_created');
      output.focus();
    });

    form.addEventListener('reset', () => setTimeout(() => {
      resetOutput();
      updatePrivacy();
    }, 0));

    copyButton.addEventListener('click', async () => {
      if (!packet) return;
      try {
        await navigator.clipboard.writeText(packet.packetText);
        copyButton.textContent = text.copied;
        recordObserved('packet_copied');
        setTimeout(() => { copyButton.textContent = text.copy; }, 1800);
      } catch {
        output.focus();
      }
    });
    downloadButton.addEventListener('click', () => {
      if (!packet) return;
      downloadJson(text.downloadName, packet);
      recordObserved('packet_downloaded');
    });
    printButton.addEventListener('click', () => {
      if (!packet) return;
      recordObserved('packet_printed');
      window.print();
    });

    resetOutput();
    updatePrivacy();
    const requestedMode = location.hash.slice(1);
    showMode(['teacher', 'learner', 'provider'].includes(requestedMode) ? requestedMode : 'teacher');
  }

  const clearHealth = q('[data-learning-health-clear]');
  clearHealth?.addEventListener('click', () => {
    try { localStorage.removeItem(healthKey); } catch { /* no-op */ }
    renderHealth();
    const status = q('[data-learning-health-clear-status]');
    if (status) status.textContent = text.countersCleared;
  });
  renderHealth();
})();

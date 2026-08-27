// ─── MATERIAL ───
TOUR_STEPS.material = [
  {
    element: '#stepMateriaTema',
    popover: {
      title: 'Materia y tema',
      description: 'Escribi sobre que queres practicar. Cuanto mas especifico el tema, mejores preguntas genera la IA.'
    }
  },
  {
    element: '#chipsRow',
    popover: {
      title: 'Atajos rapidos',
      description: 'Toca una de estas para completar la materia sin escribir.'
    }
  },
  {
    element: '.qty-row',
    popover: {
      title: 'Cuantas preguntas',
      description: 'Elegi entre 5 y 20 — mas preguntas, mas XP si las acertas todas.'
    }
  },
  {
    element: '#stepGeminiKey',
    popover: {
      title: 'Tu clave de Gemini (opcional)',
      description: 'No es obligatoria — sin clave se usa la IA compartida de StudyBuddy. Si queres la tuya, toca el boton de ayuda de al lado para conseguir una gratis.'
    }
  },
  {
    element: '#btnGen',
    popover: {
      title: 'Listo para generar',
      description: 'Con materia y tema completos, toca aca y Mindy arma tu actividad.'
    }
  }
];

SCREENS.material = (function() {
  var _stepTimer = null;

  function genErrorMessage(err) {
    if (err && err.displayMessage) return err.displayMessage;
    var t = err && err.errorType;
    if (t === 'invalid_key') return 'Tu clave de Gemini no funciona en este momento (puede estar mal escrita, vencida, o sin cuota disponible). Revisala e intenta de nuevo, o borrala para usar la IA compartida de StudyBuddy.';
    if (t === 'capacity') return 'No hay disponibilidad en nuestra API compartida debido a carga excesiva de preguntas. Podes ingresar tu clave personal de Gemini para continuar.';
    var motivo = err && err.message ? err.message : String(err);
    return 'Hubo un problema generando las preguntas (' + motivo + '). Intenta de nuevo en un momento.';
  }

  function showGenError(err) {
    var msgEl = document.getElementById('genErrorMsg');
    if (msgEl) msgEl.textContent = genErrorMessage(err);
    var ov = document.getElementById('genErrorOv');
    if (ov) ov.classList.add('show');
    var t = err && err.errorType;
    if (t === 'invalid_key' || t === 'capacity') {
      var ak = document.getElementById('inpAiKey');
      if (ak) { ak.focus(); ak.scrollIntoView({behavior:'smooth', block:'center'}); }
    }
  }

  return {
    init: function() {
      // Nav
      try { document.getElementById('matXP').textContent = APP.user ? APP.user.xp : 0; } catch(e) {}
      try {
        var na = document.getElementById('matAv');
        if (na) na.innerHTML = APP.user ? (AV_EMOJI[APP.user.avatar] || '&#x1F423;') : '&#x1F423;';
      } catch(e) {}
      // Pill del metodo
      try {
        var pill = document.getElementById('matPill');
        if (pill) pill.innerHTML = METHOD_LABEL[APP.session.method] || APP.session.method;
      } catch(e) {}
      // Restaurar campos
      try { var si = document.getElementById('inpSubj'); if (si) si.value = APP.session.subject || ''; } catch(e) {}
      try { var ti = document.getElementById('inpTopic'); if (ti) ti.value = APP.session.topic || ''; } catch(e) {}
      try { var ak = document.getElementById('inpAiKey'); if (ak) ak.value = getAiKey(); } catch(e) {}
      this.renderCount();
      this.calcProg();
      runTutorial('material');
    },
    openGeminiHelp: function() {
      var m = document.getElementById('geminiHelpModal'); if (m) m.classList.add('open');
    },
    closeGeminiHelp: function() {
      var m = document.getElementById('geminiHelpModal'); if (m) m.classList.remove('open');
    },
    closeGeminiHelpOv: function(e) { if (e.target === document.getElementById('geminiHelpModal')) this.closeGeminiHelp(); },
    saveKey: function(value) {
      saveAiKey(value);
    },
    renderCount: function() {
      var n = clampQuestionCount(APP.session.questionCount);
      APP.session.questionCount = n;
      var el = document.getElementById('qCountEl');
      if (el) el.textContent = n;
    },
    nudgeCount: function(delta) {
      APP.session.questionCount = clampQuestionCount((APP.session.questionCount || Q_MIN) + delta);
      saveSession();
      this.renderCount();
    },
    destroy: function() {
      if (_stepTimer) { clearInterval(_stepTimer); _stepTimer = null; }
      var ov = document.getElementById('loadOv'); if (ov) ov.classList.remove('show');
      var eov = document.getElementById('genErrorOv'); if (eov) eov.classList.remove('show');
    },
    retryGenerate: function() {
      var eov = document.getElementById('genErrorOv'); if (eov) eov.classList.remove('show');
      this.generate();
    },
    setChip: function(el, name) {
      var inp = document.getElementById('inpSubj'); if (inp) inp.value = name;
      var chips = document.querySelectorAll('.chip');
      for (var i = 0; i < chips.length; i++) chips[i].classList.remove('on');
      el.classList.add('on');
      APP.session.subject = name;
      this.calcProg();
    },
    calcProg: function() {
      var subj  = (document.getElementById('inpSubj')  || {}).value || '';
      var topic = (document.getElementById('inpTopic') || {}).value || '';
      var pts = 0;
      if (subj.trim()) pts += 50;
      if (topic.trim()) pts += 50;
      try { document.getElementById('progFill').style.width = pts + '%'; } catch(e) {}
      try { document.getElementById('progLbl').textContent = pts < 100 ? 'Completa materia y tema (' + pts + '%)' : 'Listo para generar!'; } catch(e) {}
      var bg = document.getElementById('btnGen');
      if (bg) { if (pts >= 100) bg.classList.add('on'); else bg.classList.remove('on'); }
    },
    generate: function() {
      var subj  = (document.getElementById('inpSubj')  || {}).value || '';
      var topic = (document.getElementById('inpTopic') || {}).value || '';
      if (!subj.trim() || !topic.trim()) { toast('Completa la materia y el tema'); return; }
      APP.session.subject = subj;
      APP.session.topic   = topic;
      var count = clampQuestionCount(APP.session.questionCount);
      APP.session.questionCount = count;
      saveSession();
      var eov = document.getElementById('genErrorOv'); if (eov) eov.classList.remove('show');
      var ov = document.getElementById('loadOv'); if (ov) ov.classList.add('show');
      for (var i = 0; i < 4; i++) { var el = document.getElementById('st' + i); if (el) el.classList.remove('done'); }
      var si = 0;
      _stepTimer = setInterval(function() {
        var el = document.getElementById('st' + si); if (el) el.classList.add('done');
        si++; if (si >= 4) { clearInterval(_stepTimer); _stepTimer = null; }
      }, 700);
      var method = APP.session.method;
      // POC: solo materia + tema. Apuntes/TXT quedan como proxima mejora (tokens).
      var promptMap = {
        flash:
          'Eres un asistente educativo. Genera exactamente ' + count + ' flashcards sobre el tema "' + topic + '" de la materia "' + subj + '".' +
          '\nResponde UNICAMENTE con un array JSON valido, sin texto extra, sin backticks, sin markdown. Formato exacto:' +
          '\nNo uses comillas dobles dentro de los textos; usa comillas simples si hace falta.' +
          '\n[{"question":"pregunta","answer":"respuesta completa","explanation":"explicacion breve de por que es correcta"}]',
        rapid:
          'Eres un asistente educativo. Genera exactamente ' + count + ' preguntas de opcion multiple, cortas y aptas para responder en 10 segundos, sobre el tema "' + topic + '" de la materia "' + subj + '".' +
          '\nCada pregunta debe tener 4 opciones donde solo una es correcta. El campo "correct" es el indice 0-3 de la opcion correcta.' +
          '\nNo uses comillas dobles dentro de los textos; usa comillas simples si hace falta.' +
          '\nResponde UNICAMENTE con un array JSON valido, sin texto extra, sin backticks, sin markdown. Formato exacto:' +
          '\n[{"question":"pregunta","options":["opcion A","opcion B","opcion C","opcion D"],"correct":0,"explanation":"por que la opcion correcta es correcta"}]',
        quiz:
          'Eres un asistente educativo. Genera exactamente ' + count + ' preguntas de opcion multiple sobre el tema "' + topic + '" de la materia "' + subj + '".' +
          '\nCada pregunta debe tener 4 opciones donde solo una es correcta. El campo "correct" es el indice 0-3 de la opcion correcta.' +
          '\nNo uses comillas dobles dentro de los textos; usa comillas simples si hace falta.' +
          '\nResponde UNICAMENTE con un array JSON valido, sin texto extra, sin backticks, sin markdown. Formato exacto:' +
          '\n[{"question":"pregunta","options":["opcion A","opcion B","opcion C","opcion D"],"correct":0,"explanation":"por que la opcion correcta es correcta"}]',
        complete:
          'Eres un asistente educativo. Genera exactamente ' + count + ' oraciones para completar sobre el tema "' + topic + '" de la materia "' + subj + '".' +
          '\nEn cada oracion usa exactamente _____ (cinco guiones bajos) donde va la palabra o frase que falta.' +
          '\nResponde UNICAMENTE con un array JSON valido, sin texto extra, sin backticks, sin markdown. Formato exacto:' +
          '\nNo uses comillas dobles dentro de los textos; usa comillas simples si hace falta.' +
          '\n[{"sentence":"La _____ fue la causa principal de...","answer":"respuesta exacta","explanation":"explicacion breve"}]'
      };
      var prompt = promptMap[method] || promptMap.quiz;
      var keyEl = document.getElementById('inpAiKey');
      if (keyEl) saveAiKey(keyEl.value);
      callAI(prompt, method).then(function(data) {
        var items = fitQuestionCount(normalizeAiItems(method, data), count);
        if (!items || !items.length) {
          var emptyErr = new Error('sin preguntas validas');
          emptyErr.errorType = 'unknown';
          emptyErr.displayMessage = 'La IA no genero preguntas validas para este tema. Intenta de nuevo o proba con otro tema.';
          throw emptyErr;
        }
        if (items.length < count) {
          toast('Se generaron ' + items.length + ' de ' + count + ' preguntas solicitadas', 4000);
        }
        console.log('[StudyBuddy] IA genero', items.length, 'preguntas:', items);
        APP.activity = items;
        // Red de seguridad: si algun bug futuro dejara APP.activity vacio pese a los chequeos de arriba,
        // no entrar a jugar sin preguntas.
        if (!APP.activity || !APP.activity.length) {
          APP.activity = getDemoData(method, subj, topic, count);
        }
        showScreen('juego');
      }).catch(function(err) {
        if (_stepTimer) { clearInterval(_stepTimer); _stepTimer = null; }
        var ov = document.getElementById('loadOv'); if (ov) ov.classList.remove('show');
        console.error('[StudyBuddy] Generacion fallo:', err && err.message, err);
        showGenError(err);
      });
    }
  };
})();

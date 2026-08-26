// ─── MATERIAL ───
SCREENS.material = (function() {
  var _stepTimer = null;

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
    },
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
        var items = fitQuestionCount(normalizeAiItems(method, data), count, method, subj, topic);
        if (!items || !items.length) throw new Error('El array de preguntas vino vacio');
        console.log('[StudyBuddy] IA genero', items.length, 'preguntas:', items);
        APP.activity = items;
        showScreen('juego');
      }).catch(function(err) {
        if (err && err.isCapacity) {
          if (_stepTimer) { clearInterval(_stepTimer); _stepTimer = null; }
          var ov = document.getElementById('loadOv'); if (ov) ov.classList.remove('show');
          toast('No hay disponibilidad en nuestra API debido a carga excesiva de preguntas. Podes ingresar tu clave personal de Gemini para continuar.', 5000);
          var ak = document.getElementById('inpAiKey');
          if (ak) { ak.focus(); ak.scrollIntoView({behavior:'smooth', block:'center'}); }
          return;
        }
        var msg = err && err.message ? err.message : String(err);
        console.error('[StudyBuddy] Gemini fallo:', msg, err);
        toast('IA fallo (' + msg + ') — usando preguntas de demo', 4000);
        APP.activity = getDemoData(method, subj, topic, count);
        showScreen('juego');
      });
    }
  };
})();

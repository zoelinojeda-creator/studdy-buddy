// ─── JUEGO ───
SCREENS.juego = (function() {
  var RAPID_MS = 10000;
  var idx = 0, correct = 0, wrong = 0, score = 0, combo = 0;
  var _rapidTimer = null;
  var _rapidDeadline = 0;
  var _answered = false;
  var _advanceTimer = null;

  return {
    init: function() {
      idx = 0; correct = 0; wrong = 0; score = 0; combo = 0;
      _answered = false;
      stopRapidTimer();
      var ht = document.getElementById('jTitle');
      if (ht) ht.innerHTML = (METHOD_LABEL[APP.session.method] || 'Actividad') + ' &mdash; ' + (APP.session.subject || '');
      updateComboHud();
      buildDots(); renderQ();
    },
    destroy: function() { stopRapidTimer(); clearAdvanceTimer(); },
    _idx: function() { return idx; },
    advance: function(knew) {
      // flashcard
      if (knew) { correct++; score += 10; setDot(idx, 'ok'); }
      else { wrong++; setDot(idx, 'fail'); }
      idx++; renderQ();
    },
    quizAns: function(i) {
      if (_answered) return;
      _answered = true;
      stopRapidTimer();
      var it = APP.activity[idx], cor = it.correct;
      var opts = document.querySelectorAll('.opt');
      for (var j = 0; j < opts.length; j++) opts[j].disabled = true;
      var isRapid = APP.session.method === 'rapid';
      if (i === cor) {
        opts[i].classList.add('ok');
        correct++;
        if (isRapid) {
          combo++;
          score += 10 + 2 * combo;
          toast('Racha x' + combo);
        } else {
          score += 10;
        }
        setDot(idx, 'ok');
      } else {
        opts[i].classList.add('fail');
        if (opts[cor]) opts[cor].classList.add('ok');
        wrong++;
        combo = 0;
        setDot(idx, 'fail');
      }
      updateComboHud();
      var fb = document.getElementById('qfb'); if (fb) fb.classList.add('show');
      var sc = document.getElementById('scoreEl'); if (sc) sc.textContent = score;
      if (isRapid) {
        scheduleAdvance(1200);
      } else {
        var bn = document.getElementById('bnx'); if (bn) bn.classList.add('show');
      }
    },
    nextQ: function() { idx++; renderQ(); },
    verifyC: function() {
      var inp = document.getElementById('cInp'); if (!inp || inp.disabled) return;
      var it = APP.activity[idx];
      var ua = inp.value.trim();
      if (!ua) { toast('Escribe una respuesta'); return; }
      var ok = answersMatch(ua, it.answer);
      var fb = document.getElementById('qfb');
      if (ok) { inp.style.borderColor='var(--accent3)'; inp.value=it.answer; correct++; score+=10; setDot(idx,'ok'); toast('Correcto! &#x1F389;'); }
      else { inp.style.borderColor='var(--accent2)'; wrong++; setDot(idx,'fail'); toast('Respuesta: '+it.answer); }
      if (fb) fb.classList.add('show');
      inp.disabled = true;
      scheduleAdvance(1600);
    },
    getResults: function() { return { correct:correct, wrong:wrong, total:APP.activity.length, score:score }; }
  };

  function isRapid() { return APP.session.method === 'rapid'; }

  function clearAdvanceTimer() {
    if (_advanceTimer) { clearTimeout(_advanceTimer); _advanceTimer = null; }
  }

  function scheduleAdvance(ms) {
    clearAdvanceTimer();
    _advanceTimer = setTimeout(function() {
      _advanceTimer = null;
      idx++;
      renderQ();
    }, ms);
  }

  function stopRapidTimer() {
    if (_rapidTimer) { clearInterval(_rapidTimer); _rapidTimer = null; }
  }

  function updateComboHud() {
    var chip = document.getElementById('comboChip');
    var el = document.getElementById('comboEl');
    if (el) el.textContent = combo;
    if (chip) chip.hidden = !isRapid();
  }

  function updateRapidBar() {
    var left = Math.max(0, _rapidDeadline - Date.now());
    var pct = (left / RAPID_MS) * 100;
    var fill = document.getElementById('rapidFill');
    var lbl = document.getElementById('rapidSec');
    if (fill) {
      fill.style.width = pct + '%';
      if (pct < 30) fill.classList.add('urgent');
      else fill.classList.remove('urgent');
    }
    if (lbl) lbl.textContent = Math.ceil(left / 1000);
    return left;
  }

  function startRapidTimer() {
    stopRapidTimer();
    _rapidDeadline = Date.now() + RAPID_MS;
    updateRapidBar();
    _rapidTimer = setInterval(function() {
      if (updateRapidBar() <= 0) onRapidTimeout();
    }, 100);
  }

  function onRapidTimeout() {
    if (_answered) return;
    _answered = true;
    stopRapidTimer();
    combo = 0;
    updateComboHud();
    var it = APP.activity[idx];
    var cor = it && it.correct;
    var opts = document.querySelectorAll('.opt');
    for (var j = 0; j < opts.length; j++) opts[j].disabled = true;
    if (opts[cor]) opts[cor].classList.add('ok');
    wrong++;
    setDot(idx, 'fail');
    var fb = document.getElementById('qfb'); if (fb) fb.classList.add('show');
    toast('Tiempo!');
    scheduleAdvance(1200);
  }

  function buildDots() {
    var r = document.getElementById('dotsRow'); if (!r) return;
    var h = '';
    for (var i = 0; i < APP.activity.length; i++) h += '<div class="dot' + (i===0?' cur':'') + '" id="jd'+i+'"></div>';
    r.innerHTML = h;
  }
  function setDot(i, type) {
    var d = document.getElementById('jd'+i); if (d) { d.className = 'dot ' + type; }
    var n = document.getElementById('jd'+(i+1)); if (n) n.classList.add('cur');
  }
  function renderQ() {
    var b = document.getElementById('jBody');
    var sc = document.getElementById('scoreEl'); if (sc) sc.textContent = score;
    if (!b) return;
    stopRapidTimer();
    clearAdvanceTimer();
    _answered = false;
    if (idx >= APP.activity.length) { finishGame(); return; }
    var it = APP.activity[idx];
    b.innerHTML = '';
    var m = APP.session.method;
    if (m === 'flash') renderFlash(b, it);
    else if (m === 'complete') renderComplete(b, it);
    else renderQuiz(b, it, m === 'rapid');
  }
  function renderFlash(b, it) {
    var h = '<div class="fc-wrap" onclick="SCREENS.juego._flipFC()"><div class="fc" id="fcCard">';
    h += '<div class="face"><span class="face-lbl">PREGUNTA</span><div class="face-txt">' + esc(it.question) + '</div></div>';
    h += '<div class="face face-back"><span class="face-lbl">RESPUESTA</span><div class="face-txt">' + esc(it.answer) + '</div></div>';
    h += '</div></div>';
    h += '<p class="fc-hint">Toca la tarjeta para ver la respuesta</p>';
    h += '<div class="fc-btns"><button class="btn-no" onclick="SCREENS.juego.advance(false)">&#x2717; No la sabia</button>';
    h += '<button class="btn-yes" onclick="SCREENS.juego.advance(true)">&#x2713; La sabia!</button></div>';
    b.innerHTML = h;
  }
  function renderQuiz(b, it, rapid) {
    var L = ['A','B','C','D'], opts = it.options || [];
    var h = '';
    if (rapid) {
      h += '<div class="rapid-hud"><div class="rapid-bar"><div class="rapid-fill" id="rapidFill"></div></div>';
      h += '<span class="rapid-sec" id="rapidSec">10</span></div>';
    }
    h += '<div class="q-txt">' + esc(it.question) + '</div><div class="opts-list">';
    for (var i = 0; i < opts.length; i++) {
      h += '<button class="opt" id="o'+i+'" onclick="SCREENS.juego.quizAns('+i+')">';
      h += '<span class="opt-ltr">' + L[i] + '</span>' + esc(opts[i]) + '</button>';
    }
    h += '</div><div class="feedback" id="qfb">' + esc(it.explanation||'') + '</div>';
    if (!rapid) {
      h += '<button class="btn-next" id="bnx" onclick="SCREENS.juego.nextQ()">Siguiente &#8594;</button>';
    }
    b.innerHTML = h;
    if (rapid) startRapidTimer();
  }
  function renderComplete(b, it) {
    var sent = esc(it.sentence||'').replace('_____', '<span class="blank">_____</span>');
    var h = '<div class="c-sent">' + sent + '</div>';
    h += '<input class="c-inp" id="cInp" placeholder="Tu respuesta..." autofocus>';
    h += '<div class="feedback" id="qfb">' + esc(it.explanation||'') + '</div>';
    h += '<button class="btn-verify" onclick="SCREENS.juego.verifyC()">Verificar &#x2713;</button>';
    b.innerHTML = h;
    setTimeout(function(){
      var inp = document.getElementById('cInp');
      if (inp) inp.addEventListener('keydown', function(e){ if(e.key==='Enter') SCREENS.juego.verifyC(); });
    }, 50);
  }
  function finishGame() {
    stopRapidTimer();
    var total = APP.activity.length;
    var pct = total > 0 ? Math.round((correct/total)*100) : 0;
    var xpE = isRapid() ? score : (correct*10 + (pct >= 80 ? 20 : 0));
    APP.results = {correct:correct, wrong:wrong, total:total, pct:pct, xpEarned:xpE};
    // Sube XP
    APP.user.xp += xpE;
    if (APP.user.xp >= APP.user.level*100) { APP.user.xp -= APP.user.level*100; APP.user.level++; }
    APP.user.sessions = (APP.user.sessions||0) + 1;
    var prevStreakDay = APP.user.lastStreakDate || '';
    var streak = updateStreak();
    saveUser();
    if (APP.user.lastStreakDate !== prevStreakDay && streak > 0) {
      toast('Racha: ' + streak + (streak === 1 ? ' dia' : ' dias') + '! &#128293;');
    }
    // Alimenta Mindy
    feedMindy(15);
    var now = new Date();
    var pad = function(n){ return String(n).padStart(2,'0'); };
    var fecha = pad(now.getDate())+'/'+pad(now.getMonth()+1)+'/'+now.getFullYear()+' '+pad(now.getHours())+':'+pad(now.getMinutes());
    addHistorialEntry({
      materia:    APP.session.subject || '',
      tema:       APP.session.topic   || '',
      actividad:  APP.session.method  || '',
      fecha:      fecha,
      porcentaje: pct,
      xp:         xpE
    });
    showScreen('resultados');
  }
})();

// Exponer flipFC para el onclick del HTML generado
SCREENS.juego._flipFC = function() {
  var fc = document.getElementById('fcCard'); if (fc) fc.classList.toggle('flip');
};

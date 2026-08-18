// ─── RESULTADOS ───
SCREENS.resultados = (function() {
  var _raf = null;

  function launchConfetti() {
    var cv = document.createElement('canvas');
    cv.id = 'confettiCv';
    cv.style.cssText = 'position:fixed;inset:0;z-index:0;pointer-events:none;';
    document.getElementById('resultados').insertBefore(cv, document.getElementById('resultados').firstChild);
    cv.width = window.innerWidth; cv.height = window.innerHeight;
    var ctx = cv.getContext('2d');
    var C = ['#f9c846','#ff6b6b','#6ee7b7','#a78bfa','#60a5fa'];
    var parts = [];
    for (var i = 0; i < 85; i++) parts.push({
      x:Math.random()*cv.width, y:-Math.random()*cv.height*.5-10,
      vx:(Math.random()-.5)*5, vy:Math.random()*3.5+1.5,
      col:C[i%5], w:Math.random()*9+4, h:Math.random()*5+3,
      rot:Math.random()*360, rv:(Math.random()-.5)*7, alpha:1
    });
    var frame = 0;
    function draw() {
      _raf = requestAnimationFrame(draw);
      ctx.clearRect(0,0,cv.width,cv.height);
      var done = true;
      for (var j = 0; j < parts.length; j++) {
        var p = parts[j];
        p.x+=p.vx; p.y+=p.vy; p.vy+=.13; p.rot+=p.rv;
        if (p.y < cv.height+20) done = false;
        if (frame > 80) p.alpha = Math.max(0, p.alpha-.012);
        ctx.save(); ctx.globalAlpha = p.alpha;
        ctx.translate(p.x,p.y); ctx.rotate(p.rot*Math.PI/180);
        ctx.fillStyle = p.col; ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h);
        ctx.restore();
      }
      frame++;
      if (done || frame > 200) { cancelAnimationFrame(_raf); _raf = null; try{cv.remove();}catch(e){} }
    }
    draw();
  }

  return {
    init: function() {
      var r = APP.results;
      try { document.getElementById('rsOk').textContent = r.correct||0; } catch(e) {}
      try { document.getElementById('rsFail').textContent = r.wrong||0; } catch(e) {}
      try { document.getElementById('rsAcc').textContent = (r.pct||0) + '%'; } catch(e) {}
      try { document.getElementById('xpBadge').textContent = '+' + (r.xpEarned||0) + ' XP ganados'; } catch(e) {}
      var pct = r.pct || 0;
      var emoji, title, sub;
      if (pct>=90){emoji='&#127942;';title='Excelente!';sub='Dominaste el tema completamente';}
      else if (pct>=70){emoji='&#11088;';title='Muy bien!';sub='Vas por buen camino';}
      else if (pct>=50){emoji='&#128170;';title='Buen esfuerzo!';sub='Sigue practicando';}
      else{emoji='&#128218;';title='A estudiar mas!';sub='La practica lleva a la perfeccion';}
      try { document.getElementById('resEmoji').innerHTML = emoji; } catch(e) {}
      try { document.getElementById('resTitle').textContent = title; } catch(e) {}
      try { document.getElementById('resSub').textContent = sub; } catch(e) {}
      try {
        var u = APP.user;
        document.getElementById('xpNote').textContent = 'Nivel ' + u.level + ' — ' + u.xp + ' / ' + (u.level*100) + ' XP acumulados';
      } catch(e) {}
      launchConfetti();
    },
    destroy: function() {
      if (_raf) { cancelAnimationFrame(_raf); _raf = null; }
      try { var cv = document.getElementById('confettiCv'); if (cv) cv.remove(); } catch(e) {}
    },
    nuevoTema: function() {
      APP.session = {
        method: '',
        subject: '',
        topic: '',
        text: '',
        questionCount: clampQuestionCount(APP.session && APP.session.questionCount)
      };
      APP.activity = [];
      saveSession();
      showScreen('actividad');
    },
    repetir: function() {
      showScreen('juego');
    }
  };
})();

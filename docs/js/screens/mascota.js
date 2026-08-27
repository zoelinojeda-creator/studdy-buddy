// ─── MASCOTA ───
TOUR_STEPS.mascota = [
  {
    element: '.monster-wrap',
    popover: {
      title: 'Esta es Mindy',
      description: 'Cuanto mas la cuides, mas contenta va a estar. Tocala para saludar!'
    }
  },
  {
    element: '.xp-bar-w',
    popover: {
      title: 'Tu progreso',
      description: 'Ahi vas viendo tu nivel y cuanto te falta para subir.'
    }
  },
  {
    element: '.h-wrap',
    popover: {
      title: 'El hambre de Mindy',
      description: 'Baja con el tiempo segun la meta que elijas. Si llega muy abajo, dale de comer!'
    }
  },
  {
    element: '.goals-grid',
    popover: {
      title: 'Meta diaria',
      description: 'Elegi que tan rapido queres que baje el hambre — de Casual a Extremo.'
    }
  },
  {
    element: '.act-grid',
    popover: {
      title: 'Comida, Ropa y Estudiar',
      description: 'Comprale cosas a Mindy con tu XP, o toca Estudiar para ganar mas.'
    }
  },
  {
    element: '.hist-section',
    popover: {
      title: 'Temas estudiados',
      description: 'Aca queda guardado todo lo que ya practicaste.'
    }
  }
];

SCREENS.mascota = (function() {
  var _timer = null;
  var _tourStarted = false;

  function startHunger() {
    stopHunger();
    applyHungerDecay();
    renderHunger();
    _timer = setInterval(function() {
      applyHungerDecay();
      renderHunger();
    }, 1000);
  }
  function stopHunger() {
    if (_timer) { clearInterval(_timer); _timer = null; }
  }
  function renderHunger() {
    try {
      var shown = Math.round(APP.mindy.hunger);
      var hf = document.getElementById('hFill'); if (hf) hf.style.width = shown + '%';
      var hp = document.getElementById('hPct'); if (hp) hp.textContent = shown + '%';
      var mb = document.getElementById('moodEl');
      if (mb) {
        var h = APP.mindy.hunger;
        var m = h>70?'&#x1F60A; Feliz':h>40?'&#x1F610; Normal':h>15?'&#x1F61F; Con hambre':'&#x1F622; Hambrienta!';
        if (mb.innerHTML !== m) { mb.innerHTML = m; mb.style.animation = 'moodBounce .4s ease'; setTimeout(function(){try{mb.style.animation='';}catch(e){}},400); }
      }
    } catch(e) {}
  }
  function renderAll() {
    var u = APP.user;
    try { document.getElementById('tbName').textContent = 'Hola, ' + u.username + '!'; } catch(e) {}
    try { document.getElementById('tbXP').textContent = u.xp; } catch(e) {}
    try { document.getElementById('uLvl').textContent = u.level; } catch(e) {}
    var needed = u.level * 100;
    try { document.getElementById('xpNext').textContent = u.xp + ' / ' + needed + ' XP'; } catch(e) {}
    try { document.getElementById('xpFill').style.width = Math.min((u.xp/needed)*100,100) + '%'; } catch(e) {}
    try { document.getElementById('stSes').textContent = u.sessions||0; } catch(e) {}
    try { document.getElementById('stXP').textContent = u.xp||0; } catch(e) {}
    try { document.getElementById('stStr').textContent = u.streak||0; } catch(e) {}
    try { document.getElementById('mindyLvl').textContent = 'Nv.' + u.level; } catch(e) {}
    renderHunger();
    renderOutfit();
    renderGoal();
  }
  function renderOutfit() {
    var el = document.getElementById('outfitIco'); if (!el) return;
    var id = APP.mindy.outfit;
    if (!id || id === 'none') { el.style.display = 'none'; el.innerHTML = ''; return; }
    for (var i = 0; i < OUTFIT_ITEMS.length; i++) {
      if (OUTFIT_ITEMS[i].id === id) { el.style.display = 'block'; el.innerHTML = OUTFIT_ITEMS[i].ico; return; }
    }
    el.style.display = 'none';
  }
  function renderGoal() {
    var btns = document.querySelectorAll('.g-btn');
    for (var i = 0; i < btns.length; i++) btns[i].classList.remove('on');
    var sel = document.getElementById('g-' + APP.mindy.goal); if (sel) sel.classList.add('on');
    var gh = document.getElementById('gHint'); if (gh) gh.textContent = GOAL_HINT[APP.mindy.goal] || GOAL_HINT.normal;
  }

  function renderHist() {
    var body = document.getElementById('histBody');
    if (!body) return;
    var hist = getHistorial();
    console.log('[StudyBuddy] Historial:', hist.length, 'entrada(s)', hist);
    var ACT_LABEL = {flash:'Flashcards', rapid:'Quiz Rapido', quiz:'Quiz', complete:'Completar'};
    if (!hist.length) {
      body.innerHTML = '<div class="hist-empty">Todavia no estudiaste ningun tema &#128218;</div>';
      return;
    }
    var html = '';
    for (var i = 0; i < hist.length; i++) {
      var h = hist[i];
      var pctCls = h.porcentaje >= 70 ? 'good' : 'bad';
      html += '<div class="hist-item">';
      html += '<div class="hist-left">';
      html += '<div class="hist-materia">' + esc(h.materia) + '</div>';
      html += '<div class="hist-tema">' + esc(h.tema) + '</div>';
      html += '<div class="hist-meta">' + esc(ACT_LABEL[h.actividad] || h.actividad) + ' &bull; ' + esc(h.fecha) + '</div>';
      html += '</div>';
      html += '<div class="hist-right">';
      html += '<div class="hist-pct ' + pctCls + '">' + h.porcentaje + '%</div>';
      html += '<div class="hist-xp">+' + h.xp + ' XP</div>';
      html += '</div>';
      html += '</div>';
    }
    html += '<button class="hist-clear" onclick="SCREENS.mascota.clearHist()">&#128465; Borrar historial</button>';
    body.innerHTML = html;
  }

  return {
    init: function() {
      expireStreakIfBroken(); renderAll(); renderHist(); startHunger();
      if (!_tourStarted) { _tourStarted = true; runTutorial('mascota'); }
    },
    destroy: function() { stopHunger(); applyHungerDecay(); saveMindy(); },
    confirmLogout: function() {
      if (confirm('Cerrar sesion?')) logout();
    },
    restartTutorial: function() {
      resetAllTutorials();
      showScreen('inicio');
    },
    poke: function() {
      var m = document.getElementById('msvg'); if (!m) return;
      m.style.animation = 'scare .5s ease';
      setTimeout(function(){try{m.style.animation='';}catch(e){}},500);
      var pokes = ['Ay!','Cuidado!','Hehe!','Epa!'];
      toast(pokes[Math.floor(Math.random()*pokes.length)]);
    },
    setGoal: function(g) {
      applyHungerDecay();
      APP.mindy.goal = g;
      APP.mindy.lastHungerAt = Date.now();
      saveMindy(); renderGoal(); startHunger();
      toast('Meta: ' + g.charAt(0).toUpperCase() + g.slice(1));
    },
    openShop: function(type) {
      var shXP = document.getElementById('shXP'); if (shXP) shXP.textContent = APP.user.xp;
      var t = document.getElementById('shTitle');
      var g = document.getElementById('shGrid'); if (!g) return;
      var html = '';
      if (type === 'food') {
        if (t) t.innerHTML = '&#129366; Tienda de Comida';
        for (var i = 0; i < FOOD_ITEMS.length; i++) {
          var it = FOOD_ITEMS[i];
          var dim = APP.user.xp < it.price ? ' style="opacity:.4"' : '';
          html += '<div class="sh-item" onclick="SCREENS.mascota.buyFood(\'' + it.id + '\')"' + dim + '>';
          html += '<span class="sh-ico">' + it.ico + '</span><span class="sh-nm">' + it.name + '</span>';
          html += '<span class="sh-pr">&#11088; ' + it.price + ' XP</span></div>';
        }
      } else {
        if (t) t.innerHTML = '&#128085; Tienda de Ropa';
        normalizeOwnedOutfits();
        for (var j = 0; j < OUTFIT_ITEMS.length; j++) {
          var ot = OUTFIT_ITEMS[j];
          var wearing = APP.mindy.outfit === ot.id;
          var owned = ownsOutfit(ot.id);
          var w = wearing ? ' wearing' : '';
          var dim2 = (!owned && ot.price > 0 && APP.user.xp < ot.price) ? ' style="opacity:.4"' : '';
          var priceLbl = wearing ? 'Usando' : (owned ? 'Tienes' : (ot.price === 0 ? 'Gratis' : '&#11088; ' + ot.price + ' XP'));
          html += '<div class="sh-item' + w + '" onclick="SCREENS.mascota.buyOutfit(\'' + ot.id + '\')"' + dim2 + '>';
          html += '<span class="sh-ico">' + ot.ico + '</span><span class="sh-nm">' + ot.name + '</span>';
          html += '<span class="sh-pr">' + priceLbl + '</span></div>';
        }
      }
      g.innerHTML = html;
      document.getElementById('shopModal').classList.add('open');
    },
    closeShopOv: function(e) { if (e.target === document.getElementById('shopModal')) this.closeShop(); },
    closeShop: function() { document.getElementById('shopModal').classList.remove('open'); },
    buyFood: function(id) {
      var it = null;
      for (var i = 0; i < FOOD_ITEMS.length; i++) if (FOOD_ITEMS[i].id === id) { it = FOOD_ITEMS[i]; break; }
      if (!it) return;
      if (APP.user.xp < it.price) { toast('No tienes suficiente XP!'); return; }
      APP.user.xp -= it.price;
      feedMindy(it.h);
      saveUser(); renderAll(); floatEmoji(it.ico);
      toast(it.name + ' — Mindy esta feliz!'); this.closeShop();
    },
    buyOutfit: function(id) {
      var it = null;
      for (var i = 0; i < OUTFIT_ITEMS.length; i++) if (OUTFIT_ITEMS[i].id === id) { it = OUTFIT_ITEMS[i]; break; }
      if (!it) return;
      normalizeOwnedOutfits();
      if (APP.mindy.outfit === id) { toast('Mindy ya usa ' + it.name); return; }
      if (!ownsOutfit(id)) {
        if (it.price > 0 && APP.user.xp < it.price) { toast('No tienes suficiente XP!'); return; }
        if (it.price > 0) { APP.user.xp -= it.price; saveUser(); }
        APP.mindy.ownedOutfits.push(id);
      }
      APP.mindy.outfit = id; saveMindy(); renderAll(); floatEmoji(it.ico);
      toast('Mindy usa ' + it.name + '!'); this.closeShop();
    },
    toggleHist: function() {
      var body = document.getElementById('histBody');
      var btn  = document.getElementById('histToggle');
      if (!body) return;
      var isHidden = body.style.display === 'none' || body.style.display === '';
      if (isHidden) {
        body.style.display = 'block';
        if (btn) btn.textContent = '▲ ocultar';
        renderHist();
      } else {
        body.style.display = 'none';
        if (btn) btn.textContent = '▼ ver';
      }
    },
    clearHist: function() {
      clearHistorial();
      renderHist();
      toast('Historial borrado');
    }
  };
})();

// ─── ACTIVIDAD ───
TOUR_STEPS.actividad = [
  {
    element: '.method-grid',
    popover: {
      title: 'Elegi como estudiar',
      description: 'Cada metodo genera preguntas distinto — probalos y quedate con el que mas te guste.'
    }
  },
  {
    element: '#btnCont',
    popover: {
      title: 'Segui adelante',
      description: 'Una vez que elegis un metodo, toca aca para cargar la materia y el tema.'
    }
  }
];

SCREENS.actividad = {
  init: function() {
    try { document.getElementById('actXP').textContent = APP.user ? APP.user.xp : 0; } catch(e) {}
    // Restaurar seleccion previa
    if (APP.session.method) {
      var cards = document.querySelectorAll('.m-card');
      for (var i = 0; i < cards.length; i++) cards[i].classList.remove('on');
      var c = document.getElementById('mc-' + APP.session.method);
      if (c) c.classList.add('on');
      var bc = document.getElementById('btnCont'); if (bc) bc.classList.add('on');
    } else {
      var cards2 = document.querySelectorAll('.m-card');
      for (var i = 0; i < cards2.length; i++) cards2[i].classList.remove('on');
      var bc2 = document.getElementById('btnCont'); if (bc2) bc2.classList.remove('on');
    }
    runTutorial('actividad');
  },
  destroy: function() {},
  pick: function(el, method) {
    APP.session.method = method;
    saveSession();
    var cards = document.querySelectorAll('.m-card');
    for (var i = 0; i < cards.length; i++) cards[i].classList.remove('on');
    el.classList.add('on');
    var bc = document.getElementById('btnCont'); if (bc) bc.classList.add('on');
  }
};

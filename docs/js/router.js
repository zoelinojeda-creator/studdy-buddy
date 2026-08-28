// ══════════════════════════════════════════════════════
//  SCREEN MANAGER
// ══════════════════════════════════════════════════════
var _cur = '';

function showScreen(id) {
  // 1. destroy saliente
  if (_cur && SCREENS[_cur] && SCREENS[_cur].destroy) {
    try { SCREENS[_cur].destroy(); } catch(e) {}
  }
  // Guardado final (sin esperar el throttle) al salir de cualquier pantalla,
  // por si quedo estado de Mindy pendiente de sincronizar con Supabase.
  if (typeof flushMindySync === 'function') {
    try { flushMindySync(); } catch(e) {}
  }
  // 2. ocultar todas
  var all = document.querySelectorAll('.screen');
  for (var i = 0; i < all.length; i++) all[i].style.display = 'none';
  // 3. mostrar nueva
  var el = document.getElementById(id);
  if (el) el.style.display = '';
  _cur = id;
  window.scrollTo(0, 0);
  // 4. init entrante
  if (SCREENS[id] && SCREENS[id].init) {
    try { SCREENS[id].init(); } catch(e) { console.error('init error', id, e); }
  }
}

// ══════════════════════════════════════════════════════
//  SCREENS
// ══════════════════════════════════════════════════════
var SCREENS = {};

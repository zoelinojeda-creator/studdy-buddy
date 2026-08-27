// ─── TUTORIAL (driver.js) ───
// Motor generico y reusable. Cada pantalla agrega sus propios pasos:
// TOUR_STEPS.<nombrePantalla> = [ { element: '...', popover: {...} }, ... ]
var TOUR_STEPS = {};

function runTutorial(screenName) {
  try {
    var steps = TOUR_STEPS[screenName];
    if (!steps || !steps.length) return;

    var seenKey = 'sb_tutorial_seen_' + screenName;
    if (storageGet(seenKey)) return;

    if (!window.driver || !window.driver.js || !window.driver.js.driver) return;

    var driverObj = window.driver.js.driver({
      showProgress: true,
      steps: steps,
      onDestroyed: function() {
        console.log('[Tutorial] onDestroyed disparado para "' + screenName + '", guardando ' + seenKey);
        storageSet(seenKey, '1');
        console.log('[Tutorial] guardado. Valor releido:', storageGet(seenKey));
      }
    });
    driverObj.drive();
  } catch (e) {
    console.warn('[Tutorial] fallo al mostrar tutorial de ' + screenName + ':', e);
  }
}

function resetAllTutorials() {
  try {
    var prefix = 'sb_tutorial_seen_';
    var toRemove = [];
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (k && k.indexOf(prefix) === 0) toRemove.push(k);
    }
    for (var j = 0; j < toRemove.length; j++) storageRemove(toRemove[j]);
  } catch (e) {}
}

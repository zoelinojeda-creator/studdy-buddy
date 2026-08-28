// ─── FONDO ANIMADO (estrellas + particulas) ───
// Corre de fondo en toda la app, no solo en #inicio. Arranca una sola vez
// desde app.js al cargar la pagina, nunca se frena al navegar entre pantallas.
var startBgCanvas, stopBgCanvas;

(function() {
  var _raf = null;
  var _running = false;
  var _stars = null;
  var _particles = null;
  var _mx = -999, _my = -999;
  var _onMouseMove = null;

  startBgCanvas = function() {
    var cv = document.getElementById('bgCanvas');
    if (!cv) return;
    cv.style.display = 'block';
    var ctx = cv.getContext('2d');
    cv.width = window.innerWidth;
    cv.height = window.innerHeight;
    if (!_stars) {
      _stars = [];
      for (var i = 0; i < 110; i++) {
        _stars.push({x:Math.random()*cv.width, y:Math.random()*cv.height, r:Math.random()*1.4+.3, a:Math.random(), spd:Math.random()*.018+.004});
      }
      _particles = [];
      var PC = ['#f9c846','#ff6b6b','#6ee7b7','#a78bfa','#60a5fa'];
      for (var j = 0; j < 26; j++) {
        _particles.push({x:Math.random()*cv.width, y:Math.random()*cv.height, vx:(Math.random()-.5)*.7, vy:(Math.random()-.5)*.7, r:Math.random()*2.5+1, col:PC[j%5], a:Math.random()*.3+.1});
      }
    }
    _onMouseMove = function(e) { _mx = e.clientX; _my = e.clientY; };
    document.addEventListener('mousemove', _onMouseMove);
    _running = true;
    function draw() {
      if (!_running) return;
      _raf = requestAnimationFrame(draw);
      cv.width = window.innerWidth; cv.height = window.innerHeight;
      ctx.clearRect(0, 0, cv.width, cv.height);
      for (var i = 0; i < _stars.length; i++) {
        var s = _stars[i]; s.a += s.spd;
        if (s.a > 1 || s.a < 0) s.spd *= -1;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
        ctx.fillStyle = 'rgba(232,234,246,' + Math.abs(s.a) + ')'; ctx.fill();
      }
      for (var j = 0; j < _particles.length; j++) {
        var p = _particles[j];
        var dx = p.x-_mx, dy = p.y-_my, d = Math.sqrt(dx*dx+dy*dy);
        if (d < 95) { p.vx += dx/d*.38; p.vy += dy/d*.38; }
        p.vx *= .982; p.vy *= .982; p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = cv.width; if (p.x > cv.width) p.x = 0;
        if (p.y < 0) p.y = cv.height; if (p.y > cv.height) p.y = 0;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
        ctx.fillStyle = p.col; ctx.globalAlpha = p.a; ctx.fill(); ctx.globalAlpha = 1;
      }
    }
    draw();
  };

  stopBgCanvas = function() {
    _running = false;
    if (_raf) { cancelAnimationFrame(_raf); _raf = null; }
    if (_onMouseMove) { document.removeEventListener('mousemove', _onMouseMove); _onMouseMove = null; }
    var cv = document.getElementById('bgCanvas');
    if (cv) { cv.style.display = 'none'; try { cv.getContext('2d').clearRect(0,0,cv.width,cv.height); } catch(e){} }
  };
})();

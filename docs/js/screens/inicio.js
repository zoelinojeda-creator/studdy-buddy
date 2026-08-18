// ─── INICIO ───
SCREENS.inicio = (function() {
  var _raf = null;
  var _running = false;
  var _stars = null;
  var _particles = null;
  var _mx = -999, _my = -999;
  var _selAv = 'huevo';
  var _onMouseMove = null;

  function startCanvas() {
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
  }

  function stopCanvas() {
    _running = false;
    if (_raf) { cancelAnimationFrame(_raf); _raf = null; }
    if (_onMouseMove) { document.removeEventListener('mousemove', _onMouseMove); _onMouseMove = null; }
    var cv = document.getElementById('bgCanvas');
    if (cv) { cv.style.display = 'none'; try { cv.getContext('2d').clearRect(0,0,cv.width,cv.height); } catch(e){} }
  }

  return {
    init: function() {
      var u = loadUser();
      if (u && u.username) {
        APP.user = u;
        loadMindy();
        showScreen('mascota');
        return;
      }
      startCanvas();
    },
    destroy: function() { stopCanvas(); },
    switchTab: function(t) {
      var isLogin = t === 'login';
      document.getElementById('pLogin').className = isLogin ? 'form-panel on' : 'form-panel';
      document.getElementById('pReg').className   = isLogin ? 'form-panel' : 'form-panel on';
      document.getElementById('tabLogin').className = isLogin ? 'tab on' : 'tab';
      document.getElementById('tabReg').className   = isLogin ? 'tab' : 'tab on';
      document.getElementById('authFoot').innerHTML = isLogin
        ? 'No tienes cuenta? <a onclick="SCREENS.inicio.switchTab(\'reg\')">Registrate gratis</a>'
        : 'Ya tienes cuenta? <a onclick="SCREENS.inicio.switchTab(\'login\')">Inicia sesion</a>';
    },
    selAv: function(el, av) {
      _selAv = av;
      var els = document.querySelectorAll('.av');
      for (var i = 0; i < els.length; i++) els[i].classList.remove('on');
      el.classList.add('on');
    },
    pwStr: function(pw) {
      var t = document.getElementById('pwTrack'), l = document.getElementById('pwLbl'); if (!t) return;
      var s = 0;
      if (pw.length >= 6) s++; if (pw.length >= 10) s++;
      if (/[A-Z]/.test(pw)) s++; if (/[0-9]/.test(pw)) s++; if (/[^A-Za-z0-9]/.test(pw)) s++;
      var C = ['#ff6b6b','#ff9f43','#f9c846','#6ee7b7','#6ee7b7'];
      var L = ['Muy debil','Debil','Regular','Fuerte','Muy fuerte'];
      t.style.width = Math.min((s/4)*100, 100) + '%';
      t.style.background = C[Math.min(s-1, 4)] || 'var(--border)';
      if (l) { l.textContent = pw.length ? L[Math.min(s-1,4)]||'Muy debil' : 'Ingresa una contrasena'; l.style.color = pw.length ? C[Math.min(s-1,4)] : 'var(--muted)'; }
    },
    doLogin: function(e) {
      e.preventDefault();
      var u = document.getElementById('lUser').value.trim();
      var p = document.getElementById('lPass').value;
      if (!u || !p) { toast('Completa todos los campos'); return; }
      try {
        var stored = getRegisteredUser();
        if ((stored.username === u || stored.email === u) && stored.pass === p) {
          APP.user = stored;
          APP.user.sessions = (APP.user.sessions || 0) + 1;
          saveUser();
          loadMindy();
          showScreen('mascota');
          return;
        }
        toast('Usuario o contrasena incorrectos');
      } catch(err) { toast('Error al iniciar sesion'); }
    },
    doReg: function(e) {
      e.preventDefault();
      var user  = document.getElementById('rUser').value.trim();
      var email = document.getElementById('rEmail').value.trim();
      var pass  = document.getElementById('rPass').value;
      if (!user || !email || !pass) { toast('Completa todos los campos'); return; }
      if (pass.length < 6) { toast('Contrasena: minimo 6 caracteres'); return; }
      APP.user = {username:user, avatar:_selAv, email:email, pass:pass, xp:0, level:1, sessions:1, streak:0};
      saveUser();
      loadMindy();
      showScreen('mascota');
    },
    doGuest: function() {
      APP.user = {username:'Invitado', avatar:'invitado', xp:0, level:1, sessions:1, streak:0, guest:true};
      saveUser();
      loadMindy();
      showScreen('mascota');
    },
    pokeMindy: function() {
      var msgs = ['Hola! :)','A estudiar!','Tu puedes!','Soy Mindy!','Aprendamos!'];
      var b = document.getElementById('mindyBubble'), ms = document.getElementById('mindyEgg');
      if (b) { b.textContent = msgs[Math.floor(Math.random()*msgs.length)]; b.classList.add('show'); setTimeout(function(){b.classList.remove('show');},2200); }
      if (ms) { ms.style.animation = 'scare .45s ease'; setTimeout(function(){ms.style.animation = 'bobble 2.6s ease-in-out infinite';},450); }
    }
  };
})();

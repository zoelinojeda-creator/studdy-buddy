// ─── INICIO ───
TOUR_STEPS.inicio = [
  {
    element: '.logo-area',
    popover: {
      title: 'Hola! Soy Mindy',
      description: 'Te voy a acompanar a estudiar y subir de nivel. Toca mi carita si queres saludarme!'
    }
  },
  {
    element: '.tabs',
    popover: {
      title: 'Entrar o registrarte',
      description: 'Desde aca elegis si ya tenes cuenta (Entrar) o si es tu primera vez (Registro).'
    }
  },
  {
    element: '#btnGuestLogin',
    popover: {
      title: 'Probar sin cuenta',
      description: 'La forma mas rapida de arrancar: entras como invitado y jugas ya mismo, sin cargar nada.'
    }
  }
];

SCREENS.inicio = (function() {
  var _selAv = 'huevo';

  return {
    init: function() {
      var u = loadUser();
      if (u && u.username) {
        APP.user = u;
        loadMindy();
        showScreen('mascota');
        if (isSupabaseUser()) {
          Promise.all([
            fetchUserFromSupabase().catch(function(){}),
            fetchMindyFromSupabase().catch(function(){}),
            fetchHistorialFromSupabase().catch(function(){})
          ]).then(function() {
            if (_cur === 'mascota' && SCREENS.mascota && SCREENS.mascota.init) {
              SCREENS.mascota.init();
            }
          });
        }
        return;
      }
      runTutorial('inicio');
    },
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
      var email = document.getElementById('lEmail').value.trim();
      var pass  = document.getElementById('lPass').value;
      if (!email || !pass) { toast('Completa todos los campos'); return; }
      supabase.auth.signInWithPassword({ email: email, password: pass })
        .then(function(res) {
          if (res.error) { toast(res.error.message || 'Correo o contrasena incorrectos'); return; }
          var authUser = res.data.user;
          return supabase.from('usuarios').select('*').eq('id', authUser.id).single()
            .then(function(row) {
              if (row.error || !row.data) { toast('No se encontro el perfil de usuario'); return; }
              APP.user = row.data;
              APP.user.sessions = (APP.user.sessions || 0) + 1;
              saveUser();
              loadMindy();
              return Promise.all([
                fetchMindyFromSupabase().catch(function(){}),
                fetchHistorialFromSupabase().catch(function(){})
              ]).then(function() {
                showScreen('mascota');
              });
            });
        })
        .catch(function(err) { toast('Error al iniciar sesion'); });
    },
    doReg: function(e) {
      e.preventDefault();
      var user  = document.getElementById('rUser').value.trim();
      var email = document.getElementById('rEmail').value.trim();
      var pass  = document.getElementById('rPass').value;
      if (!user || !email || !pass) { toast('Completa todos los campos'); return; }
      if (pass.length < 6) { toast('Contrasena: minimo 6 caracteres'); return; }
      supabase.auth.signUp({
        email: email,
        password: pass,
        options: { data: { username: user, avatar: _selAv } }
      })
        .then(function(res) {
          if (res.error) { toast(res.error.message || 'No se pudo crear la cuenta'); return; }
          var authUser = res.data && res.data.user;
          if (!authUser) { toast('No se pudo crear la cuenta'); return; }
          if (!res.data.session) {
            toast('Cuenta creada. Revisa tu correo para confirmarla y luego inicia sesion');
            return;
          }
          return supabase.from('usuarios').select('*').eq('id', authUser.id).single()
            .then(function(row) {
              if (row.error || !row.data) { toast('Cuenta creada, pero no se encontro el perfil'); return; }
              APP.user = row.data;
              saveUser();
              loadMindy();
              return Promise.all([
                fetchMindyFromSupabase().catch(function(){}),
                fetchHistorialFromSupabase().catch(function(){})
              ]).then(function() {
                showScreen('mascota');
              });
            });
        })
        .catch(function(err) { toast('Error al registrarse'); });
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

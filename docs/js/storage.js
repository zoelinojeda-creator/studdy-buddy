var STORAGE_KEYS = {
  user: 'sb_user',
  mindy: 'sb_mindy',
  session: 'sb_session',
  historial: 'sb_historial',
  aiKey: 'sb_ai_key',
  legacyMindyState: 'mindy_state',
  legacyHunger: 'mindy_hunger',
  legacyOutfit: 'mindy_outfit',
  legacyGoal: 'daily_goal'
};

function storageGet(key) {
  try { return localStorage.getItem(key); } catch(e) { return null; }
}

function storageSet(key, value) {
  try { localStorage.setItem(key, value); } catch(e) {}
}

function storageRemove(key) {
  try { localStorage.removeItem(key); } catch(e) {}
}

function migrateLegacyStorage() {
  var mindy = null;

  try {
    var existing = storageGet(STORAGE_KEYS.mindy);
    if (existing) mindy = JSON.parse(existing);
  } catch(e) {}

  if (!mindy) {
    try {
      var state = storageGet(STORAGE_KEYS.legacyMindyState);
      if (state) {
        mindy = JSON.parse(state);
        storageRemove(STORAGE_KEYS.legacyMindyState);
      }
    } catch(e) {}
  }

  if (!mindy) {
    mindy = { hunger: 75, outfit: 'none', goal: 'normal', ownedOutfits: ['none'] };
    var hunger = storageGet(STORAGE_KEYS.legacyHunger);
    if (hunger !== null && hunger !== '') {
      mindy.hunger = parseFloat(hunger);
      storageRemove(STORAGE_KEYS.legacyHunger);
    }
    var outfit = storageGet(STORAGE_KEYS.legacyOutfit);
    if (outfit) {
      mindy.outfit = outfit;
      storageRemove(STORAGE_KEYS.legacyOutfit);
    }
    var goal = storageGet(STORAGE_KEYS.legacyGoal);
    if (goal) {
      mindy.goal = goal;
      storageRemove(STORAGE_KEYS.legacyGoal);
    }
    storageSet(STORAGE_KEYS.mindy, JSON.stringify(mindy));
  }

  return mindy;
}

function loadUser() {
  try {
    var d = storageGet(STORAGE_KEYS.user);
    if (!d) d = sessionStorage.getItem(STORAGE_KEYS.user);
    if (d) return JSON.parse(d);
  } catch(e) {}
  return null;
}

function getRegisteredUser() {
  try {
    var d = storageGet(STORAGE_KEYS.user);
    if (d) return JSON.parse(d);
  } catch(e) {}
  return {};
}

function saveUser() {
  if (!APP.user) return;
  if (APP.user.guest) {
    try { sessionStorage.setItem(STORAGE_KEYS.user, JSON.stringify(APP.user)); } catch(e) {}
  } else {
    storageSet(STORAGE_KEYS.user, JSON.stringify(APP.user));
  }
}

function ownsOutfit(id) {
  var owned = APP.mindy.ownedOutfits || [];
  for (var i = 0; i < owned.length; i++) if (owned[i] === id) return true;
  return false;
}

function normalizeOwnedOutfits() {
  var owned = Array.isArray(APP.mindy.ownedOutfits) ? APP.mindy.ownedOutfits.slice() : [];
  var changed = !Array.isArray(APP.mindy.ownedOutfits);
  function add(id) {
    if (!id) return;
    if (owned.indexOf(id) === -1) { owned.push(id); changed = true; }
  }
  add('none');
  add(APP.mindy.outfit);
  APP.mindy.ownedOutfits = owned;
  return changed;
}

function hungerIntervalMs() {
  return GOAL_MS[APP.mindy.goal] || GOAL_MS.normal;
}

function applyHungerDecay() {
  if (!APP.mindy) return false;
  var now = Date.now();
  var last = APP.mindy.lastHungerAt;
  if (last == null || typeof last !== 'number' || last > now) {
    APP.mindy.lastHungerAt = now;
    saveMindy();
    return false;
  }
  var step = hungerIntervalMs();
  if (!step) return false;
  var ticks = (now - last) / step;
  if (ticks <= 0) return false;
  APP.mindy.hunger = Math.max(0, APP.mindy.hunger - ticks);
  APP.mindy.lastHungerAt = now;
  saveMindy();
  return true;
}

function feedMindy(amount) {
  applyHungerDecay();
  APP.mindy.hunger = Math.min(100, APP.mindy.hunger + (amount || 0));
  APP.mindy.lastHungerAt = Date.now();
  saveMindy();
}

function loadMindy() {
  var mindy = migrateLegacyStorage();
  if (!mindy) return;
  APP.mindy.hunger = mindy.hunger != null ? mindy.hunger : 75;
  APP.mindy.outfit = mindy.outfit || 'none';
  APP.mindy.goal = mindy.goal || 'normal';
  APP.mindy.ownedOutfits = Array.isArray(mindy.ownedOutfits) ? mindy.ownedOutfits.slice() : [];
  var hadStamp = typeof mindy.lastHungerAt === 'number';
  APP.mindy.lastHungerAt = hadStamp ? mindy.lastHungerAt : Date.now();
  if (normalizeOwnedOutfits()) saveMindy();
  if (hadStamp) applyHungerDecay();
  else saveMindy();
}

function saveMindy() {
  storageSet(STORAGE_KEYS.mindy, JSON.stringify(APP.mindy));
}

function loadSession() {
  try {
    var d = storageGet(STORAGE_KEYS.session);
    if (!d) return;
    var s = JSON.parse(d);
    APP.session.method = s.method || '';
    APP.session.subject = s.subject || '';
    APP.session.topic = s.topic || '';
    APP.session.text = s.text || '';
    APP.session.questionCount = clampQuestionCount(s.questionCount);
  } catch(e) {}
}

function saveSession() {
  storageSet(STORAGE_KEYS.session, JSON.stringify(APP.session));
}

function getHistorial() {
  try { return JSON.parse(storageGet(STORAGE_KEYS.historial) || '[]'); } catch(e) { return []; }
}

function addHistorialEntry(entry) {
  var hist = getHistorial();
  hist.unshift(entry);
  if (hist.length > 10) hist = hist.slice(0, 10);
  storageSet(STORAGE_KEYS.historial, JSON.stringify(hist));
}

function clearHistorial() {
  storageRemove(STORAGE_KEYS.historial);
}

function localDateKey(d) {
  d = d || new Date();
  var m = d.getMonth() + 1;
  var day = d.getDate();
  return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (day < 10 ? '0' : '') + day;
}

function daysBetweenKeys(fromKey, toKey) {
  var a = (fromKey || '').split('-');
  var b = (toKey || '').split('-');
  if (a.length !== 3 || b.length !== 3) return null;
  var da = new Date(+a[0], +a[1] - 1, +a[2]);
  var db = new Date(+b[0], +b[1] - 1, +b[2]);
  return Math.round((db - da) / 86400000);
}

function expireStreakIfBroken() {
  if (!APP.user) return;
  var last = APP.user.lastStreakDate || '';
  if (!last) return;
  var gap = daysBetweenKeys(last, localDateKey());
  if (gap != null && gap > 1 && (APP.user.streak || 0) > 0) {
    APP.user.streak = 0;
    saveUser();
  }
}

function updateStreak() {
  if (!APP.user) return 0;
  var today = localDateKey();
  var last = APP.user.lastStreakDate || '';
  if (last === today) return APP.user.streak || 0;
  var gap = last ? daysBetweenKeys(last, today) : null;
  APP.user.streak = (gap === 1) ? (APP.user.streak || 0) + 1 : 1;
  APP.user.lastStreakDate = today;
  return APP.user.streak;
}

function addXP(n) {
  if (!APP.user) return;
  APP.user.xp += n;
  if (APP.user.xp >= APP.user.level * 100) {
    APP.user.xp -= APP.user.level * 100;
    APP.user.level++;
    toast('Nivel ' + APP.user.level + '! &#x1F389;', 3000);
  }
  saveUser();
}

function bootstrapStorage() {
  migrateLegacyStorage();
  var user = loadUser();
  if (user) APP.user = user;
  loadMindy();
  loadSession();
}

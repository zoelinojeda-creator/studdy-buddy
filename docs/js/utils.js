function answersMatch(userAnswer, correctAnswer) {
  var ua = (userAnswer || '').trim().toLowerCase();
  var ca = (correctAnswer || '').trim().toLowerCase();
  if (!ua || !ca) return false;
  return ua === ca || ca.includes(ua) || ua.includes(ca);
}
function esc(s) {
  return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function toast(msg, dur) {
  var t = document.getElementById('toast');
  t.innerHTML = msg; t.classList.add('show');
  clearTimeout(t._t); t._t = setTimeout(function(){ t.classList.remove('show'); }, dur||2000);
}
function ripple(btn, e) {
  var r = document.createElement('span'); r.className = 'ripple-s';
  var rect = btn.getBoundingClientRect(), sz = Math.max(rect.width,rect.height);
  r.style.width = r.style.height = sz + 'px';
  r.style.left = (e.clientX - rect.left - sz/2) + 'px';
  r.style.top  = (e.clientY - rect.top  - sz/2) + 'px';
  btn.appendChild(r);
  setTimeout(function(){ try{ btn.removeChild(r); }catch(ex){} }, 560);
}
function floatEmoji(ico) {
  var el = document.createElement('div');
  el.innerHTML = ico;
  el.style.cssText = 'position:fixed;left:' + ((window.innerWidth/2)-20) + 'px;top:' + (window.innerHeight/2) + 'px;font-size:2rem;z-index:400;pointer-events:none;animation:fl2 .9s ease forwards;';
  document.body.appendChild(el);
  setTimeout(function(){ try{ document.body.removeChild(el); }catch(e){} }, 900);
}

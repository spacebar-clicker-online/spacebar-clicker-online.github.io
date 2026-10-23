/* Click-speed engine shared by the Spacebar Clicker, Spacebar Counter and CPS Test pages.
   Config comes from data attributes on #tool:
   data-mode="space" | "mouse"   which input counts
   data-default="10"             starting duration in seconds (0 = endless)
   data-key="sbc"                storage namespace so each tool keeps its own records */
(function () {
  var tool = document.getElementById('tool');
  if (!tool) return;
  var $ = function (id) { return document.getElementById(id); };
  var MODE = tool.getAttribute('data-mode') || 'space';
  var NS = tool.getAttribute('data-key') || 'sbc';
  var PRESETS = [];
  var chips = Array.prototype.slice.call(tool.querySelectorAll('.chip[data-t]'));
  chips.forEach(function (c) { PRESETS.push(+c.getAttribute('data-t')); });

  var TIERS = MODE === 'mouse' ? [
    { min: 0, name: 'Warming up', note: 'Relax your hand and use short, light clicks.' },
    { min: 5, name: 'Average', note: 'A normal score for a first try.' },
    { min: 7, name: 'Quick', note: 'Faster than most people.' },
    { min: 9, name: 'Fast', note: 'Solid gaming speed.' },
    { min: 11, name: 'Pro', note: 'Very fast clicking.' },
    { min: 14, name: 'Legendary', note: 'Elite speed, likely a jitter or butterfly technique.' }
  ] : [
    { min: 0, name: 'Warming up', note: 'Shorter, lighter taps will lift this quickly.' },
    { min: 4, name: 'Average', note: 'Where most people start.' },
    { min: 6, name: 'Quick', note: 'Faster than most players.' },
    { min: 8, name: 'Fast', note: 'Gamer-level thumbs.' },
    { min: 10, name: 'Pro', note: 'Very fast. Few keep this up.' },
    { min: 12, name: 'Legendary', note: 'Elite speed. Screenshot it.' }
  ];

  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(NS + '_' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(NS + '_' + k, JSON.stringify(v)); } catch (e) {} }
  };

  var duration = store.get('dur', +(tool.getAttribute('data-default') || 10));
  var sound = store.get('sound', false);
  var state = 'idle', presses = [], t0 = 0, raf = 0, held = false, lastRun = null;
  var pad = $('pad');
  var audio = null;

  function fmt(n, dp) { return n.toFixed(dp == null ? 2 : dp); }
  function label(d) { return d === 0 ? 'Endless' : d + 's'; }

  function beep() {
    if (!sound) return;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      var o = audio.createOscillator(), g = audio.createGain();
      o.type = 'square'; o.frequency.value = 520 + Math.random() * 60;
      g.gain.setValueAtTime(0.05, audio.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.05);
      o.connect(g); g.connect(audio.destination); o.start(); o.stop(audio.currentTime + 0.06);
    } catch (e) {}
  }

  function setDuration(d) {
    duration = d; store.set('dur', d);
    chips.forEach(function (c) { c.setAttribute('aria-pressed', String(+c.getAttribute('data-t') === d)); });
    var ci = $('customSec');
    if (ci) ci.value = PRESETS.indexOf(d) === -1 ? d : '';
    reset();
  }

  function startText() {
    return MODE === 'mouse' ? 'Click <em>here</em> to start' : 'Press <em>space</em> to start';
  }

  function reset() {
    cancelAnimationFrame(raf);
    state = 'idle'; presses = []; held = false;
    $('sHits').textContent = '0';
    $('sCps').textContent = '0.00';
    $('sTimeLbl').textContent = duration === 0 ? 'Elapsed' : 'Time left';
    $('sTime').textContent = duration === 0 ? '0.00' : fmt(duration);
    $('progress').style.width = '0%';
    $('legend').innerHTML = startText();
    pad.classList.remove('done', 'down');
    $('result').hidden = true;
    $('copyBtn').hidden = true;
    $('stopBtn').hidden = true;
    bestStat();
  }

  function hit() {
    if (state === 'done') return;
    var now = performance.now();
    if (state === 'idle') {
      state = 'running'; t0 = now; presses = [];
      $('legend').innerHTML = duration === 0 ? 'Counting · <em>enter</em> to stop' : 'Keep <em>going</em>';
      $('stopBtn').hidden = duration !== 0;
      raf = requestAnimationFrame(tick);
    }
    presses.push(now - t0);
    $('sHits').textContent = presses.length;
    beep();
  }

  function tick() {
    var el = (performance.now() - t0) / 1000;
    if (duration && el >= duration) { finish(duration); return; }
    $('sTime').textContent = duration ? fmt(Math.max(0, duration - el)) : fmt(el);
    $('progress').style.width = duration ? (el / duration * 100) + '%' : '100%';
    $('sCps').textContent = fmt(presses.length / Math.max(el, 0.5));
    raf = requestAnimationFrame(tick);
  }

  function finish(forced) {
    cancelAnimationFrame(raf);
    var el = forced != null ? forced : (performance.now() - t0) / 1000;
    state = 'done';
    var valid = presses.filter(function (p) { return p <= el * 1000; });
    var hits = valid.length, secs = Math.max(el, 0.001), cps = hits / secs;

    var n = Math.max(1, Math.ceil(secs - 1e-9));
    var buckets = []; for (var b = 0; b < n; b++) buckets.push(0);
    valid.forEach(function (p) { buckets[Math.min(n - 1, Math.floor(p / 1000))]++; });

    var peak = 0, j = 0;
    for (var i = 0; i < valid.length; i++) {
      while (valid[i] - valid[j] >= 1000) j++;
      peak = Math.max(peak, i - j + 1);
    }

    var full = buckets.slice(0, Math.floor(secs)), cons = 100;
    if (full.length > 1) {
      var m = full.reduce(function (a, c) { return a + c; }, 0) / full.length;
      var sd = Math.sqrt(full.reduce(function (a, c) { return a + (c - m) * (c - m); }, 0) / full.length);
      cons = m ? Math.max(0, Math.round(100 - sd / m * 100)) : 0;
    } else { cons = null; }

    $('sTime').textContent = duration ? '0.00' : fmt(secs);
    $('progress').style.width = '100%';
    $('sCps').textContent = fmt(cps);
    $('legend').innerHTML = 'Done · <em>enter</em> to retry';
    pad.classList.add('done'); pad.classList.remove('down');
    $('stopBtn').hidden = true;

    var ti = 0;
    TIERS.forEach(function (t, k) { if (cps >= t.min) ti = k; });
    var tier = TIERS[ti];
    var shownTime = duration === 0 ? Math.round(secs) + 's' : duration + 's';
    $('rankName').textContent = tier.name;
    $('rankSub').textContent = hits + (MODE === 'mouse' ? ' clicks' : ' hits') + ' in ' + shownTime + '. ' + tier.note;
    $('rHits').textContent = hits;
    $('rCps').textContent = fmt(cps);
    $('rPeak').textContent = peak;
    $('rCons').textContent = cons == null ? '–' : cons + '%';
    ladder(ti);

    var bests = store.get('bests', {}), key = String(duration), prev = bests[key];
    var pb = hits > 0 && (!prev || cps > prev.cps);
    if (pb) bests[key] = { hits: hits, cps: cps, date: Date.now() };
    store.set('bests', bests);
    $('pbBadge').hidden = !pb;

    var hist = store.get('hist', []);
    hist.unshift({ mode: duration, secs: secs, hits: hits, cps: cps });
    store.set('hist', hist.slice(0, 10));

    lastRun = { hits: hits, cps: cps, secs: secs, tier: tier.name, buckets: buckets, time: shownTime };
    $('result').hidden = false;
    $('copyBtn').hidden = false;
    chart(buckets, secs);
    bestStat(); bestsTable(); historyTable();
  }

  function ladder(active) {
    $('ladder').innerHTML = TIERS.map(function (t, i) {
      var nx = TIERS[i + 1];
      return '<div class="' + (i === active ? 'on' : '') + '"><b>' + t.name + '</b>' + (nx ? t.min + '–' + nx.min : t.min + '+') + ' cps</div>';
    }).join('');
  }

  function chart(buckets, secs) {
    var c = $('chart'); if (!c) return;
    var dpr = window.devicePixelRatio || 1, w = c.clientWidth, h = c.clientHeight;
    if (!w) return;
    c.width = w * dpr; c.height = h * dpr;
    var g = c.getContext('2d'); g.scale(dpr, dpr);
    var cs = getComputedStyle(document.documentElement);
    var ink = cs.getPropertyValue('--muted').trim(), line = cs.getPropertyValue('--line').trim(), acc = cs.getPropertyValue('--brand').trim();
    var pl = 28, pb = 20, pt = 10, pr = 6, cw = w - pl - pr, ch = h - pt - pb;
    var vals = buckets.map(function (v, i) { var len = Math.min(1, secs - i); return len > 0.05 ? v / len : v; });
    var maxV = Math.max(4, Math.ceil(Math.max.apply(null, vals) / 2) * 2);
    g.font = '11px ' + cs.getPropertyValue('--mono');
    g.textBaseline = 'middle'; g.textAlign = 'right';
    for (var y = 0; y <= maxV; y += maxV / 2) {
      var py = pt + ch - (y / maxV) * ch;
      g.strokeStyle = line; g.lineWidth = 1; g.beginPath(); g.moveTo(pl, py); g.lineTo(w - pr, py); g.stroke();
      g.fillStyle = ink; g.fillText(String(Math.round(y)), pl - 6, py);
    }
    var n = vals.length, slot = cw / n, bw = Math.max(2, Math.min(slot * 0.7, 40));
    g.fillStyle = acc;
    vals.forEach(function (v, i) {
      var bh = (v / maxV) * ch, x = pl + i * slot + (slot - bw) / 2, yy = pt + ch - bh, r = Math.min(4, bw / 2, bh);
      g.beginPath(); g.moveTo(x, pt + ch); g.lineTo(x, yy + r); g.quadraticCurveTo(x, yy, x + r, yy);
      g.lineTo(x + bw - r, yy); g.quadraticCurveTo(x + bw, yy, x + bw, yy + r); g.lineTo(x + bw, pt + ch); g.closePath(); g.fill();
    });
    g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.fillStyle = ink;
    var step = Math.ceil(n / 10);
    for (var k = 0; k < n; k += step) g.fillText((k + 1) + 's', pl + k * slot + slot / 2, h - 4);
  }

  function bestStat() {
    var b = store.get('bests', {})[String(duration)];
    $('sBest').textContent = b ? fmt(b.cps) : '–';
    $('sBestLbl').textContent = 'Best CPS · ' + label(duration);
  }
  function bestsTable() {
    var b = store.get('bests', {});
    var keys = Object.keys(b).map(Number).sort(function (x, y) { return (x || 1e9) - (y || 1e9); });
    $('bestsBox').innerHTML = keys.length ? '<table class="mini"><thead><tr><th>Mode</th><th>' + (MODE === 'mouse' ? 'Clicks' : 'Hits') + '</th><th>CPS</th></tr></thead><tbody>' +
      keys.map(function (k) { return '<tr><td>' + label(k) + '</td><td>' + b[k].hits + '</td><td>' + fmt(b[k].cps) + '</td></tr>'; }).join('') + '</tbody></table>'
      : '<p class="empty">Finish a run to set your first record. Each time mode keeps its own best.</p>';
  }
  function historyTable() {
    var h = store.get('hist', []);
    $('historyBox').innerHTML = h.length ? '<table class="mini"><thead><tr><th>Mode</th><th>' + (MODE === 'mouse' ? 'Clicks' : 'Hits') + '</th><th>CPS</th></tr></thead><tbody>' +
      h.map(function (r) { return '<tr><td>' + (r.mode === 0 ? 'Endless ' + Math.round(r.secs) + 's' : r.mode + 's') + '</td><td>' + r.hits + '</td><td>' + fmt(r.cps) + '</td></tr>'; }).join('') + '</tbody></table>'
      : '<p class="empty">Your last 10 runs appear here.</p>';
  }

  /* ---- input ---- */
  var isField = function (t) { return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable); };
  document.addEventListener('keydown', function (e) {
    if (isField(e.target)) return;
    if (e.code === 'Space' || e.key === ' ') {
      if (MODE !== 'space') { if (e.target === pad) e.preventDefault(); return; }
      e.preventDefault();
      if (e.repeat || held) return;
      held = true;
      if (state !== 'done') pad.classList.add('down');
      hit();
    } else if (e.key === 'Enter') {
      if (e.target && e.target.tagName === 'BUTTON' && e.target.id !== 'restartBtn') return;
      e.preventDefault();
      if (state === 'running' && duration === 0) finish(); else reset();
    } else if (e.key === 'Escape' && state === 'running' && duration === 0) {
      finish();
    }
  });
  document.addEventListener('keyup', function (e) {
    if (e.code === 'Space' || e.key === ' ') { held = false; pad.classList.remove('down'); }
  });
  window.addEventListener('blur', function () { held = false; pad.classList.remove('down'); });

  pad.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    if (state !== 'done') pad.classList.add('down');
    hit();
  });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) { pad.addEventListener(ev, function () { pad.classList.remove('down'); }); });
  pad.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  chips.forEach(function (c) { c.addEventListener('click', function () { setDuration(+c.getAttribute('data-t')); c.blur(); }); });
  var ci = $('customSec');
  if (ci) {
    ci.addEventListener('change', function () { var v = Math.round(+ci.value); if (v >= 1 && v <= 600) setDuration(v); ci.blur(); });
    ci.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); ci.blur(); } });
  }
  $('restartBtn').addEventListener('click', function (e) { reset(); e.currentTarget.blur(); });
  $('stopBtn').addEventListener('click', function (e) { finish(); e.currentTarget.blur(); });
  $('copyBtn').addEventListener('click', function (e) {
    var btn = e.currentTarget; btn.blur();
    if (!lastRun) return;
    var unit = MODE === 'mouse' ? 'clicked' : 'hit the spacebar';
    var txt = 'I ' + unit + ' ' + lastRun.hits + ' times in ' + lastRun.time + ' (' + fmt(lastRun.cps) + ' CPS, rank: ' + lastRun.tier + '). Can you beat it? ' + location.href.split('#')[0];
    var ok = function () { btn.textContent = 'Copied'; setTimeout(function () { btn.textContent = 'Copy score'; }, 1600); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(ok, function () { btn.textContent = 'Copy failed'; });
    else btn.textContent = 'Copy failed';
  });
  var snd = $('soundBtn');
  function soundUi() { snd.setAttribute('aria-pressed', String(sound)); snd.textContent = sound ? 'Sound on' : 'Sound off'; }
  if (snd) { soundUi(); snd.addEventListener('click', function () { sound = !sound; store.set('sound', sound); soundUi(); snd.blur(); }); }
  $('clearBtn').addEventListener('click', function (e) {
    store.set('bests', {}); store.set('hist', []); bestsTable(); historyTable(); bestStat(); e.currentTarget.blur();
  });

  var rt = 0;
  function redraw() { if (state === 'done' && lastRun) chart(lastRun.buckets, lastRun.secs); }
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(redraw, 120); }, { passive: true });
  document.addEventListener('themechange', redraw);

  setDuration(duration);
  ladder(-1);
  bestsTable(); historyTable();
})();

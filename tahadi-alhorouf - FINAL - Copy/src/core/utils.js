const _cleanups = [];

function _addCleanup(fn) { _cleanups.push(fn); }

function cleanupAll() {
  for (var i = 0; i < _cleanups.length; i++) { try { _cleanups[i](); } catch (e) {} }
  _cleanups.length = 0;
}

function go(id) {
  if (id === 'home') cleanupAll();
  document.querySelectorAll('.scr').forEach(s => s.classList.remove('on'));
  const el = document.getElementById(id);
  if (el) el.classList.add('on');
}

function confetti(team) {
  const cs = team === 'a'
    ? ['#FF5722', '#FF8A65', '#FFD700']
    : ['#4CAF50', '#81C784', '#FFD700'];
  for (let i = 0; i < 70; i++) {
    const el = document.createElement('div');
    el.className = 'cf';
    el.style.cssText = 'left:' + Math.random() * 100 + 'vw;background:' + cs[i % cs.length]
      + ';width:' + (8 + Math.random() * 10) + 'px;height:' + (8 + Math.random() * 10)
      + 'px;animation-duration:' + (2 + Math.random() * 2) + 's';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 4000);
  }
}

function showToast(msg, type) {
  type = type || '';
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast ' + type;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function togglePanel(side) {
  const panels = {
    left: document.getElementById('judge-left-panel'),
    right: document.getElementById('judge-right-panel')
  };
  const toggles = {
    left: document.getElementById('toggle-left-panel'),
    right: document.getElementById('toggle-right-panel')
  };
  const p = panels[side], t = toggles[side];
  if (!p || !t) return;
  const isCollapsed = p.classList.toggle('collapsed');
  t.textContent = isCollapsed ? (side === 'left' ? '▶' : '◀') : '☰';
}

function toggleSection(h3) {
  const ps = h3.closest('.ps');
  if (ps) ps.classList.toggle('section-collapsed');
}

function randLetters() {
  var keys = Object.keys(QBANK2);
  if (N <= keys.length) return keys.sort(function () { return Math.random() - 0.5; }).slice(0, N);
  var result = [];
  for (var i = 0; i < N; i++) result.push(keys[Math.floor(Math.random() * keys.length)]);
  return result;
}

const UQ = {};

function pickQ(letter, difficulty, category) {
  difficulty = difficulty || 'all';
  category = category || 'all';
  const bank = QBANK2[letter];
  if (!bank) return null;

  let candidates = [];
  if (difficulty === 'all') {
    for (const diff of ['easy', 'medium', 'hard']) {
      if (bank[diff]) candidates = candidates.concat(bank[diff]);
    }
  } else {
    if (bank[difficulty]) candidates = candidates.concat(bank[difficulty]);
  }

  if (category !== 'all') {
    candidates = candidates.filter(q => q.cat === category);
  }

  if (!candidates.length) return null;

  const key = letter + '_' + difficulty + '_' + category;
  if (!UQ[key]) UQ[key] = new Set();
  if (UQ[key].size >= candidates.length) UQ[key].clear();

  let idx;
  do { idx = Math.floor(Math.random() * candidates.length); } while (UQ[key].has(idx));
  UQ[key].add(idx);
  return candidates[idx];
}

function showDiffBadge(el, q) {
  if (!el || !q || !q.diff) return;
  el.className = 'diff-indicator diff-' + q.diff;
  const names = { easy: '🟢 سهل', medium: '🟡 متوسط', hard: '🔴 صعب' };
  el.textContent = names[q.diff] || q.diff;
}

function showCatBadge(el, q) {
  if (!el || !q || !q.cat) return;
  el.className = 'cat-tag';
  el.textContent = q.cat;
}

function setDiff(btn, mode) {
  var containerId = mode === 'j' ? 'jdiff-filter' : 'ldiff-filter';
  var container = document.getElementById(containerId);
  if (!container) return;
  container.querySelectorAll('.diff-btn').forEach(function (b) { b.className = 'diff-btn'; });
  btn.classList.add('active-' + (btn.dataset.diff === 'all' ? 'all' : btn.dataset.diff));
  if (mode === 'j') setJudgeDiff(btn.dataset.diff);
  else setLocalDiff(btn.dataset.diff);
}

function setCat(btn, mode) {
  var containerId = mode === 'j' ? 'jcat-filter' : 'lcat-filter';
  var container = document.getElementById(containerId);
  if (!container) return;
  container.querySelectorAll('.cat-btn').forEach(function (b) { b.classList.remove('active'); });
  btn.classList.add('active');
  if (mode === 'j') setJudgeCat(btn.dataset.cat);
  else setLocalCat(btn.dataset.cat);
}

function setLiveDiff(btn) {
  var container = document.getElementById('j-live-diff');
  if (!container) return;
  container.querySelectorAll('.diff-btn').forEach(function (b) { b.className = 'diff-btn'; });
  btn.classList.add('active-' + (btn.dataset.diff === 'all' ? 'all' : btn.dataset.diff));
  setJudgeDiff(btn.dataset.diff);
}

function setLiveCat(btn) {
  var container = document.getElementById('j-live-cat');
  if (!container) return;
  container.querySelectorAll('.cat-btn').forEach(function (b) { b.classList.remove('active'); });
  btn.classList.add('active');
  setJudgeCat(btn.dataset.cat);
}

function _darken(hex, amt) {
  var r = Math.max(0, parseInt(hex.slice(1,3), 16) - amt);
  var g = Math.max(0, parseInt(hex.slice(3,5), 16) - amt);
  var b = Math.max(0, parseInt(hex.slice(5,7), 16) - amt);
  return '#' + r.toString(16).padStart(2,'0') + g.toString(16).padStart(2,'0') + b.toString(16).padStart(2,'0');
}

function _hexToRgb(hex) {
  return parseInt(hex.slice(1,3), 16) + ',' + parseInt(hex.slice(3,5), 16) + ',' + parseInt(hex.slice(5,7), 16);
}

function applyTeamColors(colorA, colorB) {
  var root = document.documentElement;
  root.style.setProperty('--A', colorA || '#FF5722');
  root.style.setProperty('--B', colorB || '#4CAF50');
  root.style.setProperty('--A2', _darken(colorA || '#FF5722', 60));
  root.style.setProperty('--B2', _darken(colorB || '#4CAF50', 60));
  root.style.setProperty('--A-rgb', _hexToRgb(colorA || '#FF5722'));
  root.style.setProperty('--B-rgb', _hexToRgb(colorB || '#4CAF50'));
}

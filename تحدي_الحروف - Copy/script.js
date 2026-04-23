/* ════════════════════════════════════════
   script.js — النسخة النهائية المُصحَّحة
   ════════════════════════════════════════ */

function go(id) {
  document.querySelectorAll('.scr').forEach(s => s.classList.remove('on'));
  document.getElementById(id).classList.add('on');
}

function confetti(team) {
  const cs = team === 'a' ? ['#FF5722', '#FF8A65', '#FFD700'] : ['#4CAF50', '#81C784', '#FFD700'];
  for (let i = 0; i < 70; i++) {
    const el = document.createElement('div');
    el.className = 'cf';
    el.style.cssText = `left:${Math.random() * 100}vw;background:${cs[i % cs.length]};width:${8 + Math.random() * 10}px;height:${8 + Math.random() * 10}px;animation-duration:${2 + Math.random() * 2}s`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 4000);
  }
}

function showToast(msg, type = '') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast ' + type;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

const COLS = 5, ROWS = 5, N = 25;
function getHW() { return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--HW')) || 68; }
function hexPos(i, scale = 1) {
  const HW = getHW() * scale, HH = HW * 0.866;
  const col = i % COLS, row = Math.floor(i / COLS), odd = col % 2 === 1;
  return { x: col * HW * 0.75, y: row * HH + (odd ? HH * 0.5 : 0), w: HW, h: HH };
}
function boardDims(scale = 1) {
  const HW = getHW() * scale, HH = HW * 0.866;
  return { W: (COLS - 1) * HW * 0.75 + HW, H: (ROWS - 1) * HH + HH * 0.5 + HH };
}
function hexNbrs(i) {
  const col = i % COLS, row = Math.floor(i / COLS), odd = col % 2 === 1;
  const dirs = odd ? [[0, -1], [0, 1], [-1, 0], [-1, 1], [1, 0], [1, 1]] : [[0, -1], [0, 1], [-1, -1], [-1, 0], [1, -1], [1, 0]];
  const res = [];
  for (const [dc, dr] of dirs) { const nc = col + dc, nr = row + dr; if (nc >= 0 && nc < COLS && nr >= 0 && nr < ROWS) res.push(nr * COLS + nc); }
  return res;
}
function bfsWin(owner, team) {
  let starts, endSet;
  if (team === 'a') {
    starts = [...Array(ROWS)].map((_, r) => r * COLS).filter(i => owner[i] === team);
    endSet = new Set([...Array(ROWS)].map((_, r) => r * COLS + (COLS - 1)).filter(i => owner[i] === team));
  } else {
    starts = [...Array(COLS)].map((_, c) => c).filter(i => owner[i] === team);
    endSet = new Set([...Array(COLS)].map((_, c) => (ROWS - 1) * COLS + c).filter(i => owner[i] === team));
  }
  const vis = new Set(), q = [...starts];
  while (q.length) {
    const cur = q.shift(); if (endSet.has(cur)) return true; if (vis.has(cur)) continue; vis.add(cur);
    for (const nb of hexNbrs(cur)) if (!vis.has(nb) && owner[nb] === team) q.push(nb);
  }
  return false;
}
function randLetters() { return Object.keys(QBANK).sort(() => Math.random() - .5).slice(0, N); }

const UQ = {};
function pickQ(letter) {
  if (typeof QBANK2 !== 'undefined' && QBANK2[letter] && (GAME_DIFF !== 'all' || GAME_CAT !== 'all')) {
    const q2 = pickQ2(letter);
    if (q2) return q2;
  }
  const qs = QBANK[letter]; if (!qs || !qs.length) return null;
  if (!UQ[letter]) UQ[letter] = new Set();
  const u = UQ[letter]; if (u.size >= qs.length) u.clear();
  let idx; do { idx = Math.floor(Math.random() * qs.length); } while (u.has(idx));
  u.add(idx); return qs[idx];
}

function renderHexBoard(boardEl, letters, owner, activeCell, clickFn, scale = 1) {
  const { W, H } = boardDims(scale);
  boardEl.style.width = W + 'px'; boardEl.style.height = H + 'px'; boardEl.innerHTML = '';
  letters.forEach((l, i) => {
    const { x, y, w, h } = hexPos(i, scale);
    const d = document.createElement('div'); d.className = 'hex';
    if (owner[i] === 'a') d.classList.add('ca');
    else if (owner[i] === 'b') d.classList.add('cb');
    if (activeCell === i) d.classList.add('aq');
    d.style.cssText = `left:${x}px;top:${y}px;width:${w}px;height:${h}px;font-size:${w * .30}px;`;
    d.innerText = l;
    if (clickFn) { d.addEventListener('click', () => clickFn(i)); d.addEventListener('touchend', e => { e.preventDefault(); clickFn(i); }, { passive: false }); }
    boardEl.appendChild(d);
  });
}

/* ========== لعبة محلية ========== */
let LG = { teamA: 'الفريق الأحمر', teamB: 'الفريق الأخضر', roundsToWin: 2, round: 1, pts: { a: 0, b: 0 }, rndWins: { a: 0, b: 0 }, letters: [], owner: Array(N).fill(null), activeCell: null, activeQ: null, timerInt: null };

function startLocal() {
  LG.teamA = document.getElementById('lta').value.trim() || 'الفريق الأحمر';
  LG.teamB = document.getElementById('ltb').value.trim() || 'الفريق الأخضر';
  LG.roundsToWin = parseInt(document.getElementById('lrw').value);
  LG.round = 0; LG.pts = { a: 0, b: 0 }; LG.rndWins = { a: 0, b: 0 };
  document.getElementById('lqb-a').innerText = '✅ فوز ' + LG.teamA.substr(0, 7);
  document.getElementById('lqb-b').innerText = '✅ فوز ' + LG.teamB.substr(0, 7);
  go('local-game'); resetLocal();
}

function resetLocal() {
  clearInterval(LG.timerInt); lCloseModal(); document.getElementById('local-win').classList.remove('on');
  LG.letters = randLetters(); LG.owner = Array(N).fill(null); LG.pts = { a: 0, b: 0 }; LG.activeCell = null; LG.activeQ = null;
  Object.keys(UQ).forEach(k => delete UQ[k]); LG.round++; lUpdateUI();
  renderHexBoard(document.getElementById('local-board'), LG.letters, LG.owner, null, lHexClick);
}

function lHexClick(i) {
  if (LG.owner[i]) return; LG.activeCell = i;
  LG.activeQ = pickQ(LG.letters[i]); if (!LG.activeQ) return;
  renderHexBoard(document.getElementById('local-board'), LG.letters, LG.owner, i, lHexClick);
  document.getElementById('lq-letter').innerText = '✨ سؤال حرف (' + LG.letters[i] + ')';
  lShowDiffBadge(LG.activeQ);
  document.getElementById('lq-text').innerText = LG.activeQ.q;
  document.getElementById('lq-ans').innerText = '✅ الإجابة: ' + LG.activeQ.a;
  document.getElementById('lq-ans').style.display = 'none';
  document.getElementById('lq-timer').innerText = '20'; document.getElementById('lq-timer').classList.remove('urg');
  document.getElementById('lv-ov').classList.add('on'); document.getElementById('lv-qm').classList.add('on');
  clearInterval(LG.timerInt); let t = 20; const el = document.getElementById('lq-timer');
  LG.timerInt = setInterval(() => { t--; el.innerText = t; if (t <= 5) el.classList.add('urg'); if (t <= 0) { clearInterval(LG.timerInt); lShowAns(); } }, 1000);
}

function lShowAns() { clearInterval(LG.timerInt); document.getElementById('lq-ans').style.display = 'block'; }
function lNextQ() { if (LG.activeCell === null) return; LG.activeQ = pickQ(LG.letters[LG.activeCell]); if (!LG.activeQ) return; document.getElementById('lq-text').innerText = LG.activeQ.q; document.getElementById('lq-ans').innerText = '✅ الإجابة: ' + LG.activeQ.a; document.getElementById('lq-ans').style.display = 'none'; clearInterval(LG.timerInt); lHexClick(LG.activeCell); }
function lMark(team) { if (LG.activeCell === null) return; LG.owner[LG.activeCell] = team; LG.pts[team]++; clearInterval(LG.timerInt); lCloseModal(); renderHexBoard(document.getElementById('local-board'), LG.letters, LG.owner, null, lHexClick); lUpdateUI(); if (bfsWin(LG.owner, team)) { lShowWinner(team); return; } if (LG.owner.every(o => o)) lShowWinner(LG.pts.a >= LG.pts.b ? 'a' : 'b'); }
function lCloseModal() { clearInterval(LG.timerInt); document.getElementById('lv-ov').classList.remove('on'); document.getElementById('lv-qm').classList.remove('on'); LG.activeCell = null; renderHexBoard(document.getElementById('local-board'), LG.letters, LG.owner, null, lHexClick); }
function lShowWinner(team) { LG.rndWins[team]++; lUpdateUI(); const nm = team === 'a' ? LG.teamA : LG.teamB; const col = team === 'a' ? 'var(--A)' : 'var(--B)'; document.getElementById('lw-nm').innerHTML = '<span style="color:' + col + '">' + nm + '</span>'; document.getElementById('lw-sb').innerText = '🏆 فاز بالجولة ' + LG.round + ' — جولات: ' + LG.rndWins[team] + '/' + LG.roundsToWin; document.getElementById('local-win').classList.add('on'); confetti(team); if (LG.rndWins[team] >= LG.roundsToWin) document.getElementById('lw-sb').innerText = '🏆 فاز باللعبة كاملة!'; }
function lUpdateUI() { document.getElementById('lsa-n').innerText = LG.teamA; document.getElementById('lsb-n').innerText = LG.teamB; document.getElementById('lsa-p').innerText = LG.pts.a; document.getElementById('lsb-p').innerText = LG.pts.b; document.getElementById('lsa-w').innerText = 'جولات: ' + LG.rndWins.a; document.getElementById('lsb-w').innerText = 'جولات: ' + LG.rndWins.b; const t = ['', 'الأولى', 'الثانية', 'الثالثة', 'الرابعة', 'الخامسة']; document.getElementById('lrlbl').innerText = 'الجولة ' + (t[LG.round] || LG.round); }

/* ========== خوادم PeerJS (تتكيف مع HTTP/HTTPS) ========== */
const PEER_SERVERS = [{ host: '0.peerjs.com', port: 443, secure: true, path: '/' }, { host: 'peerjs-server.herokuapp.com', port: 443, secure: true, path: '/' }];
let currentServerIndex = 0;
function getPeerOptions() {
  const srv = PEER_SERVERS[currentServerIndex];
  const useSecure = location.protocol === 'https:';
  return {
    host: srv.host, port: srv.port,
    secure: useSecure,
    path: srv.path, debug: 0,
    config: { iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'turn:openrelay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' },
      { urls: 'turn:openrelay.metered.ca:443', username: 'openrelayproject', credential: 'openrelayproject' }
    ] }
  };
}

/* ========== لعبة الحكم ========== */
let JS = { teamA: 'الفريق الأحمر', teamB: 'الفريق الأخضر', roundsToWin: 2, round: 1, pts: { a: 0, b: 0 }, rndWins: { a: 0, b: 0 }, letters: [], owner: Array(N).fill(null), activeCell: null, activeQ: null, phase: 'idle', bzWinner: null, timerSecs: 0, timerInt: null, players: [], code: '', peer: null, conns: [], showQuestion: false, showAnswer: false, retryTimeout: null };

function startJudge() {
  JS.teamA = document.getElementById('jta').value.trim() || 'الفريق الأحمر';
  JS.teamB = document.getElementById('jtb').value.trim() || 'الفريق الأخضر';
  JS.roundsToWin = parseInt(document.getElementById('jrw').value);
  JS.code = Math.random().toString(36).substr(2, 5).toUpperCase();
  JS.conns = []; JS.players = []; Object.keys(UQ).forEach(k => delete UQ[k]);
  go('judge-game'); jUpdateUI(); jInitBoard(); genQR();
  currentServerIndex = 0; connectJudge();
  updateJudgeCodeBadge();
}

function updateJudgeCodeBadge() {
  const badge = document.getElementById('judge-code-badge');
  if (badge) badge.textContent = '🎮 كود: ' + JS.code;
}

function connectJudge() {
  if (JS.peer) JS.peer.destroy();
  clearTimeout(JS.retryTimeout);
  try { JS.peer = new Peer('hexgame-' + JS.code, getPeerOptions()); } catch (e) { showToast('خطأ في الاتصال: ' + e.type, 'error'); return; }
  JS.peer.on('open', () => { currentServerIndex = 0; });
  JS.peer.on('connection', conn => {
    JS.conns.push(conn);
    conn.on('open', () => jBcast({ type: 'state', s: jPub() }));
    conn.on('data', d => jOnData(d));
    conn.on('close', () => { JS.conns = JS.conns.filter(c => c !== conn); });
  });
  JS.peer.on('error', e => {
    showToast('خطأ في الاتصال: ' + e.type, 'error');
    if (currentServerIndex < PEER_SERVERS.length - 1) { currentServerIndex++; connectJudge(); }
    else { currentServerIndex = 0; JS.retryTimeout = setTimeout(connectJudge, 3000); }
  });
  JS.peer.on('disconnected', () => { JS.peer.reconnect(); });
}

function jPub() { return { teamA: JS.teamA, teamB: JS.teamB, board: JS.letters.map((l, i) => ({ letter: l, owner: JS.owner[i] })), activeCell: JS.activeCell, phase: JS.phase, bzWinner: JS.bzWinner, timerSecs: JS.timerSecs, pts: JS.pts, showQuestion: JS.showQuestion, showAnswer: JS.showAnswer, activeQ: JS.activeQ }; }
function jBcast(m) { JS.conns.forEach(c => { if (c.open) c.send(m); }); }
function jOnData(d) {
  if (d.type === 'join') {
    if (!JS.players.find(p => p.id === d.id)) { JS.players.push({ name: d.name, team: d.team, id: d.id, conn: JS.conns.find(c => c.peer === d.id) }); jRenderPlayers(); }
    jBcast({ type: 'state', s: jPub() }); return;
  }
  if (d.type === 'buzz') {
    if (JS.phase !== 'open' || JS.bzWinner) return;
    JS.bzWinner = { name: d.name, team: d.team, id: d.id }; JS.phase = 'won';
    jClearTimer(); jStartTimer(5);
    jBcast({ type: 'buzzer_won', winner: JS.bzWinner });
    jBcast({ type: 'state', s: jPub() }); jRenderBz();
  }
}

function jInitBoard() {
  JS.letters = randLetters(); JS.owner = Array(N).fill(null); JS.activeCell = null; JS.activeQ = null;
  JS.phase = 'idle'; JS.bzWinner = null; JS.pts = { a: 0, b: 0 };
  jClearTimer(); renderHexBoard(document.getElementById('judge-board'), JS.letters, JS.owner, null, jHexClick);
  jRenderBz(); jUpdateScores(); document.getElementById('j-qbox').innerText = 'اختر خلية من اللوحة...'; document.getElementById('j-ans').style.display = 'none';
}

function jHexClick(i) {
  if (JS.owner[i]) return; JS.activeCell = i; JS.phase = 'open'; JS.bzWinner = null;
  JS.activeQ = pickQ(JS.letters[i]); if (!JS.activeQ) return;
  jClearTimer();
  renderHexBoard(document.getElementById('judge-board'), JS.letters, JS.owner, i, jHexClick);
  jRenderBz();
  document.getElementById('j-qbox').innerText = JS.activeQ.q;
  document.getElementById('j-ans').style.display = 'none';
  // إرسال السؤال للبروجكتر واللاعبين
  jBcast({ type: 'show_q', q: JS.activeQ.q });
  jBcast({ type: 'buzzer_ready', letter: JS.letters[i] });
  jBcast({ type: 'state', s: jPub() });
}

function jStartTimer(s) { jClearTimer(); JS.timerSecs = s; jRenderBz(); jBcast({ type: 'tick', secs: JS.timerSecs }); JS.timerInt = setInterval(() => { JS.timerSecs--; jRenderBz(); jBcast({ type: 'tick', secs: JS.timerSecs }); if (JS.timerSecs <= 0) { jClearTimer(); jTimerEnd(); } }, 1000); }
function jClearTimer() { clearInterval(JS.timerInt); JS.timerInt = null; }
function jTimerEnd() {
  if (JS.phase === 'won' && JS.bzWinner) { const other = JS.bzWinner.team === 'a' ? 'b' : 'a'; JS.phase = 'open'; JS.bzWinner = null; jStartTimer(10); jBcast({ type: 'second_chance', team: other }); }
  else { JS.phase = 'open'; JS.bzWinner = null; jBcast({ type: 'open_q' }); }
  jBcast({ type: 'state', s: jPub() }); jRenderBz();
}
function jShowAns() { if (!JS.activeQ) return; const ab = document.getElementById('j-ans'); ab.innerText = '✅ ' + JS.activeQ.a; ab.style.display = 'block'; }
function jCorrect(team) {
  if (JS.activeCell === null) return; JS.owner[JS.activeCell] = team; JS.pts[team]++; jClearTimer();
  JS.phase = 'idle'; JS.bzWinner = null; JS.activeCell = null;
  renderHexBoard(document.getElementById('judge-board'), JS.letters, JS.owner, null, jHexClick);
  jUpdateScores(); jRenderBz();
  document.getElementById('j-qbox').innerText = 'اختر خلية من اللوحة...'; document.getElementById('j-ans').style.display = 'none';
  jBcast({ type: 'correct', team }); jBcast({ type: 'state', s: jPub() });
  if (bfsWin(JS.owner, team)) { jShowWinner(team); return; }
  if (JS.owner.every(o => o)) jShowWinner(JS.pts.a >= JS.pts.b ? 'a' : 'b');
}
function jNextQ() { if (JS.activeCell === null) return; JS.activeQ = pickQ(JS.letters[JS.activeCell]); if (!JS.activeQ) return; document.getElementById('j-qbox').innerText = JS.activeQ.q; document.getElementById('j-ans').style.display = 'none'; jBcast({ type: 'show_q', q: JS.activeQ.q }); }
function jReopen() { if (JS.activeCell === null) return; JS.phase = 'open'; JS.bzWinner = null; jClearTimer(); jRenderBz(); jBcast({ type: 'buzzer_ready', letter: JS.letters[JS.activeCell] }); jBcast({ type: 'state', s: jPub() }); }
function jSkip() { if (JS.activeCell === null) return; jClearTimer(); JS.phase = 'idle'; JS.bzWinner = null; JS.activeCell = null; renderHexBoard(document.getElementById('judge-board'), JS.letters, JS.owner, null, jHexClick); jRenderBz(); jBcast({ type: 'skip' }); jBcast({ type: 'state', s: jPub() }); }
function jNewRound() { JS.round++; jInitBoard(); jUpdateUI(); jBcast({ type: 'new_round', round: JS.round }); jBcast({ type: 'state', s: jPub() }); document.getElementById('judge-win').classList.remove('on'); }
function jShowWinner(team) { JS.rndWins[team]++; jUpdateScores(); const nm = team === 'a' ? JS.teamA : JS.teamB; const col = team === 'a' ? 'var(--A)' : 'var(--B)'; document.getElementById('jw-em').innerText = team === 'a' ? '🟠' : '🟢'; document.getElementById('jw-nm').innerHTML = '<span style="color:' + col + '">' + nm + '</span>'; document.getElementById('jw-sb').innerText = '🏆 فاز بالجولة ' + JS.round + ' — جولات: ' + JS.rndWins[team] + '/' + JS.roundsToWin; document.getElementById('judge-win').classList.add('on'); confetti(team); jBcast({ type: 'round_win', team, rndWins: JS.rndWins }); if (JS.rndWins[team] >= JS.roundsToWin) { document.getElementById('jw-sb').innerText = '🏆 فاز باللعبة كاملة!'; jBcast({ type: 'game_win', team }); } }
function jToggleQuestion() { JS.showQuestion = !JS.showQuestion; const btn = document.getElementById('j-toggle-q'); btn.innerText = JS.showQuestion ? '🙈 أخفِ السؤال' : '👁 أظهر السؤال'; btn.style.background = JS.showQuestion ? '#e74c3c' : '#2ecc71'; jBcast({ type: 'toggle_question', show: JS.showQuestion, q: JS.activeQ ? JS.activeQ.q : '' }); }
function jToggleAnswer() { JS.showAnswer = !JS.showAnswer; const btn = document.getElementById('j-toggle-a'); btn.innerText = JS.showAnswer ? '🙈 أخفِ الإجابة' : '👁 أظهر الإجابة'; btn.style.background = JS.showAnswer ? '#e74c3c' : '#e67e22'; jBcast({ type: 'toggle_answer', show: JS.showAnswer, answer: JS.activeQ ? JS.activeQ.a : '' }); }

function jRenderBz() {
  const bz = document.getElementById('jbz-disp'); if (!bz) return;
  if (JS.phase === 'idle') { bz.innerHTML = '<div class="bzidle">اختر خلية لبدء السؤال...</div>'; return; }
  if (JS.phase === 'open' && !JS.bzWinner) { bz.innerHTML = '<div class="bzidle" style="color:var(--GOLD)">⚡ البازر مفتوح للجميع!</div>'; return; }
  if (JS.bzWinner) { const cls = 'bzwin bzw' + JS.bzWinner.team; const tn = JS.bzWinner.team === 'a' ? JS.teamA : JS.teamB; bz.innerHTML = `<div class="${cls}"><div class="bzname">⚡ ${JS.bzWinner.name}</div><div class="bzsub">${tn}</div><div class="bzcount">${JS.timerSecs}</div></div>`; }
}
function jUpdateUI() { document.getElementById('ja-n').innerText = JS.teamA; document.getElementById('jb-n').innerText = JS.teamB; document.getElementById('jb-ca').innerText = '✅ صح (' + JS.teamA.substr(0, 7) + ')'; document.getElementById('jb-cb').innerText = '✅ صح (' + JS.teamB.substr(0, 7) + ')'; const t = ['', 'الأولى', 'الثانية', 'الثالثة', 'الرابعة', 'الخامسة']; document.getElementById('j-title').innerText = 'الجولة ' + (t[JS.round] || JS.round) + ' 🏆'; document.getElementById('j-rnd').innerText = 'الجولة ' + JS.round; }
function jUpdateScores() { document.getElementById('ja-p').innerText = JS.pts.a; document.getElementById('jb-p').innerText = JS.pts.b; document.getElementById('ja-w').innerText = 'جولات: ' + JS.rndWins.a; document.getElementById('jb-w').innerText = 'جولات: ' + JS.rndWins.b; }
function jRenderPlayers() { const pl = document.getElementById('j-players'); if (!pl) return; if (!JS.players.length) { pl.innerHTML = '<div class="bzidle">لا يوجد لاعبون...</div>'; return; } pl.innerHTML = JS.players.map(p => { const teamColor = p.team === 'a' ? 'var(--A)' : 'var(--B)'; return `<div class="plitem p${p.team}"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${teamColor};margin-left:4px;"></span><span style="flex:1;">${p.name}</span><span style="opacity:.6;font-size:.72rem;">${p.team==='a'?JS.teamA:JS.teamB}</span><button class="plkick" onclick="jKickPlayer('${p.id}')" title="طرد اللاعب">✕</button></div>`; }).join(''); }
function jKickPlayer(playerId) { const player = JS.players.find(p => p.id === playerId); if (!player) return; const conn = JS.conns.find(c => c.peer === playerId); if (conn && conn.open) conn.send({ type: 'kicked' }); if (conn) conn.close(); JS.players = JS.players.filter(p => p.id !== playerId); JS.conns = JS.conns.filter(c => c.peer !== playerId); jRenderPlayers(); jBcast({ type: 'state', s: jPub() }); }

/* ========== لاعب ========== */
let PM = { name: '', team: '', id: '' }, pSelT = '', pPeer = null, pConn = null, pBzEnabled = false, pCdI = null, pGS = null, pRetryTimeout = null;
function pSelTeam(t) { pSelT = t; document.getElementById('ptbtn-a').className = 'ptbtn' + (t === 'a' ? ' psa' : ''); document.getElementById('ptbtn-b').className = 'ptbtn' + (t === 'b' ? ' psb' : ''); }
function pJoin() {
  const name = document.getElementById('pname').value.trim(); const code = (document.getElementById('pcode').value.trim() || '').toUpperCase(); const err = document.getElementById('perr');
  if (!name) { err.innerText = 'يرجى إدخال اسمك'; err.style.display = 'block'; setTimeout(() => err.style.display = 'none', 2500); return; }
  if (!pSelT) { err.innerText = 'يرجى اختيار فريقك'; err.style.display = 'block'; setTimeout(() => err.style.display = 'none', 2500); return; }
  if (!code) { err.innerText = 'يرجى إدخال كود الجلسة'; err.style.display = 'block'; setTimeout(() => err.style.display = 'none', 2500); return; }
  PM = { name, team: pSelT, id: 'p_' + Math.random().toString(36).substr(2, 8) };
  currentServerIndex = 0; connectPlayer(code);
}
function updatePlayerCodeBadge() { const code = PM.code || document.getElementById('pcode').value.trim().toUpperCase(); const elWait = document.getElementById('player-wait-code'); const elBz = document.getElementById('player-bz-code'); if (elWait) elWait.textContent = '🎮 كود: ' + code; if (elBz) elBz.textContent = '🎮 كود: ' + code; }
function connectPlayer(code) {
  if (pPeer) pPeer.destroy(); clearTimeout(pRetryTimeout);
  try { pPeer = new Peer(getPeerOptions()); } catch (e) { showToast('خطأ: ' + e.type, 'error'); return; }
  pPeer.on('open', () => {
    pConn = pPeer.connect('hexgame-' + code, { reliable: true });
    pConn.on('open', () => { pConn.send({ type: 'join', name: PM.name, team: PM.team, id: PM.id }); PM.code = code; updatePlayerCodeBadge(); pShowWait(); });
    pConn.on('data', pOnData);
  });
  pPeer.on('error', e => {
    showToast('خطأ في الاتصال: ' + e.type, 'error');
    if (currentServerIndex < PEER_SERVERS.length - 1) { currentServerIndex++; connectPlayer(code); }
    else { currentServerIndex = 0; pRetryTimeout = setTimeout(() => connectPlayer(code), 3000); }
  });
  pPeer.on('disconnected', () => { pPeer.reconnect(); });
}

function pShowWait() {
  go('player-wait'); const tn = pGS ? (PM.team === 'a' ? pGS.teamA : pGS.teamB) : (PM.team === 'a' ? 'الفريق أ' : 'الفريق ب');
  document.getElementById('pav').className = 'pavatar ' + (PM.team === 'a' ? 'pava' : 'pavb'); document.getElementById('pav').innerText = PM.team === 'a' ? '🟠' : '🟢';
  document.getElementById('pwn').className = 'pwname t' + PM.team; document.getElementById('pwn').innerText = PM.name;
  document.getElementById('pbdg').innerHTML = '<div class="pbadge pb' + PM.team + '">' + tn + '</div>';
  document.getElementById('pwmsg').innerText = 'في انتظار اختيار سؤال...';
}

function pOnData(d) {
  if (d.type === 'kicked') { showToast('لقد تم طردك من اللعبة من قبل الحكم.', 'error'); pPeer.destroy(); go('player-join'); return; }
  if (d.type === 'state') { pGS = d.s; renderMiniBoard(pGS.board); return; }
  if (d.type === 'buzzer_ready') { pActivateBz(); return; }
  if (d.type === 'show_q') { const qc = document.getElementById('pbz-q'); qc.innerText = '❓ ' + d.q; qc.style.display = pGS && pGS.showQuestion ? 'block' : 'none'; return; }
  if (d.type === 'buzzer_won') { pOnBwon(d.winner); return; }
  if (d.type === 'second_chance') { pOnSecond(d.team); return; }
  if (d.type === 'open_q') { pOnOpen(); return; }
  if (d.type === 'tick') { const rc = document.getElementById('pres-cnt'); if (rc) rc.innerText = d.secs; return; }
  if (d.type === 'correct' || d.type === 'skip' || d.type === 'new_round') { pResetWait(); return; }
  if (d.type === 'toggle_question') { const qc = document.getElementById('pbz-q'); if (d.show && pGS && pGS.activeQ) qc.innerText = '❓ ' + pGS.activeQ.q; qc.style.display = d.show ? 'block' : 'none'; }
  if (d.type === 'toggle_answer') { const ac = document.getElementById('pbz-ans'); if (d.show) ac.innerText = '✅ الإجابة: ' + d.answer; ac.style.display = d.show ? 'block' : 'none'; }
}

function renderMiniBoard(board) { if (!board) return; const wrap = document.getElementById('miniBoardWrap'); wrap.innerHTML = ''; const scale = 0.55; const container = document.createElement('div'); container.style.position = 'relative'; const { W, H } = boardDims(scale); container.style.width = W + 'px'; container.style.height = H + 'px'; wrap.appendChild(container); board.forEach((c, i) => { const { x, y, w, h } = hexPos(i, scale); const d = document.createElement('div'); d.className = 'mini-hex'; if (c.owner === 'a') d.classList.add('a'); else if (c.owner === 'b') d.classList.add('b'); d.style.cssText = 'left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + h + 'px;font-size:' + (w * .35) + 'px;'; d.innerText = c.letter; container.appendChild(d); }); }
function pActivateBz() { pBzEnabled = true; go('player-bz'); const btn = document.getElementById('main-bz'); btn.className = 'bzbtn bz' + PM.team + ' rdy'; btn.innerHTML = '<span class="bzic">⚡</span><span class="bzlbl">اضغط الآن!</span>'; document.getElementById('pres').style.display = 'none'; document.getElementById('pbz-st').innerText = '⚡ اضغط البازر بأسرع ما يمكن!'; document.getElementById('pbz-st').style.color = 'var(--GOLD)'; if (document.getElementById('pbz-q')) document.getElementById('pbz-q').style.display = 'none'; if (document.getElementById('pbz-ans')) document.getElementById('pbz-ans').style.display = 'none'; updatePlayerCodeBadge(); }
function pPressBz(e) { if (e) e.preventDefault(); if (!pBzEnabled) return; pBzEnabled = false; if (navigator.vibrate) navigator.vibrate([60, 30, 80]); if (pConn && pConn.open) pConn.send({ type: 'buzz', name: PM.name, team: PM.team, id: PM.id }); }
function pOnBwon(w) { const isMe = w.id === PM.id; const btn = document.getElementById('main-bz'); if (isMe) { btn.className = 'bzbtn bz' + PM.team; btn.innerHTML = '<span class="bzic">🎤</span><span class="bzlbl">أجب الآن!</span>'; pSetRes(PM.name + ' 🎉', '⚡ أنت الأول! أجب على الحكم', 5, 'var(--' + (PM.team === 'a' ? 'A' : 'B') + ')'); document.getElementById('pbz-st').innerText = '✅ أنت الأول!'; } else { btn.className = 'bzbtn bz' + PM.team + ' off'; btn.innerHTML = '<span class="bzic">⏳</span><span class="bzlbl">' + w.name + '</span>'; pSetRes(w.name, 'يحاول الإجابة الآن...', 5, 'var(--' + (w.team === 'a' ? 'A' : 'B') + ')'); document.getElementById('pbz-st').innerText = 'سبقك ' + w.name; } }
function pOnSecond(team) { const mine = team === PM.team; const btn = document.getElementById('main-bz'); if (mine) { pBzEnabled = true; btn.className = 'bzbtn bz' + PM.team + ' rdy'; btn.innerHTML = '<span class="bzic">🔥</span><span class="bzlbl">فرصتكم!</span>'; document.getElementById('pres').style.display = 'none'; document.getElementById('pbz-st').innerText = '🔥 الفرصة الثانية! اضغط الآن!'; document.getElementById('pbz-st').style.color = 'var(--GOLD)'; } else { btn.className = 'bzbtn bz' + PM.team + ' off'; btn.innerHTML = '<span class="bzic">⏳</span><span class="bzlbl">انتظر</span>'; document.getElementById('pbz-st').innerText = 'الفريق الآخر يجيب...'; } }
function pOnOpen() { pBzEnabled = true; const btn = document.getElementById('main-bz'); btn.className = 'bzbtn bz' + PM.team + ' rdy'; btn.innerHTML = '<span class="bzic">🔓</span><span class="bzlbl">الكل يجيب!</span>'; document.getElementById('pres').style.display = 'none'; document.getElementById('pbz-st').innerText = '🔓 مفتوح للجميع!'; document.getElementById('pbz-st').style.color = 'var(--GOLD)'; }
function pSetRes(nm, sub, secs, color) { const rc = document.getElementById('pres'); rc.style.display = 'block'; document.getElementById('pres-nm').style.color = color; document.getElementById('pres-nm').innerText = nm; document.getElementById('pres-sub').innerText = sub; clearInterval(pCdI); let t = secs; document.getElementById('pres-cnt').innerText = t; pCdI = setInterval(() => { t--; document.getElementById('pres-cnt').innerText = Math.max(0, t); if (t <= 0) clearInterval(pCdI); }, 1000); }
function pResetWait() { pBzEnabled = false; clearInterval(pCdI); go('player-wait'); document.getElementById('pwmsg').innerText = 'في انتظار اختيار سؤال جديد...'; if (document.getElementById('pbz-q')) document.getElementById('pbz-q').style.display = 'none'; if (document.getElementById('pbz-ans')) document.getElementById('pbz-ans').style.display = 'none'; if (document.getElementById('pres')) document.getElementById('pres').style.display = 'none'; updatePlayerCodeBadge(); }

/* ========== تحكم الألواح الجانبية ========== */
function togglePanel(side) {
  if (side === 'left') { const panel = document.getElementById('judge-left-panel'); const btn = document.getElementById('toggle-left-panel'); if (panel) { panel.classList.toggle('collapsed'); if (btn) btn.textContent = panel.classList.contains('collapsed') ? '▶' : '☰'; } }
  else if (side === 'right') { const panel = document.getElementById('judge-right-panel'); const btn = document.getElementById('toggle-right-panel'); if (panel) { panel.classList.toggle('collapsed'); if (btn) btn.textContent = panel.classList.contains('collapsed') ? '◀' : '☰'; } }
  else if (side === 'display-left') { const panel = document.getElementById('display-left-panel'); const btn = document.getElementById('toggle-display-left'); if (panel) { panel.classList.toggle('collapsed'); if (btn) btn.textContent = panel.classList.contains('collapsed') ? '▶' : '☰'; } }
  else if (side === 'display-right') { const panel = document.getElementById('display-right-panel'); const btn = document.getElementById('toggle-display-right'); if (panel) { panel.classList.toggle('collapsed'); if (btn) btn.textContent = panel.classList.contains('collapsed') ? '◀' : '☰'; } }
}
function toggleSection(headerElement) { const section = headerElement.parentElement; if (!section) return; section.classList.toggle('section-collapsed'); }

/* ========== QR ========== */
function getPlayerURL() { return window.location.href.split('?')[0] + '?mode=player&code=' + JS.code; }
function getDisplayURL() { return window.location.href.split('?')[0] + '?mode=display&code=' + JS.code; }
function genQR() {
  const url = getPlayerURL(); document.getElementById('qr-url').innerText = url;
  ['qr-sm', 'qr-lg', 'display-qr'].forEach(id => { const el = document.getElementById(id); if (!el) return; el.innerHTML = ''; const sz = id === 'display-qr' ? 160 : (id === 'qr-sm' ? 70 : 230); try { new QRCode(el, { text: url, width: sz, height: sz, colorDark: '#1a1a2e', colorLight: '#ffffff' }); } catch (e) { } });
  const codeEl = document.getElementById('display-code'); if (codeEl) codeEl.textContent = JS.code;
}
function showQR() { genQR(); document.getElementById('qr-modal').classList.add('show'); }
function copyDisplayLink() { const url = getDisplayURL(); navigator.clipboard.writeText(url).then(() => showToast('تم نسخ رابط البروجكتر!', 'success')).catch(() => prompt('انسخ الرابط:', url)); }
function copyDisplayLinkOnly() { const url = getDisplayURL(); navigator.clipboard.writeText(url).then(() => showToast('تم نسخ الرابط', 'success')).catch(() => prompt('انسخ الرابط:', url)); }
function openDisplayLink() { window.open(getDisplayURL(), '_blank'); }

/* ========== شاشة العرض ========== */
let dpPeer = null, dpConn = null, dpBrd = [], dpShowQ = true, dpShowA = false, dpRetryTimeout = null, dpPendingQuestion = null;
function showDisplayScreen() { const code = prompt('أدخل كود الجلسة (من شاشة الحكم):', ''); if (!code) return; go('display'); startDisplay(code.trim().toUpperCase()); }
function startDisplay(code) { currentServerIndex = 0; connectDisplay(code); }
function connectDisplay(code) {
  if (dpPeer) dpPeer.destroy(); clearTimeout(dpRetryTimeout);
  try { dpPeer = new Peer(getPeerOptions()); } catch (e) { showToast('خطأ: ' + e.type, 'error'); return; }
  dpPeer.on('open', () => {
    dpConn = dpPeer.connect('hexgame-' + code, { reliable: true });
    dpConn.on('open', () => { document.getElementById('dp-bz').innerHTML = '<span style="color:var(--GOLD);font-size:.83rem">✅ متصل! في انتظار السؤال...</span>'; });
    dpConn.on('data', d => {
      if (d.type === 'state') { dpApply(d.s); }
      if (d.type === 'show_q') { dpPendingQuestion = d.q; }
      if (d.type === 'buzzer_won') { dpShowBz(d.winner); if (dpPendingQuestion) { const qd = document.getElementById('dp-q'); qd.innerText = '❓ ' + dpPendingQuestion; qd.style.display = 'flex'; dpPendingQuestion = null; } }
      if (d.type === 'second_chance') { dpShowSecond(d.team); }
      if (d.type === 'open_q') { document.getElementById('dp-bz').innerHTML = '<div style="color:var(--GOLD);font-weight:900">🔓 مفتوح للجميع!</div>'; }
      if (d.type === 'tick') { const el = document.getElementById('dp-cd'); if (el) el.innerText = d.secs; }
      if (d.type === 'correct' || d.type === 'skip') { document.getElementById('dp-q').style.display = 'none'; document.getElementById('dp-ans').style.display = 'none'; document.getElementById('dp-bz').innerHTML = '<span style="color:rgba(240,244,255,.3);font-size:.83rem">في انتظار السؤال...</span>'; }
      if (d.type === 'new_round') { document.getElementById('dp-q').style.display = 'none'; document.getElementById('dp-ans').style.display = 'none'; }
      if (d.type === 'toggle_question') { dpShowQ = d.show; if (d.show && d.q) { const qd = document.getElementById('dp-q'); qd.innerText = '❓ ' + d.q; qd.style.display = 'flex'; } else { document.getElementById('dp-q').style.display = 'none'; } }
      if (d.type === 'toggle_answer') { dpShowA = d.show; const ansEl = document.getElementById('dp-ans'); if (d.show) ansEl.innerText = '✅ الإجابة: ' + d.answer; ansEl.style.display = dpShowA ? 'block' : 'none'; }
    });
  });
  dpPeer.on('error', e => { document.getElementById('dp-bz').innerHTML = '<span style="color:#e74c3c">خطأ: ' + e.type + '</span> <button class="retry-btn" onclick="retryDisplayConnection(\'' + code + '\')">🔄 إعادة الاتصال</button>'; if (currentServerIndex < PEER_SERVERS.length - 1) { currentServerIndex++; connectDisplay(code); } else { currentServerIndex = 0; dpRetryTimeout = setTimeout(() => connectDisplay(code), 3000); } });
  dpPeer.on('disconnected', () => { dpPeer.reconnect(); });
}
window.retryDisplayConnection = function (code) { if (dpPeer) dpPeer.destroy(); currentServerIndex = 0; connectDisplay(code); };
function dpApply(s) { if (!s) return; document.getElementById('dp-an').innerText = s.teamA || 'الفريق أ'; document.getElementById('dp-bn').innerText = s.teamB || 'الفريق ب'; document.getElementById('dp-as').innerText = s.pts ? s.pts.a : 0; document.getElementById('dp-bs').innerText = s.pts ? s.pts.b : 0; dpBrd = s.board || []; const letters = dpBrd.map(c => c.letter); const owner = dpBrd.map(c => c.owner); renderHexBoard(document.getElementById('display-board'), letters, owner, s.activeCell, null); if (s.showAnswer && s.activeQ) { document.getElementById('dp-ans').innerText = '✅ الإجابة: ' + s.activeQ.a; document.getElementById('dp-ans').style.display = 'block'; } else { document.getElementById('dp-ans').style.display = 'none'; } if (s.activeQ) dpPendingQuestion = s.activeQ.q; }
function dpShowBz(w) { const col = 'var(--' + (w.team === 'a' ? 'A' : 'B') + ')'; document.getElementById('dp-bz').innerHTML = '<div style="text-align:center"><div style="font-size:1.4rem;font-weight:900;color:' + col + '">⚡ ' + w.name + '</div><div style="font-size:2.4rem;font-weight:900;font-family:monospace;color:' + col + '" id="dp-cd">5</div></div>'; }
function dpShowSecond(team) { const col = 'var(--' + (team === 'a' ? 'A' : 'B') + ')'; document.getElementById('dp-bz').innerHTML = '<div style="text-align:center"><div style="font-size:1.1rem;font-weight:900;color:' + col + '">🔥 الفرصة الثانية</div><div style="font-size:2rem;font-weight:900;font-family:monospace;color:' + col + '" id="dp-cd">10</div></div>'; }

/* ========== فلترة الأسئلة ========== */
let GAME_DIFF = 'all', GAME_CAT = 'all', LIVE_DIFF = 'all'; const UQ2 = {};
function setDiff(btn, mode) { const container = mode === 'j' ? document.getElementById('jdiff-filter') : document.getElementById('ldiff-filter'); container.querySelectorAll('.diff-btn').forEach(b => b.className = 'diff-btn'); const d = btn.dataset.diff; btn.classList.add('active-' + (d === 'all' ? 'all' : d)); GAME_DIFF = d; }
function setCat(btn, mode) { const container = mode === 'j' ? document.getElementById('jcat-filter') : document.getElementById('lcat-filter'); container.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); GAME_CAT = btn.dataset.cat; }
function setLiveDiff(btn) { const container = document.getElementById('j-live-diff'); container.querySelectorAll('.diff-btn').forEach(b => b.className = 'diff-btn'); const d = btn.dataset.diff; btn.classList.add('active-' + (d === 'all' ? 'all' : d)); LIVE_DIFF = d; }
function pickQ2(letter, diffOverride) { if (typeof QBANK2 === 'undefined' || !QBANK2[letter]) return null; const diff = diffOverride || LIVE_DIFF || GAME_DIFF; let levels = ['easy', 'medium', 'hard', 'expert']; if (diff !== 'all') levels = [diff]; let pool = []; for (const lvl of levels) { const qs = QBANK2[letter][lvl] || []; for (let i = 0; i < qs.length; i++) { const q = qs[i]; if (GAME_CAT === 'all' || q.cat === GAME_CAT) { pool.push({ ...q, _lvl: lvl, _idx: i, _letter: letter }); } } } if (!pool.length) return null; const usedKey = letter + '_' + diff + '_' + GAME_CAT; if (!UQ2[usedKey]) UQ2[usedKey] = new Set(); const used = UQ2[usedKey]; let available = pool.filter((_, i) => !used.has(i)); if (!available.length) { used.clear(); available = pool; } const chosen = available[Math.floor(Math.random() * available.length)]; const idx = pool.indexOf(chosen); used.add(idx); return chosen; }
const _origPickQ = pickQ;
pickQ = function (letter) { if (typeof QBANK2 !== 'undefined' && QBANK2[letter] && (GAME_DIFF !== 'all' || GAME_CAT !== 'all')) { const q2 = pickQ2(letter); if (q2) return q2; } if (typeof QBANK2 !== 'undefined' && QBANK2[letter] && GAME_DIFF === 'all' && GAME_CAT === 'all') { if (Math.random() > 0.5) { const q2 = pickQ2(letter); if (q2) return q2; } } return _origPickQ(letter); };
function lShowDiffBadge(q) { const badge = document.getElementById('lq-diff-badge'); const catTag = document.getElementById('lq-cat-badge'); if (!badge || !catTag) return; if (q && q._lvl) { const map = { easy: ['🟢 سهل', 'diff-easy'], medium: ['🟡 متوسط', 'diff-medium'], hard: ['🔴 صعب', 'diff-hard'], expert: ['⭐ خبير', 'diff-hard'] }; const [label, cls] = map[q._lvl] || ['', '']; badge.className = 'diff-indicator ' + cls; badge.textContent = label; catTag.textContent = q.cat || ''; } else { badge.className = 'diff-indicator'; badge.textContent = ''; catTag.textContent = ''; } }

/* ========== تهيئة ========== */
window.addEventListener('load', () => {
  const p = new URLSearchParams(location.search); const mode = p.get('mode'), code = p.get('code');
  if (mode === 'player') { go('player-join'); if (code) document.getElementById('pcode').value = code; }
  else if (mode === 'display' && code) { go('display'); startDisplay(code); }
  else { go('home'); }
  document.querySelectorAll('#judge-right-panel .ps h3').forEach(h3 => { h3.style.cursor = 'pointer'; h3.addEventListener('click', () => toggleSection(h3)); });
  window.addEventListener('resize', () => {
    if (document.getElementById('local-game').classList.contains('on')) renderHexBoard(document.getElementById('local-board'), LG.letters, LG.owner, LG.activeCell, lHexClick);
    if (document.getElementById('judge-game').classList.contains('on')) renderHexBoard(document.getElementById('judge-board'), JS.letters, JS.owner, JS.activeCell, jHexClick);
    if (document.getElementById('display').classList.contains('on') && dpBrd.length) dpApply({ board: dpBrd, pts: JS.pts, teamA: JS.teamA, teamB: JS.teamB });
  });
});
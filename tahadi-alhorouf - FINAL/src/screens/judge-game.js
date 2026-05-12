let JS = {
  teamA: 'الفريق الأحمر', teamB: 'الفريق الأخضر',
  colorA: '#FF5722', colorB: '#4CAF50',
  roundsToWin: 2, round: 1,
  pts: { a: 0, b: 0 }, rndWins: { a: 0, b: 0 },
  letters: [], owner: [],
  activeCell: null, activeQ: null,
  phase: 'idle', bzWinner: null, timerSecs: 0, timerInt: null,
  players: [], code: '',
  peer: null, conns: [],
  showQuestion: false, showAnswer: false, retryTimeout: null,
  diffFilter: 'all', catFilter: 'all',
  timeA: 5, timeB: 5
};

function startJudge() {
  JS.teamA = document.getElementById('jta').value.trim() || 'الفريق الأحمر';
  JS.teamB = document.getElementById('jtb').value.trim() || 'الفريق الأخضر';
  JS.colorA = document.getElementById('jca').value || '#FF5722';
  JS.colorB = document.getElementById('jcb').value || '#4CAF50';
  var bs = parseInt(document.getElementById('jbs').value) || 5;
  setBoardSize(bs, bs);
  JS.roundsToWin = parseInt(document.getElementById('jrw').value);
  JS.timeA = parseInt(document.getElementById('jta-time').value) || 5;
  JS.timeB = parseInt(document.getElementById('jtb-time').value) || 5;
  JS.code = Math.random().toString(36).substr(2, 5).toUpperCase();
  JS.conns = [];
  JS.players = [];
  JS.diffFilter = 'all';
  JS.catFilter = 'all';
  Object.keys(UQ).forEach(k => delete UQ[k]);

  applyTeamColors(JS.colorA, JS.colorB);

  go('judge-game');
  jUpdateUI();
  jInitBoard();
  genQR();

  resetPeerServerIndex();
  connectJudge();
}

function connectJudge() {
  if (JS.peer) JS.peer.destroy();
  clearTimeout(JS.retryTimeout);
  try {
    JS.peer = new Peer('hexgame-' + JS.code, getPeerOptions());
  } catch (e) { handleJudgeError(e); return; }
  JS.peer.on('open', () => { resetPeerServerIndex(); Logger.info('Judge room ' + JS.code + ' created'); });
  JS.peer.on('connection', conn => {
    JS.conns.push(conn);
    conn.on('open', () => {
      jBcast({ type: 'state', s: jPub() });
    });
    conn.on('data', d => jOnData(d));
    conn.on('close', () => {
      JS.conns = JS.conns.filter(c => c !== conn);
      JS.players = JS.players.filter(p => p.id !== conn.peer);
      jRenderPlayers();
    });
  });
  JS.peer.on('error', e => handleJudgeError(e));
  JS.peer.on('disconnected', () => { JS.peer.reconnect(); });
}

function handleJudgeError(e) {
  Logger.warn('Judge peer error: ' + e.type);
  if (rotateServer()) { connectJudge(); return; }
  JS.retryTimeout = setTimeout(connectJudge, 3000);
  showToast('⚠️ مشكلة في الاتصال، جارٍ إعادة المحاولة...', 'error');
}

function jPub() {
  return {
    code: JS.code,
    teamA: JS.teamA, teamB: JS.teamB,
    colorA: JS.colorA, colorB: JS.colorB,
    cols: COLS, rows: ROWS,
    board: JS.letters.map(function(l, i) { return { letter: l, owner: JS.owner[i] }; }),
    activeCell: JS.activeCell, phase: JS.phase,
    bzWinner: JS.bzWinner, timerSecs: JS.timerSecs,
    pts: JS.pts, round: JS.round, rndWins: JS.rndWins,
    showQuestion: JS.showQuestion, showAnswer: JS.showAnswer,
    activeQ: JS.activeQ
  };
}

function jBcast(m) {
  JS.conns.forEach(c => { if (c.open) c.send(m); });
}

function jOnData(d) {
  if (d.type === 'join') {
    if (!JS.players.find(p => p.id === d.id)) {
      if (JS.players.find(function(p) { return p.name === d.name && p.team === d.team; })) {
        JS.conns.forEach(function(c) { if (c.peer === d.id && c.open) c.send({ type: 'name_taken' }); });
        return;
      }
      JS.players.push({ name: d.name, team: d.team, id: d.id });
      jRenderPlayers();
    }
    jBcast({ type: 'state', s: jPub() });
    return;
  }
  if (d.type === 'buzz') {
    if (JS.phase !== 'open' || JS.bzWinner) return;
    JS.bzWinner = { name: d.name, team: d.team, id: d.id };
    JS.phase = 'won';
    jClearTimer();
    jStartTimer(JS.bzWinner.team === 'a' ? JS.timeA : JS.timeB);
    jBcast({ type: 'buzzer_won', winner: JS.bzWinner });
    jBcast({ type: 'state', s: jPub() });
    jRenderBz();
  }
}

function jInitBoard() {
  JS.letters = randLetters();
  JS.owner = Array(N).fill(null);
  JS.activeCell = null;
  JS.activeQ = null;
  JS.phase = 'idle';
  JS.bzWinner = null;
  JS.pts = { a: 0, b: 0 };
  jClearTimer();
  renderHexBoard(document.getElementById('judge-board'), JS.letters, JS.owner, null, jHexClick);
  jRenderBz();
  jUpdateScores();
  document.getElementById('j-qbox').innerText = 'اختر خلية من اللوحة...';
  document.getElementById('j-ans').style.display = 'none';
}

function jHexClick(i) {
  if (JS.owner[i]) return;
  JS.activeCell = i;
  JS.phase = 'open';
  JS.bzWinner = null;
  JS.activeQ = pickQ(JS.letters[i], JS.diffFilter, JS.catFilter);
  if (!JS.activeQ) return;
  jClearTimer();
  renderHexBoard(document.getElementById('judge-board'), JS.letters, JS.owner, i, jHexClick);
  jRenderBz();
  document.getElementById('j-qbox').innerText = JS.activeQ.q;
  document.getElementById('j-ans').style.display = 'none';
  jBcast({ type: 'buzzer_ready', letter: JS.letters[i] });
  jBcast({ type: 'state', s: jPub() });
}

function jStartTimer(s) {
  jClearTimer();
  JS.timerSecs = s;
  jRenderBz();
  JS.timerInt = setInterval(() => {
    JS.timerSecs--;
    jRenderBz();
    jBcast({ type: 'tick', secs: JS.timerSecs });
    if (JS.timerSecs <= 0) { jClearTimer(); jTimerEnd(); }
  }, 1000);
}

function jClearTimer() { clearInterval(JS.timerInt); JS.timerInt = null; }

function jTimerEnd() {
  if (JS.phase === 'won' && JS.bzWinner) {
    const other = JS.bzWinner.team === 'a' ? 'b' : 'a';
    JS.phase = 'open';
    JS.bzWinner = null;
    jStartTimer(other === 'a' ? JS.timeA : JS.timeB);
    jBcast({ type: 'second_chance', team: other });
    jBcast({ type: 'state', s: jPub() });
    jRenderBz();
  } else {
    JS.phase = 'open';
    JS.bzWinner = null;
    jBcast({ type: 'open_q' });
    jBcast({ type: 'state', s: jPub() });
    jRenderBz();
  }
  if (!JS.showQuestion) { JS.showQuestion = true; jBcast({ type: 'toggle_question', show: true }); }
}

function jShowAns() {
  if (!JS.activeQ) return;
  const ab = document.getElementById('j-ans');
  ab.innerText = '✅ ' + JS.activeQ.a;
  ab.style.display = 'block';
}

function jCorrect(team) {
  if (JS.activeCell === null) return;
  JS.owner[JS.activeCell] = team;
  JS.pts[team]++;
  jClearTimer();
  JS.phase = 'idle';
  JS.bzWinner = null;
  JS.activeCell = null;
  renderHexBoard(document.getElementById('judge-board'), JS.letters, JS.owner, null, jHexClick);
  jUpdateScores();
  jRenderBz();
  document.getElementById('j-qbox').innerText = 'اختر خلية من اللوحة...';
  document.getElementById('j-ans').style.display = 'none';
  jBcast({ type: 'correct', team });
  jBcast({ type: 'state', s: jPub() });
  if (bfsWin(JS.owner, team)) { jShowWinner(team); return; }
  if (JS.owner.every(o => o)) jShowWinner(JS.pts.a >= JS.pts.b ? 'a' : 'b');
}

function jNextQ() {
  if (JS.activeCell === null) return;
  JS.activeQ = pickQ(JS.letters[JS.activeCell], JS.diffFilter, JS.catFilter);
  if (!JS.activeQ) return;
  document.getElementById('j-qbox').innerText = JS.activeQ.q;
  document.getElementById('j-ans').style.display = 'none';
}

function jReopen() {
  if (JS.activeCell === null) return;
  JS.phase = 'open';
  JS.bzWinner = null;
  jClearTimer();
  jRenderBz();
  jBcast({ type: 'buzzer_ready', letter: JS.letters[JS.activeCell] });
  jBcast({ type: 'state', s: jPub() });
}

function jSkip() {
  if (JS.activeCell === null) return;
  jClearTimer();
  JS.phase = 'idle';
  JS.bzWinner = null;
  JS.activeCell = null;
  renderHexBoard(document.getElementById('judge-board'), JS.letters, JS.owner, null, jHexClick);
  jRenderBz();
  jBcast({ type: 'skip' });
  jBcast({ type: 'state', s: jPub() });
}

function jNewRound() {
  JS.round++;
  jInitBoard();
  jUpdateUI();
  jBcast({ type: 'new_round', round: JS.round });
  jBcast({ type: 'state', s: jPub() });
  document.getElementById('judge-win').classList.remove('on');
}

function jShowWinner(team) {
  JS.rndWins[team]++;
  jUpdateScores();
  const nm = team === 'a' ? JS.teamA : JS.teamB;
  const col = team === 'a' ? 'var(--A)' : 'var(--B)';
  document.getElementById('jw-em').innerText = team === 'a' ? '🟠' : '🟢';
  document.getElementById('jw-nm').innerHTML = '<span style="color:' + col + '">' + nm + '</span>';
  document.getElementById('jw-sb').innerText = '🏆 فاز بالجولة ' + JS.round + ' — جولات: ' + JS.rndWins[team] + '/' + JS.roundsToWin;
  document.getElementById('judge-win').classList.add('on');
  confetti(team);
  jBcast({ type: 'round_win', team, rndWins: JS.rndWins });
  if (JS.rndWins[team] >= JS.roundsToWin) {
    document.getElementById('jw-sb').innerText = '🏆 فاز باللعبة كاملة!';
    jBcast({ type: 'game_win', team });
  }
}

function jRenderBz() {
  const bz = document.getElementById('jbz-disp');
  if (!bz) return;
  if (JS.phase === 'idle') { bz.innerHTML = '<div class="bzidle">اختر خلية لبدء السؤال...</div>'; return; }
  if (JS.phase === 'open' && !JS.bzWinner) { bz.innerHTML = '<div class="bzidle" style="color:var(--GOLD)">⚡ البازر مفتوح للجميع!</div>'; return; }
  if (JS.bzWinner) {
    const cls = 'bzwin bzwin' + JS.bzWinner.team;
    const tn = JS.bzWinner.team === 'a' ? JS.teamA : JS.teamB;
    bz.innerHTML = '<div class="' + cls + '"><div class="bzname">⚡ ' + JS.bzWinner.name + '</div><div class="bzsub">' + tn + '</div><div class="bzcount">' + JS.timerSecs + '</div></div>';
  }
}

function jRenderPlayers() {
  const pl = document.getElementById('j-players');
  if (!pl) return;
  if (!JS.players.length) { pl.innerHTML = '<div class="bzidle">لا يوجد لاعبون...</div>'; return; }
  pl.innerHTML = JS.players.map(p => {
    const teamColor = p.team === 'a' ? 'var(--A)' : 'var(--B)';
    return '<div class="plitem p' + p.team + '">'
      + '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:' + teamColor + ';margin-left:4px;"></span>'
      + '<span style="flex:1;">' + p.name + '</span>'
      + '<span style="opacity:.6;font-size:.72rem;">' + (p.team === 'a' ? JS.teamA : JS.teamB) + '</span>'
      + '<button class="plkick" onclick="jKickPlayer(\'' + p.id + '\')" title="طرد اللاعب">✕</button>'
      + '</div>';
  }).join('');
}

function jKickPlayer(playerId) {
  const player = JS.players.find(p => p.id === playerId);
  if (!player) return;
  const conn = JS.conns.find(c => c.peer === playerId);
  if (conn && conn.open) conn.send({ type: 'kicked' });
  if (conn) conn.close();
  JS.players = JS.players.filter(p => p.id !== playerId);
  JS.conns = JS.conns.filter(c => c.peer !== playerId);
  jRenderPlayers();
  jBcast({ type: 'state', s: jPub() });
}

function jUpdateUI() {
  document.getElementById('ja-n').innerText = JS.teamA;
  document.getElementById('jb-n').innerText = JS.teamB;
  document.getElementById('jb-ca').innerText = '✅ صح (' + JS.teamA.substr(0, 7) + ')';
  document.getElementById('jb-cb').innerText = '✅ صح (' + JS.teamB.substr(0, 7) + ')';
  const t = ['', 'الأولى', 'الثانية', 'الثالثة', 'الرابعة', 'الخامسة'];
  document.getElementById('j-title').innerText = 'الجولة ' + (t[JS.round] || JS.round) + ' 🏆';
  document.getElementById('j-rnd').innerText = 'الجولة ' + JS.round;
  document.getElementById('judge-code-badge').textContent = 'كود: ' + JS.code;
}

function setJudgeDiff(diff) { JS.diffFilter = diff; }
function setJudgeCat(cat) { JS.catFilter = cat; }

function getPlayerURL() { return window.location.href.split('?')[0] + '?mode=player&code=' + JS.code; }
function getDisplayURL() { return window.location.href.split('?')[0] + '?mode=display&code=' + JS.code; }

function genQR() {
  const url = getPlayerURL();
  document.getElementById('qr-url').innerText = url;
  ['qr-sm', 'qr-lg', 'display-qr'].forEach(function (id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = '';
    const sz = id === 'display-qr' ? 160 : (id === 'qr-sm' ? 70 : 230);
    try { new QRCode(el, { text: url, width: sz, height: sz, colorDark: '#1a1a2e', colorLight: '#ffffff' }); } catch (e) { /* ignore */ }
  });
  const codeEl = document.getElementById('display-code');
  if (codeEl) codeEl.textContent = JS.code;
}
function showQR() { genQR(); document.getElementById('qr-modal').classList.add('show'); }
function copyDisplayLink() { const url = getDisplayURL(); prompt('انسخ رابط شاشة البروجكتر:', url); }
function copyDisplayLinkOnly() { const u = getDisplayURL(); navigator.clipboard.writeText(u).then(function () { showToast('تم نسخ الرابط', 'success'); }).catch(function () { prompt('انسخ:', u); }); }
function openDisplayLink() { window.open(getDisplayURL(), '_blank'); }

function jUpdateScores() {
  document.getElementById('ja-p').innerText = JS.pts.a;
  document.getElementById('jb-p').innerText = JS.pts.b;
  document.getElementById('ja-w').innerText = 'جولات: ' + JS.rndWins.a;
  document.getElementById('jb-w').innerText = 'جولات: ' + JS.rndWins.b;
}

function jToggleQuestion() {
  JS.showQuestion = !JS.showQuestion;
  const btn = document.getElementById('j-toggle-q');
  btn.innerText = JS.showQuestion ? '🙈 أخفِ السؤال' : '👁 أظهر السؤال';
  btn.style.background = JS.showQuestion ? '#e74c3c' : '#2ecc71';
  jBcast({ type: 'toggle_question', show: JS.showQuestion });
}

function jToggleAnswer() {
  JS.showAnswer = !JS.showAnswer;
  const btn = document.getElementById('j-toggle-a');
  btn.innerText = JS.showAnswer ? '🙈 أخفِ الإجابة' : '👁 أظهر الإجابة';
  btn.style.background = JS.showAnswer ? '#e74c3c' : '#e67e22';
  jBcast({ type: 'toggle_answer', show: JS.showAnswer, answer: JS.activeQ ? JS.activeQ.a : '' });
}

var JSt = { diff: 'all', cat: 'all' };

function jOpenSettings() {
  document.getElementById('jsi-ta').value = JS.teamA;
  document.getElementById('jsi-tb').value = JS.teamB;
  document.getElementById('jsi-ca').value = JS.colorA;
  document.getElementById('jsi-cb').value = JS.colorB;
  document.getElementById('jsi-bs').value = COLS || 5;
  document.getElementById('jsi-rw').value = JS.roundsToWin;
  document.getElementById('jsi-ta-t').value = JS.timeA;
  document.getElementById('jsi-tb-t').value = JS.timeB;
  document.getElementById('jsi-a').style.background = JS.colorA;
  document.getElementById('jsi-b').style.background = JS.colorB;
  JSt.diff = JS.diffFilter;
  JSt.cat = JS.catFilter;
  var dbtns = document.querySelectorAll('#jsi-diff .diff-btn');
  dbtns.forEach(function(b){ b.classList.remove('active-all'); });
  var actDiff = document.querySelector('#jsi-diff .diff-btn[data-diff="'+JSt.diff+'"]');
  if (actDiff) actDiff.classList.add('active-all');
  var cbtns = document.querySelectorAll('#jsi-cat .cat-btn');
  cbtns.forEach(function(b){ b.classList.remove('active'); });
  var actCat = document.querySelector('#jsi-cat .cat-btn[data-cat="'+JSt.cat+'"]');
  if (actCat) actCat.classList.add('active');
  document.getElementById('js-ov').classList.add('on');
  document.getElementById('js-settings').classList.add('on');
}

function jCloseSettings() {
  document.getElementById('js-ov').classList.remove('on');
  document.getElementById('js-settings').classList.remove('on');
}

function jSetSettingsDiff(el) {
  document.querySelectorAll('#jsi-diff .diff-btn').forEach(function(b){ b.classList.remove('active-all'); });
  if (el) el.classList.add('active-all');
  JSt.diff = el ? el.getAttribute('data-diff') : 'all';
}

function jSetSettingsCat(el) {
  document.querySelectorAll('#jsi-cat .cat-btn').forEach(function(b){ b.classList.remove('active'); });
  if (el) el.classList.add('active');
  JSt.cat = el ? el.getAttribute('data-cat') : 'all';
}

function jApplySettings() {
  var newSize = parseInt(document.getElementById('jsi-bs').value) || 5;
  var sizeChanged = newSize !== (COLS || 5);
  if (sizeChanged && JS.owner.some(function(o){ return o !== null; })) {
    if (!confirm('⚠️ تغيير حجم اللوحة سيؤدي إلى إعادة تعيين اللعبة! هل أنت متأكد؟')) return;
  }
  JS.teamA = document.getElementById('jsi-ta').value.trim() || JS.teamA;
  JS.teamB = document.getElementById('jsi-tb').value.trim() || JS.teamB;
  JS.colorA = document.getElementById('jsi-ca').value || JS.colorA;
  JS.colorB = document.getElementById('jsi-cb').value || JS.colorB;
  applyTeamColors(JS.colorA, JS.colorB);
  JS.roundsToWin = parseInt(document.getElementById('jsi-rw').value) || JS.roundsToWin;
  JS.timeA = parseInt(document.getElementById('jsi-ta-t').value) || JS.timeA;
  JS.timeB = parseInt(document.getElementById('jsi-tb-t').value) || JS.timeB;
  JS.diffFilter = JSt.diff;
  JS.catFilter = JSt.cat;
  if (sizeChanged) {
    setBoardSize(newSize, newSize);
    JS.owner = Array(N).fill(null);
    JS.letters = randLetters();
    JS.pts = { a: 0, b: 0 };
    JS.rndWins = { a: 0, b: 0 };
    JS.round = 1;
    JS.activeCell = null;
    JS.activeQ = null;
    JS.phase = 'idle';
    JS.bzWinner = null;
    JS.showQuestion = false;
    JS.showAnswer = false;
    document.getElementById('j-ans').style.display = 'none';
    document.getElementById('judge-win').classList.remove('on');
    document.getElementById('j-qbox').innerText = 'اختر خلية من اللوحة...';
  }
  jUpdateUI();
  jUpdateScores();
  renderHexBoard(document.getElementById('judge-board'), JS.letters, JS.owner, null, jHexClick);
  jRenderBz();
  jRenderPlayers();
  jBcast({ type: 'state', s: jPub() });
  jCloseSettings();
}

_addCleanup(function () { clearInterval(JS.timerInt); clearTimeout(JS.retryTimeout); if (JS.peer) { JS.peer.destroy(); JS.peer = null; } JS.conns = []; });

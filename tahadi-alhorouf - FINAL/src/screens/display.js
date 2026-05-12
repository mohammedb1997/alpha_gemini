let dpPeer = null, dpConn = null, dpBrd = [], dpShowQ = true, dpShowA = false;
let dpRetryTimeout = null, dpPendingQuestion = null;

function showDisplayScreen() {
  const code = prompt('أدخل كود الجلسة (من شاشة الحكم):', '');
  if (!code) return;
  go('display');
  startDisplay(code.trim().toUpperCase());
}

function startDisplay(code) {
  resetPeerServerIndex();
  connectDisplay(code);
}

function connectDisplay(code) {
  if (dpPeer) dpPeer.destroy();
  clearTimeout(dpRetryTimeout);
  try { dpPeer = new Peer(getPeerOptions()); } catch (e) { handleDisplayError(e, code); return; }
  dpPeer.on('open', () => {
    dpConn = dpPeer.connect('hexgame-' + code, { reliable: true });
    dpConn.on('open', () => {
      document.getElementById('dp-bz').innerHTML = '<span style="color:var(--GOLD);font-size:.83rem">✅ متصل! في انتظار السؤال...</span>';
    });
    dpConn.on('data', d => {
      if (d.type === 'state') { dpApply(d.s); }
      if (d.type === 'buzzer_won') {
        dpShowBz(d.winner);
        if (dpPendingQuestion) {
          document.getElementById('dp-q').innerText = '❓ ' + dpPendingQuestion;
          document.getElementById('dp-q').style.display = 'flex';
          dpPendingQuestion = null;
        }
      }
      if (d.type === 'second_chance') { dpShowSecond(d.team); }
      if (d.type === 'open_q') { document.getElementById('dp-bz').innerHTML = '<div style="color:var(--GOLD);font-weight:900">🔓 مفتوح للجميع!</div>'; }
      if (d.type === 'tick') { const el = document.getElementById('dp-cd'); if (el) el.innerText = d.secs; }
      if (d.type === 'correct' || d.type === 'skip') {
        document.getElementById('dp-q').style.display = 'none';
        document.getElementById('dp-ans').style.display = 'none';
        document.getElementById('dp-bz').innerHTML = '<span style="color:rgba(240,244,255,.3);font-size:.83rem">في انتظار السؤال...</span>';
      }
      if (d.type === 'new_round') { document.getElementById('dp-q').style.display = 'none'; document.getElementById('dp-ans').style.display = 'none'; }
      if (d.type === 'toggle_question') { dpShowQ = d.show; document.getElementById('dp-q').style.display = dpShowQ ? 'flex' : 'none'; }
      if (d.type === 'toggle_answer') {
        dpShowA = d.show;
        const ansEl = document.getElementById('dp-ans');
        if (d.show) ansEl.innerText = '✅ الإجابة: ' + d.answer;
        ansEl.style.display = dpShowA ? 'block' : 'none';
      }
    });
  });
  dpPeer.on('error', e => handleDisplayError(e, code));
  dpPeer.on('disconnected', () => { dpPeer.reconnect(); });
}

function handleDisplayError(e, code) {
  Logger.warn('Display peer error: ' + e.type);
  document.getElementById('dp-bz').innerHTML = '<span style="color:#e74c3c">خطأ: ' + e.type + '</span>'
    + ' <button class="retry-btn" onclick="retryDisplayConnection(\'' + code + '\')">🔄 إعادة الاتصال</button>';
  if (rotateServer()) { connectDisplay(code); return; }
  dpRetryTimeout = setTimeout(() => connectDisplay(code), 3000);
}

function retryDisplayConnection(code) {
  if (dpPeer) dpPeer.destroy();
  resetPeerServerIndex();
  connectDisplay(code);
}

function dpApply(s) {
  if (!s) return;
  document.getElementById('dp-an').innerText = s.teamA || 'الفريق أ';
  document.getElementById('dp-bn').innerText = s.teamB || 'الفريق ب';
  document.getElementById('dp-as').innerText = s.pts ? s.pts.a : 0;
  document.getElementById('dp-bs').innerText = s.pts ? s.pts.b : 0;
  const rndEl = document.getElementById('dp-rnd');
  if (rndEl && s.round) rndEl.innerText = 'الجولة ' + s.round;
  const aw = document.getElementById('dp-aw'), bw = document.getElementById('dp-bw');
  if (aw && s.rndWins) aw.innerText = 'جولات: ' + s.rndWins.a;
  if (bw && s.rndWins) bw.innerText = 'جولات: ' + s.rndWins.b;
  dpBrd = s.board || [];
  const letters = dpBrd.map(c => c.letter);
  const owner = dpBrd.map(c => c.owner);
  if (s.cols && s.rows) setBoardSize(s.cols, s.rows);
  var boardEl = document.getElementById('display-board');
  renderHexBoard(boardEl, letters, owner, s.activeCell, null);
  requestAnimationFrame(function () {
    var dims = boardDims(1), dpc = boardEl.closest('.dpcenter');
    if (!dpc) return;
    var qh = (document.getElementById('dp-q').offsetHeight || 0) + 10;
    var ah = (document.getElementById('dp-ans').offsetHeight || 0) + 10;
    var availW = dpc.clientWidth - 40, availH = dpc.clientHeight - qh - ah - 30;
    if (availW > 0 && availH > 0) {
      var scl = Math.min(availW / dims.W, availH / dims.H, 1);
      if (scl < 0.99) {
        boardEl.style.transform = 'scale(' + scl + ')';
        boardEl.style.transformOrigin = 'top center';
      } else {
        boardEl.style.transform = '';
      }
    }
  });
  const qEl = document.getElementById('dp-q');
  if (s.activeQ) {
    dpPendingQuestion = s.activeQ.q;
    if (qEl) {
      qEl.innerText = '❓ ' + s.activeQ.q;
      qEl.style.display = s.showQuestion ? 'flex' : 'none';
    }
  }
  if (s.showAnswer && s.activeQ) {
    document.getElementById('dp-ans').innerText = '✅ الإجابة: ' + s.activeQ.a;
    document.getElementById('dp-ans').style.display = 'block';
  } else {
    document.getElementById('dp-ans').style.display = 'none';
  }
  if (s.code) {
    const codeEl = document.getElementById('display-code');
    if (codeEl) codeEl.textContent = s.code;
    const qrEl = document.getElementById('display-qr');
    if (qrEl) {
      qrEl.innerHTML = '';
      var url = window.location.href.split('?')[0] + '?mode=player&code=' + s.code;
      try { new QRCode(qrEl, { text: url, width: 160, height: 160, colorDark: '#1a1a2e', colorLight: '#ffffff' }); } catch (e) {}
    }
  }
  if (s.colorA && s.colorB) applyTeamColors(s.colorA, s.colorB);
}

function dpShowBz(w) {
  const col = 'var(--' + (w.team === 'a' ? 'A' : 'B') + ')';
  document.getElementById('dp-bz').innerHTML = '<div style="text-align:center">'
    + '<div style="font-size:1.4rem;font-weight:900;color:' + col + '">⚡ ' + w.name + '</div>'
    + '<div style="font-size:2.4rem;font-weight:900;font-family:monospace;color:' + col + '" id="dp-cd">5</div></div>';
}

function dpShowSecond(team) {
  const col = 'var(--' + (team === 'a' ? 'A' : 'B') + ')';
  document.getElementById('dp-bz').innerHTML = '<div style="text-align:center">'
    + '<div style="font-size:1.1rem;font-weight:900;color:' + col + '">🔥 الفرصة الثانية</div>'
    + '<div style="font-size:2rem;font-weight:900;font-family:monospace;color:' + col + '" id="dp-cd">10</div></div>';
}

_addCleanup(function () { clearTimeout(dpRetryTimeout); if (dpPeer) { dpPeer.destroy(); dpPeer = null; dpConn = null; } });

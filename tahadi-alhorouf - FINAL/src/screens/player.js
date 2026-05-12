let PM = {}, pGS = null;
let pPeer = null, pConn = null;
let pBzEnabled = false, pCdI = null, pRetryTimeout = null;
let pSelT = null;

function pSelTeam(t) {
  pSelT = t;
  document.getElementById('ptbtn-a').className = 'ptbtn' + (t === 'a' ? ' psa' : '');
  document.getElementById('ptbtn-b').className = 'ptbtn' + (t === 'b' ? ' psb' : '');
}

function pJoin() {
  const name = document.getElementById('pname').value.trim();
  const code = (document.getElementById('pcode').value.trim() || '').toUpperCase();
  const err = document.getElementById('perr');
  if (!name) { err.innerText = 'يرجى إدخال اسمك'; err.style.display = 'block'; setTimeout(() => err.style.display = 'none', 2500); return; }
  if (!pSelT) { err.innerText = 'يرجى اختيار فريقك'; err.style.display = 'block'; setTimeout(() => err.style.display = 'none', 2500); return; }
  if (!code) { err.innerText = 'يرجى إدخال كود الجلسة'; err.style.display = 'block'; setTimeout(() => err.style.display = 'none', 2500); return; }
  PM = { name, team: pSelT, id: 'p_' + Math.random().toString(36).substr(2, 8) };
  localStorage.setItem('playerName_' + code, name);
  resetPeerServerIndex();
  connectPlayer(code);
}

function connectPlayer(code) {
  if (pPeer) pPeer.destroy();
  clearTimeout(pRetryTimeout);
  try { pPeer = new Peer(getPeerOptions()); } catch (e) { handlePlayerError(e, code); return; }
  pPeer.on('open', () => {
    pConn = pPeer.connect('hexgame-' + code, { reliable: true });
    pConn.on('open', () => {
      pConn.send({ type: 'join', name: PM.name, team: PM.team, id: PM.id });
      pShowWait();
    });
    pConn.on('data', pOnData);
  });
  pPeer.on('error', e => handlePlayerError(e, code));
  pPeer.on('disconnected', () => { pPeer.reconnect(); });
}

function handlePlayerError(e, code) {
  Logger.warn('Player peer error: ' + e.type);
  if (rotateServer()) { connectPlayer(code); return; }
  pRetryTimeout = setTimeout(() => connectPlayer(code), 3000);
  document.getElementById('perr').innerText = 'خطأ في الاتصال - جارٍ إعادة المحاولة...';
  document.getElementById('perr').style.display = 'block';
}

function pShowWait() {
  go('player-wait');
  const tn = pGS ? (PM.team === 'a' ? pGS.teamA : pGS.teamB) : (PM.team === 'a' ? 'الفريق أ' : 'الفريق ب');
  document.getElementById('pav').className = 'pavatar ' + (PM.team === 'a' ? 'pava' : 'pavb');
  document.getElementById('pav').innerText = PM.team === 'a' ? '🟠' : '🟢';
  document.getElementById('pwn').className = 'pwname t' + PM.team;
  document.getElementById('pwn').innerText = PM.name;
  document.getElementById('pbdg').innerHTML = '<div class="pbadge pb' + PM.team + '">' + tn + '</div>';
  document.getElementById('pwmsg').innerText = 'في انتظار اختيار سؤال...';
}

function pOnData(d) {
  if (d.type === 'name_taken') {
    document.getElementById('perr').innerText = '⚠️ هذا الاسم مستخدم بالفعل في هذا الفريق!';
    document.getElementById('perr').style.display = 'block';
    if (pPeer) { pPeer.destroy(); pPeer = null; pConn = null; }
    go('player-join');
    return;
  }
  if (d.type === 'kicked') {
    alert('لقد تم طردك من اللعبة من قبل الحكم.');
    if (pPeer) { pPeer.destroy(); pPeer = null; pConn = null; }
    go('player-join');
    return;
  }
  if (d.type === 'state') {
    pGS = d.s;
    if (d.s.cols && d.s.rows) setBoardSize(d.s.cols, d.s.rows);
    renderMiniBoard(document.getElementById('miniBoardWrapWait'), pGS.board, pGS.activeCell);
    renderMiniBoard(document.getElementById('miniBoardWrapBz'), pGS.board, pGS.activeCell);
    if (d.s.code) {
      ['player-wait-code','player-bz-code'].forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.textContent = 'كود: ' + d.s.code;
      });
    }
    if (pGS.activeQ && pGS.showQuestion) {
      document.getElementById('pbz-q').innerText = '❓ ' + pGS.activeQ.q;
      document.getElementById('pbz-q').style.display = 'block';
    } else {
      document.getElementById('pbz-q').style.display = 'none';
    }
    if (pGS.showAnswer && pGS.activeQ) {
      document.getElementById('pbz-ans').innerText = '✅ الإجابة: ' + pGS.activeQ.a;
      document.getElementById('pbz-ans').style.display = 'block';
    } else {
      document.getElementById('pbz-ans').style.display = 'none';
    }
    return;
  }
  if (d.type === 'buzzer_ready') { pActivateBz(); return; }
  if (d.type === 'buzzer_won') { pOnBwon(d.winner); return; }
  if (d.type === 'second_chance') { pOnSecond(d.team); return; }
  if (d.type === 'open_q') { pOnOpen(); return; }
  if (d.type === 'tick') { const rc = document.getElementById('pres-cnt'); if (rc) rc.innerText = d.secs; return; }
  if (d.type === 'correct' || d.type === 'skip' || d.type === 'new_round') { pResetWait(); return; }
  if (d.type === 'toggle_question') {
    const qc = document.getElementById('pbz-q');
    if (d.show && pGS && pGS.activeQ) qc.innerText = '❓ ' + pGS.activeQ.q;
    qc.style.display = d.show ? 'block' : 'none';
  }
  if (d.type === 'toggle_answer') {
    const ac = document.getElementById('pbz-ans');
    if (d.show) ac.innerText = '✅ الإجابة: ' + d.answer;
    ac.style.display = d.show ? 'block' : 'none';
  }
}

function pActivateBz() {
  pBzEnabled = true;
  go('player-bz');
  const btn = document.getElementById('main-bz');
  btn.className = 'bzbtn bz' + PM.team + ' rdy';
  btn.innerHTML = '<span class="bzic">⚡</span><span class="bzlbl">اضغط الآن!</span>';
  document.getElementById('pres').style.display = 'none';
  document.getElementById('pbz-st').innerText = '⚡ اضغط البازر بأسرع ما يمكن!';
  document.getElementById('pbz-st').style.color = 'var(--GOLD)';
  document.getElementById('pbz-q').style.display = 'none';
  document.getElementById('pbz-ans').style.display = 'none';
}

function pPressBz(e) {
  if (e) e.preventDefault();
  if (!pBzEnabled) return;
  pBzEnabled = false;
  if (navigator.vibrate) navigator.vibrate([60, 30, 80]);
  if (pConn && pConn.open) pConn.send({ type: 'buzz', name: PM.name, team: PM.team, id: PM.id });
}

function pOnBwon(w) {
  const isMe = w.id === PM.id;
  const btn = document.getElementById('main-bz');
  if (isMe) {
    btn.className = 'bzbtn bz' + PM.team;
    btn.innerHTML = '<span class="bzic">🎤</span><span class="bzlbl">أجب الآن!</span>';
    pSetRes(PM.name + ' 🎉', '⚡ أنت الأول! أجب على الحكم', 5, 'var(--' + (PM.team === 'a' ? 'A' : 'B') + ')');
    document.getElementById('pbz-st').innerText = '✅ أنت الأول!';
  } else {
    btn.className = 'bzbtn bz' + PM.team + ' off';
    btn.innerHTML = '<span class="bzic">⏳</span><span class="bzlbl">' + w.name + '</span>';
    pSetRes(w.name, 'يحاول الإجابة الآن...', 5, 'var(--' + (w.team === 'a' ? 'A' : 'B') + ')');
    document.getElementById('pbz-st').innerText = 'سبقك ' + w.name;
  }
}

function pOnSecond(team) {
  const mine = team === PM.team;
  const btn = document.getElementById('main-bz');
  if (mine) {
    pBzEnabled = true;
    btn.className = 'bzbtn bz' + PM.team + ' rdy';
    btn.innerHTML = '<span class="bzic">🔥</span><span class="bzlbl">فرصتكم!</span>';
    document.getElementById('pres').style.display = 'none';
    document.getElementById('pbz-st').innerText = '🔥 الفرصة الثانية! اضغط الآن!';
    document.getElementById('pbz-st').style.color = 'var(--GOLD)';
  } else {
    btn.className = 'bzbtn bz' + PM.team + ' off';
    btn.innerHTML = '<span class="bzic">⏳</span><span class="bzlbl">انتظر</span>';
    document.getElementById('pbz-st').innerText = 'الفريق الآخر يجيب...';
  }
}

function pOnOpen() {
  pBzEnabled = true;
  const btn = document.getElementById('main-bz');
  btn.className = 'bzbtn bz' + PM.team + ' rdy';
  btn.innerHTML = '<span class="bzic">🔓</span><span class="bzlbl">الكل يجيب!</span>';
  document.getElementById('pres').style.display = 'none';
  document.getElementById('pbz-st').innerText = '🔓 مفتوح للجميع!';
  document.getElementById('pbz-st').style.color = 'var(--GOLD)';
}

function pSetRes(nm, sub, secs, color) {
  const rc = document.getElementById('pres');
  rc.style.display = 'block';
  document.getElementById('pres-nm').style.color = color;
  document.getElementById('pres-nm').innerText = nm;
  document.getElementById('pres-sub').innerText = sub;
  clearInterval(pCdI);
  let t = secs;
  document.getElementById('pres-cnt').innerText = t;
  pCdI = setInterval(() => { t--; document.getElementById('pres-cnt').innerText = Math.max(0, t); if (t <= 0) clearInterval(pCdI); }, 1000);
}

function pResetWait() {
  pBzEnabled = false;
  clearInterval(pCdI);
  go('player-wait');
  document.getElementById('pwmsg').innerText = 'في انتظار اختيار سؤال جديد...';
  document.getElementById('pbz-q').style.display = 'none';
  document.getElementById('pbz-ans').style.display = 'none';
  document.getElementById('pres').style.display = 'none';
}

_addCleanup(function () { clearInterval(pCdI); clearTimeout(pRetryTimeout); if (pPeer) { pPeer.destroy(); pPeer = null; pConn = null; } });

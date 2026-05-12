let LG = {
  teamA: 'الفريق الأحمر', teamB: 'الفريق الأخضر',
  colorA: '#FF5722', colorB: '#4CAF50',
  roundsToWin: 2, round: 1,
  pts: { a: 0, b: 0 }, rndWins: { a: 0, b: 0 },
  letters: [], owner: [],
  activeCell: null, activeQ: null, timerInt: null,
  diffFilter: 'all', catFilter: 'all',
  timeA: 20, timeB: 20
};

function startLocal() {
  LG.teamA = document.getElementById('lta').value.trim() || 'الفريق الأحمر';
  LG.teamB = document.getElementById('ltb').value.trim() || 'الفريق الأخضر';
  LG.colorA = document.getElementById('lca').value || '#FF5722';
  LG.colorB = document.getElementById('lcb').value || '#4CAF50';
  var bs = parseInt(document.getElementById('lbs').value) || 5;
  setBoardSize(bs, bs);
  LG.roundsToWin = parseInt(document.getElementById('lrw').value);
  LG.timeA = parseInt(document.getElementById('lta-time').value) || 20;
  LG.timeB = parseInt(document.getElementById('ltb-time').value) || 20;
  LG.round = 0;
  LG.pts = { a: 0, b: 0 };
  LG.rndWins = { a: 0, b: 0 };
  LG.diffFilter = 'all';
  LG.catFilter = 'all';
  applyTeamColors(LG.colorA, LG.colorB);
  document.getElementById('lqb-a').innerText = '✅ فوز ' + LG.teamA.substr(0, 7);
  document.getElementById('lqb-b').innerText = '✅ فوز ' + LG.teamB.substr(0, 7);
  go('local-game');
  resetLocal();
}

function resetLocal() {
  clearInterval(LG.timerInt);
  lCloseModal();
  document.getElementById('local-win').classList.remove('on');
  Object.keys(UQ).forEach(k => delete UQ[k]);
  LG.letters = randLetters();
  LG.owner = Array(N).fill(null);
  LG.pts = { a: 0, b: 0 };
  LG.activeCell = null;
  LG.activeQ = null;
  LG.round++;
  lUpdateUI();
  renderHexBoard(document.getElementById('local-board'), LG.letters, LG.owner, null, lHexClick);
}

function lHexClick(i) {
  if (LG.owner[i]) return;
  LG.activeCell = i;
  LG.activeQ = pickQ(LG.letters[i], LG.diffFilter, LG.catFilter);
  if (!LG.activeQ) return;
  renderHexBoard(document.getElementById('local-board'), LG.letters, LG.owner, i, lHexClick);

  document.getElementById('lq-letter').innerText = '✨ سؤال حرف (' + LG.letters[i] + ')';
  showDiffBadge(document.getElementById('lq-diff-badge'), LG.activeQ);
  showCatBadge(document.getElementById('lq-cat-badge'), LG.activeQ);
  document.getElementById('lq-text').innerText = LG.activeQ.q;
  document.getElementById('lq-ans').innerText = '✅ الإجابة: ' + LG.activeQ.a;
  document.getElementById('lq-ans').style.display = 'none';
  document.getElementById('lv-ov').classList.add('on');
  document.getElementById('lv-qm').classList.add('on');

  clearInterval(LG.timerInt);
  var t = LG.timeA, maxT = t;
  var el = document.getElementById('lq-timer');
  el.innerText = t;
  el.classList.remove('urg');
  LG.timerInt = setInterval(function () {
    t--;
    el.innerText = t;
    if (t <= 5) el.classList.add('urg');
    if (t <= 0) { clearInterval(LG.timerInt); lShowAns(); }
  }, 1000);
}

function lShowAns() {
  clearInterval(LG.timerInt);
  document.getElementById('lq-ans').style.display = 'block';
}

function lNextQ() {
  if (LG.activeCell === null) return;
  LG.activeQ = pickQ(LG.letters[LG.activeCell], LG.diffFilter, LG.catFilter);
  if (!LG.activeQ) return;
  document.getElementById('lq-text').innerText = LG.activeQ.q;
  document.getElementById('lq-ans').innerText = '✅ الإجابة: ' + LG.activeQ.a;
  document.getElementById('lq-ans').style.display = 'none';
  clearInterval(LG.timerInt);
  // Use team B time for subsequent questions
  var tmp = LG.timeA;
  LG.timeA = LG.timeB;
  LG.timeB = tmp;
  lHexClick(LG.activeCell);
}

function lMark(team) {
  if (LG.activeCell === null) return;
  LG.owner[LG.activeCell] = team;
  LG.pts[team]++;
  clearInterval(LG.timerInt);
  lCloseModal();
  renderHexBoard(document.getElementById('local-board'), LG.letters, LG.owner, null, lHexClick);
  lUpdateUI();
  if (bfsWin(LG.owner, team)) { lShowWinner(team); return; }
  if (LG.owner.every(o => o)) lShowWinner(LG.pts.a >= LG.pts.b ? 'a' : 'b');
}

function lCloseModal() {
  clearInterval(LG.timerInt);
  document.getElementById('lv-ov').classList.remove('on');
  document.getElementById('lv-qm').classList.remove('on');
  LG.activeCell = null;
  renderHexBoard(document.getElementById('local-board'), LG.letters, LG.owner, null, lHexClick);
}

function lShowWinner(team) {
  LG.rndWins[team]++;
  lUpdateUI();
  const nm = team === 'a' ? LG.teamA : LG.teamB;
  const col = team === 'a' ? 'var(--A)' : 'var(--B)';
  document.getElementById('lw-nm').innerHTML = '<span style="color:' + col + '">' + nm + '</span>';
  document.getElementById('lw-sb').innerText = '🏆 فاز بالجولة ' + LG.round + ' — جولات: ' + LG.rndWins[team] + '/' + LG.roundsToWin;
  document.getElementById('local-win').classList.add('on');
  confetti(team);
  if (LG.rndWins[team] >= LG.roundsToWin) {
    document.getElementById('lw-sb').innerText = '🏆 فاز باللعبة كاملة!';
  }
}

function setLocalDiff(diff) { LG.diffFilter = diff; }
function setLocalCat(cat) { LG.catFilter = cat; }

_addCleanup(function () { clearInterval(LG.timerInt); });

let LS = { diff: 'all', cat: 'all' };

function lOpenSettings() {
  document.getElementById('lsi-ta').value = LG.teamA;
  document.getElementById('lsi-tb').value = LG.teamB;
  document.getElementById('lsi-ca').value = LG.colorA;
  document.getElementById('lsi-cb').value = LG.colorB;
  document.getElementById('lsi-bs').value = COLS || 5;
  document.getElementById('lsi-rw').value = LG.roundsToWin;
  document.getElementById('lsi-ta-t').value = LG.timeA;
  document.getElementById('lsi-tb-t').value = LG.timeB;
  document.getElementById('lsi-a').style.background = LG.colorA;
  document.getElementById('lsi-b').style.background = LG.colorB;
  LS.diff = LG.diffFilter;
  LS.cat = LG.catFilter;
  var dbtns = document.querySelectorAll('#lsi-diff .diff-btn');
  dbtns.forEach(function(b){ b.classList.remove('active-all'); });
  var actDiff = document.querySelector('#lsi-diff .diff-btn[data-diff="'+LS.diff+'"]');
  if (actDiff) actDiff.classList.add('active-all');
  var cbtns = document.querySelectorAll('#lsi-cat .cat-btn');
  cbtns.forEach(function(b){ b.classList.remove('active'); });
  var actCat = document.querySelector('#lsi-cat .cat-btn[data-cat="'+LS.cat+'"]');
  if (actCat) actCat.classList.add('active');
  document.getElementById('ls-ov').classList.add('on');
  document.getElementById('ls-settings').classList.add('on');
}

function lCloseSettings() {
  document.getElementById('ls-ov').classList.remove('on');
  document.getElementById('ls-settings').classList.remove('on');
}

function lSetSettingsDiff(el) {
  document.querySelectorAll('#lsi-diff .diff-btn').forEach(function(b){ b.classList.remove('active-all'); });
  if (el) el.classList.add('active-all');
  LS.diff = el ? el.getAttribute('data-diff') : 'all';
}

function lSetSettingsCat(el) {
  document.querySelectorAll('#lsi-cat .cat-btn').forEach(function(b){ b.classList.remove('active'); });
  if (el) el.classList.add('active');
  LS.cat = el ? el.getAttribute('data-cat') : 'all';
}

function lApplySettings() {
  var newSize = parseInt(document.getElementById('lsi-bs').value) || 5;
  var sizeChanged = newSize !== (COLS || 5);
  if (sizeChanged && LG.owner.some(function(o){ return o !== null; })) {
    if (!confirm('⚠️ تغيير حجم اللوحة سيؤدي إلى إعادة تعيين اللعبة! هل أنت متأكد؟')) return;
  }
  LG.teamA = document.getElementById('lsi-ta').value.trim() || LG.teamA;
  LG.teamB = document.getElementById('lsi-tb').value.trim() || LG.teamB;
  LG.colorA = document.getElementById('lsi-ca').value || LG.colorA;
  LG.colorB = document.getElementById('lsi-cb').value || LG.colorB;
  applyTeamColors(LG.colorA, LG.colorB);
  LG.roundsToWin = parseInt(document.getElementById('lsi-rw').value) || LG.roundsToWin;
  LG.timeA = parseInt(document.getElementById('lsi-ta-t').value) || LG.timeA;
  LG.timeB = parseInt(document.getElementById('lsi-tb-t').value) || LG.timeB;
  LG.diffFilter = LS.diff;
  LG.catFilter = LS.cat;
  if (sizeChanged) {
    setBoardSize(newSize, newSize);
    LG.owner = Array(N).fill(null);
    LG.letters = randLetters();
    LG.pts = { a: 0, b: 0 };
    LG.rndWins = { a: 0, b: 0 };
    LG.round = 1;
    if (LG.activeCell !== null) lCloseModal();
    document.getElementById('lw-nm').innerText = 'الفائز!';
    document.getElementById('local-win').classList.remove('on');
  }
  lUpdateUI();
  renderHexBoard(document.getElementById('local-board'), LG.letters, LG.owner, null, lHexClick);
  lCloseSettings();
}

function lUpdateUI() {
  document.getElementById('lsa-n').innerText = LG.teamA;
  document.getElementById('lsb-n').innerText = LG.teamB;
  document.getElementById('lsa-p').innerText = LG.pts.a;
  document.getElementById('lsb-p').innerText = LG.pts.b;
  document.getElementById('lsa-w').innerText = 'جولات: ' + LG.rndWins.a;
  document.getElementById('lsb-w').innerText = 'جولات: ' + LG.rndWins.b;
  const t = ['', 'الأولى', 'الثانية', 'الثالثة', 'الرابعة', 'الخامسة'];
  document.getElementById('lrlbl').innerText = 'الجولة ' + (t[LG.round] || LG.round);
}

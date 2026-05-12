(function () {
  const p = new URLSearchParams(location.search);
  const mode = p.get('mode'), code = p.get('code');

  if (mode === 'player') {
    go('player-join');
    if (code) document.getElementById('pcode').value = code;
  } else if (mode === 'display' && code) {
    go('display');
    startDisplay(code);
  } else {
    go('home');
  }

  document.querySelectorAll('#judge-right-panel .ps h3').forEach(function (h3) {
    h3.style.cursor = 'pointer';
    h3.addEventListener('click', function () { toggleSection(h3); });
  });

  const pnameInput = document.getElementById('pname');
  if (pnameInput) {
    pnameInput.addEventListener('change', function () {
      const c = document.getElementById('pcode').value.trim().toUpperCase();
      if (c && pnameInput.value.trim()) {
        localStorage.setItem('playerName_' + c, pnameInput.value.trim());
      }
    });
  }

  window.addEventListener('resize', function () {
    if (document.getElementById('local-game').classList.contains('on')) {
      renderHexBoard(document.getElementById('local-board'), LG.letters, LG.owner, LG.activeCell, lHexClick);
    }
    if (document.getElementById('judge-game').classList.contains('on')) {
      renderHexBoard(document.getElementById('judge-board'), JS.letters, JS.owner, JS.activeCell, jHexClick);
    }
    if (document.getElementById('display').classList.contains('on') && dpBrd.length) {
      dpApply({ board: dpBrd, pts: JS.pts, teamA: JS.teamA, teamB: JS.teamB });
    }
  });
})();

let COLS = 5, ROWS = 5, N = 25;

function setBoardSize(c, r) { COLS = c; ROWS = r; N = c * r; }

function getHW() {
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--HW')) || 68;
}

function hexPos(i, scale) {
  scale = scale || 1;
  const HW = getHW() * scale, HH = HW * 0.866;
  const col = i % COLS, row = Math.floor(i / COLS), odd = col % 2 === 1;
  return { x: col * HW * 0.75, y: row * HH + (odd ? HH * 0.5 : 0), w: HW, h: HH };
}

function boardDims(scale) {
  scale = scale || 1;
  const HW = getHW() * scale, HH = HW * 0.866;
  return { W: (COLS - 1) * HW * 0.75 + HW, H: (ROWS - 1) * HH + HH * 0.5 + HH };
}

function hexNbrs(i) {
  const col = i % COLS, row = Math.floor(i / COLS), odd = col % 2 === 1;
  const dirs = odd
    ? [[0,-1],[0,1],[-1,0],[-1,1],[1,0],[1,1]]
    : [[0,-1],[0,1],[-1,-1],[-1,0],[1,-1],[1,0]];
  const res = [];
  for (const [dc, dr] of dirs) {
    const nc = col + dc, nr = row + dr;
    if (nc >= 0 && nc < COLS && nr >= 0 && nr < ROWS) res.push(nr * COLS + nc);
  }
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
    const cur = q.shift();
    if (endSet.has(cur)) return true;
    if (vis.has(cur)) continue;
    vis.add(cur);
    for (const nb of hexNbrs(cur)) {
      if (!vis.has(nb) && owner[nb] === team) q.push(nb);
    }
  }
  return false;
}

function renderHexBoard(boardEl, letters, owner, activeCell, clickFn, scale) {
  scale = scale || 1;
  const { W, H } = boardDims(scale);
  boardEl.style.width = W + 'px';
  boardEl.style.height = H + 'px';
  boardEl.innerHTML = '';
  letters.forEach((l, i) => {
    const { x, y, w, h } = hexPos(i, scale);
    const d = document.createElement('div');
    d.className = 'hex';
    if (owner[i] === 'a') d.classList.add('ca');
    else if (owner[i] === 'b') d.classList.add('cb');
    if (activeCell === i) d.classList.add('aq');
    d.style.cssText = 'left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + h + 'px;font-size:' + (w * 0.30) + 'px;';
    d.innerText = l;
    if (clickFn) {
      d.addEventListener('click', () => clickFn(i));
      d.addEventListener('touchend', e => { e.preventDefault(); clickFn(i); }, { passive: false });
    }
    boardEl.appendChild(d);
  });
}

function renderMiniBoard(wrapEl, board, activeCell) {
  if (!board || !wrapEl) return;
  if (wrapEl._miniBoardCleanup) wrapEl._miniBoardCleanup();
  wrapEl.innerHTML = '';
  const baseScale = 0.8;
  const { W, H } = boardDims(baseScale);
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.top = '50%';
  container.style.left = '50%';
  container.style.width = W + 'px';
  container.style.height = H + 'px';
  wrapEl.appendChild(container);
  board.forEach((c, i) => {
    const { x, y, w, h } = hexPos(i, baseScale);
    const d = document.createElement('div');
    d.className = 'mini-hex';
    if (c.owner === 'a') d.classList.add('a');
    else if (c.owner === 'b') d.classList.add('b');
    if (activeCell !== null && i === activeCell) d.classList.add('active');
    const fs = Math.max(w * 0.38, 12);
    d.style.cssText = 'left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + h + 'px;font-size:' + fs + 'px;line-height:' + h + 'px;';
    d.innerText = c.letter;
    container.appendChild(d);
  });
  const scaleBoard = () => {
    const wrapW = wrapEl.clientWidth, wrapH = wrapEl.clientHeight;
    if (!wrapW || !wrapH) return;
    const s = Math.min(wrapW / W, wrapH / H, 1.2);
    container.style.transform = 'translate(-50%,-50%) scale(' + s + ')';
    container.style.transformOrigin = 'center center';
  };
  requestAnimationFrame(scaleBoard);
  window.addEventListener('resize', scaleBoard);
  wrapEl._miniBoardCleanup = function () {
    window.removeEventListener('resize', scaleBoard);
  };
}

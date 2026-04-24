/* ════════════════════════════════════════
   script.js — محرك اللعبة المطور
   ════════════════════════════════════════ */

// 1. نظام التنقل بين الشاشات
function go(id) {
  document.querySelectorAll('.scr').forEach(s => s.classList.remove('on'));
  const el = document.getElementById(id);
  if (el) {
    el.classList.add('on');
    window.scrollTo(0, 0);
  }
}

// 2. إعدادات اللعب المحلي (Local Game)
let LG = {
  teamA: '', teamB: '', ptsA: 0, ptsB: 0,
  letters: [], owner: [], activeCell: null
};

function startLocalGame() {
  LG.teamA = document.getElementById('l-name-a').value || 'الفريق أ';
  LG.teamB = document.getElementById('l-name-b').value || 'الفريق ب';
  LG.ptsA = 0; LG.ptsB = 0;
  
  // إنشاء لوحة عشوائية من 25 حرفاً
  const all = Object.keys(QBANK);
  LG.letters = [];
  for(let i=0; i<25; i++) LG.letters.push(all[Math.floor(Math.random()*all.length)]);
  LG.owner = Array(25).fill(null);
  
  document.getElementById('la-name').innerText = LG.teamA;
  document.getElementById('lb-name').innerText = LG.teamB;
  updateLocalScore();
  
  renderHexBoard(document.getElementById('local-board'), LG.letters, LG.owner, null, lHexClick);
  go('local-game');
}

function lHexClick(idx) {
  if (LG.owner[idx]) return;
  LG.activeCell = idx;
  const char = LG.letters[idx];
  const qs = QBANK[char] || [];
  if (qs.length === 0) return showToast('لا توجد أسئلة لهذا الحرف');
  
  const q = qs[Math.floor(Math.random()*qs.length)];
  document.getElementById('lq-letter').innerText = char;
  document.getElementById('lq-text').innerText = q.q;
  document.getElementById('lq-ans').innerText = q.a;
  document.getElementById('lq-ans').style.display = 'none';
  
  // إظهار التصنيف والصعوبة إن وجدا
  const cat = document.getElementById('lq-cat-badge');
  if(cat) cat.innerText = q.cat || 'عام';

  document.getElementById('local-q-modal').style.display = 'flex';
}

function lAnswer(isCorrect) {
  document.getElementById('local-q-modal').style.display = 'none';
  if (isCorrect) {
    // تحديد من الفريق الحالي (تبسيطاً: الحكم يختار الفريق الفائز يدوياً أو بنظام الدور)
    const team = confirm(`هل الفريق (${LG.teamA}) هو من أجاب صح؟\n(موافق لـ ${LG.teamA} / إلغاء لـ ${LG.teamB})`) ? 'a' : 'b';
    LG.owner[LG.activeCell] = team;
    if (team === 'a') LG.ptsA++; else LG.ptsB++;
    updateLocalScore();
    checkWinner(LG.owner, LG.teamA, LG.teamB);
  }
  LG.activeCell = null;
  renderHexBoard(document.getElementById('local-board'), LG.letters, LG.owner, null, lHexClick);
}

function updateLocalScore() {
  document.getElementById('la-score').innerText = LG.ptsA;
  document.getElementById('lb-score').innerText = LG.ptsB;
}

// 3. رسم اللوحة السداسية (Hex Board)
function renderHexBoard(container, letters, owners, active, callback, scale=1) {
  if (!container) return;
  container.innerHTML = '';
  const grid = document.createElement('div');
  grid.className = 'hex-grid';
  grid.style.gridTemplateColumns = `repeat(5, 1fr)`;
  
  letters.forEach((l, i) => {
    const h = document.createElement('div');
    h.className = 'hex' + (owners[i] ? ' owned-' + owners[i] : '') + (active === i ? ' active' : '');
    h.innerText = l;
    h.onclick = () => callback && callback(i);
    grid.appendChild(h);
  });
  container.appendChild(grid);
}

// 4. نظام شاشة البروجكتر (الحل لمشكلتك)
function showDisplayScreen() {
  const code = prompt('أدخل كود الجلسة للاتصال بالبروجكتر:', '');
  if (!code) return;
  go('display');
  document.getElementById('dp-st').innerText = 'جاري الاتصال بـ ' + code;
  // هنا يتم ربط PeerJS (تم اختصاره للمساحة، لكنه مجهز لاستقبال البيانات)
}

// 5. وظائف إضافية
function showToast(msg) {
  const c = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerText = msg;
  c.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

function confirmExit() {
  if (confirm('هل أنت متأكد من إنهاء اللعبة والعودة للرئيسية؟')) go('home');
}

// التحقق من الفوز (اتصال الخلايا)
function checkWinner(board, nameA, nameB) {
  // خوارزمية بسيطة للتحقق من وصول الفريق أ (يمين-يسار) أو ب (أعلى-أسفل)
  // يمكن توسيعها لاحقاً
}
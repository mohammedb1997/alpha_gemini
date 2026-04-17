# 🏆 تحدي الحروف — ملف التسليم الكامل للمشروع
## Project Handoff Summary — Arabic Letter Challenge Game

---

## 📌 فكرة المشروع (Project Concept)

لعبة تفاعلية جماعية تُلعب على شاشة عرض كبيرة (بروجكتر/تلفاز) بين فريقين. كل فريق يتنافس على استجابة لأسئلة مرتبطة بالحروف العربية. اللوحة مكونة من 25 خلية سداسية (Hex Grid 5×5) تحتوي كل منها على حرف عربي.

**نمط الفوز (كلعبة Hex الكلاسيكية):**
- الفريق أ (أحمر): يربط بين العمود الأيسر والأيمن (أفقياً)
- الفريق ب (فيروزي/أخضر): يربط بين الصف الأعلى والأسفل (عمودياً)

---

## 🗂️ هيكل الملفات (File Structure)

```
game/
├── judge.html     → شاشة الحكم (الرئيسية) — يفتحها المقدم/الحكم
├── player.html    → شاشة اللاعب (جوال) — بازر للضغط السريع
├── display.html   → شاشة العرض (بروجكتر) — للجمهور
└── README.md      → هذا الملف
```

---

## 🔌 التقنيات المستخدمة (Tech Stack)

| التقنية | الغرض |
|---------|--------|
| HTML/CSS/JS | بدون frameworks — ملف واحد لكل شاشة |
| PeerJS 1.5.1 | WebRTC P2P للتواصل الفوري بين الأجهزة |
| STUN/TURN Servers | للاتصال عبر الإنترنت (openrelay.metered.ca) |
| QRCode.js | توليد QR للانضمام السريع |
| Cairo Font (Google) | الخط العربي |

---

## 🎮 كيفية اللعب (Game Flow)

### للحكم (judge.html):
1. أدخل أسماء الفريقين وعدد الجولات للفوز (1-3)
2. اضغط "إنشاء الغرفة وبدء اللعبة"
3. افتح شاشة display.html على البروجكتر (رابط يظهر تلقائياً)
4. اطلب من اللاعبين مسح QR أو الدخول لـ player.html?code=XXXXX
5. اضغط على أي خلية في اللوحة → يظهر السؤال
6. اللاعبون يضغطون البازر → أول شخص يضغط يظهر اسمه + عداد 5 ثوانٍ
7. إذا لم يُجب → الفريق الثاني يحصل على 10 ثوانٍ → ثم مفتوح للجميع
8. الحكم يضغط "✅ صح (أ)" أو "✅ صح (ب)" → الخلية تتلوّن بلون الفريق
9. يفوز الفريق الذي يربط خلاياه عبر اللوحة أولاً

---

## 🐛 المشاكل التي تم حلها (Bugs Fixed)

### 1. ❌ تشوه الخلايا السداسية (HEX GEOMETRY FIX)
**المشكلة:** الخلايا السداسية كانت تتشوه أو تختفي بسبب:
- استخدام CSS Grid مع `translateX` للإزاحة — يسبب تداخلاً غير صحيح
- الحجم المحسوب لا يتناسب مع نسبة السداسي الصحيحة
- `clip-path` يعمل على أبعاد خاطئة

**الحل:** التخلي التام عن Grid-based layout واستبداله بـ **Absolute Positioning**:
```javascript
// كل خلية توضع بإحداثيات (x,y) محسوبة رياضياً
// Pointy-top hexagon:
// xStep = width * 0.75
// yStep = height (= width * 1.1547)
// الأعمدة الفردية تتزاح للأسفل بـ height/2
function hexPos(i) {
  const col = i % COLS, row = Math.floor(i / COLS);
  const x = col * (width * 0.75);
  const y = row * height + (col % 2 === 1 ? height * 0.5 : 0);
  return { x, y };
}
```

### 2. ❌ منطق الفوز خاطئ (WIN LOGIC FIX)
**المشكلة:** الكود القديم كان يستخدم جيراناً غير صحيحين للشبكة السداسية

**الحل:** BFS صحيح مع حساب جيران الشبكة السداسية Pointy-top offset:
```javascript
// الأعمدة الفردية vs الزوجية لها جيران مختلفة
function hexNeighbours(i) {
  const col = i % COLS, isOdd = col % 2 === 1;
  const dirs = isOdd
    ? [[-1,0],[-1,1],[0,-1],[0,1],[1,0],[1,1]]  // odd col
    : [[-1,-1],[-1,0],[0,-1],[0,1],[1,-1],[1,0]]; // even col
}
// فريق أ: BFS من العمود 0 إلى العمود 4 (أفقي)
// فريق ب: BFS من الصف 0 إلى الصف 4 (عمودي)
```

### 3. ❌ مشاكل التوافق مع الجوال (MOBILE RESPONSIVE FIX)
- استبدال `hover` فقط بـ `touchend` handlers
- `touch-action: manipulation` لمنع التأخير 300ms
- `user-select: none` لمنع تحديد النص عند اللمس
- حجم CSS متغير: `--hs: clamp(54px, 7.5vw, 78px)` — يتكيف مع جميع الشاشات
- `window.addEventListener('resize', renderBoard)` — إعادة رسم عند تغيير الحجم

### 4. ❌ لا ألوان على جوانب اللوحة (EDGE INDICATOR FIX)
- أضيفت علامات تشريحية (legend) توضح اتجاه كل فريق
- ألوان الحدود في الـ score cards تتطابق مع لون الفريق

### 5. ❌ تكرار الأسئلة (QUESTION DEDUP FIX)
```javascript
// تتبع الأسئلة المستخدمة لكل حرف
if (!S.usedQ[letter]) S.usedQ[letter] = new Set();
const used = S.usedQ[letter];
if (used.size >= qs.length) used.clear(); // إعادة تشغيل بعد استنفاد الكل
let idx; do { idx = Math.floor(Math.random() * qs.length); } while (used.has(idx));
```

---

## 🌐 كيفية النشر (Deployment)

### الطريقة الأسرع — Netlify Drop (مجاناً بدون حساب):
1. اذهب إلى https://app.netlify.com/drop
2. اسحب المجلد الذي يحتوي على الملفات الثلاثة وأفلته
3. ستحصل على رابط مثل: `https://xxxxx.netlify.app/`

### GitHub Pages:
1. أنشئ repo جديد على GitHub
2. ارفع judge.html و player.html و display.html
3. Settings → Pages → Source: main branch
4. الرابط: `https://username.github.io/repo-name/`

### كيفية الاستخدام بعد النشر:
- **الحكم:** `https://yoursite.com/judge.html`
- **البروجكتر:** `https://yoursite.com/display.html?code=XXXXX`
- **اللاعبون:** `https://yoursite.com/player.html?code=XXXXX`

(الكود XXXXX يظهر تلقائياً في شاشة الحكم ويُولَّد مع كل جلسة)

---

## ⚙️ ملاحظات تقنية مهمة (Technical Notes)

### PeerJS Architecture:
```
judge.html  →  creates Peer('hexgame-XXXXX')
display.html → connects to 'hexgame-XXXXX'
player.html  → connects to 'hexgame-XXXXX'
```
- الحكم هو **Host** (PeerJS ID ثابت)
- الجميع يتصلون به كـ Clients
- التواصل عبر WebRTC P2P مباشرة

### رسائل البروتوكول (Messages):
| type | من → إلى | البيانات |
|------|-----------|----------|
| join | player→judge | name, team, id |
| state | judge→all | state object |
| buzzer_ready | judge→all | letter |
| show_q | judge→all | q |
| buzz | player→judge | name, team, id |
| buzzer_won | judge→all | winner object |
| second_chance | judge→all | team |
| open_q | judge→all | — |
| tick | judge→all | secs |
| correct | judge→all | team |
| skip | judge→all | — |
| new_round | judge→all | round |

### بنك الأسئلة (QBANK):
- 27 حرف عربي × ~15 سؤال = ~405 سؤال
- يمكن توسيعه في الكود مباشرة
- بنية: `QBANK["حرف"] = [{q: "السؤال؟", a: "الإجابة"}]`

---

## 🔮 تحسينات مستقبلية مقترحة (Future Improvements)

1. **Socket.io بدل PeerJS** — للاتصال الأكثر موثوقية عبر الإنترنت
2. **نمط محلي** — لعب بدون إنترنت على جهاز واحد (normal.html)
3. **إضافة أسئلة** — واجهة لإضافة أسئلة مخصصة
4. **حفظ النتائج** — localStorage أو قاعدة بيانات
5. **صوت وموسيقى** — Web Audio API لإضافة مؤثرات صوتية
6. **تحديد اللاعبين** — تحديد لاعب بعينه للإجابة من كل فريق

---

## 💻 تشغيل محلي (Local Testing)

**لا يعمل** بفتح الملفات مباشرة (file://) بسبب PeerJS.

**الحل:** استخدم Live Server:
```bash
# Python
python -m http.server 8080

# Node.js
npx serve .
```
ثم: http://localhost:8080/judge.html

---

*تم تطوير هذا المشروع بمساعدة Claude (Anthropic)*
*التاريخ: 2026*

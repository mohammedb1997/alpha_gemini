# 📍 PROJECT_MAP — تحدي الحروف

## SYSTEM_FLOW
```
[Home] → Local Setup → [Local Game Board] → Q Modal → Score + Win
        → Judge Setup → [Judge Game] ←→ Player Buzzers + Display Screen
        → Display Screen (connected to Judge)
        → Player Join (connected to Judge)
```

## FILES & RESPONSIBILITY

| File | Role | Status |
|------|------|--------|
| `src/index.html` | UI with all styles + screens | ✅ Complete |
| `src/core/logger.js` | RingBuffer logger | ✅ Complete |
| `src/core/hex-engine.js` | Hex board math, BFS win, render | ✅ Complete |
| `src/core/utils.js` | Screen nav, confetti, Q picker, filters | ✅ Complete |
| `src/network/peer-config.js` | PeerJS server config + rotation | ✅ Complete |
| `src/data/qbank.js` | Question bank (all letters) | ✅ Complete |
| `src/screens/local-game.js` | Local 2-team game logic | ✅ Complete |
| `src/screens/judge-game.js` | Judge/host game logic + networking | ✅ Complete |
| `src/screens/player.js` | Player buzzer logic | ✅ Complete |
| `src/screens/display.js` | Projector display client | ✅ Complete |
| `src/index.js` | Router + resize handler | ✅ Complete |
| `build.js` | Bundles all JS into single HTML | ✅ Built (192 KB, scripts wrapped in `<script>`) |

## CRITICAL BUG FIXED - Build script

**البنك:** `build.js` كان يستبدل `<!-- SCRIPTS -->` بالكود الخام دون وسم `<script>`، فالمتصفح لا ينفذ الـ JS مطلقاً. أُضيف `<script>` و `</script>` حول الكود.

**الأعراض السابقة:** كان يظهر الـ HTML/CSS فقط (الشاشة الرئيسية) لكن الأزرار لا تعمل لأن `go()` غير معرفة.

## BUGS FIXED - Batch 2

1. **`serve.js` query string 404** — `q.url` كان يشمل query params (مثل `?mode=display&code=XXX`)، فكان الخادم يحاول إيجاد ملف بهذا الاسم. أُضيف `url.parse(q.url).pathname` لاستخراج المسار فقط.

2. **حروف ناقصة في QBANK2** — البنك كان يحتوي 24 حرفاً فقط، بينما اللوحة تحتاج 25. الأضيفت الحروف: `ا`, `ذ`, `ض`, `ظ`, `غ` (4 أسئلة لكل حرف). الآن 29 مفتاحاً، الـ `randLetters()` تختار 25 منها عشوائياً دون `undefined`.

## FIXES APPLIED

1. **`setLiveDiff` override conflict** — Removed duplicate `setLiveDiff(diff)` from `judge-game.js` that was overwriting the correct UI-aware version in `utils.js`.
2. **`dist/` built** — Successfully generated `dist/bundle.html` (191 KB).
3. **Live category filter added** — Added `setLiveCat()` in `utils.js` and live category filter UI in judge right panel.
4. **`.urg` CSS class** — Added timer urgency styling (`qtmr.urg`) so timer turns red and pulses when ≤5s remain.
5. **`jPub()` now sends `round` and `rndWins`** — Display screen can show round/win info.
6. **`dpApply` sets question text + visibility directly** — `toggle_question` works even before anyone buzzes (was showing empty box).
7. **Display screen win counts** — Added `dp-aw`/`dp-bw` elements showing `جولات: N` for each team on projector.

## FIXES APPLIED - Batch 3 (v2.0)

1. **لوحة اللاعب المصغرة** — `hex-engine.js:renderMiniBoard`: زيد `baseScale` من 0.55 إلى 0.8، حجم الخط `max(w*0.38,12px)`. أضيف `_miniBoardCleanup()` لمنع تراكم الـ resize listeners. أضيف `requestAnimationFrame` لضمان اكتمال التخطيط قبل القياس.

2. **كود الجلسة + QR في شاشة البروجكتر** — `judge-game.js:jPub()`: أضيف `code` إلى بيانات الحالة. `display.js:dpApply()`: يقرأ الكود من الحالة ويولّد QR ويعرض كود الجلسة في `#display-code` و `#display-qr`.

3. **كود الجلسة في شاشة اللاعب** — `player.js:pOnData`: يملأ `#player-wait-code` و `#player-bz-code` بكود الجلسة المستلم من الحكم.

4. **نظام تنظيف شامل (cleanupAll)** — `utils.js`: أضيف `_cleanups[]` و `cleanupAll()` تُستدعى عند الانتقال إلى الشاشة الرئيسية، تُدمّر اتصالات Peer وتُصفّر المؤقتات في كل الشاشات (local, judge, player, display).

## TECH_STACK

| التقنية | الإصدار | المصدر |
|---------|---------|--------|
| PeerJS | 1.5.5 | `unpkg.com/peerjs@1.5.5` |
| QRCodeJS | 1.0.0 | `cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0` |
| Cairo Font | 500/700/900 | `fonts.googleapis.com` |
| Node.js | (بيئة بناء) | `build.js`, `serve.js` |

## ARCHITECTURE

### التبعيات (Dependency Order)
```
utils.js (go, cleanupAll, confetti, pickQ, filters)
  → logger.js
  → hex-engine.js (board math, render)
  → peer-config.js (server rotation)
  → qbank.js (data)
  → screens/local-game.js
  → screens/judge-game.js (→ display.js ←→ player.js)
  → index.js (router, resize)
```

### تدفق البيانات (Data Flow)
```
Judge Peer ←→ Player Peer (buzz, join, state)
Judge Peer ←→ Display Peer (state, tick, buzzer_won)
Local Game: all in-memory (no network)
```

## FIXES APPLIED - Batch 4 (v3.0 — Configurable)

1. **حجم اللوحة قابل للتعديل (4×4 إلى 10×10)** — `hex-engine.js:setBoardSize(c,r)`: COLS/ROWS/N صارت `let` مع دالة `setBoardSize`. `utils.js:randLetters()`: تتعامل مع أي حجم (تقوم بتكرار الحروف إذا N > 29). أضيف `<select id="lbs/jbs">` في شاشتي الإعداد مع خيارات من 4 إلى 10.

2. **وقت إجابة لكل فريق** — `local-game.js`: أضيف `timeA`/`timeB` مع مدخلات `<input type="number">` في الإعداد. السؤال الأول يستخدم `timeA`، زر "سؤال آخر" يبدّل بين `timeA` ↔ `timeB`. `judge-game.js`: الفائز بالبازر يأخذ وقت فريقه، الفرصة الثانية تأخذ وقت الفريق الآخر.

3. **منع تكرار أسماء اللاعبين** — `judge-game.js:jOnData`: عند محاولة الانضمام بنفس الاسم+الفريق، يُرسل `{type:'name_taken'}` للاعب. `player.js:pOnData`: يعرض رسالة خطأ ويعود لشاشة الانضمام.

4. **ألوان الفريقين قابلة للتخصيص** — `utils.js:applyTeamColors()`: تضبط CSS variables `--A`, `--A2`, `--A-rgb`, `--B`, `--B2`, `--B-rgb`. أضيف `<input type="color">` في الإعداد. كل `rgba(255,87,34,` و `rgba(76,175,80,)` في CSS استُبدلت بـ `rgba(var(--A-rgb),` و `rgba(var(--B-rgb),`. الأعمدة الجانبية تتحدّث تلقائياً.

5. **دعم اللمس والتجاوب مع جميع الأجهزة** — `index.html`: أضيف `*{touch-action:manipulation}` لمنع تأخير النقر على اللمس، `-webkit-overflow-scrolling:touch` على جميع الشاشات لتمرير سلس على iOS، `overflow:auto` على مناطق اللوحة (`.barea`, `.jcenter`, `.dpcenter`) لتمكين التمرير عند كبر حجم اللوحة (حتى 10×10). أضيف breakpoints جديدة: 700px (للمد), 480px (للهواتف), 380px (الشاشات الصغيرة جداً). في 480px: صفوف الإعداد تتحول لعمود واحد (`grid-template-columns:1fr`), اللوحات الجانبية تصبح أضيق.

## FIXES - Batch 5 (v2.2)

1. **شاشات اللعب قابلة للتمرير** — غيّرت `overflow:hidden` إلى `overflow-y:auto;overflow-x:hidden` في `#judge-game` و `#local-game` و `#display` و `#player-join` و `#player-wait` و `#player-bz` حتى تسمح بالتمرير بالماوس أو اللمس عند الحاجة. أضيف `overflow-y:auto` إلى `.local-side`, `.jlp`, `.dpleft`, `.dpright` والـ `.jrp` أضيف `min-height:0`.

2. **تصحيح توسيط لوحة الأحرف المصغرة** — `hex-engine.js:renderMiniBoard`: غيّرت `position:relative` إلى `position:absolute;top:50%;left:50%` مع `transform:translate(-50%,-50%) scale(s)` و `transformOrigin:center center` لتوسيط اللوحة في منتصف الحاوية تماماً. أزلت `overflow:hidden` و `aspect-ratio:512/450` من `.mini-board-wrap` وأضفت `min-height` بدلاً عنها لتناسب جميع أحجام اللوحات.

3. **إصلاح تغطية badge على toggle button** — أضيف `right:auto` إلى inline style للـ `#judge-code-badge` لمنع تداخل `right:10px` من كلاس `.code-badge` مع `left:50%` عند تصغير الشاشة.

4. **إصلاح عرض اللوحات الكبيرة (8×8 فأكثر) في شاشة البروجكتر واللاعب** — `judge-game.js:jPub()`: أضيف `cols`/`rows` إلى بيانات الحالة. `display.js:dpApply()` و `player.js:pOnData`: يستدعيان `setBoardSize(s.cols, s.rows)` قبل `renderHexBoard`/`renderMiniBoard` حتى تُحسب مواقع الخلايا بشكل صحيح. `display.js`: أضيف `requestAnimationFrame` لحساب مقياس (`scale`) للوحة لتناسب مساحة الشاشة.

## TECH_STACK

| التقنية | الإصدار | المصدر |
|---------|---------|--------|
| PeerJS | 1.5.5 | `unpkg.com/peerjs@1.5.5` |
| QRCodeJS | 1.0.0 | `cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0` |
| Cairo Font | 500/700/900 | `fonts.googleapis.com` |
| Node.js | (بيئة بناء) | `build.js`, `serve.js` |

## ARCHITECTURE

### التبعيات (Dependency Order)
```
utils.js (go, cleanupAll, confetti, pickQ, filters, applyTeamColors)
  → logger.js
  → hex-engine.js (board math, BFS, render, setBoardSize)
  → peer-config.js (server rotation)
  → qbank.js (data)
  → screens/local-game.js
  → screens/judge-game.js (→ display.js ←→ player.js)
  → index.js (router, resize)
```

### تدفق البيانات (Data Flow)
```
Judge Peer ←→ Player Peer (buzz, join, state, name_taken)
Judge Peer ←→ Display Peer (state, tick, buzzer_won, colorA/colorB)
Local Game: all in-memory (no network)
```

## ORPHANS & PENDING
*(All sections empty — product complete)*

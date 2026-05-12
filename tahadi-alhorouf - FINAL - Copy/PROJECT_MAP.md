# 📍 PROJECT_MAP — تحدي الحروف

## SYSTEM_FLOW
```
[Home]
  ├── [Local Setup] → [Local Game Board] → Hex Click → Q Modal → Timer → Score → BFS Win → Round Win → Game Win
  ├── [Judge Setup] → [Judge Game Board]
  │     ├── Hex Click → Buzz Open → Player Buzz → Timer → Correct/Skip → BFS Win → Round Win → Game Win
  │     ├── ←→ [Display] (Realtime state, tick, buzzer, question/answer toggle)
  │     └── ←→ [Player Buzzers] (Join → Wait → Buzz → Result)
  ├── [Display Screen] (code prompt → connect to Judge)
  └── [Player Join] (enter code → verify session → select team + enter name → confirm join → Wait → Buzz → Result)
```

## FILES & RESPONSIBILITY

| File | Role | Lines |
|------|------|-------|
| `src/index.html` | All UI + CSS (604 lines) | 604 |
| `src/index.js` | Router + resize handler | 41 |
| `src/core/logger.js` | RingBuffer async logger (200 entries, 4 levels) | 30 |
| `src/core/hex-engine.js` | Hex board math, BFS win detection, render | 117 |
| `src/core/utils.js` | Screen nav, confetti, Q picker with uniqueness, filters, team colors | 172 |
| `src/network/peer-config.js` | PeerJS server config + rotation (2 servers + TURN) | 40 |
| `src/data/qbank.js` | Question bank (29 letters, 3 difficulties, 12 categories, 797 Qs) | 1 (72 KB) |
| `src/screens/local-game.js` | Local 2-team game logic + settings modal | 222 |
| `src/screens/judge-game.js` | Judge/host game logic + PeerJS networking + settings | 448 |
| `src/screens/player.js` | Player buzzer (2-step join, wait, buzz, result) | 253 |
| `src/screens/display.js` | Projector display client + QR code + board scaling | 145 |
| `build.js` | Bundles all JS into single HTML + backup | 51 |
| `serve.js` | Dev server (port 8081) | 8 |
| `dist/bundle.html` | Built output (221 KB) | — |

## TECH_STACK

| التقنية | الإصدار | المصدر |
|---------|---------|--------|
| PeerJS | 1.5.5 | `unpkg.com/peerjs@1.5.5` |
| QRCodeJS | 1.0.0 | `cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0` |
| Cairo Font | 500/700/900 | `fonts.googleapis.com` |
| Node.js | بيئة بناء فقط | `build.js`, `serve.js` |

## ARCHITECTURE

### Dependency Order
```
utils.js (go, cleanupAll, confetti, pickQ, filters, applyTeamColors)
  → logger.js (RingBuffer)
  → hex-engine.js (board math, BFS, render, setBoardSize)
  → peer-config.js (server rotation, ICE config)
  → qbank.js (data only)
  → screens/local-game.js
  → screens/judge-game.js (←→ display.js ←→ player.js)
  → index.js (router, resize, URL param routing)
```

### Data Flow
```
Judge Peer ←→ Player Peer: join, buzz, state, name_taken, kicked, buzzer_ready, buzzer_won, second_chance, open_q, tick, toggle_question, toggle_answer
Judge Peer ←→ Display Peer: state, tick, buzzer_won, second_chance, open_q, toggle_question, toggle_answer
Local Game: all in-memory (no network)
```

## VERIFIED FEATURES (All Complete)

1. **Local Game**: 2-team same-device mode with hex board, configurable size (4×4—10×10), per-team timers, difficulty/category filter, live settings, BFS win detection, rounds system
2. **Networked Game (Judge)**: PeerJS host creates room, players join via code/QR, buzzer system with second-chance, per-team timers, live difficulty/category filter
3. **Display Screen**: Real-time projector view, QR code + session code, auto-scaled board
4. **Player Screen**: Two-step join (enter code → verify session → select team from live names + enter name → confirm), wait screen, buzzer button, question/answer display, vibration feedback
5. **QR Code**: Generated for player join URLs in judge + display screens
6. **Team Colors**: Fully customizable via color pickers, applied as CSS variables
7. **Touch/Mobile**: `touch-action:manipulation`, overflow scroll, responsive breakpoints (700px/600px/480px/380px)
8. **Cleanup System**: `_addCleanup`/`cleanupAll()` prevents memory leaks on screen transitions
9. **Panel Toggle**: Judge left/right panels collapsible with overlay buttons
10. **Build Pipeline**: `build.js` concatenates, `backup.js` auto-backups before build

## ORPHANS & PENDING

**All resolved. Product is complete.**

### Removed Orphans (May 2026)
| File | Reason | Action |
|------|--------|--------|
| `src/init.js` | ES modules pattern, unused (project uses IIFE) | Deleted |
| `src/screens/judge-setup.js` | ES module import, dead code | Deleted |
| `src/screens/local-setup.js` | ES module import, dead code | Deleted |
| `src/screens/player-join.js` | Stub file (logic in player.js) | Deleted |
| `src/screens/player-wait.js` | Stub file (logic in player.js) | Deleted |
| `src/screens/player-bz.js` | Stub file (logic in player.js) | Deleted |

### Changes (May 2026)
| Change | Description |
|--------|-------------|
| CSS `--A2`/`--B2` missing colons | `--A    #BF360C → --A2:   #BF360C` |
| Player join flow (2-step) | Step 1: enter code + verify connection. Step 2: select team from live names + colors (from judge `state`), enter name, client-side name conflict check, confirm join |

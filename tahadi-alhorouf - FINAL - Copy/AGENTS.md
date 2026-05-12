# AGENTS.md — تحدي الحروف

## Commands

```powershell
# Build bundle
node build.js

# Run dev server
node serve.js
# → http://localhost:8081

# Check syntax of all source files
node check_full_syntax.js

# Check individual segments
node check_segments.js
```

## Runtime URLs

| Mode | URL |
|------|-----|
| Home | `http://localhost:8081` |
| Player Join | `http://localhost:8081/?mode=player&code=XXXXX` |
| Display | `http://localhost:8081/?mode=display&code=XXXXX` |

## Build Order (build.js)

1. `core/logger.js` — logging utility
2. `core/hex-engine.js` — board math + render
3. `core/utils.js` — shared utilities
4. `network/peer-config.js` — WebRTC config
5. `data/qbank.js` — question bank
6. `screens/local-game.js` — local mode
7. `screens/judge-game.js` — judge mode
8. `screens/player.js` — player buzzer
9. `screens/display.js` — projector display
10. `index.js` — router + resize handler

## Dependencies (all CDN, no npm install needed)

- `peerjs@1.5.5` — WebRTC peer-to-peer
- `qrcodejs@1.0.0` — QR code generation
- Google Fonts: Cairo 500/700/900

## Notes

- No package.json — pure vanilla JS
- `_addCleanup(fn)` / `cleanupAll()` — memory management pattern
- `setBoardSize(cols, rows)` — call before render
- Global state objects: `LG` (local), `JS` (judge), `PM` (player)

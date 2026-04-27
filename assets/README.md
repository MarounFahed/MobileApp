# Assets

Drop final assets here before release:

- `icon.png` (1024×1024) — referenced by `app.json`.
- `splash.png` (≥1242×2436, dark bg `#0A0E1A`) — referenced by `app.json`.
- `adaptive-icon.png` (1024×1024 foreground, dark bg `#0A0E1A`) — referenced by `app.json`.
- `audio/sfx/` — royalty-free SFX (tension loop, stinger, heartbeat). Wire up in `src/audio/sfx.ts`.
- `audio/{en,ar,fr}/` — optional pre-recorded narration clips. Register them in `src/audio/narrationFiles.ts`.
- `fonts/` — optional. Latin (Inter) and Arabic (Tajawal / IBM Plex Sans Arabic) suggested.

Until you provide these, Expo will warn about missing icon/splash but will still build. Sound effects no-op until registered.

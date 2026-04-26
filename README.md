# Mafiazo

Pass-the-phone Mafia party game for iOS and Android. Two rulesets:

- **Standard Mafia** — classic worldwide ruleset with nightly Mafia kill.
- **Lebnené** — custom Lebanese variant. No nightly kill: Mafia coordinate at night and act through the day vote.

Fully offline. No accounts. No analytics. No network calls.

---

## Tech stack

- React Native + Expo (SDK 52), TypeScript, Expo Router
- `expo-sqlite` for local persistence
- `expo-speech` for TTS narration (English in v1; architected for Arabic & French TTS plus pre-recorded clips)
- `expo-haptics` for tactile feedback
- `expo-image-picker` + `expo-file-system` for optional roster photos
- `react-native-reanimated` for transitions
- `i18next` + `react-i18next` for localization (EN / AR / FR, with RTL for Arabic)
- `zustand` for state management
- EAS for iOS + Android builds

## Setup

```sh
npm install
npx expo start
```

Run on a device with the Expo Go app, or build a development client:

```sh
npx expo run:ios       # local iOS simulator
npx expo run:android   # local Android emulator
```

## Build

```sh
npm install -g eas-cli
eas login
npm run build:ios
npm run build:android
```

Configure your bundle identifiers, signing, and credentials in EAS — see `eas.json`.

## Test

```sh
npm test            # full suite
npm run test:watch  # interactive
npm run typecheck   # tsc strict
npm run lint        # eslint
```

The engine layer (`src/engine/`) is pure TypeScript with no React or Expo dependencies and is fully covered by Jest unit tests. Component tests use `@testing-library/react-native`.

---

## Project structure

```
mafiazo/
  app/                    Expo Router screens
    _layout.tsx           Stack + i18n + DB init
    index.tsx             Home / mode picker / resume modal
    settings.tsx
    roster.tsx
    history.tsx
    game/
      setup.tsx
      reveal.tsx          Press-and-hold private role reveal
      day.tsx
      night.tsx           Handles all night flows (mod / no-mod, both modes)
      vote.tsx
      death-speech.tsx    30s timer + role reveal
      end.tsx             Winner + MVPs + roster
  src/
    engine/               Pure game logic, no UI
      roles.ts
      autoBalance.ts      Role split table + 15+ scaling
      winConditions.ts
      narration.ts        Phase → i18n key map
      stateMachine.ts     FSM transitions, snapshot type
      mvp.ts              MVP award computation
      __tests__/          Unit tests (engine)
    db/
      schema.ts           SQLite init + tables
      roster.ts
      history.ts
      stats.ts
      activeGame.ts       Auto-save / resume
    audio/
      tts.ts              expo-speech wrapper, key resolver
      sfx.ts              Tension loop, stinger, heartbeat, haptics
      narrationFiles.ts   Stub registry for future pre-recorded clips
    i18n/
      index.ts            i18next + RTL
      en.json | ar.json | fr.json
    theme/
      colors.ts | typography.ts
    components/
      Screen.tsx | Button.tsx | CedarMark.tsx
      PlayerCard.tsx | Timer.tsx
      PressAndHoldReveal.tsx | VoteTracker.tsx | RoleBadge.tsx
      __tests__/          Component tests
    stores/
      appStore.ts         Language, sound, sticky game settings
      gameStore.ts        Snapshot + transition wrappers + persistence
  assets/
    icon.png splash.png adaptive-icon.png       (placeholders — replace before release)
    audio/                Drop pre-recorded narration clips here
```

---

## Game design summary

### Roles

| Role | Faction | Notes |
|---|---|---|
| Godfather | Mafia | Appears innocent to the Detective in Standard mode (toggle). |
| Mafia | Mafia | Standard nightly kill in Standard mode; coordinates day vote in Lebnené. |
| Sheriff (Lebnené) | Town | Investigates 1 player per night. |
| Detective (Standard) | Town | Investigates 1 player per night. |
| Police / Civilian | Town | Vote, listen, reason. |

### Auto-balance table

| Players | Godfather | Mafia | Investigator | Filler |
|---|---|---|---|---|
| 5 | 1 | 0 | 1 | 3 |
| 6 | 1 | 1 | 1 | 3 |
| 7 | 1 | 1 | 1 | 4 |
| 8 | 1 | 2 | 1 | 4 |
| 9 | 1 | 2 | 1 | 5 |
| 10 | 1 | 3 | 1 | 5 |
| 11 | 1 | 3 | 1 | 6 |
| 12 | 1 | 4 | 1 | 6 |
| 13 | 1 | 4 | 1 | 7 |
| 14 | 1 | 5 | 1 | 7 |
| 15+ | 1 | +1 / 2 extra players | 1 | +1 / extra player |

### Win conditions (both modes)

- **Town wins** when the Godfather is eliminated **or** all Mafia are eliminated.
- **Mafia wins** when alive Mafia ≥ alive Town (parity).

### State machine

```
SETUP → ROLE_REVEAL → NIGHT_0 → DAY → VOTE
                                       ├─ DEATH_SPEECH → ROLE_REVEAL_ON_DEATH → CHECK_WIN
                                       └─ CHECK_WIN (skipped/tie-skip)
                                                          ├─ END
                                                          └─ NIGHT
                                                                ├─ NIGHT_MAFIA_KILL  (standard only)
                                                                └─ NIGHT_INVESTIGATE
                                                                       → DAY (or END on parity)
```

Every transition writes the current snapshot to the `active_game` SQLite row. On launch, if a snapshot exists, the home screen offers **Resume** or **Discard**.

### No-moderator night flow

Phone passes clockwise, starting from Player 1. Every player taps once. Most taps show a black "Sleep" screen for ~2 seconds. The Sheriff/Detective tap opens the investigation screen — every player makes the same physical motion, so identity stays hidden. In Standard mode, the Godfather's tap opens the kill-target screen.

### Mid-game changes

Not allowed. Role correction, manual elimination, and undo all require starting a new game. The UI does not offer them mid-game. Auto-balance is locked at game start.

---

## Localization

Strings live in `src/i18n/{en,ar,fr}.json`. To add a new language:

1. Create `src/i18n/<code>.json` mirroring the EN bundle.
2. Add the code to `SUPPORTED` in `src/i18n/index.ts` and load it in the `resources` block.
3. Add a chip in `app/settings.tsx`.
4. If the new language is RTL, extend `isRTL()` in `src/i18n/index.ts`.

Narration strings live under `narration.{mode|common}.{playMode}.{phase}`. The TTS layer tries the most-specific key first, then falls back to common.

## Swapping TTS for pre-recorded clips

`src/audio/narrationFiles.ts` exposes `registerNarrationClip(key, lang, clip)`. Drop audio files under `assets/audio/<lang>/<key>.mp3` and register them once at app boot:

```ts
import { Audio } from 'expo-av';
import { registerNarrationClip } from '@/audio/narrationFiles';

const sound = new Audio.Sound();
await sound.loadAsync(require('../../assets/audio/ar/night_intro.mp3'));
registerNarrationClip('narration.common.night_intro', 'ar', {
  play: () => sound.replayAsync().then(() => undefined),
});
```

The TTS layer prefers a registered clip over `expo-speech` automatically, so there is no other code change required.

## Privacy

Mafiazo is fully offline. No accounts, no analytics, no third-party SDKs that talk to a network. Roster photos live in `${FileSystem.documentDirectory}roster/` and are never uploaded.

## Acceptance checklist

- [x] Mode picker shows Standard Mafia and Lebnené after install.
- [x] 7-player Lebnené moderator end-to-end: setup → reveal → night 0 → day → vote → elimination → death speech → role reveal → night → win → MVPs → stats persist.
- [x] No-moderator phone-tap-clockwise hides Sheriff identity (sleep screen for non-Sheriff taps; investigation screen on the Sheriff's tap).
- [x] Resume modal appears after relaunch mid-game.
- [x] Standard mode plays with nightly kill mechanic; Detective respects "Godfather appears innocent" toggle.
- [x] Roster: add player with photo, edit, remove, lifetime stats.
- [x] Settings: language switcher (Arabic forces RTL), sound/music toggles, test audio.
- [x] Win triggers correctly at parity and at Godfather elimination.
- [x] Tie-break: revote and skip both work.
- [x] Fully usable in airplane mode.

## Assets

`assets/icon.png`, `assets/splash.png`, `assets/adaptive-icon.png` are referenced by `app.json`. Drop final 1024×1024 PNGs in before submitting to App Store / Play Store. Sound effects in `assets/audio/sfx/` are placeholders — wire them up in `src/audio/sfx.ts` once you have royalty-free clips.

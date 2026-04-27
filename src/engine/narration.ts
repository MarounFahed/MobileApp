import { GameMode } from './roles';

export type Phase =
  | 'role_reveal_intro'
  | 'night_0_intro'
  | 'night_0_mafia_open'
  | 'night_0_mafia_close'
  | 'night_0_sheriff_open'
  | 'night_0_sheriff_close'
  | 'night_0_outro'
  | 'day_intro'
  | 'day_timer_warning'
  | 'vote_intro'
  | 'death_speech_intro'
  | 'death_speech_end'
  | 'role_reveal_on_death'
  | 'night_intro'
  | 'night_mafia_open'
  | 'night_mafia_kill_prompt'
  | 'night_mafia_close'
  | 'night_sheriff_open'
  | 'night_sheriff_pass_phone'
  | 'night_sheriff_close'
  | 'night_outro'
  | 'game_over_town'
  | 'game_over_mafia';

export type PlayMode = 'moderator' | 'no_moderator';

export type Language = 'en' | 'ar' | 'fr';

interface NarrationKey {
  phase: Phase;
  mode: GameMode;
  playMode: PlayMode;
}

/**
 * Returns an i18n key string. Resolved by the i18next bundle for the current language.
 * Lines are NOT hardcoded here — narration just maps phase → key.
 *
 * Lookup order:
 *   1. narration.{mode}.{playMode}.{phase}
 *   2. narration.{playMode}.{phase}
 *   3. narration.common.{phase}
 *
 * The TTS layer attempts each key in order and uses the first available translation.
 */
export function narrationKeys({
  phase,
  mode,
  playMode,
}: NarrationKey): string[] {
  return [
    `narration.${mode}.${playMode}.${phase}`,
    `narration.${playMode}.${phase}`,
    `narration.common.${phase}`,
  ];
}

export interface NarrationLine {
  keys: string[];
  /** Pause in ms after speaking this line. */
  pauseMs: number;
}

export function nightSequenceLebnene(playMode: PlayMode): NarrationLine[] {
  const k = (phase: Phase) =>
    narrationKeys({ phase, mode: 'lebnene', playMode });
  return [
    { keys: k('night_intro'), pauseMs: 1500 },
    { keys: k('night_mafia_open'), pauseMs: 4000 },
    { keys: k('night_mafia_close'), pauseMs: 1500 },
    {
      keys: k(
        playMode === 'no_moderator'
          ? 'night_sheriff_pass_phone'
          : 'night_sheriff_open',
      ),
      pauseMs: 2000,
    },
    { keys: k('night_sheriff_close'), pauseMs: 1500 },
    { keys: k('night_outro'), pauseMs: 0 },
  ];
}

export function nightSequenceStandard(playMode: PlayMode): NarrationLine[] {
  const k = (phase: Phase) =>
    narrationKeys({ phase, mode: 'standard', playMode });
  return [
    { keys: k('night_intro'), pauseMs: 1500 },
    { keys: k('night_mafia_open'), pauseMs: 1500 },
    { keys: k('night_mafia_kill_prompt'), pauseMs: 5000 },
    { keys: k('night_mafia_close'), pauseMs: 1500 },
    {
      keys: k(
        playMode === 'no_moderator'
          ? 'night_sheriff_pass_phone'
          : 'night_sheriff_open',
      ),
      pauseMs: 2000,
    },
    { keys: k('night_sheriff_close'), pauseMs: 1500 },
    { keys: k('night_outro'), pauseMs: 0 },
  ];
}

export function night0Sequence(
  mode: GameMode,
  playMode: PlayMode,
): NarrationLine[] {
  const k = (phase: Phase) => narrationKeys({ phase, mode, playMode });
  const lines: NarrationLine[] = [
    { keys: k('night_0_intro'), pauseMs: 1500 },
    { keys: k('night_0_mafia_open'), pauseMs: 4000 },
    { keys: k('night_0_mafia_close'), pauseMs: 1500 },
  ];
  // Lebnene: no sheriff investigation Night 0.
  // Standard: Detective gets a Night 0 ID.
  if (mode === 'standard') {
    lines.push(
      { keys: k('night_0_sheriff_open'), pauseMs: 2000 },
      { keys: k('night_0_sheriff_close'), pauseMs: 1500 },
    );
  }
  lines.push({ keys: k('night_0_outro'), pauseMs: 0 });
  return lines;
}

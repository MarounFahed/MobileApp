import * as Speech from 'expo-speech';
import i18n from '@/i18n';
import { Language } from '@/engine/narration';
import { resolveNarrationClip } from './narrationFiles';

export type Pace = 'slow' | 'medium' | 'fast';

const RATE: Record<Pace, number> = {
  slow: 0.85,
  medium: 1,
  fast: 1.2,
};

const LANG_CODE: Record<Language, string> = {
  en: 'en-US',
  ar: 'ar-SA',
  fr: 'fr-FR',
};

export interface SpeakOptions {
  pace?: Pace;
  pauseAfterMs?: number;
  vars?: Record<string, string | number>;
}

/** Resolve the first key that has a translation. */
function resolveKey(keys: string[]): string | null {
  for (const k of keys) {
    if (i18n.exists(k)) return k;
  }
  return null;
}

export async function speakKeys(
  keys: string[],
  opts: SpeakOptions = {},
): Promise<void> {
  const lang = (i18n.language as Language) || 'en';
  const key = resolveKey(keys);
  if (!key) return;

  // First, prefer a pre-recorded clip if one is registered.
  const clip = resolveNarrationClip(key, lang);
  if (clip) {
    await clip.play();
  } else {
    const text = i18n.t(key, opts.vars ?? {});
    await new Promise<void>((resolve) => {
      Speech.speak(text, {
        language: LANG_CODE[lang],
        rate: RATE[opts.pace ?? 'medium'],
        onDone: () => resolve(),
        onStopped: () => resolve(),
        onError: () => resolve(),
      });
    });
  }

  if (opts.pauseAfterMs && opts.pauseAfterMs > 0) {
    await new Promise((r) => setTimeout(r, opts.pauseAfterMs));
  }
}

export async function speakSequence(
  lines: { keys: string[]; pauseMs: number }[],
  pace: Pace = 'medium',
  vars?: Record<string, string | number>,
): Promise<void> {
  for (const line of lines) {
    await speakKeys(line.keys, { pace, pauseAfterMs: line.pauseMs, vars });
  }
}

export function stop(): void {
  Speech.stop();
}

export async function testAudio(pace: Pace = 'medium'): Promise<void> {
  await speakKeys(
    ['narration.common.day_intro', 'narration.common.night_intro'],
    { pace, vars: { round: 1 } },
  );
}

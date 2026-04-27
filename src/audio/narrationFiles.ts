import { Language } from '@/engine/narration';

/**
 * Maps narration keys to pre-recorded audio clips. Empty in v1 — TTS handles all
 * narration. To add a Lebanese Arabic clip later:
 *
 * 1. Drop the audio file into assets/audio/<lang>/<key>.mp3
 * 2. Register it here:
 *      registerNarrationClip('narration.common.night_intro', 'ar', require('../../assets/audio/ar/night_intro.mp3'));
 * 3. The TTS layer will prefer the clip over synthesized speech automatically.
 */

export interface NarrationClip {
  play: () => Promise<void>;
}

const CLIPS = new Map<string, NarrationClip>();

function clipKey(narrationKey: string, lang: Language): string {
  return `${lang}::${narrationKey}`;
}

export function registerNarrationClip(
  narrationKey: string,
  lang: Language,
  clip: NarrationClip,
): void {
  CLIPS.set(clipKey(narrationKey, lang), clip);
}

export function resolveNarrationClip(
  narrationKey: string,
  lang: Language,
): NarrationClip | null {
  return CLIPS.get(clipKey(narrationKey, lang)) ?? null;
}

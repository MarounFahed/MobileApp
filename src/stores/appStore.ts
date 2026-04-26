import { create } from 'zustand';
import { db } from '@/db/schema';
import { setLanguage, SupportedLanguage } from '@/i18n';

interface AppState {
  language: SupportedLanguage;
  soundEnabled: boolean;
  musicEnabled: boolean;
  /** Last-used per-game settings (sticky defaults). */
  lastGameSettings?: string; // JSON-encoded GameSettings
  hydrate: () => void;
  setLanguage: (l: SupportedLanguage) => void;
  setSoundEnabled: (v: boolean) => void;
  setMusicEnabled: (v: boolean) => void;
  setLastGameSettings: (json: string) => void;
}

function readMeta(key: string): string | null {
  const r = db().getFirstSync<{ value: string }>(
    'SELECT value FROM app_meta WHERE key = ?',
    [key],
  );
  return r?.value ?? null;
}

function writeMeta(key: string, value: string): void {
  db().runSync(
    'INSERT OR REPLACE INTO app_meta (key, value) VALUES (?, ?)',
    [key, value],
  );
}

export const useAppStore = create<AppState>((set, get) => ({
  language: 'en',
  soundEnabled: true,
  musicEnabled: true,
  hydrate: () => {
    const lang = (readMeta('language') as SupportedLanguage | null) ?? 'en';
    const sound = readMeta('sound') !== '0';
    const music = readMeta('music') !== '0';
    const last = readMeta('lastGameSettings') ?? undefined;
    set({
      language: lang,
      soundEnabled: sound,
      musicEnabled: music,
      lastGameSettings: last,
    });
    setLanguage(lang);
  },
  setLanguage: (l) => {
    writeMeta('language', l);
    setLanguage(l);
    set({ language: l });
  },
  setSoundEnabled: (v) => {
    writeMeta('sound', v ? '1' : '0');
    set({ soundEnabled: v });
  },
  setMusicEnabled: (v) => {
    writeMeta('music', v ? '1' : '0');
    set({ musicEnabled: v });
  },
  setLastGameSettings: (json) => {
    writeMeta('lastGameSettings', json);
    set({ lastGameSettings: json });
  },
}));

export function ensureHydrated() {
  if (!useAppStore.getState().language) {
    useAppStore.getState().hydrate();
  }
}

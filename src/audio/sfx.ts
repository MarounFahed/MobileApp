import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { useAppStore } from '@/stores/appStore';

type SfxKey = 'tension_loop' | 'stinger_elimination' | 'heartbeat';

interface Sound {
  key: SfxKey;
  loop: boolean;
  source: number | null; // require() of asset, null = unimplemented placeholder
}

// Placeholders. Drop royalty-free files into assets/audio/sfx/ and wire them up here.
const REGISTRY: Record<SfxKey, Sound> = {
  tension_loop: { key: 'tension_loop', loop: true, source: null },
  stinger_elimination: { key: 'stinger_elimination', loop: false, source: null },
  heartbeat: { key: 'heartbeat', loop: true, source: null },
};

const ACTIVE = new Map<SfxKey, Audio.Sound>();

export async function playSfx(key: SfxKey): Promise<void> {
  if (!useAppStore.getState().soundEnabled && key !== 'tension_loop') return;
  if (key === 'tension_loop' && !useAppStore.getState().musicEnabled) return;
  const def = REGISTRY[key];
  if (!def.source) return; // placeholder, no-op until audio is added

  try {
    const { sound } = await Audio.Sound.createAsync(def.source, {
      isLooping: def.loop,
      shouldPlay: true,
    });
    ACTIVE.set(key, sound);
  } catch {
    // Audio failures should never crash the app.
  }
}

export async function stopSfx(key: SfxKey): Promise<void> {
  const s = ACTIVE.get(key);
  if (s) {
    try {
      await s.stopAsync();
      await s.unloadAsync();
    } catch {}
    ACTIVE.delete(key);
  }
}

export async function stopAllSfx(): Promise<void> {
  await Promise.all(Array.from(ACTIVE.keys()).map(stopSfx));
}

export async function tap(): Promise<void> {
  if (!useAppStore.getState().soundEnabled) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {}
}

export async function strongHaptic(): Promise<void> {
  if (!useAppStore.getState().soundEnabled) return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } catch {}
}

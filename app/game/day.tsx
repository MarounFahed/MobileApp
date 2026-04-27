import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '@/components/Screen';
import { Timer, TimerHandle } from '@/components/Timer';
import { Button } from '@/components/Button';
import { useGameStore } from '@/stores/gameStore';
import { speakKeys } from '@/audio/tts';
import { narrationKeys } from '@/engine/narration';
import { colors, spacing, typography } from '@/theme';
import { playSfx, stopSfx } from '@/audio/sfx';

export default function DayScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const snap = useGameStore((s) => s.snapshot);
  const timer = useRef<TimerHandle>(null);

  useEffect(() => {
    if (!snap) return;
    speakKeys(
      narrationKeys({
        phase: 'day_intro',
        mode: snap.settings.mode,
        playMode: snap.settings.playMode,
      }),
      {
        pace: snap.settings.nightPace,
        vars: { round: snap.round },
      },
    );
    if (snap.settings.musicEnabled) {
      playSfx('tension_loop').catch(() => {});
    }
    return () => {
      stopSfx('tension_loop').catch(() => {});
    };
  }, [snap?.id]);

  if (!snap) return null;

  const callVote = () => {
    stopSfx('tension_loop').catch(() => {});
    useGameStore.getState().startVote();
    router.replace('/game/vote');
  };

  return (
    <Screen>
      <Text style={styles.h1}>{t('day.title', { round: snap.round })}</Text>
      <Text style={styles.subtitle}>{t('day.discussion')}</Text>

      <View style={styles.timerWrap}>
        <Timer
          ref={timer}
          durationSec={snap.settings.discussionTimerSec}
          onElapsed={() => {
            // auto-end allowed by spec; user can also tap "Call vote" earlier.
          }}
        />
      </View>

      <View style={styles.controls}>
        <Button
          title={t('day.addTime')}
          variant="secondary"
          onPress={() => timer.current?.add(30)}
        />
        <Button
          title={t('common.pause')}
          variant="secondary"
          onPress={() => timer.current?.pause()}
        />
        <Button
          title={t('common.resume')}
          variant="secondary"
          onPress={() => timer.current?.resume()}
        />
      </View>

      <Button title={t('day.callVote')} onPress={callVote} variant="danger" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  h1: { ...typography.h1, color: colors.text },
  subtitle: { ...typography.body, color: colors.textMuted },
  timerWrap: { alignItems: 'center', marginVertical: spacing.xl },
  controls: {
    flexDirection: 'row',
    gap: spacing.s,
    flexWrap: 'wrap',
    marginBottom: spacing.l,
  },
});

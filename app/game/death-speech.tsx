import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '@/components/Screen';
import { Button } from '@/components/Button';
import { Timer } from '@/components/Timer';
import { RoleBadge } from '@/components/RoleBadge';
import { useGameStore } from '@/stores/gameStore';
import { speakKeys } from '@/audio/tts';
import { narrationKeys } from '@/engine/narration';
import { strongHaptic, playSfx } from '@/audio/sfx';
import { colors, spacing, typography } from '@/theme';

type Stage = 'speech' | 'reveal';

export default function DeathSpeechScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const snap = useGameStore((s) => s.snapshot);
  const [stage, setStage] = useState<Stage>('speech');

  useEffect(() => {
    if (!snap) return;
    if (snap.state === 'DEATH_SPEECH') {
      const player = snap.players.find((p) => p.id === snap.pendingEliminationId);
      speakKeys(
        narrationKeys({
          phase: 'death_speech_intro',
          mode: snap.settings.mode,
          playMode: snap.settings.playMode,
        }),
        {
          pace: snap.settings.nightPace,
          vars: { name: player?.name ?? '' },
        },
      );
    }
    if (snap.state === 'ROLE_REVEAL_ON_DEATH') {
      setStage('reveal');
    }
  }, [snap?.id, snap?.state]);

  if (!snap) return null;

  const target = snap.players.find((p) => p.id === snap.pendingEliminationId);

  if (!target) return null;

  const onSpeechEnd = async () => {
    await speakKeys(
      narrationKeys({
        phase: 'death_speech_end',
        mode: snap.settings.mode,
        playMode: snap.settings.playMode,
      }),
      { pace: snap.settings.nightPace },
    );
    strongHaptic().catch(() => {});
    playSfx('stinger_elimination').catch(() => {});
    useGameStore.getState().finishDeathSpeech();
    setStage('reveal');
  };

  const onRevealEnd = () => {
    useGameStore.getState().finishRoleRevealOnDeath();
    useGameStore.getState().checkWinAndAdvance();
    const post = useGameStore.getState().snapshot!;
    if (post.state === 'END') router.replace('/game/end');
    else router.replace('/game/night');
  };

  if (stage === 'speech') {
    return (
      <Screen>
        <Text style={styles.h1}>{t('deathSpeech.title')}</Text>
        <Text style={styles.subtle}>
          {t('deathSpeech.instructions', { name: target.name })}
        </Text>
        <View style={styles.timerWrap}>
          <Timer
            durationSec={snap.settings.deathSpeechSec}
            variant="urgent"
            onElapsed={onSpeechEnd}
          />
        </View>
        <Button
          title={t('common.skip')}
          variant="ghost"
          onPress={onSpeechEnd}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.center}>
        <Text style={styles.h1}>
          {t('death.wasA', {
            name: target.name,
            role: t(`roles.${target.role}`),
          })}
        </Text>
        <View style={{ height: spacing.l }} />
        <RoleBadge role={target.role} />
        <View style={{ height: spacing.xl }} />
        <Button title={t('common.next')} onPress={onRevealEnd} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  h1: { ...typography.h1, color: colors.text, textAlign: 'center' },
  subtle: { ...typography.body, color: colors.textMuted, textAlign: 'center' },
  timerWrap: { alignItems: 'center', marginVertical: spacing.xl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

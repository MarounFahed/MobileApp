import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '@/components/Screen';
import { Button } from '@/components/Button';
import { VoteTracker } from '@/components/VoteTracker';
import { useGameStore } from '@/stores/gameStore';
import { speakKeys } from '@/audio/tts';
import { narrationKeys } from '@/engine/narration';
import { alivePlayers } from '@/engine/stateMachine';
import { colors, spacing, typography } from '@/theme';

export default function VoteScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const snap = useGameStore((s) => s.snapshot);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (!snap) return;
    speakKeys(
      narrationKeys({
        phase: 'vote_intro',
        mode: snap.settings.mode,
        playMode: snap.settings.playMode,
      }),
      { pace: snap.settings.nightPace },
    );
  }, [snap?.id]);

  if (!snap) return null;

  const alive = alivePlayers(snap).sort((a, b) => a.seat - b.seat);

  const confirm = () => {
    if (!selected) return;
    useGameStore.getState().recordVoteElimination(selected);
    router.replace('/game/death-speech');
  };

  const skip = () => {
    useGameStore.getState().recordVoteElimination(null, false);
    useGameStore.getState().checkWinAndAdvance();
    afterCheck();
  };

  const tieSkip = () => {
    useGameStore.getState().recordVoteElimination(null, true);
    useGameStore.getState().checkWinAndAdvance();
    afterCheck();
  };

  const afterCheck = () => {
    const post = useGameStore.getState().snapshot!;
    if (post.state === 'END') router.replace('/game/end');
    else router.replace('/game/night');
  };

  return (
    <Screen>
      <Text style={styles.h1}>{t('vote.title')}</Text>
      <View style={{ flex: 1, marginTop: spacing.m }}>
        <VoteTracker
          alive={alive}
          selectedId={selected}
          onSelect={setSelected}
        />
      </View>
      <View style={styles.actions}>
        <Button
          title={
            snap.settings.tieBreak === 'skip'
              ? t('vote.tieSkip')
              : t('vote.skip')
          }
          variant="ghost"
          onPress={snap.settings.tieBreak === 'skip' ? tieSkip : skip}
        />
        <Button
          title={t('common.confirm')}
          onPress={confirm}
          disabled={!selected}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  h1: { ...typography.h1, color: colors.text },
  actions: { flexDirection: 'row', gap: spacing.m, marginTop: spacing.m },
});

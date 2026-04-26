import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '@/components/Screen';
import { Button } from '@/components/Button';
import { PressAndHoldReveal } from '@/components/PressAndHoldReveal';
import { RoleBadge } from '@/components/RoleBadge';
import { useGameStore } from '@/stores/gameStore';
import { colors, spacing, typography } from '@/theme';

export default function RevealScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const snap = useGameStore((s) => s.snapshot);
  const [seatIndex, setSeatIndex] = useState(0);
  const [revealedThis, setRevealedThis] = useState(false);

  if (!snap) return null;
  const player = snap.players[seatIndex];
  if (!player) return null;
  const isLast = seatIndex === snap.players.length - 1;
  const isInvestigator =
    player.role === 'sheriff' || player.role === 'detective';

  const next = () => {
    if (!revealedThis) return;
    setRevealedThis(false);
    if (isLast) {
      useGameStore.getState().finishRoleReveal();
      router.replace('/game/night');
    } else {
      setSeatIndex(seatIndex + 1);
    }
  };

  return (
    <Screen>
      <Text style={styles.h2}>
        {t('reveal.passTo', { name: player.name })}
      </Text>
      <Text style={styles.muted}>
        {seatIndex + 1} / {snap.players.length}
      </Text>

      <View style={{ flex: 1, marginVertical: spacing.l }}>
        <PressAndHoldReveal
          prompt={t('reveal.holdToReveal')}
          releaseHint={t('reveal.release')}
          onReleased={() => setRevealedThis(true)}
        >
          <Text style={styles.youAre}>{t('reveal.youAre')}</Text>
          <RoleBadge role={player.role} />
          {isInvestigator ? (
            <Text style={styles.investHint}>
              {t('reveal.investigationsBegin')}
            </Text>
          ) : null}
        </PressAndHoldReveal>
      </View>

      <Button
        title={isLast ? t('common.done') : t('common.next')}
        onPress={next}
        disabled={!revealedThis}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  h2: { ...typography.h2, color: colors.text },
  muted: { ...typography.caption, color: colors.textMuted, marginTop: 4 },
  youAre: { ...typography.body, color: colors.textMuted, marginBottom: spacing.m },
  investHint: {
    ...typography.caption,
    color: colors.cedar,
    marginTop: spacing.m,
    textAlign: 'center',
  },
});

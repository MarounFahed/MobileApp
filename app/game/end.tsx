import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '@/components/Screen';
import { Button } from '@/components/Button';
import { RoleBadge } from '@/components/RoleBadge';
import { useGameStore } from '@/stores/gameStore';
import { MvpAward } from '@/engine/mvp';
import { colors, radius, spacing, typography } from '@/theme';

export default function EndScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const snap = useGameStore((s) => s.snapshot);
  const [mvps, setMvps] = useState<MvpAward[]>([]);

  useEffect(() => {
    const finalized = useGameStore.getState().finalize();
    setMvps(finalized);
  }, []);

  if (!snap || !snap.win) return null;

  const winnerLabel =
    snap.win.winner === 'town' ? t('end.townWins') : t('end.mafiaWins');
  const reasonLabel =
    snap.win.reason === 'godfather_eliminated'
      ? t('end.reasonGodfather')
      : snap.win.reason === 'all_mafia_eliminated'
        ? t('end.reasonAllMafia')
        : t('end.reasonParity');

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <Text style={styles.title}>{t('end.title')}</Text>
        <Text
          style={[
            styles.winner,
            { color: snap.win.winner === 'town' ? colors.cedar : colors.mafia },
          ]}
        >
          {winnerLabel}
        </Text>
        <Text style={styles.reason}>{reasonLabel}</Text>

        {mvps.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('end.mvps')}</Text>
            {mvps.map((m, i) => {
              const player = snap.players.find((p) => p.id === m.playerId);
              return (
                <View key={i} style={styles.mvp}>
                  <Text style={styles.mvpCat}>{t(`mvp.${m.category}`)}</Text>
                  <Text style={styles.mvpName}>{player?.name}</Text>
                  <Text style={styles.mvpDetail}>{m.detail}</Text>
                </View>
              );
            })}
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('setup.players')}</Text>
          {snap.players
            .slice()
            .sort((a, b) => a.seat - b.seat)
            .map((p) => (
              <View key={p.id} style={styles.playerRow}>
                <Text
                  style={[
                    styles.playerName,
                    !p.alive && { textDecorationLine: 'line-through' },
                  ]}
                >
                  {p.name}
                </Text>
                <RoleBadge role={p.role} size="small" />
              </View>
            ))}
        </View>

        <View style={styles.actions}>
          <Button
            title={t('end.playAgain')}
            onPress={() => {
              useGameStore.getState().clear();
              router.replace({
                pathname: '/game/setup',
                params: { mode: snap.settings.mode },
              });
            }}
          />
          <Button
            title={t('end.home')}
            variant="ghost"
            onPress={() => {
              useGameStore.getState().clear();
              router.replace('/');
            }}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.h2, color: colors.textMuted },
  winner: { ...typography.display, marginVertical: spacing.s },
  reason: { ...typography.body, color: colors.textMuted },
  section: { marginTop: spacing.l, gap: spacing.s },
  sectionTitle: { ...typography.h2, color: colors.text },
  mvp: {
    backgroundColor: colors.bgCard,
    padding: spacing.m,
    borderRadius: radius.m,
  },
  mvpCat: { ...typography.micro, color: colors.cedar },
  mvpName: { ...typography.h3, color: colors.text, marginTop: spacing.xs },
  mvpDetail: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  playerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    padding: spacing.m,
    borderRadius: radius.m,
  },
  playerName: { ...typography.body, color: colors.text },
  actions: { gap: spacing.s, marginTop: spacing.l },
});

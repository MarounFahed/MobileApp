import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Screen } from '@/components/Screen';
import { GameHistoryRow, listGames } from '@/db/history';
import { colors, radius, spacing, typography } from '@/theme';

export default function HistoryScreen() {
  const { t } = useTranslation();
  const [games, setGames] = useState<GameHistoryRow[]>([]);
  const [open, setOpen] = useState<GameHistoryRow | null>(null);

  useEffect(() => {
    setGames(listGames());
  }, []);

  if (open) {
    return (
      <Screen>
        <Pressable onPress={() => setOpen(null)}>
          <Text style={styles.back}>‹ {t('common.back')}</Text>
        </Pressable>
        <Text style={styles.h1}>
          {new Date(open.startedAt).toLocaleString()}
        </Text>
        <Text style={styles.meta}>
          {t(`menu.mode${cap(open.mode)}`)} •{' '}
          {t(
            open.playMode === 'moderator'
              ? 'setup.playModeModerator'
              : 'setup.playModeNoModerator',
          )}
        </Text>
        <Text style={styles.winner}>
          {open.winner === 'town'
            ? t('end.townWins')
            : open.winner === 'mafia'
              ? t('end.mafiaWins')
              : '—'}
        </Text>
        <Text style={styles.h2}>{t('end.mvps')}</Text>
        {open.mvps.map((m, i) => {
          const player = open.snapshot.players.find((p) => p.id === m.playerId);
          return (
            <Text style={styles.mvpRow} key={i}>
              {t(`mvp.${m.category}`)}: {player?.name ?? '?'} — {m.detail}
            </Text>
          );
        })}
        <Text style={[styles.h2, { marginTop: spacing.m }]}>
          {t('setup.players')}
        </Text>
        {open.snapshot.players.map((p) => (
          <Text style={styles.playerRow} key={p.id}>
            {p.name} — {t(`roles.${p.role}`)} {p.alive ? '' : '✗'}
          </Text>
        ))}
      </Screen>
    );
  }

  return (
    <Screen>
      {games.length === 0 ? (
        <Text style={styles.empty}>{t('history.empty')}</Text>
      ) : (
        <FlatList
          data={games}
          keyExtractor={(g) => g.id}
          contentContainerStyle={{ gap: spacing.s }}
          renderItem={({ item }) => (
            <Pressable style={styles.row} onPress={() => setOpen(item)}>
              <Text style={styles.rowDate}>
                {new Date(item.startedAt).toLocaleString()}
              </Text>
              <Text style={styles.rowMeta}>
                {t(`menu.mode${cap(item.mode)}`)} •{' '}
                {t(
                  item.winner === 'town'
                    ? 'end.townWins'
                    : item.winner === 'mafia'
                      ? 'end.mafiaWins'
                      : 'common.skip',
                )}
              </Text>
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const styles = StyleSheet.create({
  empty: { ...typography.body, color: colors.textMuted, textAlign: 'center' },
  row: {
    backgroundColor: colors.bgCard,
    padding: spacing.m,
    borderRadius: radius.m,
  },
  rowDate: { ...typography.bodyBold, color: colors.text },
  rowMeta: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  back: { ...typography.body, color: colors.textMuted, marginBottom: spacing.s },
  h1: { ...typography.h1, color: colors.text },
  h2: {
    ...typography.h2,
    color: colors.text,
    marginTop: spacing.m,
    marginBottom: spacing.s,
  },
  meta: { ...typography.body, color: colors.textMuted },
  winner: {
    ...typography.h2,
    color: colors.cedar,
    marginTop: spacing.s,
    marginBottom: spacing.m,
  },
  mvpRow: { ...typography.body, color: colors.text, marginBottom: 4 },
  playerRow: { ...typography.body, color: colors.text, marginBottom: 4 },
});

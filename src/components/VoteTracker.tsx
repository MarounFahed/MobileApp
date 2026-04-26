import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Player } from '@/engine/stateMachine';
import { PlayerCard } from './PlayerCard';
import { colors, spacing, typography } from '@/theme';
import { useTranslation } from 'react-i18next';

interface Props {
  alive: Player[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
  testID?: string;
}

export function VoteTracker({ alive, selectedId, onSelect, testID }: Props) {
  const { t } = useTranslation();
  return (
    <View style={styles.wrap} testID={testID ?? 'vote-tracker'}>
      <Text style={styles.heading}>{t('vote.instructions')}</Text>
      <ScrollView
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      >
        {alive.map((p) => (
          <PlayerCard
            key={p.id}
            name={p.name}
            color={p.color}
            photoUri={p.photoUri}
            selected={selectedId === p.id}
            onPress={() => onSelect(p.id)}
            style={styles.card}
            testID={`vote-target-${p.id}`}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
  },
  heading: {
    ...typography.body,
    color: colors.textMuted,
    marginBottom: spacing.m,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.m,
    paddingBottom: spacing.l,
  },
  card: {
    width: 110,
  },
});

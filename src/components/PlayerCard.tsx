import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ViewStyle,
} from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';

interface Props {
  name: string;
  photoUri?: string;
  color: string;
  alive?: boolean;
  selected?: boolean;
  badge?: string;
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  testID?: string;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join('');
}

export function PlayerCard({
  name,
  photoUri,
  color,
  alive = true,
  selected = false,
  badge,
  onPress,
  disabled,
  style,
  testID,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || !onPress}
      style={({ pressed }) => [
        styles.card,
        selected && styles.cardSelected,
        !alive && styles.cardDead,
        pressed && styles.cardPressed,
        style,
      ]}
      testID={testID}
    >
      <View style={[styles.avatar, { backgroundColor: color }]}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.avatarImage} />
        ) : (
          <Text style={styles.avatarText}>{initials(name)}</Text>
        )}
      </View>
      <Text
        style={[styles.name, !alive && styles.nameDead]}
        numberOfLines={1}
      >
        {name}
      </Text>
      {badge ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
      {!alive ? (
        <View style={styles.deadOverlay}>
          <Text style={styles.deadText}>×</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.m,
    padding: spacing.m,
    borderWidth: 2,
    borderColor: colors.transparent,
    alignItems: 'center',
    minWidth: 100,
  },
  cardSelected: {
    borderColor: colors.cedar,
  },
  cardPressed: {
    opacity: 0.7,
  },
  cardDead: {
    opacity: 0.45,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    ...typography.h2,
    color: colors.text,
  },
  name: {
    ...typography.bodyBold,
    color: colors.text,
    marginTop: spacing.s,
    textAlign: 'center',
  },
  nameDead: {
    textDecorationLine: 'line-through',
    color: colors.textMuted,
  },
  badge: {
    marginTop: spacing.xs,
    paddingHorizontal: spacing.s,
    paddingVertical: 2,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.pill,
  },
  badgeText: {
    ...typography.micro,
    color: colors.textMuted,
  },
  deadOverlay: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  deadText: {
    fontSize: 28,
    color: colors.mafia,
    fontWeight: '900',
  },
});

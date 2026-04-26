import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Role, isMafia } from '@/engine/roles';
import { colors, radius, spacing, typography } from '@/theme';

interface Props {
  role: Role;
  size?: 'small' | 'large';
}

export function RoleBadge({ role, size = 'large' }: Props) {
  const { t } = useTranslation();
  const isMaf = isMafia(role);
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: isMaf ? colors.mafia : colors.cedar },
        size === 'small' ? styles.small : styles.large,
      ]}
    >
      <Text style={[styles.text, size === 'small' && styles.textSmall]}>
        {t(`roles.${role}`)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  large: {
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.s,
  },
  small: {
    paddingHorizontal: spacing.m,
    paddingVertical: 4,
  },
  text: {
    ...typography.h3,
    color: colors.text,
  },
  textSmall: {
    ...typography.micro,
    color: colors.text,
  },
});

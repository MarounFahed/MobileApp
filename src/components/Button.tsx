import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
  ActivityIndicator,
} from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';

interface Props {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  testID?: string;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  style,
  testID,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      testID={testID}
      style={({ pressed }) => [
        styles.base,
        VARIANTS[variant].container,
        disabled && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={VARIANTS[variant].label.color as string} />
      ) : (
        <Text style={[styles.label, VARIANTS[variant].label]}>{title}</Text>
      )}
    </Pressable>
  );
}

const VARIANTS = {
  primary: {
    container: { backgroundColor: colors.cedar },
    label: { color: colors.text },
  },
  secondary: {
    container: {
      backgroundColor: colors.bgCard,
      borderWidth: 1,
      borderColor: colors.border,
    },
    label: { color: colors.text },
  },
  danger: {
    container: { backgroundColor: colors.mafia },
    label: { color: colors.text },
  },
  ghost: {
    container: { backgroundColor: colors.transparent },
    label: { color: colors.textMuted },
  },
} as const;

const styles = StyleSheet.create({
  base: {
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.l,
    borderRadius: radius.m,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  label: {
    ...typography.bodyBold,
  },
  disabled: {
    opacity: 0.4,
  },
  pressed: {
    opacity: 0.7,
  },
});

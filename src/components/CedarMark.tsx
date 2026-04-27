import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography } from '@/theme';

interface Props {
  size?: number;
}

/**
 * Lebanese cedar silhouette as a simple typographic mark.
 * Replace with an SVG asset later if a richer rendering is desired.
 */
export function CedarMark({ size = 80 }: Props) {
  return (
    <View
      style={[
        styles.wrap,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Text style={[styles.glyph, { fontSize: size * 0.6 }]}>🌲</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: {
    ...typography.display,
    color: colors.cedar,
  },
});

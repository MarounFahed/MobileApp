import React, { useState, useRef, useEffect } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  GestureResponderEvent,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { colors, radius, spacing, typography } from '@/theme';
import { tap as hapticTap } from '@/audio/sfx';

interface Props {
  /** Content shown while held. */
  children: React.ReactNode;
  /** Hint shown when not held. */
  prompt: string;
  /** Hint shown while held. */
  releaseHint?: string;
  /** Min hold time in ms before content is fully revealed. */
  rampMs?: number;
  /** Called once the user releases AFTER having seen the content. */
  onReleased?: () => void;
  testID?: string;
}

export function PressAndHoldReveal({
  children,
  prompt,
  releaseHint = 'Release to hide',
  rampMs = 250,
  onReleased,
  testID,
}: Props) {
  const [holding, setHolding] = useState(false);
  const seenRef = useRef(false);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(holding ? 1 : 0, { duration: rampMs });
  }, [holding, rampMs, opacity]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const onPressIn = (_: GestureResponderEvent) => {
    setHolding(true);
    seenRef.current = true;
    hapticTap().catch(() => {});
  };
  const onPressOut = () => {
    setHolding(false);
    if (seenRef.current) onReleased?.();
  };

  return (
    <Pressable
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={styles.container}
      testID={testID ?? 'press-and-hold-reveal'}
    >
      {!holding && (
        <View style={styles.promptWrap} pointerEvents="none">
          <Text style={styles.prompt}>{prompt}</Text>
        </View>
      )}
      <Animated.View
        style={[styles.contentWrap, animStyle]}
        pointerEvents="none"
      >
        {children}
        <Text style={styles.releaseHint}>{releaseHint}</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderRadius: radius.l,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    minHeight: 240,
  },
  promptWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prompt: {
    ...typography.h2,
    color: colors.textMuted,
    textAlign: 'center',
  },
  contentWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  releaseHint: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.l,
  },
});

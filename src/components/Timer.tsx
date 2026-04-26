import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '@/theme';
import { playSfx, stopSfx } from '@/audio/sfx';

interface Props {
  durationSec: number;
  paused?: boolean;
  /** When 0, called once. */
  onElapsed?: () => void;
  /** Called every tick with seconds remaining. */
  onTick?: (secLeft: number) => void;
  /** Visual style toggle. */
  variant?: 'normal' | 'urgent';
  testID?: string;
}

export interface TimerHandle {
  pause: () => void;
  resume: () => void;
  add: (seconds: number) => void;
  skip: () => void;
}

export const Timer = React.forwardRef<TimerHandle, Props>(function Timer(
  { durationSec, paused: pausedProp, onElapsed, onTick, variant = 'normal', testID },
  ref,
) {
  const [secLeft, setSecLeft] = useState(durationSec);
  const [paused, setPaused] = useState(pausedProp ?? false);
  const elapsedRef = useRef(false);
  const heartbeatStartedRef = useRef(false);

  const tick = useCallback(() => {
    setSecLeft((s) => {
      const next = Math.max(0, s - 1);
      onTick?.(next);
      if (next === 0 && !elapsedRef.current) {
        elapsedRef.current = true;
        onElapsed?.();
        stopSfx('heartbeat').catch(() => {});
      }
      if (next === 30 && !heartbeatStartedRef.current) {
        heartbeatStartedRef.current = true;
        playSfx('heartbeat').catch(() => {});
      }
      return next;
    });
  }, [onElapsed, onTick]);

  useEffect(() => {
    if (paused) return;
    if (secLeft <= 0) return;
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [paused, secLeft, tick]);

  useEffect(() => {
    if (pausedProp !== undefined) setPaused(pausedProp);
  }, [pausedProp]);

  useEffect(
    () => () => {
      stopSfx('heartbeat').catch(() => {});
    },
    [],
  );

  React.useImperativeHandle(
    ref,
    () => ({
      pause: () => setPaused(true),
      resume: () => setPaused(false),
      add: (seconds: number) => setSecLeft((s) => s + seconds),
      skip: () => setSecLeft(0),
    }),
    [],
  );

  const m = Math.floor(secLeft / 60);
  const s = secLeft % 60;
  const display = `${m}:${s.toString().padStart(2, '0')}`;
  const urgent = variant === 'urgent' || secLeft <= 30;

  return (
    <View
      style={[styles.wrap, urgent && styles.urgent]}
      testID={testID ?? 'timer'}
    >
      <Text style={[styles.display, urgent && styles.displayUrgent]}>
        {display}
      </Text>
      {paused ? <Text style={styles.paused}>paused</Text> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.l,
    paddingVertical: spacing.l,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  urgent: {
    borderColor: colors.mafia,
  },
  display: {
    ...typography.display,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  displayUrgent: {
    color: colors.mafia,
  },
  paused: {
    ...typography.micro,
    color: colors.textMuted,
    marginTop: spacing.s,
  },
});

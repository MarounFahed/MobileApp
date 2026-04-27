import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '@/components/Screen';
import { Button } from '@/components/Button';
import { PlayerCard } from '@/components/PlayerCard';
import { useGameStore } from '@/stores/gameStore';
import { speakKeys, speakSequence } from '@/audio/tts';
import {
  night0Sequence,
  nightSequenceLebnene,
  nightSequenceStandard,
  narrationKeys,
} from '@/engine/narration';
import { alivePlayers, findInvestigator } from '@/engine/stateMachine';
import { colors, spacing, typography } from '@/theme';
import { tap as hapticTap } from '@/audio/sfx';

type Phase =
  | 'narrating'
  | 'mod_mafia_kill'
  | 'pass_phone'
  | 'sleep_screen'
  | 'investigate'
  | 'investigation_result'
  | 'wake_up'
  | 'mafia_kill_no_mod';

export default function NightScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const snap = useGameStore((s) => s.snapshot);

  // Local UI phase. Independent of game state.
  const [uiPhase, setUiPhase] = useState<Phase>('narrating');
  const [seatIndex, setSeatIndex] = useState(0);
  const [investigationsLeft, setInvestigationsLeft] = useState(0);
  const [lastResult, setLastResult] = useState<'mafia' | 'town' | null>(null);
  const [killTargetId, setKillTargetId] = useState<string | null>(null);
  const cancelled = useRef(false);

  useEffect(() => () => {
    cancelled.current = true;
  }, []);

  useEffect(() => {
    if (!snap) return;
    cancelled.current = false;
    runOpening();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!snap) return null;

  const isNight0 = snap.state === 'NIGHT_0';
  const playMode = snap.settings.playMode;
  const mode = snap.settings.mode;
  const aliveSorted = alivePlayers(snap).sort((a, b) => a.seat - b.seat);
  const investigator = findInvestigator(snap);

  const runOpening = async () => {
    if (isNight0) {
      await speakSequence(
        night0Sequence(mode, playMode),
        snap.settings.nightPace,
      );
      if (cancelled.current) return;
      useGameStore.getState().finishNight0();
      router.replace('/game/day');
      return;
    }

    // NIGHT_n. First narrate intro, then route by playMode/mode.
    useGameStore.getState().startNight();
    const post = useGameStore.getState().snapshot!;

    // Setup investigations counter.
    const invs =
      investigator && investigator.alive ? snap.settings.investigationsPerNight : 0;
    setInvestigationsLeft(invs);

    if (playMode === 'moderator') {
      // Moderator handles everything; we narrate, then show buttons:
      // - mafia kill (standard only)
      // - investigation tap-target (sheriff)
      const lines =
        mode === 'standard'
          ? nightSequenceStandard('moderator')
          : nightSequenceLebnene('moderator');
      await speakSequence(lines, snap.settings.nightPace);
      if (cancelled.current) return;
      if (post.state === 'NIGHT_MAFIA_KILL') {
        setUiPhase('mod_mafia_kill');
      } else {
        // jump straight to investigation flow (mod taps target on behalf of sheriff)
        setUiPhase(invs > 0 ? 'investigate' : 'wake_up');
      }
    } else {
      // No-moderator: pass-phone clockwise tap mechanic.
      const lines =
        mode === 'standard'
          ? nightSequenceStandard('no_moderator')
          : nightSequenceLebnene('no_moderator');
      await speakSequence(lines, snap.settings.nightPace);
      if (cancelled.current) return;
      setSeatIndex(0);
      setUiPhase('pass_phone');
    }
  };

  // ---------- moderator: mafia kill ----------
  const onModMafiaKillTap = (targetId: string | null) => {
    useGameStore.getState().recordMafiaKill(targetId);
    setUiPhase(investigationsLeft > 0 ? 'investigate' : 'wake_up');
  };

  // ---------- moderator: investigation ----------
  const onModInvestigateTap = (targetId: string) => {
    if (!investigator) return;
    useGameStore.getState().recordInvestigation(investigator.id, targetId);
    const after = useGameStore.getState().snapshot!;
    const last = after.investigations[after.investigations.length - 1]!;
    setLastResult(last.result);
    setUiPhase('investigation_result');
  };

  const onResultDismiss = () => {
    setLastResult(null);
    const remaining = investigationsLeft - 1;
    setInvestigationsLeft(remaining);
    if (remaining > 0) {
      setUiPhase('investigate');
    } else {
      setUiPhase('wake_up');
    }
  };

  // ---------- no-moderator: pass phone ----------
  const onPassTap = async () => {
    hapticTap().catch(() => {});
    const seat = seatIndex;
    const player = snap.players[seat]; // by seat order

    if (!player || !player.alive) {
      // Skip dead seats: still show sleep screen briefly so timing stays uniform.
      setUiPhase('sleep_screen');
      setTimeout(() => advanceSeat(), 1500);
      return;
    }

    // Standard mode: godfather may need to tap a kill target on this round.
    if (
      mode === 'standard' &&
      snap.state === 'NIGHT_MAFIA_KILL' &&
      player.role === 'godfather' &&
      // Only the FIRST godfather tap during this night phase records the kill.
      !snap.mafiaKills.find((k) => k.round === snap.round + 1)
    ) {
      setUiPhase('mafia_kill_no_mod');
      return;
    }

    // Otherwise, treat as sleep tap unless it's the investigator and they have investigations left.
    if (
      investigator &&
      player.id === investigator.id &&
      investigationsLeft > 0
    ) {
      setUiPhase('investigate');
      return;
    }

    setUiPhase('sleep_screen');
    setTimeout(() => advanceSeat(), 1800);
  };

  const advanceSeat = () => {
    if (seatIndex >= snap.players.length - 1) {
      // Phone has gone all the way around.
      // If we're still in MAFIA_KILL (no godfather tap happened), record null kill.
      const post = useGameStore.getState().snapshot!;
      if (post.state === 'NIGHT_MAFIA_KILL') {
        useGameStore.getState().recordMafiaKill(null);
      }
      finishAndAdvance();
    } else {
      setSeatIndex(seatIndex + 1);
      setUiPhase('pass_phone');
    }
  };

  // Standard, no-mod: godfather taps target.
  const onGodfatherKillTap = (targetId: string | null) => {
    useGameStore.getState().recordMafiaKill(targetId);
    // After the kill, return phone to the godfather's seat continues; show sleep screen.
    setUiPhase('sleep_screen');
    setTimeout(() => advanceSeat(), 1200);
  };

  // No-mod: investigator taps target.
  const onInvestigateTap = (targetId: string) => {
    if (!investigator) return;
    useGameStore.getState().recordInvestigation(investigator.id, targetId);
    const after = useGameStore.getState().snapshot!;
    const last = after.investigations[after.investigations.length - 1]!;
    setLastResult(last.result);
    setUiPhase('investigation_result');
  };

  const onInvestigationResultDismissNoMod = () => {
    setLastResult(null);
    const remaining = investigationsLeft - 1;
    setInvestigationsLeft(remaining);
    if (remaining > 0) {
      setUiPhase('investigate');
    } else {
      // After investigations done, sheriff goes back to sleeping; phone passes on.
      setUiPhase('sleep_screen');
      setTimeout(() => advanceSeat(), 1200);
    }
  };

  // ---------- end of night ----------
  const finishAndAdvance = async () => {
    // Wake up narration.
    await speakKeys(
      narrationKeys({ phase: 'night_outro', mode, playMode }),
      { pace: snap.settings.nightPace, pauseAfterMs: 800 },
    );
    if (cancelled.current) return;
    useGameStore.getState().finishNight();
    const post = useGameStore.getState().snapshot!;
    if (post.state === 'END') {
      router.replace('/game/end');
    } else {
      router.replace('/game/day');
    }
  };

  // ---------- Render ----------

  if (uiPhase === 'narrating') {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={styles.title}>
            {isNight0 ? t('night.title', { round: 0 }) : t('night.title', { round: snap.round })}
          </Text>
          <Text style={styles.subtitle}>{t('night.everyoneClose')}</Text>
        </View>
      </Screen>
    );
  }

  if (uiPhase === 'mod_mafia_kill') {
    return (
      <Screen>
        <Text style={styles.title}>{t('night.mafiaPick')}</Text>
        <View style={styles.gridWrap}>
          {aliveSorted.map((p) => (
            <PlayerCard
              key={p.id}
              name={p.name}
              color={p.color}
              photoUri={p.photoUri}
              selected={killTargetId === p.id}
              onPress={() => setKillTargetId(p.id)}
            />
          ))}
        </View>
        <Button
          title={t('common.skip')}
          variant="ghost"
          onPress={() => onModMafiaKillTap(null)}
        />
        <Button
          title={t('common.confirm')}
          onPress={() => onModMafiaKillTap(killTargetId)}
          disabled={!killTargetId}
        />
      </Screen>
    );
  }

  if (uiPhase === 'investigate') {
    return (
      <Screen>
        <Text style={styles.title}>{t('night.yourInvestigation')}</Text>
        <Text style={styles.subtitle}>{t('night.tapTarget')}</Text>
        <View style={styles.gridWrap}>
          {aliveSorted
            .filter((p) => p.id !== investigator?.id)
            .map((p) => (
              <PlayerCard
                key={p.id}
                name={p.name}
                color={p.color}
                photoUri={p.photoUri}
                onPress={() =>
                  playMode === 'moderator'
                    ? onModInvestigateTap(p.id)
                    : onInvestigateTap(p.id)
                }
              />
            ))}
        </View>
      </Screen>
    );
  }

  if (uiPhase === 'investigation_result') {
    return (
      <Pressable
        onPress={
          playMode === 'moderator'
            ? onResultDismiss
            : onInvestigationResultDismissNoMod
        }
        style={[
          styles.full,
          {
            backgroundColor:
              lastResult === 'mafia' ? colors.mafia : colors.cedar,
          },
        ]}
      >
        <Text style={styles.resultLabel}>{t('night.result')}</Text>
        <Text style={styles.resultText}>
          {lastResult === 'mafia'
            ? t('night.resultMafia')
            : t('night.resultTown')}
        </Text>
        <Text style={styles.resultHint}>{t('night.tapToContinue')}</Text>
      </Pressable>
    );
  }

  if (uiPhase === 'pass_phone') {
    return (
      <Pressable onPress={onPassTap} style={styles.full}>
        <Text style={styles.title}>
          {seatIndex + 1} / {snap.players.length}
        </Text>
        <Text style={styles.subtitle}>{t('night.tapToContinue')}</Text>
      </Pressable>
    );
  }

  if (uiPhase === 'sleep_screen') {
    return (
      <View style={[styles.full, { backgroundColor: colors.black }]}>
        <Text style={styles.sleep}>{t('night.sleep')}</Text>
      </View>
    );
  }

  if (uiPhase === 'mafia_kill_no_mod') {
    return (
      <Screen>
        <Text style={styles.title}>{t('night.godfatherTap')}</Text>
        <View style={styles.gridWrap}>
          {aliveSorted
            .filter((p) => p.role !== 'mafia' && p.role !== 'godfather')
            .map((p) => (
              <PlayerCard
                key={p.id}
                name={p.name}
                color={p.color}
                photoUri={p.photoUri}
                onPress={() => onGodfatherKillTap(p.id)}
              />
            ))}
        </View>
        <Button
          title={t('common.skip')}
          variant="ghost"
          onPress={() => onGodfatherKillTap(null)}
        />
      </Screen>
    );
  }

  if (uiPhase === 'wake_up') {
    return (
      <Screen>
        <View style={styles.center}>
          <Text style={styles.title}>{t('night.wakeUp')}</Text>
          <View style={{ height: spacing.l }} />
          <Button title={t('common.next')} onPress={finishAndAdvance} />
        </View>
      </Screen>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  full: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.l,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { ...typography.h1, color: colors.text, textAlign: 'center' },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.s,
    textAlign: 'center',
  },
  gridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.s,
    marginVertical: spacing.l,
  },
  resultLabel: { ...typography.micro, color: colors.text, opacity: 0.8 },
  resultText: { ...typography.display, color: colors.text, marginTop: spacing.s },
  resultHint: {
    ...typography.caption,
    color: colors.text,
    opacity: 0.7,
    marginTop: spacing.l,
  },
  sleep: { ...typography.h2, color: '#222' },
});

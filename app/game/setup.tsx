import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Switch,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { newId } from '@/utils/id';
import { Screen } from '@/components/Screen';
import { Button } from '@/components/Button';
import { PlayerCard } from '@/components/PlayerCard';
import { colors, radius, spacing, typography } from '@/theme';
import {
  RosterEntry,
  listRoster,
  pickColor,
} from '@/db/roster';
import {
  autoBalance,
  describeBalance,
  maxInvestigationsPerNight,
  RoleCounts,
} from '@/engine/autoBalance';
import { GameMode } from '@/engine/roles';
import { createGame, GameSettings } from '@/engine/stateMachine';
import { useGameStore } from '@/stores/gameStore';
import { useAppStore } from '@/stores/appStore';
import { testAudio } from '@/audio/tts';

export default function SetupScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ mode: string }>();
  const mode = (params.mode === 'standard' ? 'standard' : 'lebnene') as GameMode;

  const [roster, setRoster] = useState<RosterEntry[]>([]);
  const [selected, setSelected] = useState<RosterEntry[]>([]);
  const [adHoc, setAdHoc] = useState('');

  const lastJson = useAppStore.getState().lastGameSettings;
  const last: Partial<GameSettings> = lastJson ? JSON.parse(lastJson) : {};

  const [playMode, setPlayMode] = useState<'moderator' | 'no_moderator'>(
    (last.playMode as 'moderator' | 'no_moderator') ?? 'moderator',
  );
  const [discussionTimerSec, setDiscussionTimerSec] = useState(
    last.discussionTimerSec ?? 180,
  );
  const [nightPace, setNightPace] = useState<'slow' | 'medium' | 'fast'>(
    (last.nightPace as 'slow' | 'medium' | 'fast') ?? 'medium',
  );
  const [tieBreak, setTieBreak] = useState<'revote' | 'skip'>(
    (last.tieBreak as 'revote' | 'skip') ?? 'revote',
  );
  const [investigationsPerNight, setInvestigationsPerNight] = useState<
    1 | 2 | 3
  >((last.investigationsPerNight as 1 | 2 | 3) ?? 1);
  const [godfatherInnocent, setGodfatherInnocent] = useState(
    last.godfatherInnocentToDetective ?? true,
  );

  useEffect(() => {
    setRoster(listRoster());
  }, []);

  const playerCount = selected.length;
  const counts: RoleCounts | null =
    playerCount >= 5 ? autoBalance(playerCount) : null;
  const balance = useMemo(
    () => (counts ? describeBalance(counts) : null),
    [counts],
  );
  const maxInv = maxInvestigationsPerNight(playerCount);

  useEffect(() => {
    if (investigationsPerNight > maxInv) setInvestigationsPerNight(1);
  }, [maxInv, investigationsPerNight]);

  const togglePlayer = (e: RosterEntry) => {
    setSelected((s) =>
      s.find((x) => x.id === e.id) ? s.filter((x) => x.id !== e.id) : [...s, e],
    );
  };

  const addAdHoc = () => {
    const trimmed = adHoc.trim();
    if (!trimmed) return;
    const entry: RosterEntry = {
      id: newId(),
      name: trimmed,
      color: pickColor(),
      createdAt: Date.now(),
    };
    setSelected((s) => [...s, entry]);
    setAdHoc('');
  };

  const begin = () => {
    if (!counts || playerCount < 5) {
      Alert.alert(t('setup.minPlayers'));
      return;
    }
    const settings: GameSettings = {
      mode,
      playMode,
      discussionTimerSec,
      nightPace,
      investigationsPerNight,
      tieBreak,
      godfatherInnocentToDetective: godfatherInnocent,
      soundEnabled: useAppStore.getState().soundEnabled,
      musicEnabled: useAppStore.getState().musicEnabled,
      deathSpeechSec: 30,
    };
    useAppStore.getState().setLastGameSettings(JSON.stringify(settings));
    const snapshot = createGame({
      id: newId(),
      settings,
      players: selected.map((p) => ({
        id: p.id,
        name: p.name,
        photoUri: p.photoUri,
        color: p.color,
      })),
      counts,
    });
    useGameStore.getState().setSnapshot(snapshot);
    useGameStore.getState().startRoleReveal();
    router.replace('/game/reveal');
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        <Text style={styles.h1}>{t('setup.title')}</Text>
        <Text style={styles.subtle}>
          {t(mode === 'lebnene' ? 'menu.modeLebnene' : 'menu.modeStandard')}
        </Text>

        <Section title={t('setup.playMode')}>
          <Toggle
            options={[
              { v: 'moderator', label: t('setup.playModeModerator') },
              { v: 'no_moderator', label: t('setup.playModeNoModerator') },
            ]}
            value={playMode}
            onChange={setPlayMode}
          />
        </Section>

        <Section title={t('setup.players')}>
          <View style={styles.grid}>
            {roster.map((r) => (
              <PlayerCard
                key={r.id}
                name={r.name}
                color={r.color}
                photoUri={r.photoUri}
                selected={!!selected.find((s) => s.id === r.id)}
                onPress={() => togglePlayer(r)}
              />
            ))}
          </View>
          <View style={styles.adHocRow}>
            <TextInput
              value={adHoc}
              onChangeText={setAdHoc}
              placeholder={t('setup.addAdHoc')}
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              onSubmitEditing={addAdHoc}
            />
            <Button title={t('common.add')} onPress={addAdHoc} variant="secondary" />
          </View>
          {selected.length > 0 ? (
            <View style={styles.selectedRow}>
              <Text style={styles.muted}>
                {selected.map((s) => s.name).join(', ')}
              </Text>
            </View>
          ) : null}
          {playerCount > 0 && playerCount < 5 ? (
            <Text style={styles.warn}>{t('setup.minPlayers')}</Text>
          ) : null}
        </Section>

        {balance ? (
          <Section title={t('setup.balance')}>
            <Text style={styles.balanceLine}>
              {balance.godfather}× {t('roles.godfather')} • {balance.mafia}×{' '}
              {t('roles.mafia')} •{' '}
              {balance.investigator}×{' '}
              {t(`roles.${mode === 'lebnene' ? 'sheriff' : 'detective'}`)} •{' '}
              {balance.filler}×{' '}
              {t(`roles.${mode === 'lebnene' ? 'police' : 'civilian'}`)}
            </Text>
          </Section>
        ) : null}

        <Section title={t('setup.options')}>
          <View style={styles.optionRow}>
            <Text style={styles.label}>{t('setup.discussionTimer')}</Text>
            <View style={styles.row}>
              <Stepper
                value={discussionTimerSec / 60}
                onChange={(n) =>
                  setDiscussionTimerSec(Math.max(60, Math.min(600, n * 60)))
                }
                min={1}
                max={10}
                suffix=" min"
              />
            </View>
          </View>

          <View style={styles.optionRow}>
            <Text style={styles.label}>{t('setup.nightPace')}</Text>
            <Toggle
              options={[
                { v: 'slow', label: t('setup.paceSlow') },
                { v: 'medium', label: t('setup.paceMedium') },
                { v: 'fast', label: t('setup.paceFast') },
              ]}
              value={nightPace}
              onChange={setNightPace}
            />
          </View>

          <View style={styles.optionRow}>
            <Text style={styles.label}>{t('setup.tieBreak')}</Text>
            <Toggle
              options={[
                { v: 'revote', label: t('setup.tieRevote') },
                { v: 'skip', label: t('setup.tieSkip') },
              ]}
              value={tieBreak}
              onChange={setTieBreak}
            />
          </View>

          <View style={styles.optionRow}>
            <Text style={styles.label}>{t('setup.investigations')}</Text>
            {maxInv === 1 ? (
              <Text style={styles.muted}>{t('setup.investigationsLocked')}</Text>
            ) : (
              <Toggle
                options={[
                  { v: 1, label: '1' },
                  { v: 2, label: '2' },
                  { v: 3, label: '3' },
                ]}
                value={investigationsPerNight}
                onChange={(v) =>
                  setInvestigationsPerNight(v as 1 | 2 | 3)
                }
              />
            )}
          </View>

          {mode === 'standard' ? (
            <View style={styles.toggleRow}>
              <Text style={styles.label}>{t('setup.godfatherInnocent')}</Text>
              <Switch
                value={godfatherInnocent}
                onValueChange={setGodfatherInnocent}
                trackColor={{ false: colors.border, true: colors.cedar }}
              />
            </View>
          ) : null}
        </Section>

        <Button
          title={t('setup.testAudio')}
          variant="secondary"
          onPress={() => testAudio(nightPace)}
          style={{ marginTop: spacing.m }}
        />

        <Button
          title={t('setup.begin')}
          onPress={begin}
          disabled={playerCount < 5}
          style={{ marginTop: spacing.l }}
        />
      </ScrollView>
    </Screen>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Toggle<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { v: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.toggleGroup}>
      {options.map((o) => (
        <Pressable
          key={String(o.v)}
          onPress={() => onChange(o.v)}
          style={[
            styles.togglePill,
            value === o.v && styles.togglePillActive,
          ]}
        >
          <Text
            style={[
              styles.togglePillText,
              value === o.v && styles.togglePillTextActive,
            ]}
          >
            {o.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function Stepper({
  value,
  min,
  max,
  onChange,
  suffix,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  suffix?: string;
}) {
  return (
    <View style={styles.stepper}>
      <Pressable
        onPress={() => onChange(Math.max(min, value - 1))}
        style={styles.stepBtn}
      >
        <Text style={styles.stepBtnText}>−</Text>
      </Pressable>
      <Text style={styles.stepValue}>
        {value}
        {suffix}
      </Text>
      <Pressable
        onPress={() => onChange(Math.min(max, value + 1))}
        style={styles.stepBtn}
      >
        <Text style={styles.stepBtnText}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  h1: { ...typography.h1, color: colors.text },
  subtle: { ...typography.body, color: colors.textMuted, marginBottom: spacing.l },
  section: { marginTop: spacing.l, gap: spacing.s },
  sectionTitle: { ...typography.h3, color: colors.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.s },
  adHocRow: {
    flexDirection: 'row',
    gap: spacing.s,
    alignItems: 'center',
    marginTop: spacing.s,
  },
  input: {
    flex: 1,
    backgroundColor: colors.bgCard,
    color: colors.text,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderRadius: radius.m,
    minHeight: 44,
    ...typography.body,
  },
  selectedRow: { marginTop: spacing.s },
  muted: { ...typography.caption, color: colors.textMuted },
  warn: { ...typography.caption, color: colors.warning, marginTop: spacing.s },
  balanceLine: { ...typography.body, color: colors.text },
  optionRow: {
    paddingVertical: spacing.s,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.s,
  },
  row: { flexDirection: 'row', gap: spacing.s, alignItems: 'center' },
  label: { ...typography.body, color: colors.text, marginBottom: spacing.s },
  toggleGroup: {
    flexDirection: 'row',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  togglePill: {
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    backgroundColor: colors.bgCard,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  togglePillActive: {
    backgroundColor: colors.cedar,
    borderColor: colors.cedar,
  },
  togglePillText: { ...typography.body, color: colors.textMuted },
  togglePillTextActive: { color: colors.text, fontWeight: '700' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.m },
  stepBtn: {
    width: 36,
    height: 36,
    backgroundColor: colors.bgCard,
    borderRadius: radius.m,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: { ...typography.h2, color: colors.text },
  stepValue: { ...typography.bodyBold, color: colors.text, minWidth: 64, textAlign: 'center' },
});

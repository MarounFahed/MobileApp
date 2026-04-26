import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '@/components/Screen';
import { Button } from '@/components/Button';
import { CedarMark } from '@/components/CedarMark';
import { colors, radius, spacing, typography } from '@/theme';
import { useGameStore } from '@/stores/gameStore';
import { GameMode } from '@/engine/roles';

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [resumePrompt, setResumePrompt] = useState(false);

  useEffect(() => {
    const hasActive = useGameStore.getState().hydrateFromActive();
    if (hasActive) setResumePrompt(true);
  }, []);

  const startMode = (mode: GameMode) => {
    useGameStore.getState().clear();
    router.push({ pathname: '/game/setup', params: { mode } });
  };

  const resume = () => {
    setResumePrompt(false);
    const snap = useGameStore.getState().snapshot;
    if (!snap) return;
    routeForState(router, snap.state);
  };

  const discard = () => {
    useGameStore.getState().clear();
    setResumePrompt(false);
  };

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.hero}>
          <CedarMark size={96} />
          <Text style={styles.title}>{t('app.name')}</Text>
          <Text style={styles.tagline}>{t('app.tagline')}</Text>
        </View>

        <View style={styles.modes}>
          <ModeCard
            title={t('menu.modeLebnene')}
            desc={t('menu.modeLebneneDesc')}
            color={colors.cedar}
            onPress={() => startMode('lebnene')}
            testID="mode-lebnene"
          />
          <ModeCard
            title={t('menu.modeStandard')}
            desc={t('menu.modeStandardDesc')}
            color={colors.mafia}
            onPress={() => startMode('standard')}
            testID="mode-standard"
          />
        </View>

        <View style={styles.bottomNav}>
          <Button
            title={t('menu.roster')}
            variant="ghost"
            onPress={() => router.push('/roster')}
          />
          <Button
            title={t('menu.history')}
            variant="ghost"
            onPress={() => router.push('/history')}
          />
          <Button
            title={t('menu.settings')}
            variant="ghost"
            onPress={() => router.push('/settings')}
          />
        </View>
      </View>

      <Modal transparent visible={resumePrompt} animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('resume.title')}</Text>
            <Text style={styles.modalBody}>{t('resume.body')}</Text>
            <View style={{ height: spacing.l }} />
            <Button title={t('common.resume')} onPress={resume} />
            <View style={{ height: spacing.s }} />
            <Button
              title={t('menu.discard')}
              variant="ghost"
              onPress={discard}
            />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

function ModeCard({
  title,
  desc,
  color,
  onPress,
  testID,
}: {
  title: string;
  desc: string;
  color: string;
  onPress: () => void;
  testID?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.modeCard,
        { borderColor: color },
        pressed && { opacity: 0.7 },
      ]}
    >
      <Text style={[styles.modeTitle, { color }]}>{title}</Text>
      <Text style={styles.modeDesc}>{desc}</Text>
    </Pressable>
  );
}

function routeForState(router: ReturnType<typeof useRouter>, state: string) {
  switch (state) {
    case 'ROLE_REVEAL':
      router.push('/game/reveal');
      break;
    case 'NIGHT_0':
    case 'NIGHT':
    case 'NIGHT_MAFIA_KILL':
    case 'NIGHT_INVESTIGATE':
      router.push('/game/night');
      break;
    case 'DAY':
      router.push('/game/day');
      break;
    case 'VOTE':
      router.push('/game/vote');
      break;
    case 'DEATH_SPEECH':
    case 'ROLE_REVEAL_ON_DEATH':
      router.push('/game/death-speech');
      break;
    case 'CHECK_WIN':
      router.push('/game/day');
      break;
    case 'END':
      router.push('/game/end');
      break;
    default:
      router.push('/game/setup');
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'space-between' },
  hero: {
    alignItems: 'center',
    marginTop: spacing.xxl,
    gap: spacing.m,
  },
  title: {
    ...typography.display,
    color: colors.text,
  },
  tagline: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
  modes: {
    gap: spacing.m,
  },
  modeCard: {
    borderWidth: 2,
    borderRadius: radius.l,
    padding: spacing.l,
    backgroundColor: colors.bgCard,
    gap: spacing.s,
  },
  modeTitle: {
    ...typography.h1,
  },
  modeDesc: {
    ...typography.body,
    color: colors.textMuted,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: spacing.m,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: colors.bgOverlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.l,
  },
  modalCard: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.l,
    padding: spacing.l,
    width: '100%',
    maxWidth: 420,
  },
  modalTitle: {
    ...typography.h1,
    color: colors.text,
    marginBottom: spacing.s,
  },
  modalBody: {
    ...typography.body,
    color: colors.textMuted,
  },
});

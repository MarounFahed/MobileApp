import React from 'react';
import { View, Text, StyleSheet, Switch, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Screen } from '@/components/Screen';
import { Button } from '@/components/Button';
import { useAppStore } from '@/stores/appStore';
import { colors, radius, spacing, typography } from '@/theme';
import { SUPPORTED, SupportedLanguage } from '@/i18n';
import Constants from 'expo-constants';
import { testAudio } from '@/audio/tts';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const {
    language,
    setLanguage,
    soundEnabled,
    setSoundEnabled,
    musicEnabled,
    setMusicEnabled,
  } = useAppStore();

  return (
    <Screen>
      <Text style={styles.h2}>{t('settings.language')}</Text>
      <View style={styles.row}>
        {SUPPORTED.map((l) => (
          <LangChip
            key={l}
            lang={l}
            active={language === l}
            onPress={() => setLanguage(l)}
          />
        ))}
      </View>
      <Text style={styles.note}>{t('settings.languageChangeNote')}</Text>

      <View style={styles.divider} />

      <View style={styles.toggleRow}>
        <Text style={styles.label}>{t('settings.sound')}</Text>
        <Switch
          value={soundEnabled}
          onValueChange={setSoundEnabled}
          trackColor={{ false: colors.border, true: colors.cedar }}
        />
      </View>

      <View style={styles.toggleRow}>
        <Text style={styles.label}>{t('settings.music')}</Text>
        <Switch
          value={musicEnabled}
          onValueChange={setMusicEnabled}
          trackColor={{ false: colors.border, true: colors.cedar }}
        />
      </View>

      <View style={styles.divider} />
      <Button
        title={t('setup.testAudio')}
        variant="secondary"
        onPress={() => testAudio()}
      />

      <View style={{ flex: 1 }} />
      <Text style={styles.aboutHeader}>{t('settings.about')}</Text>
      <Text style={styles.about}>
        {t('settings.version', {
          v: (Constants.expoConfig?.version as string) ?? '1.0.0',
        })}
      </Text>
      <Text style={styles.about}>{t('settings.offline')}</Text>
    </Screen>
  );
}

function LangChip({
  lang,
  active,
  onPress,
}: {
  lang: SupportedLanguage;
  active: boolean;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>
        {t(`settings.language${lang.charAt(0).toUpperCase() + lang.slice(1)}`)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  h2: { ...typography.h2, color: colors.text, marginBottom: spacing.m },
  row: { flexDirection: 'row', gap: spacing.s, flexWrap: 'wrap' },
  chip: {
    backgroundColor: colors.bgCard,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.cedar,
    borderColor: colors.cedar,
  },
  chipText: { color: colors.text, ...typography.body },
  chipTextActive: { color: colors.text, fontWeight: '700' },
  note: { ...typography.caption, color: colors.textMuted, marginTop: spacing.s },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.l,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.s,
  },
  label: { ...typography.body, color: colors.text },
  aboutHeader: { ...typography.h3, color: colors.text, marginBottom: spacing.s },
  about: { ...typography.caption, color: colors.textMuted },
});

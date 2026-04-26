import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { v4 as uuidv4 } from 'uuid';
import { useTranslation } from 'react-i18next';
import { Screen } from '@/components/Screen';
import { Button } from '@/components/Button';
import {
  RosterEntry,
  addRoster,
  listRoster,
  pickColor,
  removeRoster,
  updateRoster,
} from '@/db/roster';
import { getStats } from '@/db/stats';
import { colors, radius, spacing, typography } from '@/theme';

export default function RosterScreen() {
  const { t } = useTranslation();
  const [entries, setEntries] = useState<RosterEntry[]>([]);
  const [editing, setEditing] = useState<RosterEntry | null>(null);
  const [name, setName] = useState('');
  const [photoUri, setPhotoUri] = useState<string | undefined>();

  const refresh = () => setEntries(listRoster());

  useEffect(refresh, []);

  const startNew = () => {
    setEditing(null);
    setName('');
    setPhotoUri(undefined);
  };

  const startEdit = (e: RosterEntry) => {
    setEditing(e);
    setName(e.name);
    setPhotoUri(e.photoUri);
  };

  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const entry: RosterEntry = {
      id: editing?.id ?? uuidv4(),
      name: trimmed,
      photoUri,
      color: editing?.color ?? pickColor(),
      createdAt: editing?.createdAt ?? Date.now(),
    };
    if (editing) updateRoster(entry);
    else addRoster(entry);
    refresh();
    startNew();
  };

  const remove = (e: RosterEntry) => {
    Alert.alert(
      t('roster.deleteConfirm', { name: e.name }),
      undefined,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            removeRoster(e.id);
            refresh();
            if (editing?.id === e.id) startNew();
          },
        },
      ],
    );
  };

  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.6,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (res.canceled || !res.assets[0]) return;
    const src = res.assets[0].uri;
    const dest = `${FileSystem.documentDirectory}roster/${uuidv4()}.jpg`;
    await FileSystem.makeDirectoryAsync(
      `${FileSystem.documentDirectory}roster/`,
      { intermediates: true },
    );
    await FileSystem.copyAsync({ from: src, to: dest });
    setPhotoUri(dest);
  };

  return (
    <Screen>
      <Text style={styles.h2}>{t('roster.addNew')}</Text>
      <View style={styles.editor}>
        <View style={styles.editorRow}>
          <Pressable
            style={[styles.avatarSlot, { backgroundColor: colors.bgCard }]}
            onPress={pickPhoto}
          >
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.avatarImg} />
            ) : (
              <Text style={styles.avatarHint}>{t('roster.photo')}</Text>
            )}
          </Pressable>
          <TextInput
            placeholder={t('roster.name')}
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
            style={styles.input}
          />
        </View>
        <View style={styles.editorActions}>
          {photoUri ? (
            <Button
              title={t('roster.removePhoto')}
              variant="ghost"
              onPress={() => setPhotoUri(undefined)}
            />
          ) : null}
          <Button
            title={editing ? t('common.save') : t('common.add')}
            onPress={save}
            disabled={!name.trim()}
          />
        </View>
      </View>

      <Text style={[styles.h2, { marginTop: spacing.l }]}>
        {t('roster.title')}
      </Text>
      {entries.length === 0 ? (
        <Text style={styles.empty}>{t('roster.empty')}</Text>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(e) => e.id}
          contentContainerStyle={{ gap: spacing.s, paddingBottom: spacing.xl }}
          renderItem={({ item }) => (
            <RosterRow
              entry={item}
              onEdit={() => startEdit(item)}
              onRemove={() => remove(item)}
            />
          )}
        />
      )}
    </Screen>
  );
}

function RosterRow({
  entry,
  onEdit,
  onRemove,
}: {
  entry: RosterEntry;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const { t } = useTranslation();
  const stats = getStats(entry.id);
  return (
    <View style={styles.row}>
      <Pressable onPress={onEdit} style={styles.rowMain}>
        <View style={[styles.dot, { backgroundColor: entry.color }]}>
          {entry.photoUri ? (
            <Image source={{ uri: entry.photoUri }} style={styles.dotImg} />
          ) : (
            <Text style={styles.dotText}>
              {entry.name.trim().charAt(0).toUpperCase()}
            </Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowName}>{entry.name}</Text>
          {stats ? (
            <Text style={styles.rowStats}>
              {t('roster.gamesPlayed')}: {stats.gamesPlayed} •{' '}
              {t('roster.winRate')}: {Math.round(stats.winRate * 100)}%
            </Text>
          ) : null}
        </View>
      </Pressable>
      <Pressable onPress={onRemove} hitSlop={8}>
        <Text style={styles.removeText}>×</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  h2: { ...typography.h2, color: colors.text, marginBottom: spacing.m },
  editor: {
    backgroundColor: colors.bgCard,
    padding: spacing.m,
    borderRadius: radius.m,
    gap: spacing.m,
  },
  editorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.m },
  editorActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.s,
  },
  avatarSlot: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarHint: { ...typography.micro, color: colors.textMuted },
  input: {
    ...typography.body,
    color: colors.text,
    flex: 1,
    backgroundColor: colors.bgElevated,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderRadius: radius.m,
    minHeight: 48,
  },
  empty: { ...typography.body, color: colors.textMuted, textAlign: 'center' },
  row: {
    backgroundColor: colors.bgCard,
    padding: spacing.m,
    borderRadius: radius.m,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.m,
  },
  rowMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.m,
  },
  dot: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  dotImg: { width: '100%', height: '100%' },
  dotText: { ...typography.h3, color: colors.text },
  rowName: { ...typography.bodyBold, color: colors.text },
  rowStats: { ...typography.caption, color: colors.textMuted },
  removeText: {
    ...typography.h1,
    color: colors.mafia,
    paddingHorizontal: spacing.s,
  },
});

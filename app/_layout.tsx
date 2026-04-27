import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator, Text, StyleSheet, Pressable } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { init as initDb } from '@/db/schema';
import { initI18n } from '@/i18n';
import { useAppStore } from '@/stores/appStore';
import { colors, spacing, typography } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        try {
          initDb();
        } catch (e) {
          console.warn('initDb failed', e);
        }
        try {
          useAppStore.getState().hydrate();
        } catch (e) {
          console.warn('hydrate failed', e);
        }
        try {
          initI18n(useAppStore.getState().language);
        } catch (e) {
          console.warn('initI18n failed', e);
        }
      } catch (e) {
        if (!cancelled) {
          setInitError(String((e as Error)?.message ?? e));
        }
      } finally {
        if (!cancelled) setReady(true);
        SplashScreen.hideAsync().catch(() => {});
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator color={colors.cedar} size="large" />
      </View>
    );
  }

  if (initError) {
    return (
      <View style={styles.splash}>
        <Text style={styles.errorTitle}>Mafiazo failed to start</Text>
        <Text style={styles.errorBody}>{initError}</Text>
        <Pressable
          onPress={() => {
            setInitError(null);
            setReady(false);
            setTimeout(() => setReady(true), 50);
          }}
          style={styles.retry}
        >
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.bg },
            headerTintColor: colors.text,
            contentStyle: { backgroundColor: colors.bg },
            headerShadowVisible: false,
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="settings" options={{ title: 'Settings' }} />
          <Stack.Screen name="roster" options={{ title: 'Roster' }} />
          <Stack.Screen name="history" options={{ title: 'History' }} />
          <Stack.Screen name="game/setup" options={{ title: 'Setup' }} />
          <Stack.Screen
            name="game/reveal"
            options={{ title: 'Roles', headerBackVisible: false }}
          />
          <Stack.Screen
            name="game/day"
            options={{ headerShown: false, gestureEnabled: false }}
          />
          <Stack.Screen
            name="game/night"
            options={{ headerShown: false, gestureEnabled: false }}
          />
          <Stack.Screen
            name="game/vote"
            options={{ headerShown: false, gestureEnabled: false }}
          />
          <Stack.Screen
            name="game/death-speech"
            options={{ headerShown: false, gestureEnabled: false }}
          />
          <Stack.Screen
            name="game/end"
            options={{ headerShown: false, gestureEnabled: false }}
          />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.l,
  },
  errorTitle: {
    ...typography.h2,
    color: colors.mafia,
    marginBottom: spacing.m,
    textAlign: 'center',
  },
  errorBody: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.l,
  },
  retry: {
    backgroundColor: colors.cedar,
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.m,
    borderRadius: 12,
  },
  retryText: {
    ...typography.bodyBold,
    color: colors.text,
  },
});

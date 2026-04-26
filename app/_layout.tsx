import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { init as initDb } from '@/db/schema';
import { initI18n } from '@/i18n';
import { useAppStore } from '@/stores/appStore';
import { colors } from '@/theme';

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      initDb();
      useAppStore.getState().hydrate();
      initI18n(useAppStore.getState().language);
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator color={colors.cedar} />
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
  },
});

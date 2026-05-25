import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, LogBox } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useRouter } from 'expo-router';
import SplashAnimation from '@/src/components/SplashAnimation';
import { getValidToken } from '@/src/auth/storage';

// Silence Native Driver warnings on web platform
LogBox.ignoreLogs(['Animated: `useNativeDriver` is not supported']);

// Prevent the native splash from auto-hiding — we control it
SplashScreen.preventAutoHideAsync();

/**
 * Root layout — declares all route groups.
 *
 * Auth flow:
 *  ┌─ app/index.tsx              → Landing (checks token → redirects)
 *  ├─ app/(auth)/*               → Login / Register / Forgot / Verify / Reset
 *  ├─ app/(tabs)/*               → Main app with floating bottom nav
 *  │    ├─ index                 → Dashboard (Home)
 *  │    ├─ spaces                → My Spaces
 *  │    ├─ inbox                 → Inbox
 *  │    └─ profile               → Profile
 *  ├─ app/create-project/*       → 3-step Create Project flow
 *  │    ├─ index                 → Step 1: Select project type
 *  │    ├─ setup                 → Step 2: Project details & team
 *  │    └─ invite                → Step 3: Invite team members
 *  └─ app/portfolios/*           → Portfolio management
 *       ├─ index                 → Portfolio list
 *       └─ [id]                  → Portfolio detail with metrics
 */
export default function RootLayout() {
  const router = useRouter();
  const [showSplash,   setShowSplash]   = useState(true);
  const [authChecked,  setAuthChecked]  = useState(false);
  const [isAuthed,     setIsAuthed]     = useState(false);

  // Check auth in background while animation plays
  useEffect(() => {
    // Hide the native OS splash immediately — our JS splash takes over
    SplashScreen.hideAsync();

    (async () => {
      const token = await getValidToken();
      setIsAuthed(!!token);
      setAuthChecked(true);
    })();
  }, []);

  // Called by SplashAnimation when exit animation finishes
  const handleSplashFinished = useCallback(() => {
    setShowSplash(false);
    // Auth check is almost certainly done by now (it's < 300ms),
    // but await it just in case
    if (authChecked) {
      router.replace(isAuthed ? '/(tabs)' : '/');
    }
    // If not done, the effect below will fire when authChecked flips
  }, [authChecked, isAuthed]);

  // Safety net: if auth resolves AFTER animation finished
  useEffect(() => {
    if (!showSplash && authChecked) {
      router.replace(isAuthed ? '/(tabs)' : '/');
    }
  }, [showSplash, authChecked, isAuthed]);

  return (
    <View style={styles.root}>
      {/* Stack navigator — always mounted so screens can prepare */}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index"                  options={{ headerShown: false }} />
        <Stack.Screen name="(auth)"                 options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)"                 options={{ headerShown: false }} />
        <Stack.Screen name="summary/[projectId]"    options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="board/[projectId]"      options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="create-project/index"   options={{ headerShown: false, animation: 'slide_from_bottom' }} />
        <Stack.Screen name="create-project/setup"   options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="create-project/invite"  options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="portfolios/index"                options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="portfolios/[id]"              options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="project/[projectId]/settings" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="modal"                        options={{ presentation: 'modal' }} />
      </Stack>

      {/* Custom splash overlaid above everything, removed after animation */}
      {showSplash && (
        <SplashAnimation onFinished={handleSplashFinished} />
      )}

      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});

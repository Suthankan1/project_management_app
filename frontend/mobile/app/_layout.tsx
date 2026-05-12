import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

/**
 * Root layout — declares all route groups.
 *
 * Auth flow:
 *  ┌─ app/index.tsx       → Landing (checks token → redirects)
 *  ├─ app/(auth)/*        → Login / Register / Forgot / Verify / Reset
 *  └─ app/(tabs)/*        → Main app with floating bottom nav
 *       ├─ index          → Dashboard (Home)
 *       ├─ spaces         → My Spaces
 *       ├─ inbox          → Inbox
 *       └─ profile        → Profile
 */
export default function RootLayout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index"   options={{ headerShown: false }} />
        <Stack.Screen name="(auth)"  options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)"  options={{ headerShown: false }} />
        <Stack.Screen name="summary/[projectId]" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="modal"   options={{ presentation: 'modal' }} />
      </Stack>
      <StatusBar style="dark" />
    </>
  );
}

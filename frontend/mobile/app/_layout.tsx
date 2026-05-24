import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

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
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index"                  options={{ headerShown: false }} />
        <Stack.Screen name="(auth)"                 options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)"                 options={{ headerShown: false }} />
        <Stack.Screen name="summary/[projectId]"    options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="create-project/index"   options={{ headerShown: false, animation: 'slide_from_bottom' }} />
        <Stack.Screen name="create-project/setup"   options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="create-project/invite"  options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="portfolios/index"                options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="portfolios/[id]"              options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="project/[projectId]/settings" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="modal"                        options={{ presentation: 'modal' }} />
      </Stack>
      <StatusBar style="dark" />
    </>
  );
}

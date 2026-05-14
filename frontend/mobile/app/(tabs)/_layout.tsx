import React from 'react';
import { Tabs } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import FloatingTabBar from '@/src/components/navigation/FloatingTabBar';

/**
 * (tabs) layout — Expo Router Tabs with a custom glassmorphism
 * floating bottom navigation bar.
 *
 * Drawer/sidebar completely removed.
 * 4 tabs: Home (Dashboard), Spaces, Inbox, Profile
 */
export default function TabLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Tabs
        tabBar={(props) => <FloatingTabBar {...props} />}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Tabs.Screen name="index"   options={{ title: 'Home'    }} />
        <Tabs.Screen name="spaces"  options={{ title: 'Spaces'  }} />
        <Tabs.Screen name="inbox"   options={{ title: 'Inbox'   }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      </Tabs>
    </GestureHandlerRootView>
  );
}

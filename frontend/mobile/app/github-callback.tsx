import React, { useEffect, useRef } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { exchangeCodeForToken, saveGitHubToken } from '../src/services/githubMobileService';

/**
 * Handles the GitHub OAuth callback deep link: mobile://github-callback?code=...&state=<projectId>
 *
 * On Android, when GitHub redirects to mobile://github-callback, Expo Router
 * navigates here instead of openAuthSessionAsync returning the URL (which is
 * how iOS works via ASWebAuthenticationSession). This page exchanges the code
 * with the backend and navigates back to the GitHub project page.
 */
export default function GitHubCallbackScreen() {
  const { code, state, error } = useLocalSearchParams<{ code?: string; state?: string; error?: string }>();
  const router = useRouter();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const handle = async () => {
      const projectId = state || '';

      if (error || !code) {
        // GitHub denied access or something went wrong — go back to the project page
        navigateBack(router, projectId);
        return;
      }

      try {
        await exchangeCodeForToken(code, 'mobile://github-callback');
        await saveGitHubToken('backend-managed');
      } catch {
        // Exchange failed — the github page will show the disconnected state
      } finally {
        navigateBack(router, projectId);
      }
    };

    void handle();
  }, [code, state, error, router]);

  return (
    <LinearGradient
      colors={['#0F172A', '#1E293B']}
      style={styles.container}
    >
      <View style={styles.card}>
        <ActivityIndicator size="large" color="#6366F1" style={styles.spinner} />
        <Text style={styles.title}>Connecting GitHub</Text>
        <Text style={styles.subtitle}>Please wait…</Text>
      </View>
    </LinearGradient>
  );
}

function navigateBack(router: ReturnType<typeof useRouter>, projectId: string) {
  if (projectId) {
    router.replace(`/github/${projectId}` as never);
  } else {
    router.replace('/(tabs)' as never);
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  spinner: {
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F1F5F9',
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
  },
});

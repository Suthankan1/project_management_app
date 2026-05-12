import React, { useRef, useEffect } from 'react';
import {
  ScrollView, View, StyleSheet, RefreshControl,
  Platform, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import DashboardHeader from '@/src/components/dashboard/DashboardHeader';
import RecentSpacesSection from '@/src/components/dashboard/RecentSpacesSection';
import TasksSection from '@/src/components/dashboard/TasksSection';
import { useDashboard } from '@/src/hooks/useDashboard';

// ─── Animated section wrapper — staggered fade + slide up ─────────────────────

function FadeSlideIn({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 380,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        delay,
        useNativeDriver: true,
        tension: 180,
        friction: 20,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}

// ─── Dashboard Screen ──────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const {
    user,
    projects,
    tabItems,
    assignedCount,
    loadingProjects,
    loadingTab,
    activeTab,
    setActiveTab,
    refreshProjects,
    refreshTab,
    toggleFavorite,
    recordAccess,
  } = useDashboard();

  const isRefreshing = loadingProjects;

  const onRefresh = () => {
    refreshProjects();
    refreshTab();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />

      {/* ── Sticky Dashboard Header ── */}
      <FadeSlideIn delay={0}>
        <DashboardHeader
          username={user?.username}
          profileInitial={user?.username?.charAt(0).toUpperCase()}
        />
      </FadeSlideIn>

      {/* ── Scrollable Content ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        // High-performance scroll config
        removeClippedSubviews={Platform.OS === 'android'}
        overScrollMode="never"
        decelerationRate="normal"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor="#155DFC"
            colors={['#155DFC']}
          />
        }
      >
        {/* ── Recent Spaces Section — delay 80ms ── */}
        <FadeSlideIn delay={80}>
          <View style={styles.section}>
            <RecentSpacesSection
              projects={projects}
              loading={loadingProjects}
              onFavoriteToggle={toggleFavorite}
              onRecordAccess={recordAccess}
            />
          </View>
        </FadeSlideIn>

        {/* ── Separator ── */}
        <View style={styles.sectionGap} />

        {/* ── Tasks Section — delay 160ms ── */}
        <FadeSlideIn delay={160}>
          <View style={[styles.section, styles.sectionBottom]}>
            <TasksSection
              items={tabItems}
              loading={loadingTab}
              activeTab={activeTab}
              assignedCount={assignedCount}
              onTabChange={setActiveTab}
            />
          </View>
        </FadeSlideIn>

        {/* Safe bottom pad for floating tab bar */}
        <View style={styles.bottomPad} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scroll: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  scrollContent: {
    paddingTop: 4,
  },
  section: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
  },
  sectionGap: {
    height: 8,
    backgroundColor: '#F1F5F9',
  },
  sectionBottom: {
    paddingBottom: 24,
  },
  bottomPad: {
    height: 100,
    backgroundColor: '#F7F8FA',
  },
});

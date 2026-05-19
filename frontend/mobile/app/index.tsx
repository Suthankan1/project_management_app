import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Svg, { Path, Rect } from 'react-native-svg';
import { Colors } from '@/src/constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function LightningIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M13 2L4.09 12.6A1 1 0 005 14h6v8l8.91-10.6A1 1 0 0019 10h-6V2z"
        fill={Colors.primary}
        stroke={Colors.primary}
        strokeWidth={1}
      />
    </Svg>
  );
}

function ClipboardIcon({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        stroke="white"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CalendarIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={4} width={18} height={18} rx={2} stroke="white" strokeWidth={2} />
      <Path d="M16 2v4M8 2v4M3 10h18" stroke="white" strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function PeopleIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
        stroke="white"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const FEATURE_CARDS = [
  {
    Icon: ClipboardIcon,
    title: 'Smart Backlogs',
    desc: 'Organize your work with intelligent backlogs, sprints, and automated task management.',
  },
  {
    Icon: CalendarIcon,
    title: 'Timeline & Calendar',
    desc: 'Visualize your project lifecycle. Track deadlines, milestones, and team velocity.',
  },
  {
    Icon: PeopleIcon,
    title: 'Unified Collaboration',
    desc: 'Built-in communication tools ensure your team stays synchronized, wherever they are.',
  },
];

export default function LandingScreen() {
  const router = useRouter();

  return (
    <LinearGradient
        colors={[Colors.gradientStart, Colors.gradientMid, Colors.gradientEnd]}
        locations={[0, 0.5, 1]}
        start={{ x: 0.13, y: 0 }}
        end={{ x: 0.87, y: 1 }}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safeArea}>
          {/* Nav Bar */}
          <View style={styles.navBar}>
            <View style={styles.logoRow}>
              <View style={styles.logoBox}>
                <LightningIcon />
              </View>
              <Text style={styles.logoText}>Planora</Text>
            </View>
            <View style={styles.navButtons}>
              <TouchableOpacity
                style={styles.ghostButton}
                onPress={() => router.push('/(auth)/login')}
              >
                <Text style={styles.ghostButtonText}>Sign In</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.filledButton}
                onPress={() => router.push('/(auth)/register')}
              >
                <Text style={styles.filledButtonText}>Get Started</Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Hero */}
            <View style={styles.hero}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>✨ THE FUTURE OF PROJECT MANAGEMENT</Text>
              </View>

              <Text style={styles.heading}>{'Manage Projects\nwith Planora'}</Text>

              <Text style={styles.subheadline}>
                {'The all-in-one platform for high-performance teams. Plan, track, and deliver extraordinary work without the complexity.'}
              </Text>

              <View style={styles.ctaButtons}>
                <TouchableOpacity
                  style={styles.ctaPrimary}
                  onPress={() => router.push('/(auth)/register')}
                >
                  <Text style={styles.ctaPrimaryText}>Get Started</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.ctaOutline}
                  onPress={() => router.push('/(auth)/register')}
                >
                  <Text style={styles.ctaOutlineText}>Learn More</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Feature Cards */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.cardsRow}
              style={styles.cardsScroll}
            >
              {FEATURE_CARDS.map(({ Icon, title, desc }) => (
                <View key={title} style={styles.card}>
                  <View style={styles.cardIconBox}>
                    <Icon />
                  </View>
                  <Text style={styles.cardTitle}>{title}</Text>
                  <Text style={styles.cardDesc}>{desc}</Text>
                </View>
              ))}
            </ScrollView>

            {Platform.OS === 'ios' && <View style={{ height: 20 }} />}
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  navBar: {
    height: 64,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
  },
  navButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  ghostButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    minHeight: 44,
    justifyContent: 'center',
  },
  ghostButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  filledButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: Colors.white,
    minHeight: 44,
    justifyContent: 'center',
  },
  filledButtonText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
    paddingBottom: 40,
  },
  hero: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 50,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 1.5,
  },
  heading: {
    fontSize: 34,
    fontWeight: '800',
    color: Colors.white,
    textAlign: 'center',
    lineHeight: 42,
    marginTop: 24,
  },
  subheadline: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 16,
    maxWidth: 300,
  },
  ctaButtons: {
    alignSelf: 'stretch',
    marginTop: 32,
    gap: 12,
  },
  ctaPrimary: {
    height: 52,
    borderRadius: 12,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaPrimaryText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  ctaOutline: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaOutlineText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  cardsScroll: {
    marginTop: 40,
  },
  cardsRow: {
    paddingHorizontal: 20,
    gap: 16,
  },
  card: {
    width: SCREEN_WIDTH * 0.72,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    padding: 24,
  },
  cardIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 8,
  },
  cardDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 19,
  },
});

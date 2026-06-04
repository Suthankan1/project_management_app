import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { FadeInUp, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useForgotPassword } from '@/src/hooks/useForgotPassword';
import BrandHeader from '@/src/components/ui/BrandHeader';
import TextInputField from '@/src/components/ui/TextInputField';
import PrimaryButton from '@/src/components/ui/PrimaryButton';
import Toast from '@/src/components/ui/Toast';
import { Colors } from '@/src/constants/colors';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    email, setEmail,
    isLoading,
    submitted,
    error,
    countdown,
    handleSubmit,
    handleReset,
  } = useForgotPassword();

  const [toastVisible, setToastVisible] = useState(false);
  const scale = useSharedValue(0.5);

  useEffect(() => {
    if (submitted) {
      scale.value = withSpring(1, { damping: 10, stiffness: 80 });
    } else {
      scale.value = 0.5;
    }
  }, [submitted, scale]);

  const scaleStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  useEffect(() => {
    if (error) {
      setToastVisible(true);
    }
  }, [error]);

  return (
    <LinearGradient
      colors={['#F0F4FF', '#F8FAFC', '#FDF0FA']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
        <Toast
          message={error}
          visible={toastVisible}
          onDismiss={() => setToastVisible(false)}
          type="error"
        />

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            style={styles.flex}
            contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top }]}
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Back */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.push('/(auth)/login')}
            >
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M15 18l-6-6 6-6"
                  stroke={Colors.textPrimary}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>

            {/* Brand */}
            <View style={styles.headerWrapper}>
              <BrandHeader
                title="Reset Password"
                subtitle="Enter your email to receive a reset code"
              />
            </View>

            {/* Card */}
            <Animated.View entering={FadeInUp.duration(600).springify().damping(15)}>
              <BlurView intensity={20} tint="light" style={styles.card}>
                {!submitted ? (
                  /* Input State */
                  <View style={styles.formGap}>
                    <TextInputField
                      label="Email Address"
                      value={email}
                      onChangeText={t => setEmail(t.toLowerCase())}
                      placeholder="Enter your email"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      returnKeyType="done"
                      onSubmitEditing={handleSubmit}
                    />

                    <PrimaryButton
                      label={isLoading ? 'Sending...' : 'Send Reset Code'}
                      loading={isLoading}
                      onPress={handleSubmit}
                    />
                  </View>
              ) : (
                /* Success State */
                <View style={styles.successContainer}>
                  <Animated.View style={scaleStyle}>
                    <LinearGradient
                      colors={['#34D399', '#10B981']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.successIcon}
                    >
                      <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
                        <Path
                          d="M5 13l4 4L19 7"
                          stroke="#FFFFFF"
                          strokeWidth={3}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </Svg>
                    </LinearGradient>
                  </Animated.View>

                  <Text style={styles.successTitle}>Check your email</Text>
                  <Text style={styles.successDesc}>
                    {'We\'ve sent a password reset code to '}
                    <Text style={styles.successEmail}>{email}</Text>
                  </Text>
                  <Text style={styles.successNote}>
                    Enter the 6-digit code on the reset password screen. The code expires in 10 minutes.
                  </Text>

                  <PrimaryButton
                    label="Enter Reset Code"
                    onPress={() => router.push({ pathname: '/(auth)/reset-password', params: { email } })}
                  />

                  {countdown > 0 ? (
                    <Text style={styles.countdownText}>Resend available in {countdown}s</Text>
                  ) : (
                    <TouchableOpacity
                      style={styles.resendButton}
                      onPress={handleReset}
                    >
                      <Text style={styles.resendText}>Send to another email</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </BlurView>
            </Animated.View>

            <Text style={styles.footer}>© 2026 Planora. All rights reserved.</Text>
          </ScrollView>
        </KeyboardAvoidingView>
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
    backgroundColor: 'transparent',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 160,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderWidth: 1,
    borderColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    marginLeft: 20,
  },
  headerWrapper: {
    alignItems: 'center',
    marginTop: 24,
    paddingHorizontal: 20,
  },
  card: {
    marginTop: 24,
    marginHorizontal: 20,
    borderRadius: 28,
    backgroundColor: Platform.OS === 'ios' ? 'rgba(255, 255, 255, 0.82)' : 'rgba(255, 255, 255, 0.96)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    padding: 24,
    ...Platform.select({
      web: { boxShadow: '0 12px 28px rgba(99, 102, 241, 0.12)' },
      default: {
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.12,
        shadowRadius: 28,
      },
    }),
    elevation: 16,
  },
  formGap: {
    gap: 16,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 8,
    gap: 0,
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 16,
    textAlign: 'center',
  },
  successDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  successEmail: {
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  successNote: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 24,
    lineHeight: 22,
  },
  countdownText: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 16,
  },
  resendButton: {
    marginTop: 16,
    minHeight: 44,
    justifyContent: 'center',
  },
  resendText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  footer: {
    fontSize: 11,
    color: '#C0C8D8',
    textAlign: 'center',
    marginTop: 24,
  },
});

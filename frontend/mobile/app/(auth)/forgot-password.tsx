import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { useForgotPassword } from '@/src/hooks/useForgotPassword';
import BrandHeader from '@/src/components/ui/BrandHeader';
import TextInputField from '@/src/components/ui/TextInputField';
import PrimaryButton from '@/src/components/ui/PrimaryButton';
import ErrorBanner from '@/src/components/ui/ErrorBanner';
import { Colors } from '@/src/constants/colors';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const {
    email, setEmail,
    isLoading,
    submitted,
    error,
    countdown,
    handleSubmit,
    handleReset,
  } = useForgotPassword();

  return (
    <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Back */}
            <TouchableOpacity
              style={styles.backRow}
              onPress={() => router.push('/(auth)/login')}
            >
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M15 18l-6-6 6-6"
                  stroke={Colors.textMuted}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
              <Text style={styles.backText}>Back to login</Text>
            </TouchableOpacity>

            {/* Brand */}
            <View style={styles.headerWrapper}>
              <BrandHeader
                title="Reset Password"
                subtitle="Enter your email to receive a reset code"
              />
            </View>

            {/* Card */}
            <View style={styles.card}>
              {!submitted ? (
                /* Input State */
                <View style={styles.formGap}>
                  <ErrorBanner message={error} visible={!!error} />

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
                  <View style={styles.successIcon}>
                    <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M5 13l4 4L19 7"
                        stroke={Colors.successGreen}
                        strokeWidth={2.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  </View>

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
                    onPress={() => router.push('/(auth)/reset-password')}
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
            </View>

            <Text style={styles.footer}>© 2026 Planora. All rights reserved.</Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.pageBg,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingTop: 16,
    minHeight: 44,
  },
  backText: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  headerWrapper: {
    alignItems: 'center',
    marginTop: 24,
    paddingHorizontal: 20,
  },
  card: {
    marginTop: 24,
    marginHorizontal: 20,
    borderRadius: 24,
    backgroundColor: Colors.cardBg,
    padding: 24,
    ...Platform.select({
      web: { boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
      },
    }),
    elevation: 4,
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
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.successGreenBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 16,
    textAlign: 'center',
  },
  successDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
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
    lineHeight: 18,
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
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 24,
  },
});

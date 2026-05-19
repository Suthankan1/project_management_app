import React, { useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { useResetPassword } from '@/src/hooks/useResetPassword';
import BrandHeader from '@/src/components/ui/BrandHeader';
import PasswordInput from '@/src/components/ui/PasswordInput';
import PasswordStrengthBar from '@/src/components/ui/PasswordStrengthBar';
import PrimaryButton from '@/src/components/ui/PrimaryButton';
import ErrorBanner from '@/src/components/ui/ErrorBanner';
import { getPasswordStrength } from '@/src/lib/validation';
import { Colors } from '@/src/constants/colors';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const {
    otp, setOtp,
    newPassword, setNewPassword,
    confirmPassword, setConfirmPassword,
    isLoading, error,
    submitted,
    handleSubmit,
  } = useResetPassword();

  const inputRefs = useRef<TextInput[]>([]);
  const otpChars = otp.padEnd(6, '').split('').slice(0, 6);

  const handleOtpChange = (text: string, index: number) => {
    const char = text.slice(-1);
    setOtp(prev => {
      const current = prev.padEnd(6, ' ').split('');
      current[index] = char || ' ';
      const newOtp = current.join('').replace(/\s/g, '');
      if (char && index < 5) {
        setTimeout(() => inputRefs.current[index + 1]?.focus(), 10);
      }
      return newOtp;
    });
  };

  const handleOtpKeyPress = (key: string, index: number) => {
    if (key === 'Backspace') {
      setOtp(prev => {
        const current = prev.padEnd(6, ' ').split('');
        if ((!current[index] || current[index] === ' ') && index > 0) {
          inputRefs.current[index - 1]?.focus();
          current[index - 1] = ' ';
        } else {
          current[index] = ' ';
        }
        return current.join('').replace(/\s/g, '');
      });
    }
  };

  const strength = getPasswordStrength(newPassword);

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
              onPress={() => router.push('/(auth)/forgot-password')}
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
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>

            {/* Brand */}
            <View style={styles.headerWrapper}>
              <BrandHeader
                title="New Password"
                subtitle="Enter the reset code from your email"
              />
            </View>

            {/* Card */}
            <View style={styles.card}>
              {!submitted ? (
                <View style={styles.formGap}>
                  <ErrorBanner message={error} visible={!!error} />

                  {/* OTP Input */}
                  <View>
                    <Text style={styles.otpLabel}>Reset Code</Text>
                    <View style={styles.otpRow}>
                      {[0, 1, 2, 3, 4, 5].map(i => (
                        <TextInput
                          key={i}
                          ref={ref => { if (ref) inputRefs.current[i] = ref; }}
                          style={[
                            styles.otpInput,
                            otpChars[i] ? styles.otpInputFilled : null,
                          ]}
                          value={otpChars[i] || ''}
                          onChangeText={text => handleOtpChange(text, i)}
                          onKeyPress={({ nativeEvent }) => handleOtpKeyPress(nativeEvent.key, i)}
                          maxLength={2}
                          keyboardType="number-pad"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          textAlign="center"
                          selectTextOnFocus
                        />
                      ))}
                    </View>
                  </View>

                  <View>
                    <PasswordInput
                      label="New Password"
                      value={newPassword}
                      onChangeText={setNewPassword}
                      placeholder="Create a new password"
                      textContentType="newPassword"
                      returnKeyType="next"
                    />
                    {newPassword.length > 0 && (
                      <PasswordStrengthBar strength={strength} password={newPassword} />
                    )}
                  </View>

                  <PasswordInput
                    label="Confirm Password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirm your new password"
                    textContentType="newPassword"
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit}
                  />

                  <PrimaryButton
                    label="Reset Password"
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

                  <Text style={styles.successTitle}>Password Reset Successfully</Text>
                  <Text style={styles.successDesc}>
                    Your password has been updated. You can now sign in.
                  </Text>

                  <View style={styles.successButton}>
                    <PrimaryButton
                      label="Back to Sign In"
                      onPress={() => router.replace('/(auth)/login')}
                    />
                  </View>
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
  otpLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  otpRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  otpInput: {
    width: 44,
    height: 52,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.borderDefault,
    fontSize: 20,
    fontWeight: '700',
    color: '#000000', // Hardcoded black
    backgroundColor: Colors.white,
    textAlign: 'center',
    padding: 0,
  },
  otpInputFilled: {
    borderColor: Colors.primary,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 8,
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
    lineHeight: 20,
  },
  successButton: {
    alignSelf: 'stretch',
    marginTop: 24,
  },
  footer: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 24,
  },
});

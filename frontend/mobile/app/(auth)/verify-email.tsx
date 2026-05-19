import React, { useEffect, useRef, useState } from 'react';
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import Svg, { Path, Rect } from 'react-native-svg';
import api from '@/src/api/axios';
import BrandHeader from '@/src/components/ui/BrandHeader';
import PrimaryButton from '@/src/components/ui/PrimaryButton';
import ErrorBanner from '@/src/components/ui/ErrorBanner';
import { Colors } from '@/src/constants/colors';
import { isWeb } from '@/src/lib/platform';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();

  const [otp,            setOtp]            = useState('');
  const [isLoading,      setIsLoading]      = useState(false);
  const [isResending,    setIsResending]    = useState(false);
  const [error,          setError]          = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);

  const inputRefs  = useRef<TextInput[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const otpChars   = otp.padEnd(6, '').split('').slice(0, 6);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const startCountdown = () => {
    setResendCountdown(60);
    intervalRef.current = setInterval(() => {
      setResendCountdown(n => {
        if (n <= 1) {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          return 0;
        }
        return n - 1;
      });
    }, 1000);
  };

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
        // If current box is empty, move back and clear previous
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

  const handleVerify = async () => {
    if (otp.length < 6) {
      setError('Enter the full 6-digit code.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      await api.post('/api/auth/reg/verify', { email, otp });
      router.replace('/(tabs)');
    } catch (err: unknown) {
      const e = err as { response?: { data?: unknown } };
      const errorData = e.response?.data;
      let msg = 'Verification failed. Please try again.';
      if (typeof errorData === 'string') msg = errorData;
      else if (errorData && typeof errorData === 'object' && 'message' in errorData) {
        msg = (errorData as { message: string }).message;
      }
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (isResending || resendCountdown > 0) return;
    setIsResending(true);
    setError('');
    try {
      await api.post('/api/auth/resend', { email });
      startCountdown();
    } catch (err: unknown) {
      const e = err as { response?: { data?: unknown } };
      const errorData = e.response?.data;
      let msg = 'Failed to resend code. Please try again.';
      if (typeof errorData === 'string') msg = errorData;
      else if (errorData && typeof errorData === 'object' && 'message' in errorData) {
        msg = (errorData as { message: string }).message;
      }
      setError(msg);
    } finally {
      setIsResending(false);
    }
  };

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
            {/* Brand */}
            <View style={styles.headerWrapper}>
              <BrandHeader
                title="Verify Your Email"
                subtitle={email || ''}
              />
            </View>

            {/* Card */}
            <View style={styles.card}>
              {/* Email icon */}
              <View style={styles.emailIconWrapper}>
                <View style={styles.emailIconBox}>
                  <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
                    <Rect x={2} y={4} width={20} height={16} rx={2} stroke="white" strokeWidth={2} />
                    <Path
                      d="M2 7l10 7 10-7"
                      stroke="white"
                      strokeWidth={2}
                      strokeLinecap="round"
                    />
                  </Svg>
                </View>

                <Text style={styles.instructionText}>
                  {'We sent a 6-digit verification code to\n'}
                  <Text style={styles.emailBold}>{email}</Text>
                </Text>
              </View>

              <View style={styles.formGap}>
                {/* OTP Input */}
                <View>
                  <Text style={styles.otpLabel}>Verification Code</Text>
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

                <ErrorBanner message={error} visible={!!error} />

                <PrimaryButton
                  label="Verify Email"
                  loading={isLoading}
                  onPress={handleVerify}
                />

                {/* Resend */}
                <View style={styles.resendRow}>
                  {resendCountdown > 0 ? (
                    <Text style={styles.countdownText}>
                      Resend code in {resendCountdown}s
                    </Text>
                  ) : (
                    <TouchableOpacity onPress={handleResend} style={styles.resendButton}>
                      <Text style={styles.resendText}>
                        {isResending ? 'Sending...' : 'Resend verification code'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
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
  headerWrapper: {
    alignItems: 'center',
    marginTop: 40,
    paddingHorizontal: 20,
  },
  card: {
    marginTop: 24,
    marginHorizontal: 20,
    borderRadius: 24,
    backgroundColor: Colors.cardBg,
    padding: 24,
    ...(isWeb
      ? { boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)' }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 16,
        }),
    elevation: 4,
  },
  emailIconWrapper: {
    alignItems: 'center',
    marginBottom: 24,
  },
  emailIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 20,
  },
  emailBold: {
    fontWeight: '700',
    color: Colors.textPrimary,
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
    color: '#000000', // Hardcoded black to rule out color issues
    backgroundColor: Colors.white,
    textAlign: 'center',
    padding: 0,
  },
  otpInputFilled: {
    borderColor: Colors.primary,
  },
  resendRow: {
    alignItems: 'center',
  },
  countdownText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  resendButton: {
    minHeight: 44,
    justifyContent: 'center',
  },
  resendText: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  footer: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 24,
  },
});

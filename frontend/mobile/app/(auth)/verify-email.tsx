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
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import api from '@/src/api/axios';
import BrandHeader from '@/src/components/ui/BrandHeader';
import PrimaryButton from '@/src/components/ui/PrimaryButton';
import ErrorBanner from '@/src/components/ui/ErrorBanner';
import { Colors } from '@/src/constants/colors';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();

  const [otp,            setOtp]            = useState('');
  const [isLoading,      setIsLoading]      = useState(false);
  const [isResending,    setIsResending]    = useState(false);
  const [error,          setError]          = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);
  const [focusedIndex,   setFocusedIndex]   = useState<number | null>(null);

  const inputRefs  = useRef<TextInput[]>([]);
  const prevOtp    = useRef(otp);
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
    if (!/^\d?$/.test(text)) return;
    const isDeleting = text === '' && prevOtp.current.length >= otp.length;
    setOtp(prev => {
      const chars = prev.padEnd(6, ' ').split('');
      chars[index] = text || ' ';
      const next = chars.join('').replace(/ /g, '');
      prevOtp.current = next;
      if (text && index < 5) setTimeout(() => inputRefs.current[index + 1]?.focus(), 0);
      if (!text && isDeleting && index > 0) setTimeout(() => inputRefs.current[index - 1]?.focus(), 0);
      return next;
    });
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
    <LinearGradient
      colors={['#EEF4FF', '#F8FAFC', '#FBF0FE']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
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
            {/* Back button */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.canGoBack() ? router.back() : router.replace('/(auth)/register')}
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
                title="Verify Your Email"
                subtitle={email || ''}
              />
            </View>

            {/* Card */}
            <BlurView intensity={20} tint="light" style={styles.card}>
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
                          focusedIndex === i && styles.otpInputFocused,
                        ]}
                        value={otpChars[i] || ''}
                        onChangeText={text => handleOtpChange(text, i)}
                        onFocus={() => setFocusedIndex(i)}
                        onBlur={() => setFocusedIndex(null)}
                        maxLength={1}
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
            </BlurView>

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
    paddingBottom: 40,
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
    marginTop: 40,
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
    lineHeight: 22,
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
    color: '#6B7280',
    marginBottom: 8,
  },
  otpRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
  },
  otpInput: {
    width: 50,
    height: 58,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E0E7FF',
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    backgroundColor: 'rgba(255, 255, 255, 0.90)',
    textAlign: 'center',
    padding: 0,
  },
  otpInputFilled: {
    borderColor: Colors.primary,
  },
  otpInputFocused: {
    borderColor: Colors.primary,
    ...Platform.select({
      web: { boxShadow: `0 0 8px ${Colors.primary}33` },
      default: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.20,
        shadowRadius: 8,
      },
    }),
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
    color: '#C0C8D8',
    textAlign: 'center',
    marginTop: 24,
  },
});

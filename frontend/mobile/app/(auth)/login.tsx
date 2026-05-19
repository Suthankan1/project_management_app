import React, { useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { useLoginForm } from '@/src/hooks/useLoginForm';
import BrandHeader from '@/src/components/ui/BrandHeader';
import TextInputField from '@/src/components/ui/TextInputField';
import PasswordInput from '@/src/components/ui/PasswordInput';
import PrimaryButton from '@/src/components/ui/PrimaryButton';
import ErrorBanner from '@/src/components/ui/ErrorBanner';
import { Colors } from '@/src/constants/colors';
import { isWeb } from '@/src/lib/platform';

export default function LoginScreen() {
  const router = useRouter();
  const passwordRef = useRef<TextInput>(null);
  const {
    email, setEmail,
    password, setPassword,
    remember, setRemember,
    isLoading, error,
    handleLogin,
  } = useLoginForm();

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
              onPress={() => router.push('/')}
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
              <Text style={styles.backText}>Back to home</Text>
            </TouchableOpacity>

            {/* Brand */}
            <View style={styles.headerWrapper}>
              <BrandHeader
                title="Welcome Back"
                subtitle="Project Management Platform"
              />
            </View>

            {/* Card */}
            <View style={styles.card}>
              {/* Tab Switcher */}
              <View style={styles.tabContainer}>
                <View style={[styles.tab, styles.tabActive]}>
                  <Text style={styles.tabActiveText}>Sign In</Text>
                </View>
                <TouchableOpacity
                  style={styles.tab}
                  onPress={() => router.replace('/(auth)/register')}
                >
                  <Text style={styles.tabInactiveText}>Register</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.formGap}>
                <ErrorBanner message={error} visible={!!error} />

                <TextInputField
                  label="Email Address"
                  value={email}
                  onChangeText={t => setEmail(t.toLowerCase())}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  textContentType="username"
                  returnKeyType="next"
                  blurOnSubmit={false}
                  submitBehavior="submit"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                />

                <PasswordInput
                  inputRef={passwordRef}
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  textContentType="password"
                  returnKeyType="done"
                  blurOnSubmit
                  submitBehavior="blurAndSubmit"
                  onSubmitEditing={handleLogin}
                />

                {/* Utilities Row */}
                <View style={styles.utilitiesRow}>
                  <TouchableOpacity
                    style={styles.rememberRow}
                    onPress={() => setRemember(v => !v)}
                  >
                    <View style={[styles.checkbox, remember && styles.checkboxChecked]}>
                      {remember && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <Text style={styles.rememberText}>Remember me for 7 days</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
                    <Text style={styles.forgotText}>Forgot password?</Text>
                  </TouchableOpacity>
                </View>

                <PrimaryButton
                  label="Sign In"
                  loading={isLoading}
                  onPress={handleLogin}
                />
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 6,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: Colors.white,
    ...(isWeb
      ? { boxShadow: '0 1px 4px rgba(0, 0, 0, 0.08)' }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.08,
          shadowRadius: 4,
        }),
    elevation: 2,
  },
  tabActiveText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  tabInactiveText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  formGap: {
    gap: 16,
  },
  utilitiesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: Colors.borderDefault,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkmark: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  rememberText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  forgotText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
  footer: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 24,
  },
});

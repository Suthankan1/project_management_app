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
import { useRegisterForm } from '@/src/hooks/useRegisterForm';
import BrandHeader from '@/src/components/ui/BrandHeader';
import TextInputField from '@/src/components/ui/TextInputField';
import PasswordInput from '@/src/components/ui/PasswordInput';
import PasswordStrengthBar from '@/src/components/ui/PasswordStrengthBar';
import PrimaryButton from '@/src/components/ui/PrimaryButton';
import ErrorBanner from '@/src/components/ui/ErrorBanner';
import { Colors } from '@/src/constants/colors';
import { isWeb } from '@/src/lib/platform';

export default function RegisterScreen() {
  const router = useRouter();
  const fullNameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);
  const {
    username, setUsername,
    fullName, setFullName,
    email, setEmail,
    password, setPassword,
    confirmPassword, setConfirmPassword,
    isLoading, error,
    strength,
    handleRegister,
  } = useRegisterForm();

  return (
    <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
                title="Create Account"
                subtitle="Project Management Platform"
              />
            </View>

            {/* Card */}
            <View style={styles.card}>
              {/* Tab Switcher */}
              <View style={styles.tabContainer}>
                <TouchableOpacity
                  style={styles.tab}
                  onPress={() => router.replace('/(auth)/login')}
                >
                  <Text style={styles.tabInactiveText}>Sign In</Text>
                </TouchableOpacity>
                <View style={[styles.tab, styles.tabActive]}>
                  <Text style={styles.tabActiveText}>Register</Text>
                </View>
              </View>

              <View style={styles.formGap}>
                <ErrorBanner message={error} visible={!!error} />

                <TextInputField
                  label="Username"
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Pick a username"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  blurOnSubmit={false}
                  submitBehavior="submit"
                  onSubmitEditing={() => fullNameRef.current?.focus()}
                />

                <TextInputField
                  inputRef={fullNameRef}
                  label="Full Name"
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="John Doe"
                  autoCapitalize="words"
                  returnKeyType="next"
                  blurOnSubmit={false}
                  submitBehavior="submit"
                  onSubmitEditing={() => emailRef.current?.focus()}
                />

                <TextInputField
                  inputRef={emailRef}
                  label="Email Address"
                  value={email}
                  onChangeText={t => setEmail(t.toLowerCase())}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  textContentType="emailAddress"
                  returnKeyType="next"
                  blurOnSubmit={false}
                  submitBehavior="submit"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                />

                <View>
                  <PasswordInput
                    inputRef={passwordRef}
                    label="Password"
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Create a password (min 8 chars)"
                    autoComplete="new-password"
                    textContentType="newPassword"
                    returnKeyType="next"
                    blurOnSubmit={false}
                    submitBehavior="submit"
                    onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                  />
                  {password.length > 0 && (
                    <PasswordStrengthBar strength={strength} password={password} />
                  )}
                </View>

                <PasswordInput
                  inputRef={confirmPasswordRef}
                  label="Confirm Password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  textContentType="newPassword"
                  returnKeyType="done"
                  blurOnSubmit
                  submitBehavior="blurAndSubmit"
                  onSubmitEditing={handleRegister}
                />

                <PrimaryButton
                  label="Create Account"
                  loading={isLoading}
                  onPress={handleRegister}
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
  footer: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 24,
  },
});

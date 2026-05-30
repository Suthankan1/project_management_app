import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../lib/axios';
import { getValidToken } from '../lib/auth';
import { EMAIL_REGEX, validatePassword, getPasswordStrength } from '../lib/validation';

export function useRegisterForm() {
  const router = useRouter();

  const [username,         setUsername]         = useState('');
  const [fullName,         setFullName]         = useState('');
  const [email,            setEmail]            = useState('');
  const [password,         setPassword]         = useState('');
  const [confirmPassword,  setConfirmPassword]  = useState('');
  const [isLoading,        setIsLoading]        = useState(false);
  const [error,            setError]            = useState('');

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  useEffect(() => {
    (async () => {
      const token = await getValidToken();
      if (token) router.replace('/(tabs)');
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRegister = async () => {
    setIsLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setIsLoading(false);
      return;
    }

    const { valid, message } = validatePassword(password);
    if (!valid) {
      setError(message);
      setIsLoading(false);
      return;
    }

    if (!EMAIL_REGEX.test(email)) {
      setError('Please enter a valid email address.');
      setIsLoading(false);
      return;
    }

    if (!/^[a-z0-9_]{3,20}$/.test(username)) {
      setError('Username must be 3–20 characters: letters, numbers, underscore only.');
      setIsLoading(false);
      return;
    }

    try {
      await api.post('/api/auth/register', {
        username,
        fullName,
        email: email.toLowerCase(),
        password,
      });
      await AsyncStorage.setItem('pendingVerificationEmail', email.toLowerCase());
      router.push({ pathname: '/(auth)/verify-email', params: { email: email.toLowerCase() } });
    } catch (err: unknown) {
      const e = err as { response?: { data?: unknown } };
      const errorData = e.response?.data;
      let errorMessage = 'Registration failed. Please try again.';

      if (typeof errorData === 'string') {
        errorMessage = errorData;
      } else if (errorData && typeof errorData === 'object' && 'message' in errorData) {
        errorMessage = (errorData as { message: string }).message;
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    username, setUsername,
    fullName, setFullName,
    email, setEmail,
    password, setPassword,
    confirmPassword, setConfirmPassword,
    isLoading,
    error, setError,
    strength,
    handleRegister,
  };
}

import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import api from '../api/axios';
import { clearRefreshToken, getValidToken, saveRefreshToken, saveToken, setRememberMe } from '../auth/storage';
import { EMAIL_REGEX } from '../lib/validation';
import { registerForPushNotifications } from '../lib/pushNotifications';

export function useLoginForm() {
  const router = useRouter();

  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [remember,     setRemember]     = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading,    setIsLoading]    = useState(false);
  const [error,        setError]        = useState('');

  useEffect(() => {
    (async () => {
      const token = await getValidToken();
      if (token) router.replace('/(tabs)');
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogin = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setError('');

    if (!EMAIL_REGEX.test(email)) {
      setError('Please enter a valid email address.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.post('/api/auth/login', {
        email: email.toLowerCase(),
        password,
      });

      if (response.data.success) {
        await saveToken(response.data.token);
        await setRememberMe(remember);
        if (remember && response.data.refreshToken) {
          await saveRefreshToken(response.data.refreshToken);
        } else {
          await clearRefreshToken();
        }

        if (Platform.OS === 'ios' || Platform.OS === 'android') {
          const pushToken = await registerForPushNotifications();
          if (pushToken) {
            try {
              await api.post('/api/user/me/push-token', {
                pushToken,
                platform: Platform.OS,
              });
            } catch {
              // Push registration is best effort; login should still succeed.
            }
          }
        }

        router.replace('/(tabs)');
      } else {
        setError(response.data.message || 'Login failed. Please try again.');
      }
    } catch (err: unknown) {
      const e = err as { response?: { status?: number; data?: unknown } };
      const errorData = e.response?.data;
      let errorMessage = 'Login failed. Please try again.';

      if (typeof errorData === 'string') {
        errorMessage = errorData;
      } else if (errorData && typeof errorData === 'object' && 'message' in errorData) {
        errorMessage = (errorData as { message: string }).message;
      }

      if (e.response?.status === 403) {
        setError(errorMessage || 'Email is not verified. Please check your email.');
      } else if (e.response?.status === 401) {
        setError(errorMessage || 'Incorrect email or password.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return {
    email, setEmail,
    password, setPassword,
    remember, setRemember,
    showPassword, setShowPassword,
    isLoading,
    error, setError,
    handleLogin,
  };
}

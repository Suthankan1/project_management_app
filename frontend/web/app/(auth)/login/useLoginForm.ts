'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ensureValidToken, saveToken, saveRefreshToken, setRememberMe } from '@/lib/auth';
import { authApi } from '@/services/api-contract';

/*
 * Headless Business Logic Hook for Login.
 * Manages the API contract between the Next.js frontend and the Spring Boot backend.
 */
export function useLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ── Form State ──
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // ── Network State ──
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  /*
   * UX Optimization: Silent Auth Bypass.
   * On component mount, check if we already have a valid JWT. 
   * If so, instantly kick the user to the dashboard so they don't have to look at a login screen.
   */
  useEffect(() => {
    let isMounted = true;

    const redirectIfAuthenticated = async () => {
      if (await ensureValidToken()) {
        // Use replace() instead of push() so the user can't hit the "Back" button
        // and end up stuck on the login page again.
        if (isMounted) router.replace('/dashboard');
      }
    };

    void redirectIfAuthenticated();
    return () => {
      isMounted = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Core Login Execution
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    setError('');

    // This regex is a basic check for the presence of "@" and "." in the right order, 
    // but it doesn't guarantee the email is deliverable or that the user has access to it.
    // This regex checks for text + @ + text + . + text
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      setIsLoading(false);
      return;
    }
    

    try {
      // API CONTRACT: Send credentials to Spring Boot.
      const response = await authApi.login({
        email: email.toLowerCase(),
        password,
      });

      if ((response as { success?: boolean }).success) {
        // Step 1: Tell our local auth utility how long to keep these tokens alive based on user preference.
        setRememberMe(remember);

        // Step 2: Persist the Access JWT.
        saveToken((response as { token?: string }).token || (response as { accessToken?: string }).accessToken || '');

        // Step 3: Persist the Refresh Token (if the backend issues them).
        if ((response as { refreshToken?: string }).refreshToken) {
          saveRefreshToken((response as { refreshToken?: string }).refreshToken!);
        }

        // Step 4: Route to the authenticated app (or back to the deep link they came from).
        const redirectTo = searchParams.get('redirect') || '/dashboard';
        router.push(redirectTo);
      } else {
        setError((response as { message?: string }).message || 'Login failed. Please try again.');
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      // ── API Error Translation ──
      // This block bridges the gap between raw HTTP protocol errors and user-friendly UI text.
      let errorMessage = 'Login failed. Please try again.';
      const errorData = err.response?.data;

      // Parse the Spring Boot payload formats
      if (typeof errorData === 'string') {
        errorMessage = errorData;
      } else if (errorData?.message) {
        errorMessage = errorData.message;
      }

      // Map strict HTTP Status Codes to contextual help.
      if (err.response?.status === 403) {
        // 403 Forbidden is typically thrown by our JpaUserDetailedService if user.isVerified() is false.
        setError(errorMessage || 'Email is not verified. Please check your email.');
      } else if (err.response?.status === 401) {
        // 401 Unauthorized is standard for bad credentials.
        setError(errorMessage || 'Incorrect email or password.');
      } else {
        // 500s or unknown errors.
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Expose the internal state and actions to the View Component.
  return {
    email, setEmail,
    password, setPassword,
    remember, setRemember,
    showPassword, setShowPassword,
    isLoading,
    error,
    handleLogin,
  };
}

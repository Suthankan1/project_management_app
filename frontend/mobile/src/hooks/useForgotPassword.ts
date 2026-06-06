import { useEffect, useRef, useState } from 'react';
import api from '../lib/axios';
import { buildForgotPasswordRequest, forgotPassword as forgotPasswordBuilder, type ForgotPasswordRequest } from '@planora/contracts';
import { EMAIL_REGEX } from '../lib/validation';

export function useForgotPassword() {
  const [email,     setEmail]     = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error,     setError]     = useState('');
  const [countdown, setCountdown] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const startCountdown = () => {
    setCountdown(60);
    intervalRef.current = setInterval(() => {
      setCountdown(n => {
        if (n <= 1) {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          return 0;
        }
        return n - 1;
      });
    }, 1000);
  };

  const handleSubmit = async () => {
    if (isLoading) return;
    setError('');

    if (!EMAIL_REGEX.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    try {
      const request: ForgotPasswordRequest = buildForgotPasswordRequest({ email: email.toLowerCase() });
      await forgotPasswordBuilder(api, request);
      setSubmitted(true);
      startCountdown();
    } catch (err: unknown) {
      const e = err as { response?: { data?: unknown } };
      const errorData = e.response?.data;
      let msg = 'Failed to send reset code. Please try again.';
      if (typeof errorData === 'string') msg = errorData;
      else if (errorData && typeof errorData === 'object' && 'message' in errorData) {
        msg = (errorData as { message: string }).message;
      }
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setEmail('');
    setCountdown(0);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  return {
    email, setEmail,
    isLoading,
    submitted,
    error, setError,
    countdown,
    handleSubmit,
    handleReset,
  };
}

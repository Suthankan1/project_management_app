import { useState } from 'react';
import api from '../api/axios';
import { validatePassword } from '../lib/validation';

export function useResetPassword() {
  const [otp,             setOtp]             = useState('');
  const [newPassword,     setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading,       setIsLoading]       = useState(false);
  const [error,           setError]           = useState('');
  const [submitted,       setSubmitted]       = useState(false);

  const handleSubmit = async () => {
    if (isLoading) return;
    setError('');

    if (otp.trim().length < 6) {
      setError('Please enter the 6-digit code.');
      return;
    }

    const { valid, message } = validatePassword(newPassword);
    if (!valid) {
      setError(message);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/api/auth/reset', { token: otp.trim(), newPassword });
      setNewPassword('');
      setConfirmPassword('');
      setSubmitted(true);
    } catch (err: unknown) {
      const e = err as { response?: { data?: unknown } };
      const errorData = e.response?.data;
      let msg = 'Failed to reset password. Please try again.';
      if (typeof errorData === 'string') msg = errorData;
      else if (errorData && typeof errorData === 'object' && 'message' in errorData) {
        msg = (errorData as { message: string }).message;
      }
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    otp, setOtp,
    newPassword, setNewPassword,
    confirmPassword, setConfirmPassword,
    isLoading,
    error, setError,
    submitted,
    handleSubmit,
  };
}

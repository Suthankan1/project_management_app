'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { validatePassword } from '@/lib/passwordValidation';
import BrandLogo from '../components/UI/BrandLogo';
import ResetPasswordForm from './components/ResetPasswordForm';
import SuccessMessage from './components/SuccessMessage';
import { authApi } from '@/services/api-contract';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const [otp, setOtp] = useState(() => searchParams.get('token') ?? '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!otp || otp.trim().length < 6) {
      setError('Please enter the 6-digit reset code from your email.');
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
      await authApi.resetPassword({
        token: otp.trim(),
        newPassword,
      });

      setSubmitted(true);
      // Clear plaintext passwords from React state immediately after a successful reset as a security measure
      setNewPassword('');
      setConfirmPassword('');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      let errorMessage = 'Failed to reset password. Please try again.';
      const errorData = err.response?.data;
      
      if (typeof errorData === 'string') {
        errorMessage = errorData;
      } else if (errorData?.message) {
        errorMessage = errorData.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='min-h-screen flex flex-col items-center justify-center p-4'>
      {/* Back to Login Link */}
      <div className="w-full max-w-[420px] mb-4">
        <Link href="/login" className='inline-flex items-center text-sm text-cu-text-muted hover:text-cu-text-primary transition-colors'>
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back to login
        </Link>
      </div>

      {/* Header Section */}
      <BrandLogo title="Reset Password" subtitle="Choose a new password to complete your reset" />

      {/* Main Card Container */}
      <div className='w-full max-w-[420px] glass-panel rounded-[24px] shadow-xl p-4 sm:p-8'>
        {/* Swap to SuccessMessage in-place so the user sees confirmation before being asked to navigate */}
        {submitted ? (
          <SuccessMessage />
        ) : (
          <ResetPasswordForm
            otp={otp}
            newPassword={newPassword}
            confirmPassword={confirmPassword}
            error={error}
            isLoading={isLoading}
            onOtpChange={setOtp}
            onPasswordChange={setNewPassword}
            onConfirmPasswordChange={setConfirmPassword}
            onSubmit={handleSubmit}
          />
        )}

        {/* Footer Reference */}
        <p className="mt-8 text-center text-xs text-cu-text-muted">
          © 2026 Planora. All rights reserved.
        </p>
      </div>
    </div>
  );
}

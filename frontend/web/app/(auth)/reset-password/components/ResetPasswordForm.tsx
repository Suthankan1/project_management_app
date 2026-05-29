'use client';

import PasswordChecklist from '@/app/(auth)/components/UI/PasswordChecklist';
import OtpInput from './OtpInput';
import PasswordInput from './PasswordInput';

interface ResetPasswordFormProps {
  otp: string;
  newPassword: string;
  confirmPassword: string;
  error: string;
  isLoading: boolean;
  onOtpChange: (value: string) => void;
  onPasswordChange: (password: string) => void;
  onConfirmPasswordChange: (password: string) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export default function ResetPasswordForm({
  otp,
  newPassword,
  confirmPassword,
  error,
  isLoading,
  onOtpChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onSubmit
}: ResetPasswordFormProps) {
  return (
    <form className='space-y-5' onSubmit={onSubmit}>
      {error && (
        <div role="alert" className="bg-cu-danger/10 border border-cu-danger/30 text-cu-danger px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <OtpInput value={otp} onChange={onOtpChange} disabled={isLoading} />

      <div className="bg-cu-primary/5 border border-cu-primary/20 rounded-lg p-3">
        <p className="text-xs font-semibold text-cu-text-primary mb-2">Password Requirements:</p>
        <PasswordChecklist password={newPassword} unmetClassName="text-cu-text-muted" />
      </div>

      <PasswordInput
        label="New Password"
        value={newPassword}
        onChange={onPasswordChange}
        placeholder="Enter new password"
        disabled={isLoading}
      />

      <PasswordInput
        label="Confirm Password"
        value={confirmPassword}
        onChange={onConfirmPasswordChange}
        placeholder="Confirm your password"
        disabled={isLoading}
      />

      <button
        type="submit"
        disabled={isLoading}
        className='w-full bg-cu-primary hover:opacity-90 disabled:bg-cu-bg-tertiary disabled:text-cu-text-muted disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors'
      >
        {isLoading ? 'Resetting...' : 'Reset Password'}
      </button>
    </form>
  );
}

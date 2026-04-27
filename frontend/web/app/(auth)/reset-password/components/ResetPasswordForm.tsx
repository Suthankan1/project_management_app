'use client';

import { PASSWORD_REQUIREMENTS } from '@/lib/passwordValidation';
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
        <div role="alert" className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <OtpInput value={otp} onChange={onOtpChange} disabled={isLoading} />

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-xs font-semibold text-blue-900 mb-2">Password Requirements:</p>
        <ul className="space-y-1">
          {PASSWORD_REQUIREMENTS.map((req) => {
            const met = req.test(newPassword);
            return (
              <li key={req.id} className={`flex items-center gap-1.5 text-xs ${met ? 'text-emerald-600' : 'text-blue-800'}`}>
                <span className="shrink-0">{met ? '✓' : '○'}</span>
                {req.label}
              </li>
            );
          })}
        </ul>
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
        className='w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors'
      >
        {isLoading ? 'Resetting...' : 'Reset Password'}
      </button>
    </form>
  );
}

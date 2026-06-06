'use client';

import { useState } from 'react';
import { AxiosError } from 'axios';
import { validatePassword } from '@/lib/passwordValidation';
import { authApi } from '@/services/api-contract';

type PwStep = 'idle' | 'sent' | 'done';

function normalizeError(error: unknown, fallback: string): string {
    if (error instanceof AxiosError) {
        const data = error.response?.data;
        if (typeof data === 'string' && data.trim()) return data;
        if (data && typeof data === 'object' && 'message' in data) {
            const message = (data as { message?: unknown }).message;
            if (typeof message === 'string' && message.trim()) return message;
        }
    }
    return fallback;
}

export function useChangePassword({ email }: { email: string }) {
    const [pwStep, setPwStep] = useState<PwStep>('idle');
    const [isSendingOtp, setIsSendingOtp] = useState(false);
    const [isResettingPw, setIsResettingPw] = useState(false);
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSendOtp = async () => {
        if (!email) return;
        setError('');
        setSuccess('');
        try {
            setIsSendingOtp(true);
            await authApi.forgotPassword({ email });
            setPwStep('sent');
        } catch (err: unknown) {
            setError(normalizeError(err, 'Failed to send verification code.'));
        } finally {
            setIsSendingOtp(false);
        }
    };

    const handleResetPassword = async () => {
        const { valid, message } = validatePassword(newPassword);
        if (!valid) {
            setError(message);
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        setError('');
        setSuccess('');
        try {
            setIsResettingPw(true);
            await authApi.resetPassword({ email, token: otp, newPassword });
            setSuccess('Password updated successfully.');
            setPwStep('done');
            setOtp('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: unknown) {
            setError(normalizeError(err, 'Failed to reset password.'));
        } finally {
            setIsResettingPw(false);
        }
    };

    return {
        pwStep, setPwStep,
        isSendingOtp,
        isResettingPw,
        otp, setOtp,
        newPassword, setNewPassword,
        confirmPassword, setConfirmPassword,
        error,
        success,
        handleSendOtp,
        handleResetPassword,
    };
}

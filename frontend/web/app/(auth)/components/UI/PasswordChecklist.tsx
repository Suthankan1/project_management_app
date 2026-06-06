'use client';

import { PASSWORD_REQUIREMENTS } from '@/lib/passwordValidation';

interface PasswordChecklistProps {
  password: string;
  unmetClassName?: string;
}

export default function PasswordChecklist({ password, unmetClassName = 'text-cu-text-muted' }: PasswordChecklistProps) {
  return (
    <ul className="space-y-0.5">
      {PASSWORD_REQUIREMENTS.map((req) => {
        const met = req.test(password);
        return (
          <li key={req.id} className={`flex items-center gap-1.5 text-xs ${met ? 'text-emerald-600' : unmetClassName}`}>
            <span className="shrink-0">{met ? '✓' : '○'}</span>
            {req.label}
          </li>
        );
      })}
    </ul>
  );
}

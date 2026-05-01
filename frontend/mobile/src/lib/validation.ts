export const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,128}$/;

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const PASSWORD_REQUIREMENTS = [
  { label: 'At least 8 characters',            test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter (A–Z)',        test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter (a–z)',        test: (p: string) => /[a-z]/.test(p) },
  { label: 'One number (0–9)',                  test: (p: string) => /[0-9]/.test(p) },
  { label: 'One special character (!@#$ etc)',  test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

export function validatePassword(pw: string): { valid: boolean; message: string } {
  if (!PASSWORD_REGEX.test(pw)) {
    const missing = PASSWORD_REQUIREMENTS
      .filter(r => !r.test(pw))
      .map(r => r.label)
      .join(', ');
    return { valid: false, message: `Password needs: ${missing}` };
  }
  return { valid: true, message: '' };
}

export function getPasswordStrength(pw: string): 0 | 1 | 2 | 3 | 4 {
  const met = PASSWORD_REQUIREMENTS.filter(r => r.test(pw)).length;
  if (met === PASSWORD_REQUIREMENTS.length) return 4;
  return Math.min(3, met) as 0 | 1 | 2 | 3;
}

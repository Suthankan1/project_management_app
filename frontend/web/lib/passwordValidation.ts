const UPPER_RE   = /[A-Z]/;
const LOWER_RE   = /[a-z]/;
const DIGIT_RE   = /[0-9]/;
const SPECIAL_RE = /[^A-Za-z0-9]/;

export const PASSWORD_REQUIREMENTS = [
  { id: 'length',  label: 'At least 8 characters',         test: (pw: string) => pw.length >= 8 },
  { id: 'upper',   label: 'One uppercase letter (A–Z)',     test: (pw: string) => UPPER_RE.test(pw) },
  { id: 'lower',   label: 'One lowercase letter (a–z)',     test: (pw: string) => LOWER_RE.test(pw) },
  { id: 'digit',   label: 'One number (0–9)',               test: (pw: string) => DIGIT_RE.test(pw) },
  { id: 'special', label: 'One special character (!@#$…)',  test: (pw: string) => SPECIAL_RE.test(pw) },
] as const;

export function validatePassword(password: string): { valid: boolean; message: string } {
  for (const req of PASSWORD_REQUIREMENTS) {
    if (!req.test(password)) {
      return { valid: false, message: `Password must include ${req.label.toLowerCase()}.` };
    }
  }
  return { valid: true, message: '' };
}

export const isValidEmail = (value: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

// Dominios de proveedores de correo conocidos. Evita dominios inventados tipo @asdasdas.com
export const ALLOWED_EMAIL_DOMAINS = [
  'gmail.com',
  'googlemail.com',
  'outlook.com',
  'outlook.es',
  'hotmail.com',
  'hotmail.es',
  'live.com',
  'msn.com',
  'yahoo.com',
  'yahoo.es',
  'icloud.com',
  'me.com',
  'mac.com',
  'proton.me',
  'protonmail.com',
  'aol.com',
  'gmx.com',
  'gmx.es',
  'zoho.com',
  'yandex.com',
] as const;

export const isAllowedEmailDomain = (value: string): boolean => {
  const domain = value.trim().toLowerCase().split('@')[1] ?? '';
  return (ALLOWED_EMAIL_DOMAINS as readonly string[]).includes(domain);
};
export const isRequired = (value: string): boolean => value.trim().length > 0;
export const hasMinLength = (value: string, min: number): boolean => value.trim().length >= min;
export const hasMaxLength = (value: string, max: number): boolean => value.trim().length <= max;
export const onlyDigits = (value: string): string => value.replace(/\D/g, '');
export const isValidColombianPhone = (value: string): boolean => /^\d{10}$/.test(onlyDigits(value));

// Nombres: 2-25 caracteres (sin contar espacios al inicio/fin)
export const isValidNameLength = (value: string): boolean => {
  const len = value.trim().length;
  return len >= 2 && len <= 25;
};

// Contraseña segura: min 8, mayúscula, minúscula, número, símbolo, sin espacios
export const hasUppercase = (v: string) => /[A-Z]/.test(v);
export const hasLowercase = (v: string) => /[a-z]/.test(v);
export const hasNumber = (v: string) => /\d/.test(v);
export const hasSymbol = (v: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(v);
export const hasNoSpaces = (v: string) => !/\s/.test(v);

export const isStrongPassword = (value: string): boolean =>
  value.length >= 8 && hasUppercase(value) && hasLowercase(value) && hasNumber(value) && hasSymbol(value) && hasNoSpaces(value);

export type PasswordStrength = 'weak' | 'medium' | 'good' | 'strong';

export function getPasswordStrength(password: string): { level: PasswordStrength; score: number } {
  if (!password) return { level: 'weak', score: 0 };
  let score = 0;
  if (password.length >= 8) score++;
  if (hasUppercase(password)) score++;
  if (hasLowercase(password)) score++;
  if (hasNumber(password)) score++;
  if (hasSymbol(password)) score++;
  // sin espacios no suma, pero si tiene espacio penaliza
  if (!hasNoSpaces(password)) score = Math.max(0, score - 2);
  if (score <= 2) return { level: 'weak', score };
  if (score === 3) return { level: 'medium', score };
  if (score === 4) return { level: 'good', score };
  return { level: 'strong', score };
}



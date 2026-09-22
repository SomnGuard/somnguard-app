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
export const onlyDigits = (value: string): string => value.replace(/\D/g, '');
export const isValidColombianPhone = (value: string): boolean => /^\d{10}$/.test(onlyDigits(value));



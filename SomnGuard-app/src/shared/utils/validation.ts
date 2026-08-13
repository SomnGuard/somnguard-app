export const isValidEmail = (value: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
export const isRequired = (value: string): boolean => value.trim().length > 0;
export const hasMinLength = (value: string, min: number): boolean => value.trim().length >= min;
export const onlyDigits = (value: string): string => value.replace(/\D/g, '');
export const isValidColombianPhone = (value: string): boolean => /^\d{10}$/.test(onlyDigits(value));



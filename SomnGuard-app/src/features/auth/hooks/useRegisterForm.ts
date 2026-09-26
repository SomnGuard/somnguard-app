import type { TFunction } from 'i18next';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { authService } from '@/features/auth/services/auth.service';
import { RegisterErrors, RegisterForm } from '@/features/auth/types/auth.types';
import {
  getPasswordStrength,
  hasNoSpaces,
  isRequired,
  isStrongPassword,
  isValidColombianPhone,
  isValidEmail,
  isValidNameLength,
  onlyDigits,
  type PasswordStrength,
} from '@/shared/utils/validation';

const initialForm: RegisterForm = { firstName: '', lastName: '', email: '', password: '', confirmPassword: '', phone: '' };

function validate(form: RegisterForm, t: TFunction): RegisterErrors {
  const errors: RegisterErrors = {};
  if (!isRequired(form.firstName)) errors.firstName = t('auth.errors.firstNameRequired');
  else if (!isValidNameLength(form.firstName)) errors.firstName = t('auth.errors.firstNameLength');
  if (!isRequired(form.lastName)) errors.lastName = t('auth.errors.lastNameRequired');
  else if (!isValidNameLength(form.lastName)) errors.lastName = t('auth.errors.lastNameLength');
  if (!isRequired(form.email)) errors.email = t('auth.errors.emailRequired');
  else if (!isValidEmail(form.email)) errors.email = t('auth.errors.invalidEmailLong');
  if (!isRequired(form.password)) errors.password = t('auth.errors.passwordRequired');
  else if (!hasNoSpaces(form.password)) errors.password = t('auth.errors.passwordNoSpaces');
  else if (!isStrongPassword(form.password)) errors.password = t('auth.errors.passwordWeak');
  if (!isRequired(form.confirmPassword)) errors.confirmPassword = t('auth.errors.confirmPasswordRequired');
  else if (form.password !== form.confirmPassword) errors.confirmPassword = t('auth.errors.passwordsMismatch');
  if (!isRequired(form.phone)) errors.phone = t('auth.errors.phoneRequired');
  else if (!isValidColombianPhone(form.phone)) errors.phone = t('auth.errors.invalidPhone');
  return errors;
}

export function getPasswordStrengthLabel(level: PasswordStrength, t: TFunction): string {
  if (level === 'weak') return t('auth.errors.passwordStrengthWeak');
  if (level === 'medium') return t('auth.errors.passwordStrengthMedium');
  if (level === 'good') return t('auth.errors.passwordStrengthGood');
  return t('auth.errors.passwordStrengthStrong');
}

export function useRegisterForm(onSuccess: () => void) {
  const { t } = useTranslation();
  const [form, setForm] = useState<RegisterForm>(initialForm);
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // truncar nombres a 25 máx. visual
  function updateField<K extends keyof RegisterForm>(field: K, value: RegisterForm[K]) {
    let nextValue: RegisterForm[K] = value;
    if (field === 'phone') nextValue = onlyDigits(value).slice(0, 10) as RegisterForm[K];
    if (field === 'firstName' || field === 'lastName') nextValue = (value as string).slice(0, 25) as RegisterForm[K];
    setForm((current) => ({ ...current, [field]: nextValue }));
    setErrors((current) => ({ ...current, [field]: undefined, general: undefined }));
  }

  const passwordStrength = getPasswordStrength(form.password);

  async function submit() {
    const validationErrors = validate(form, t);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;
    try {
      setIsSubmitting(true);
      await authService.register(form);
      onSuccess();
    } catch (error) {
      const message = error instanceof Error ? error.message : t('auth.errors.registerFailed');
      const lower = message.toLowerCase();
      const isEmail = lower.includes('email') || lower.includes('correo') || lower.includes('mail');
      const isPhone = lower.includes('phone') || lower.includes('tel') || lower.includes('cel') || lower.includes('número') || lower.includes('numero') || lower.includes('móvil') || lower.includes('movil');
      const isPassword = lower.includes('password') || lower.includes('contraseña') || lower.includes('contrasena');
      // La API ya informa si es email o teléfono -> priorizar campo específico
      if (isPhone) {
        setErrors({ phone: message });
      } else if (isEmail) {
        setErrors({ email: message });
      } else if (isPassword) {
        setErrors({ password: message });
      } else {
        setErrors({ general: message });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return { form, errors, isSubmitting, updateField, submit, passwordStrength };
}

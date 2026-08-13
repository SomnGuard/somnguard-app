import type { TFunction } from 'i18next';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { authService } from '@/features/auth/services/auth.service';
import { RegisterErrors, RegisterForm } from '@/features/auth/types/auth.types';
import { hasMinLength, isRequired, isValidColombianPhone, isValidEmail, onlyDigits } from '@/shared/utils/validation';

const initialForm: RegisterForm = { firstName: '', lastName: '', email: '', password: '', confirmPassword: '', phone: '' };

function validate(form: RegisterForm, t: TFunction): RegisterErrors {
  const errors: RegisterErrors = {};
  if (!isRequired(form.firstName)) errors.firstName = t('auth.errors.firstNameRequired');
  if (!isRequired(form.lastName)) errors.lastName = t('auth.errors.lastNameRequired');
  if (!isRequired(form.email)) errors.email = t('auth.errors.emailRequired');
  else if (!isValidEmail(form.email)) errors.email = t('auth.errors.invalidEmailLong');
  if (!isRequired(form.password)) errors.password = t('auth.errors.passwordRequired');
  else if (!hasMinLength(form.password, 6)) errors.password = t('auth.errors.minPassword', { count: 6 });
  if (!isRequired(form.confirmPassword)) errors.confirmPassword = t('auth.errors.confirmPasswordRequired');
  else if (form.password !== form.confirmPassword) errors.confirmPassword = t('auth.errors.passwordsMismatch');
  if (!isRequired(form.phone)) errors.phone = t('auth.errors.phoneRequired');
  else if (!isValidColombianPhone(form.phone)) errors.phone = t('auth.errors.invalidPhone');
  return errors;
}

export function useRegisterForm(onSuccess: () => void) {
  const { t } = useTranslation();
  const [form, setForm] = useState<RegisterForm>(initialForm);
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField<K extends keyof RegisterForm>(field: K, value: RegisterForm[K]) {
    const nextValue = field === 'phone' ? onlyDigits(value).slice(0, 10) : value;
    setForm((current) => ({ ...current, [field]: nextValue }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function submit() {
    const validationErrors = validate(form, t);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;
    try {
      setIsSubmitting(true);
      await authService.register(form);
      onSuccess();
    } catch (error) {
      setErrors({ email: error instanceof Error ? error.message : t('auth.errors.registerFailed') });
    } finally {
      setIsSubmitting(false);
    }
  }

  return { form, errors, isSubmitting, updateField, submit };
}

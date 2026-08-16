import type { TFunction } from 'i18next';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { authService } from '@/features/auth/services/auth.service';
import { LoginErrors, LoginForm } from '@/features/auth/types/auth.types';
import { isRequired, isValidEmail } from '@/shared/utils/validation';

const initialForm: LoginForm = { email: '', password: '' };

function validate(form: LoginForm, t: TFunction): LoginErrors {
  const errors: LoginErrors = {};
  if (!isRequired(form.email)) errors.email = t('auth.errors.emailRequired');
  else if (!isValidEmail(form.email)) errors.email = t('auth.errors.invalidEmail');
  if (!isRequired(form.password)) errors.password = t('auth.errors.passwordRequired');
  return errors;
}

export function useLoginForm(onSuccess: () => void) {
  const { t } = useTranslation();
  const [form, setForm] = useState<LoginForm>(initialForm);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField<K extends keyof LoginForm>(field: K, value: LoginForm[K]) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined, general: undefined }));
  }

  async function submit() {
    const validationErrors = validate(form, t);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;
    try {
      setIsSubmitting(true);
      await authService.login(form);
      onSuccess();
    } catch (error) {
      setErrors({ general: error instanceof Error ? error.message : t('auth.errors.loginFailed') });
    } finally {
      setIsSubmitting(false);
    }
  }

  return { form, errors, isSubmitting, updateField, submit };
}

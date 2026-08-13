import type { TFunction } from 'i18next';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { profileService } from '@/features/profile/services/profile.service';
import type { AccountErrors, AccountForm } from '@/features/profile/types/profile.types';
import { isRequired, isValidColombianPhone, isValidEmail, onlyDigits } from '@/shared/utils/validation';

const initialProfile = profileService.getProfile();
const initialForm: AccountForm = {
  name: initialProfile.name,
  email: initialProfile.email,
  phone: initialProfile.phone,
  birthDate: initialProfile.birthDate,
};

function validate(form: AccountForm, t: TFunction): AccountErrors {
  const errors: AccountErrors = {};
  if (!isRequired(form.name)) errors.name = t('account.errors.fullNameRequired');
  if (!isRequired(form.email)) errors.email = t('auth.errors.emailRequired');
  else if (!isValidEmail(form.email)) errors.email = t('auth.errors.invalidEmail');
  if (!isRequired(form.phone)) errors.phone = t('auth.errors.phoneRequired');
  else if (!isValidColombianPhone(form.phone)) errors.phone = t('auth.errors.invalidPhone');
  if (!isRequired(form.birthDate)) errors.birthDate = t('account.errors.birthDateRequired');
  return errors;
}

export function useAccountForm(onSuccess: (form: AccountForm) => void) {
  const { t } = useTranslation();
  const [form, setForm] = useState<AccountForm>(initialForm);
  const [errors, setErrors] = useState<AccountErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField<K extends keyof AccountForm>(field: K, value: AccountForm[K]) {
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
      const updated = await profileService.updateAccount(form);
      onSuccess(updated);
    } catch (error) {
      setErrors({ email: error instanceof Error ? error.message : t('account.errors.updateFailed') });
    } finally {
      setIsSubmitting(false);
    }
  }

  return { form, errors, isSubmitting, updateField, submit };
}

import type { TFunction } from 'i18next';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { profileService } from '@/features/profile/services/profile.service';
import type { SecurityErrors, SecurityForm } from '@/features/profile/types/profile.types';
import { hasMinLength, isRequired } from '@/shared/utils/validation';

const initialForm: SecurityForm = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
  twoFactorEnabled: false,
};

function validate(form: SecurityForm, t: TFunction): SecurityErrors {
  const errors: SecurityErrors = {};
  if (!isRequired(form.currentPassword)) errors.currentPassword = t('security.errors.currentPasswordRequired');
  if (!isRequired(form.newPassword)) errors.newPassword = t('security.errors.newPasswordRequired');
  else if (!hasMinLength(form.newPassword, 6)) errors.newPassword = t('auth.errors.minPassword', { count: 6 });
  if (!isRequired(form.confirmPassword)) errors.confirmPassword = t('security.errors.confirmNewPassword');
  else if (form.newPassword !== form.confirmPassword) errors.confirmPassword = t('auth.errors.passwordsMismatch');
  return errors;
}

export function useSecurityForm(onSuccess: () => void) {
  const { t } = useTranslation();
  const [form, setForm] = useState<SecurityForm>(initialForm);
  const [errors, setErrors] = useState<SecurityErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField<K extends keyof SecurityForm>(field: K, value: SecurityForm[K]) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function submit() {
    const validationErrors = validate(form, t);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;
    try {
      setIsSubmitting(true);
      await profileService.changePassword(form.currentPassword, form.newPassword, form.twoFactorEnabled);
      onSuccess();
    } catch (error) {
      setErrors({ currentPassword: error instanceof Error ? error.message : t('security.errors.updateFailed') });
    } finally {
      setIsSubmitting(false);
    }
  }

  return { form, errors, isSubmitting, updateField, submit };
}

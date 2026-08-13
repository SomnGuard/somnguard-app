import { useState } from 'react';
import { profileService } from '@/features/profile/services/profile.service';
import type { PreferencesForm } from '@/features/profile/types/profile.types';
import { DEFAULT_LANGUAGE, type AppLanguage } from '@/shared/i18n';
import type { AppThemeName } from '@/shared/theme';

const initialForm: PreferencesForm = {
  theme: 'dark',
  language: DEFAULT_LANGUAGE,
  units: 'metric',
  soundsEnabled: true,
};

export function usePreferencesForm(onSuccess: () => void, initialLanguage: AppLanguage = DEFAULT_LANGUAGE, initialTheme: AppThemeName = 'dark') {
  const [form, setForm] = useState<PreferencesForm>({ ...initialForm, language: initialLanguage, theme: initialTheme });
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField<K extends keyof PreferencesForm>(field: K, value: PreferencesForm[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit() {
    try {
      setIsSubmitting(true);
      await profileService.savePreferences(form);
      onSuccess();
    } finally {
      setIsSubmitting(false);
    }
  }

  return { form, isSubmitting, updateField, submit };
}

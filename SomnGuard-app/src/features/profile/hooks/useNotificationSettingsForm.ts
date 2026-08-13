import { useState } from 'react';
import { profileService } from '@/features/profile/services/profile.service';
import type { NotificationSettings } from '@/features/profile/types/profile.types';

const initialSettings: NotificationSettings = {
  push: true,
  securityAlerts: true,
  activityAlerts: true,
  reminders: true,
  emailNotifications: true,
  dailySummary: false,
  criticalAlerts: true,
};

export function useNotificationSettingsForm(onSuccess: () => void) {
  const [form, setForm] = useState<NotificationSettings>(initialSettings);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField<K extends keyof NotificationSettings>(field: K, value: NotificationSettings[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit() {
    try {
      setIsSubmitting(true);
      await profileService.saveNotificationSettings(form);
      onSuccess();
    } finally {
      setIsSubmitting(false);
    }
  }

  return { form, isSubmitting, updateField, submit };
}

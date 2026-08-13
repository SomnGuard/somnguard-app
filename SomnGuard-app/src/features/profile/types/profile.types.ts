import type { AppLanguage } from '@/shared/i18n';

export type AccountForm = {
  name: string;
  email: string;
  phone: string;
  birthDate: string;
};

export type AccountErrors = Partial<Record<keyof AccountForm, string>>;

export type SecurityForm = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  twoFactorEnabled: boolean;
};

export type SecurityErrors = Partial<Record<'currentPassword' | 'newPassword' | 'confirmPassword', string>>;

export type PreferencesForm = {
  theme: 'dark' | 'light';
  language: AppLanguage;
  units: 'metric' | 'imperial';
  soundsEnabled: boolean;
};

export type NotificationSettings = {
  push: boolean;
  securityAlerts: boolean;
  activityAlerts: boolean;
  reminders: boolean;
  emailNotifications: boolean;
  dailySummary: boolean;
  criticalAlerts: boolean;
};

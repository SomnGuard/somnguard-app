import type { AppLanguage } from '@/shared/i18n';

export type AccountForm = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

export type AccountErrors = Partial<Record<keyof AccountForm, string>>;

export type EmailChangeForm = {
  newEmail: string;
};

export type EmailChangeErrors = Partial<Record<keyof EmailChangeForm, string>>;

export type PreferencesForm = {
  theme: 'dark' | 'light';
  language: AppLanguage;
};

export type NotificationSettings = {
  push: boolean;
};

export type DeviceInfo = {
  id: string;
  name: string;
  status: 'connected' | 'disconnected';
  code: string;
  linkedAt: string;
};

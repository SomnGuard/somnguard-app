import { profile as profileMock } from '@/features/profile/mocks/profile.mock';
import type { AccountForm, NotificationSettings, PreferencesForm } from '@/features/profile/types/profile.types';
import { i18n } from '@/shared/i18n';

let currentProfile: typeof profileMock & { birthDate?: string } = { ...profileMock };

export const profileService = {
  getProfile(): AccountForm {
    return {
      name: currentProfile.name,
      email: currentProfile.email,
      phone: currentProfile.phone.replace(/\D/g, ''),
      birthDate: currentProfile.birthDate ?? '',
    };
  },

  async updateAccount(form: AccountForm): Promise<AccountForm> {
    currentProfile = { ...currentProfile, name: form.name, email: form.email, phone: `+57 ${form.phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3')}`, birthDate: form.birthDate };
    return this.getProfile();
  },

  async changePassword(currentPassword: string, newPassword: string, twoFactorEnabled: boolean): Promise<void> {
    if (!currentPassword.trim()) throw new Error(i18n.t('security.errors.currentPasswordRequired'));
    if (newPassword.trim().length < 6) throw new Error(i18n.t('auth.errors.minPassword', { count: 6 }));
    void twoFactorEnabled;
    return;
  },

  async savePreferences(values: PreferencesForm): Promise<PreferencesForm> {
    return values;
  },

  async saveNotificationSettings(values: NotificationSettings): Promise<NotificationSettings> {
    return values;
  },

  async downloadData(): Promise<string> {
    return i18n.t('privacy.downloadAlertMessage');
  },
};


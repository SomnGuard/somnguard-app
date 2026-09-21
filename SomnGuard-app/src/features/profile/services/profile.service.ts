import type { AccountForm, DeviceInfo, NotificationSettings, PreferencesForm } from '@/features/profile/types/profile.types';
import { i18n } from '@/shared/i18n';
import { usersApi, type UserMeResponse } from '@/shared/api/usersApi';
import { ApiError } from '@/shared/api/client';

let linkedDevice: DeviceInfo | null = null;

type CachedProfile = {
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone: string;
};

const emptyProfile: CachedProfile = { firstName: '', lastName: '', name: '', email: '', phone: '' };

// Cache en memoria sincronizado con la API (sin datos mock)
let currentProfile: CachedProfile = { ...emptyProfile };

function mapUserMeToAccountForm(user: UserMeResponse): AccountForm {
  return {
    firstName: user.firstName ?? '',
    lastName: user.lastName ?? '',
    email: user.email ?? '',
    phone: (user.phone ?? '').replace(/\D/g, ''),
  };
}

export const profileService = {
  async fetchProfile(): Promise<UserMeResponse> {
    try {
      const user = await usersApi.getMe();
      // sync fallback cache
      currentProfile = { ...currentProfile, firstName: user.firstName, lastName: user.lastName, name: `${user.firstName} ${user.lastName}`.trim(), email: user.email, phone: user.phone ?? '' };
      return user;
    } catch (e) {
      // fallback to mock if API fails (e.g., offline dev)
      if (e instanceof ApiError) throw e;
      throw e;
    }
  },

  async getProfileFromApi(): Promise<AccountForm> {
    const user = await this.fetchProfile();
    return mapUserMeToAccountForm(user);
  },

  // Legacy sync for compatibility (returns cached)
  getProfile(): AccountForm {
    const nameParts = (currentProfile.name ?? `${currentProfile.firstName ?? ''} ${currentProfile.lastName ?? ''}`.trim()).split(' ');
    const firstName = currentProfile.firstName ?? nameParts[0] ?? '';
    const lastName = currentProfile.lastName ?? nameParts.slice(1).join(' ') ?? '';
    return {
      firstName,
      lastName,
      email: currentProfile.email,
      phone: currentProfile.phone.replace(/\D/g, ''),
    };
  },

  getEmail(): string {
    return currentProfile.email;
  },

  async updateAccount(form: AccountForm): Promise<AccountForm> {
    try {
      const payload: Record<string, string> = {};
      if (form.firstName?.trim()) payload.firstName = form.firstName.trim();
      if (form.lastName?.trim()) payload.lastName = form.lastName.trim();
      if (form.phone?.trim()) payload.phone = form.phone.trim();
      // email is read-only in Cuenta; send current email to satisfy backend body permitido
      if (form.email?.trim()) payload.email = form.email.trim().toLowerCase();
      const updated = await usersApi.updateMe(payload);
      currentProfile = { ...currentProfile, firstName: updated.firstName, lastName: updated.lastName, name: `${updated.firstName} ${updated.lastName}`.trim(), email: updated.email, phone: updated.phone ?? '' };
      return mapUserMeToAccountForm(updated);
    } catch (e) {
      if (e instanceof ApiError) throw new Error(e.message);
      throw e instanceof Error ? e : new Error(i18n.t('account.errors.updateFailed'));
    }
  },

  async changeEmail(newEmail: string): Promise<UserMeResponse> {
    if (!newEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.trim())) throw new Error(i18n.t('auth.errors.invalidEmail'));
    try {
      const updated = await usersApi.updateMe({ email: newEmail.trim().toLowerCase() });
      currentProfile = { ...currentProfile, email: updated.email, firstName: updated.firstName, lastName: updated.lastName, name: `${updated.firstName} ${updated.lastName}`.trim() };
      return updated;
    } catch (e) {
      if (e instanceof ApiError) throw new Error(e.message);
      throw e instanceof Error ? e : new Error(i18n.t('security.errors.updateFailed'));
    }
  },

  async deleteAccount(): Promise<void> {
    try {
      await usersApi.deleteMe();
      currentProfile = { ...emptyProfile };
      linkedDevice = null;
    } catch (e) {
      if (e instanceof ApiError) throw new Error(e.message);
      throw e instanceof Error ? e : new Error(i18n.t('security.errors.updateFailed'));
    }
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

  getDevice(): DeviceInfo | null {
    return linkedDevice;
  },

  hasLinkedDevice(): boolean {
    return linkedDevice !== null;
  },

  async linkDevice(code: string): Promise<DeviceInfo> {
    const alphanum = code.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    if (alphanum.length !== 13) throw new Error(i18n.t('account.errors.invalidDeviceCode'));
    if (!/^[A-Za-z0-9]{5}-[A-Za-z0-9]{4}-[A-Za-z0-9]{4}$/.test(code)) throw new Error(i18n.t('account.errors.invalidDeviceCode'));
    linkedDevice = {
      id: `DEV-${alphanum.slice(0, 5)}-${alphanum.slice(5, 9)}`,
      name: `SomnGuard Device ${alphanum.slice(-4)}`,
      status: 'connected',
      code: code.toUpperCase(), // conservar formato xxxxx-xxxx-xxxx alfanumérico
      linkedAt: new Date().toISOString(),
    };
    return linkedDevice;
  },

  async unlinkDevice(): Promise<void> {
    linkedDevice = null;
  },
};


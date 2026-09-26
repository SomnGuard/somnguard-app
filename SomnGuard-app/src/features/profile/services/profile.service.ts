import type { AccountForm, DeviceInfo, NotificationSettings, PreferencesForm } from '@/features/profile/types/profile.types';
import { i18n } from '@/shared/i18n';
import { usersApi, type UserMeResponse } from '@/shared/api/usersApi';
import { devicesApi, type DeviceResponse } from '@/shared/api/devicesApi';
import { ApiError } from '@/shared/api/client';

// Dispositivos vinculados del usuario (GET /api/v1/devices)
let linkedDevices: DeviceResponse[] = [];

function mapDeviceToInfo(device: DeviceResponse): DeviceInfo {
  return {
    id: device.id,
    name: device.serialNumber || device.id,
    status: device.statusCategory === 'active' || device.status === 'ASSIGNED' ? 'connected' : 'disconnected',
    code: device.claimCode ?? device.serialNumber ?? '',
    linkedAt: device.assignedAt ?? device.createdAt ?? new Date().toISOString(),
  };
}

function toDeviceError(e: unknown): Error {
  if (e instanceof ApiError && e.status === 0) return new Error(i18n.t('common.connectionError'));
  if (e instanceof ApiError && e.status === 404) return new Error(i18n.t('account.errors.deviceClaimNotFound'));
  if (e instanceof ApiError && e.status === 409) return new Error(i18n.t('account.errors.deviceClaimConflict'));
  if (e instanceof ApiError && e.status === 400) return new Error(i18n.t('account.errors.deviceClaimInvalid'));
  if (e instanceof ApiError) return new Error(e.message);
  return e instanceof Error ? e : new Error(i18n.t('account.errors.deviceLinkFailed'));
}

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
      if (e instanceof ApiError && e.status === 0) throw new Error(i18n.t('common.connectionError'));
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
      if (e instanceof ApiError && e.status === 0) throw new Error(i18n.t('common.connectionError'));
      if (e instanceof ApiError) throw new Error(e.message);
      throw e instanceof Error ? e : new Error(i18n.t('security.errors.updateFailed'));
    }
  },

  async deleteAccount(): Promise<void> {
    try {
      await usersApi.deleteMe();
      currentProfile = { ...emptyProfile };
      linkedDevices = [];
    } catch (e) {
      if (e instanceof ApiError && e.status === 0) throw new Error(i18n.t('common.connectionError'));
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

  // GET /api/v1/devices - consulta dispositivos vinculados y actualiza cache
  async fetchDevices(): Promise<DeviceResponse[]> {
    try {
      linkedDevices = await devicesApi.listMyDevices();
      return linkedDevices;
    } catch (e) {
      if (e instanceof ApiError) throw e;
      throw e;
    }
  },

  getDevices(): DeviceResponse[] {
    return linkedDevices;
  },

  getDevice(): DeviceInfo | null {
    const first = linkedDevices[0];
    return first ? mapDeviceToInfo(first) : null;
  },

  hasLinkedDevice(): boolean {
    return linkedDevices.length > 0;
  },

  // POST /api/v1/devices/claim { claimCode } - vincula y refresca lista
  async linkDevice(code: string): Promise<DeviceInfo> {
    const claimCode = code.trim();
    if (!claimCode) throw new Error(i18n.t('account.errors.invalidDeviceCode'));
    try {
      await devicesApi.claimDevice(claimCode);
      await this.fetchDevices();
      const linked = this.getDevice();
      if (!linked) throw new Error(i18n.t('account.errors.deviceLinkFailed'));
      return linked;
    } catch (e) {
      throw toDeviceError(e);
    }
  },

  // POST /api/v1/devices/{id}/unassign - desvincula y refresca lista
  async unlinkDevice(): Promise<void> {
    const first = linkedDevices[0];
    if (!first) {
      linkedDevices = [];
      return;
    }
    try {
      await devicesApi.unassignDevice(first.id);
      await this.fetchDevices();
    } catch (e) {
      throw toDeviceError(e);
    }
  },
};


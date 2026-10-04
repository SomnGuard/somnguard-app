import type { TFunction } from 'i18next';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { profileService } from '@/features/profile/services/profile.service';
import type { DeviceResponse } from '@/shared/api/devicesApi';
import type { AccountErrors, AccountForm, DeviceInfo } from '@/features/profile/types/profile.types';
import { isRequired, isValidColombianPhone, onlyDigits } from '@/shared/utils/validation';

function validate(form: AccountForm, t: TFunction): AccountErrors {
  const errors: AccountErrors = {};
  if (!isRequired(form.firstName)) errors.firstName = t('auth.errors.firstNameRequired');
  if (!isRequired(form.lastName)) errors.lastName = t('auth.errors.lastNameRequired');
  if (!isRequired(form.phone)) errors.phone = t('auth.errors.phoneRequired');
  else if (!isValidColombianPhone(form.phone)) errors.phone = t('auth.errors.invalidPhone');
  return errors;
}

export function useAccountForm(onSuccess: (form: AccountForm) => void) {
  const { t } = useTranslation();
  const fallback = profileService.getProfile();
  const [form, setForm] = useState<AccountForm>(fallback);
  const [errors, setErrors] = useState<AccountErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [device, setDevice] = useState<DeviceInfo | null>(() => profileService.getDevice());
  const [devices, setDevices] = useState<DeviceResponse[]>(() => profileService.getDevices());
  const [isLoadingDevices, setIsLoadingDevices] = useState(false);
  const [devicesError, setDevicesError] = useState<string | undefined>(undefined);
  const [deviceCode, setDeviceCode] = useState('');
  const [deviceError, setDeviceError] = useState<string | undefined>(undefined);
  const [isLinking, setIsLinking] = useState(false);
  const [deviceLinked, setDeviceLinked] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);

  async function refreshDevices(): Promise<void> {
    try {
      setIsLoadingDevices(true);
      setDevicesError(undefined);
      const list = await profileService.fetchDevices();
      setDevices(list);
      setDevice(profileService.getDevice());
    } catch (e) {
      setDevicesError(e instanceof Error ? e.message : t('account.errors.deviceLoadFailed'));
    } finally {
      setIsLoadingDevices(false);
    }
  }

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setIsLoading(true);
        const user = await profileService.fetchProfile();
        if (!mounted) return;
        setForm({
          firstName: user.firstName ?? fallback.firstName,
          lastName: user.lastName ?? fallback.lastName,
          email: user.email ?? fallback.email,
          phone: (user.phone ?? fallback.phone).replace(/\D/g, ''),
        });
      } catch (e) {
        // si falla, mantiene fallback ya mostrado
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    load();
    refreshDevices().catch(() => {});
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      setErrors({ phone: error instanceof Error ? error.message : t('account.errors.updateFailed') });
    } finally {
      setIsSubmitting(false);
    }
  }

  function updateDeviceCode(value: string) {
    // El formato real lo define el backend (ClaimDeviceRequest.claimCode) - solo trim + tope
    setDeviceCode(value.slice(0, 64));
    setDeviceError(undefined);
  }

  async function linkDevice() {
    const claimCode = deviceCode.trim();
    if (!claimCode) {
      setDeviceError(t('account.errors.invalidDeviceCode'));
      return;
    }
    try {
      setIsLinking(true);
      setDeviceLinked(false);
      const linked = await profileService.linkDevice(claimCode);
      setDevices(profileService.getDevices());
      setDevice(linked);
      setDeviceCode('');
      setDeviceError(undefined);
      setDevicesError(undefined);
      setDeviceLinked(true);
    } catch (error) {
      setDeviceError(error instanceof Error ? error.message : t('account.errors.deviceLinkFailed'));
    } finally {
      setIsLinking(false);
    }
  }

  async function unlinkDevice() {
    try {
      setIsUnlinking(true);
      setDeviceError(undefined);
      await profileService.unlinkDevice();
      setDevices(profileService.getDevices());
      setDevice(profileService.getDevice());
    } catch (error) {
      setDeviceError(error instanceof Error ? error.message : t('account.errors.deviceLinkFailed'));
    } finally {
      setIsUnlinking(false);
    }
  }

  function dismissDeviceLinked() {
    setDeviceLinked(false);
  }

  return {
    form,
    errors,
    isSubmitting,
    isLoading,
    updateField,
    submit,
    device,
    devices,
    isLoadingDevices,
    devicesError,
    refreshDevices,
    deviceCode,
    deviceError,
    isLinking,
    deviceLinked,
    dismissDeviceLinked,
    isUnlinking,
    updateDeviceCode,
    linkDevice,
    unlinkDevice,
  };
}

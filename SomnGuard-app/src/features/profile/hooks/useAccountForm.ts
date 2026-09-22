import type { TFunction } from 'i18next';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { profileService } from '@/features/profile/services/profile.service';
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
  const [deviceCode, setDeviceCode] = useState('');
  const [deviceError, setDeviceError] = useState<string | undefined>(undefined);
  const [isLinking, setIsLinking] = useState(false);

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
    return () => {
      mounted = false;
    };
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

  function formatDeviceCode(value: string): string {
    const alphanum = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 13);
    if (alphanum.length <= 5) return alphanum;
    if (alphanum.length <= 9) return `${alphanum.slice(0, 5)}-${alphanum.slice(5)}`;
    return `${alphanum.slice(0, 5)}-${alphanum.slice(5, 9)}-${alphanum.slice(9)}`;
  }

  function updateDeviceCode(value: string) {
    const formatted = formatDeviceCode(value);
    setDeviceCode(formatted);
    setDeviceError(undefined);
  }

  async function linkDevice() {
    const alphanum = deviceCode.replace(/[^A-Za-z0-9]/g, '');
    if (alphanum.length !== 13 || !/^[A-Za-z0-9]{5}-[A-Za-z0-9]{4}-[A-Za-z0-9]{4}$/.test(deviceCode)) {
      setDeviceError(t('account.errors.invalidDeviceCode'));
      return;
    }
    try {
      setIsLinking(true);
      const linked = await profileService.linkDevice(deviceCode);
      setDevice(linked);
      setDeviceCode('');
      setDeviceError(undefined);
    } catch (error) {
      setDeviceError(error instanceof Error ? error.message : t('account.errors.deviceLinkFailed'));
    } finally {
      setIsLinking(false);
    }
  }

  async function unlinkDevice() {
    await profileService.unlinkDevice();
    setDevice(null);
  }

  return { form, errors, isSubmitting, isLoading, updateField, submit, device, deviceCode, deviceError, isLinking, updateDeviceCode, linkDevice, unlinkDevice };
}

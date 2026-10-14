import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { normalizeLanguage, type AppLanguage } from '@/shared/i18n';
import type { AppThemeName } from '@/shared/theme';

const PREFERENCES_KEY = 'somnguard.preferences';

export type StoredAppPreferences = {
  theme: AppThemeName;
  language: AppLanguage;
};

function normalizePreferences(value: unknown): StoredAppPreferences | null {
  if (!value || typeof value !== 'object') return null;
  const preferences = value as Record<string, unknown>;
  const theme = preferences.theme === 'light' ? 'light' : preferences.theme === 'dark' ? 'dark' : null;
  if (!theme || typeof preferences.language !== 'string') return null;

  return {
    theme,
    language: normalizeLanguage(preferences.language),
  };
}

export async function loadAppPreferences(): Promise<StoredAppPreferences | null> {
  try {
    const serialized = Platform.OS === 'web'
      ? globalThis.localStorage?.getItem(PREFERENCES_KEY) ?? null
      : await SecureStore.getItemAsync(PREFERENCES_KEY);
    if (!serialized) return null;
    return normalizePreferences(JSON.parse(serialized));
  } catch {
    // If local storage is unavailable or contains invalid data, use defaults.
    return null;
  }
}

export async function saveAppPreferences(preferences: StoredAppPreferences): Promise<void> {
  const serialized = JSON.stringify(preferences);
  if (Platform.OS === 'web') {
    if (!globalThis.localStorage) throw new Error('El almacenamiento local no está disponible.');
    globalThis.localStorage.setItem(PREFERENCES_KEY, serialized);
    return;
  }

  if (!(await SecureStore.isAvailableAsync())) {
    throw new Error('El almacenamiento seguro no está disponible en este dispositivo.');
  }
  await SecureStore.setItemAsync(PREFERENCES_KEY, serialized);
}

import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
import { resources } from '@/shared/i18n/resources';

export type AppLanguage = keyof typeof resources;

export const DEFAULT_LANGUAGE: AppLanguage = 'es';

export const appLanguages: { code: AppLanguage; labelKey: string }[] = [
  { code: 'es', labelKey: 'preferences.languages.es' },
  { code: 'en', labelKey: 'preferences.languages.en' },
  { code: 'pt', labelKey: 'preferences.languages.pt' },
  { code: 'fr', labelKey: 'preferences.languages.fr' },
];

export function normalizeLanguage(language?: string): AppLanguage {
  const baseLanguage = language?.split('-')[0] as AppLanguage | undefined;
  return appLanguages.some((item) => item.code === baseLanguage) ? baseLanguage! : DEFAULT_LANGUAGE;
}

export const i18n = createInstance();

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources,
    lng: DEFAULT_LANGUAGE,
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: appLanguages.map((item) => item.code),
    defaultNS: 'translation',
    returnNull: false,
    interpolation: {
      escapeValue: false,
    },
  });
}
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppButton } from '@/shared/components/AppButton';
import { Screen } from '@/shared/components/Screen';
import { appLanguages, i18n, normalizeLanguage, type AppLanguage } from '@/shared/i18n';
import { useAppTheme } from '@/shared/theme';
import { usePreferencesForm } from '@/features/profile/hooks/usePreferencesForm';
import type { PreferencesForm } from '@/features/profile/types/profile.types';

const themeOptions: { value: PreferencesForm['theme']; labelKey: string }[] = [
  { value: 'dark', labelKey: 'preferences.theme.dark' },
  { value: 'light', labelKey: 'preferences.theme.light' },
];

const unitOptions: { value: PreferencesForm['units']; labelKey: string }[] = [
  { value: 'metric', labelKey: 'preferences.unitOptions.metric' },
  { value: 'imperial', labelKey: 'preferences.unitOptions.imperial' },
];

export default function PreferencesScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colorScheme, setColorScheme, theme } = useAppTheme();
  const styles = createStyles(theme);
  const { form, isSubmitting, updateField, submit } = usePreferencesForm(() => {
    Alert.alert(t('preferences.savedTitle'), t('preferences.savedMessage'));
  }, normalizeLanguage(i18n.resolvedLanguage ?? i18n.language), colorScheme);

  function handleLanguageChange(language: AppLanguage) {
    updateField('language', language);
    void i18n.changeLanguage(language);
  }

  function handleThemeChange(value: PreferencesForm['theme']) {
    updateField('theme', value);
    setColorScheme(value);
  }

  return (
    <Screen contentStyle={styles.screen}>
      <View style={styles.topBar}>
        <Pressable accessibilityRole="button" style={styles.backButton} onPress={() => router.push('/profile' as any)}>
          <Ionicons name="arrow-back-outline" size={30} color={theme.colors.accent} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('preferences.title')}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>{t('preferences.appearance')}</Text>
        <View style={styles.optionCard}>
          {themeOptions.map((item) => (
            <Pressable key={item.value} style={[styles.optionItem, form.theme === item.value && styles.optionSelected]} onPress={() => handleThemeChange(item.value)}>
              <Text style={[styles.optionText, form.theme === item.value && styles.optionTextSelected]}>{t(item.labelKey)}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionTitle}>{t('preferences.language')}</Text>
        <View style={styles.optionCard}>
          {appLanguages.map((item) => (
            <Pressable key={item.code} style={[styles.optionItem, form.language === item.code && styles.optionSelected]} onPress={() => handleLanguageChange(item.code)}>
              <Text style={[styles.optionText, form.language === item.code && styles.optionTextSelected]}>{t(item.labelKey)}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionTitle}>{t('preferences.units')}</Text>
        <View style={styles.optionCard}>
          {unitOptions.map((item) => (
            <Pressable key={item.value} style={[styles.optionItem, form.units === item.value && styles.optionSelected]} onPress={() => updateField('units', item.value)}>
              <Text style={[styles.optionText, form.units === item.value && styles.optionTextSelected]}>{t(item.labelKey)}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionTitle}>{t('preferences.other')}</Text>
        <Pressable style={styles.preferenceCard} onPress={() => updateField('soundsEnabled', !form.soundsEnabled)}>
          <Text style={styles.preferenceLabel}>{t('preferences.sounds')}</Text>
          <Text style={styles.preferenceValue}>{form.soundsEnabled ? t('common.enabled') : t('common.disabled')}</Text>
        </Pressable>

        <View style={styles.buttonWrap}>
          <AppButton title={isSubmitting ? t('common.saving') : t('common.saveChanges')} onPress={submit} />
        </View>
      </View>
    </Screen>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  return StyleSheet.create({
  screen: { paddingHorizontal: 0, paddingBottom: 0, paddingTop: '15%' },
  topBar: { height: 67, backgroundColor: theme.colors.header, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14 },
  backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: 24 },
  headerTitle: { color: theme.colors.accent, fontSize: 25, fontWeight: '900', textDecorationLine: 'underline' },
  content: { width: '100%', maxWidth: 420, alignSelf: 'center', paddingTop: 24, paddingHorizontal: 24, paddingBottom: 92 },
  sectionTitle: { color: theme.colors.accent, fontSize: 20, fontWeight: '900', marginBottom: 12 },
  optionCard: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.card, padding: 14, marginBottom: 24 },
  optionItem: { paddingVertical: 16, paddingHorizontal: 18, borderRadius: theme.radius.input, backgroundColor: theme.colors.background, marginBottom: 10 },
  optionSelected: { backgroundColor: theme.colors.accent, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
  optionText: { color: theme.colors.text, fontSize: theme.fontSize.sm, fontWeight: '700' },
  optionTextSelected: { color: theme.colors.background },
  preferenceCard: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.card, padding: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.14, shadowRadius: 8, elevation: 4 },
  preferenceLabel: { color: theme.colors.accent, fontSize: theme.fontSize.sm, fontWeight: '800' },
  preferenceValue: { color: theme.colors.textMuted, fontSize: theme.fontSize.sm },
  buttonWrap: { marginTop: theme.spacing.lg, width: '100%' },
  });
}

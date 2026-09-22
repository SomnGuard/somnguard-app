import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppAlertModal } from '@/shared/components/AppAlertModal';
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

export default function PreferencesScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colorScheme, setColorScheme, theme } = useAppTheme();
  const [showSavedModal, setShowSavedModal] = useState(false);
  const styles = createStyles(theme);
  const { form, isSubmitting, updateField, submit } = usePreferencesForm(() => {}, normalizeLanguage(i18n.resolvedLanguage ?? i18n.language), colorScheme);

  function handleLanguageChange(language: AppLanguage) {
    updateField('language', language);
  }

  function handleThemeChange(value: PreferencesForm['theme']) {
    updateField('theme', value);
  }

  async function handleSave() {
    await submit();
    // aplicar solo al guardar y mostrar confirmación
    setColorScheme(form.theme);
    await i18n.changeLanguage(form.language);
    setShowSavedModal(true);
  }

  return (
    <Screen scrollable={false} contentStyle={styles.screen}>
      <View style={styles.topBar}>
        <Pressable accessibilityRole="button" style={styles.backButton} onPress={() => router.push('/profile' as any)}>
          <Ionicons name="arrow-back-outline" size={28} color={theme.colors.accent} />
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

        <View style={styles.buttonWrap}>
          <AppButton title={isSubmitting ? t('common.saving') : t('common.saveChanges')} onPress={handleSave} />
        </View>
      </View>
      <AppAlertModal
        visible={showSavedModal}
        title={t('preferences.savedTitle')}
        message={t('preferences.savedMessage')}
        onRequestClose={() => setShowSavedModal(false)}
        buttons={[{ text: t('common.confirm'), onPress: () => setShowSavedModal(false) }]}
      />
    </Screen>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  return StyleSheet.create({
  screen: { paddingHorizontal: 0, paddingBottom: 0, paddingTop: 0, flex: 1 },
  topBar: { height: 56, backgroundColor: theme.colors.header, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14 },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  headerTitle: { color: theme.colors.accent, fontSize: 20, fontWeight: '900', textDecorationLine: 'underline' },
  content: { flex: 1, width: '100%', maxWidth: 420, alignSelf: 'center', paddingTop: 16, paddingHorizontal: 24, paddingBottom: 16, justifyContent: 'flex-start', gap: 12 },
  sectionTitle: { color: theme.colors.accent, fontSize: 18, fontWeight: '900', marginBottom: 8 },
  optionCard: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.card, padding: 12, marginBottom: 8 },
  optionItem: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: theme.radius.input, backgroundColor: theme.colors.background, marginBottom: 8 },
  optionSelected: { backgroundColor: theme.colors.accent, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
  optionText: { color: theme.colors.text, fontSize: theme.fontSize.sm, fontWeight: '700' },
  optionTextSelected: { color: theme.colors.background },
  buttonWrap: { marginTop: 8, width: '100%' },
  });
}
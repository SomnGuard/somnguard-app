import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppButton } from '@/shared/components/AppButton';
import { AppTextInput } from '@/shared/components/AppTextInput';
import { Screen } from '@/shared/components/Screen';
import { useAppTheme } from '@/shared/theme';
import { useAccountForm } from '@/features/profile/hooks/useAccountForm';

export default function AccountScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [saved, setSaved] = useState(false);
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  const { form, errors, isSubmitting, updateField, submit } = useAccountForm(() => {
    setSaved(true);
    Alert.alert(t('account.updatedTitle'), t('account.updatedMessage'));
  });

  return (
    <Screen contentStyle={styles.screen}>
      <View style={styles.topBar}>
        <Pressable accessibilityRole="button" style={styles.backButton} onPress={() => router.push('/profile' as any)}>
          <Ionicons name="arrow-back-outline" size={30} color={theme.colors.accent} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('account.title')}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>{t('account.section')}</Text>
        <AppTextInput label={t('account.fullName')} placeholder={t('account.fullNamePlaceholder')} value={form.name} error={errors.name} onChangeText={(text) => updateField('name', text)} />
        <AppTextInput label={t('account.email')} placeholder={t('account.emailPlaceholder')} value={form.email} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} error={errors.email} onChangeText={(text) => updateField('email', text)} />
        <AppTextInput label={t('account.phone')} placeholder={t('account.phonePlaceholder')} value={form.phone} keyboardType="phone-pad" error={errors.phone} onChangeText={(text) => updateField('phone', text)} />
        
        <View style={styles.buttonWrap}>
          <AppButton title={isSubmitting ? t('common.saving') : t('common.saveChanges')} onPress={submit} />
        </View>
        {saved && <Text style={styles.helpText}>{t('account.updatedHelp')}</Text>}
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
  sectionTitle: { color: theme.colors.accent, fontSize: 20, fontWeight: '900', marginBottom: 16 },
  buttonWrap: { marginTop: theme.spacing.lg, width: '100%' },
  helpText: { marginTop: theme.spacing.md, color: theme.colors.textMuted, fontSize: theme.fontSize.sm, textAlign: 'center' },
  });
}

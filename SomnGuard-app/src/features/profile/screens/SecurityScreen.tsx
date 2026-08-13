import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppButton } from '@/shared/components/AppButton';
import { AppTextInput } from '@/shared/components/AppTextInput';
import { Screen } from '@/shared/components/Screen';
import { useAppTheme } from '@/shared/theme';
import { useSecurityForm } from '@/features/profile/hooks/useSecurityForm';

export default function SecurityScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [saved, setSaved] = useState(false);
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  const { form, errors, isSubmitting, updateField, submit } = useSecurityForm(() => {
    setSaved(true);
    Alert.alert(t('security.updatedTitle'), t('security.updatedMessage'));
  });

  return (
    <Screen contentStyle={styles.screen}>
      <View style={styles.topBar}>
        <Pressable accessibilityRole="button" style={styles.backButton} onPress={() => router.push('/profile' as any)}>
          <Ionicons name="arrow-back-outline" size={30} color={theme.colors.accent} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('security.title')}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>{t('security.section')}</Text>
        <AppTextInput label={t('security.currentPassword')} placeholder="******" secureTextEntry value={form.currentPassword} error={errors.currentPassword} onChangeText={(text) => updateField('currentPassword', text)} />
        <AppTextInput label={t('security.newPassword')} placeholder="******" secureTextEntry value={form.newPassword} error={errors.newPassword} onChangeText={(text) => updateField('newPassword', text)} />
        <AppTextInput label={t('security.confirmPassword')} placeholder="******" secureTextEntry value={form.confirmPassword} error={errors.confirmPassword} onChangeText={(text) => updateField('confirmPassword', text)} />

        <View style={styles.switchRow}>
          <View style={styles.switchLabelBlock}>
            <Text style={styles.switchTitle}>{t('security.twoFactor')}</Text>
            <Text style={styles.switchDescription}>{t('security.twoFactorDescription')}</Text>
          </View>
          <Switch value={form.twoFactorEnabled} onValueChange={(value) => updateField('twoFactorEnabled', value)} thumbColor={form.twoFactorEnabled ? theme.colors.accent : theme.colors.text} trackColor={{ false: '#5a8095', true: theme.colors.accentLight }} />
        </View>

        <View style={styles.sessionCard}>
          <View style={styles.sessionHeader}>
            <Text style={styles.sessionTitle}>{t('security.activeSessions')}</Text>
            <View style={styles.sessionBadge}><Text style={styles.sessionBadgeText}>2</Text></View>
          </View>
          <Text style={styles.sessionText}>{t('security.sessionPhone')}</Text>
          <Text style={styles.sessionText}>{t('security.sessionBrowser')}</Text>
        </View>

        <View style={styles.buttonWrap}>
          <AppButton title={isSubmitting ? t('common.saving') : t('common.saveChanges')} onPress={submit} />
        </View>
        {saved && <Text style={styles.helpText}>{t('security.updatedHelp')}</Text>}
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
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.colors.surface, borderRadius: theme.radius.card, padding: 16, marginBottom: 20 },
  switchLabelBlock: { flex: 1, paddingRight: 10 },
  switchTitle: { color: theme.colors.accent, fontSize: 16, fontWeight: '800', marginBottom: 4 },
  switchDescription: { color: theme.colors.textMuted, fontSize: 13, lineHeight: 18 },
  sessionCard: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.card, padding: 18, marginTop: 16, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 10, elevation: 5 },
  sessionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sessionTitle: { color: theme.colors.accent, fontSize: 16, fontWeight: '900' },
  sessionBadge: { backgroundColor: theme.colors.accent, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  sessionBadgeText: { color: theme.colors.background, fontWeight: '900' },
  sessionText: { color: theme.colors.text, fontSize: theme.fontSize.sm, marginBottom: 6 },
  buttonWrap: { marginTop: theme.spacing.lg, width: '100%' },
  helpText: { marginTop: theme.spacing.md, color: theme.colors.textMuted, fontSize: theme.fontSize.sm, textAlign: 'center' },
  });
}

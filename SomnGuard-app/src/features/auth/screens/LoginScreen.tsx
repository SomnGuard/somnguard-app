import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import SomnGuardLogo from '@/shared/components/SomnGuardLogo';
import { AppButton } from '@/shared/components/AppButton';
import { AppTextInput } from '@/shared/components/AppTextInput';
import { Screen } from '@/shared/components/Screen';
import { useAppTheme } from '@/shared/theme';
import { useLoginForm } from '@/features/auth/hooks/useLoginForm';

export default function LoginScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { form, errors, isSubmitting, updateField, submit } = useLoginForm(() => router.replace('/(tabs)'));
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  return (
    <Screen keyboard contentStyle={styles.screen}>
      <View style={styles.content}>
        <View style={styles.logoArea}>
          <SomnGuardLogo size={96} />
        </View>
        <View style={styles.formCard}>
          <AppTextInput label={t('auth.login.emailLabel')} placeholder="" value={form.email} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} error={errors.email} onChangeText={(text) => updateField('email', text)} wrapperStyle={styles.inputSpacing} />
          <AppTextInput label={t('auth.login.passwordLabel')} placeholder="" value={form.password} secureTextEntry error={errors.password} onChangeText={(text) => updateField('password', text)} />
          {!!errors.general && <Text style={styles.formError}>{errors.general}</Text>}
          <View style={styles.buttonWrap}><AppButton title={isSubmitting ? t('common.validating') : t('auth.login.submit')} onPress={submit} /></View>
          <Pressable accessibilityRole="button" style={styles.linkRow} onPress={() => router.push('/(auth)/register')}>
            <Text style={styles.linkText}>{t('auth.login.registerPrompt')} </Text><Text style={[styles.linkText, styles.underline]}>{t('auth.login.registerLink')}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" style={styles.linkRow} onPress={() => router.push('/(auth)/forgot-password')}>
            <Text style={[styles.linkText, styles.underline]}>{t('auth.login.forgotPassword')}</Text>
          </Pressable>
          <View style={styles.divider} />
        </View>
      </View>
    </Screen>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  return StyleSheet.create({
  screen: { flexGrow: 1, paddingTop: theme.spacing.lg, paddingBottom: theme.spacing.xxl, paddingHorizontal: theme.spacing.xl },
  content: { flexGrow: 1, justifyContent: 'center', width: '100%', maxWidth: 380, alignSelf: 'center' },
  logoArea: { alignItems: 'center', marginBottom: theme.spacing.xl },
  formCard: { width: '100%', padding: 10 },
  buttonWrap: { marginTop: theme.spacing.lg, marginBottom: theme.spacing.lg, alignSelf: 'center', height: 50, width: '60%', maxWidth: 280 },
  formError: { color: theme.colors.error, textAlign: 'center', fontSize: theme.fontSize.xs, marginTop: theme.spacing.xs },
  linkRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', alignSelf: 'stretch', marginBottom: theme.spacing.lg },
  linkText: { color: theme.colors.textLink, fontSize: theme.fontSize.sm, fontWeight: '600' },
  underline: { textDecorationLine: 'underline' },
  inputSpacing: { marginBottom: 30 },
  divider: { marginTop: theme.spacing.lg, borderTopWidth: 1, borderColor: theme.colors.accent, opacity: 0.8 },
  });
}

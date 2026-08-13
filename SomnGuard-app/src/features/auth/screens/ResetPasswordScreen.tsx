import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { authService } from '@/features/auth/services/auth.service';
import SomnGuardLogo from '@/shared/components/SomnGuardLogo';
import { Screen } from '@/shared/components/Screen';
import { useAppTheme } from '@/shared/theme';

type PasswordErrors = { password?: string; confirmPassword?: string; general?: string };

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { email } = useLocalSearchParams<{ email?: string }>();
  const recoveryEmail = String(email ?? '').trim().toLowerCase();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<PasswordErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  function validate() {
    const nextErrors: PasswordErrors = {};
    if (!recoveryEmail || !authService.isRegisteredEmail(recoveryEmail)) nextErrors.general = t('auth.errors.requestCodeFirst');
    if (!password) nextErrors.password = t('auth.errors.newPasswordRequired');
    else if (password.length < 8) nextErrors.password = t('auth.errors.newPasswordMin', { count: 8 });
    if (!confirmPassword) nextErrors.confirmPassword = t('auth.errors.confirmNewPassword');
    else if (confirmPassword !== password) nextErrors.confirmPassword = t('auth.errors.passwordsMismatch');
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    try {
      setIsSubmitting(true);
      await authService.resetPassword(recoveryEmail, password);
      router.replace('/(auth)/login');
    } catch (submitError) {
      setErrors({ general: submitError instanceof Error ? submitError.message : t('auth.errors.resetFailed') });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Screen keyboard contentStyle={styles.screen}>
      <View style={styles.content}>
        <View style={styles.headerBlock}>
          <Text style={styles.title}>{t('auth.reset.title')}</Text>
          <Text style={styles.subtitle}>{t('auth.forgot.subtitle')}</Text>
        </View>

        <View style={styles.logoBlock}>
          <SomnGuardLogo size={116} hideName />
        </View>

        {!!errors.general && <Text style={styles.generalError}>{errors.general}</Text>}

        <PasswordField
          label={t('auth.reset.newPassword')}
          value={password}
          error={errors.password}
          onChangeText={(value) => { setPassword(value); if (errors.password || errors.general) setErrors((current) => ({ ...current, password: undefined, general: undefined })); }}
        />
        <PasswordField
          label={t('auth.reset.confirmPassword')}
          value={confirmPassword}
          error={errors.confirmPassword}
          onChangeText={(value) => { setConfirmPassword(value); if (errors.confirmPassword || errors.general) setErrors((current) => ({ ...current, confirmPassword: undefined, general: undefined })); }}
        />

        <Pressable accessibilityRole="button" disabled={isSubmitting} style={({ pressed }) => [styles.button, pressed && styles.buttonPressed, isSubmitting && styles.buttonDisabled]} onPress={handleSubmit}>
          <Text style={styles.buttonText}>{isSubmitting ? t('common.saving') : t('common.change')}</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

function PasswordField({ label, value, error, onChangeText }: { label: string; value: string; error?: string; onChangeText: (value: string) => void }) {
  const { t } = useTranslation();
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputRow, !!error && styles.inputRowError]}>
        <Ionicons name="lock-closed" size={20} color={theme.colors.accent} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          secureTextEntry
          placeholder={t('auth.reset.passwordPlaceholder')}
          placeholderTextColor={theme.colors.accent}
          style={styles.input}
        />
      </View>
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  return StyleSheet.create({
  screen: { justifyContent: 'center', alignItems: 'center', paddingTop: 28, paddingHorizontal: 28 },
  content: { width: '100%', maxWidth: 380 },
  headerBlock: { alignItems: 'center' },
  title: { color: theme.colors.accent, fontSize: 23, fontWeight: '900', textAlign: 'center' },
  subtitle: { color: theme.colors.accent, fontSize: 12, fontWeight: '800', marginTop: 8, textAlign: 'center' },
  logoBlock: { alignItems: 'center', marginTop: 40, marginBottom: 20 },
  generalError: { color: theme.colors.error, fontSize: 12, fontWeight: '800', textAlign: 'center', marginBottom: 14 },
  fieldBlock: { marginBottom: 28 },
  label: { color: theme.colors.accent, fontSize: 14, fontWeight: '900', marginBottom: 6 },
  inputRow: { minHeight: 43, borderRadius: 4, backgroundColor: theme.colors.header, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, gap: 8 },
  inputRowError: { borderWidth: 1, borderColor: theme.colors.error },
  input: { flex: 1, color: theme.colors.accent, fontSize: 15, fontWeight: '800', paddingVertical: 7 },
  error: { color: theme.colors.error, fontSize: 11, fontWeight: '800', marginTop: 5 },
  button: { alignSelf: 'center', width: '100%', minHeight: 53, borderRadius: 26, backgroundColor: theme.colors.header, alignItems: 'center', justifyContent: 'center', marginTop: 18, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 10, elevation: 4 },
  buttonPressed: { opacity: 0.82, transform: [{ scale: 0.98 }] },
  buttonDisabled: { opacity: 0.62 },
  buttonText: { color: theme.colors.accent, fontSize: 20, fontWeight: '900' },
  });
}

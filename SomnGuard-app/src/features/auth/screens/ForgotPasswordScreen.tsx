import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { authService } from '@/features/auth/services/auth.service';
import SomnGuardLogo from '@/shared/components/SomnGuardLogo';
import { Screen } from '@/shared/components/Screen';
import { STATIC_COPY } from '@/shared/i18n/constants';
import { useAppTheme } from '@/shared/theme';
import { isRequired, isValidEmail } from '@/shared/utils/validation';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  async function handleSubmit() {
    const normalizedEmail = email.trim().toLowerCase();
    if (!isRequired(normalizedEmail)) {
      setError(t('auth.errors.emailInputRequired'));
      return;
    }
    if (!isValidEmail(normalizedEmail)) {
      setError(t('auth.errors.invalidEmail'));
      return;
    }

    try {
      setIsSubmitting(true);
      await authService.requestPasswordReset(normalizedEmail);
      setError('');
      router.push({ pathname: '/(auth)/verify-reset-code', params: { email: normalizedEmail } });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : t('auth.errors.emailValidationFailed'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Screen keyboard contentStyle={styles.screen}>
      
      <View style={styles.icon}>
        <Pressable onPress={() => router.back()} style={{ padding: 8 }}>
          <Ionicons name="arrow-back" size={28} color={theme.colors.accent}/>
        </Pressable>
      </View>

      <View style={styles.content}>
        <View style={styles.headerBlock}>
          <Text style={styles.title}>{t('auth.forgot.title')}</Text>
          <Text style={styles.subtitle}>{t('auth.forgot.subtitle')}</Text>
        </View>

        <View style={styles.logoBlock}>
          <SomnGuardLogo size={112} hideName />
        </View>

        <View style={styles.fieldBlock}>
          <Text style={styles.label}>{t('auth.forgot.emailLabel')}</Text>
          <View style={[styles.inputRow, !!error && styles.inputRowError]}>
            <Ionicons name="mail-outline" size={28} color={theme.colors.accent} />
            <TextInput
              value={email}
              onChangeText={(value) => { setEmail(value); if (error) setError(''); }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              placeholder={t('auth.forgot.emailPlaceholder')}
              placeholderTextColor={theme.colors.accent}
              style={styles.input}
            />
          </View>
          {!!error && <Text style={styles.error}>{error}</Text>}
          <Text style={styles.helper}>{t('auth.forgot.helper', { emails: STATIC_COPY.passwordResetEmails })}</Text>
        </View>

        <Pressable accessibilityRole="button" disabled={isSubmitting} style={({ pressed }) => [styles.button, pressed && styles.buttonPressed, isSubmitting && styles.buttonDisabled]} onPress={handleSubmit}>
          <Text style={styles.buttonText}>{isSubmitting ? t('common.validating') : t('common.change')}</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  return StyleSheet.create({
  screen: { justifyContent: 'center', alignItems: 'center', paddingTop: 28, paddingHorizontal: 22 },
  content: { width: '100%', maxWidth: 360 },
  headerBlock: { alignItems: 'center' },
  title: { color: theme.colors.accent, fontSize: 18, fontWeight: '900', textAlign: 'center' },
  subtitle: { color: theme.colors.accent, fontSize: 12, fontWeight: '800', marginTop: 18, textAlign: 'center' },
  logoBlock: { alignItems: 'center', marginTop: 36, marginBottom: 58 },
  fieldBlock: { width: '100%', paddingHorizontal: 12 },
  label: { color: theme.colors.accent, fontSize: 14, fontWeight: '900', marginBottom: 4 },
  inputRow: { minHeight: 43, borderRadius: 4, backgroundColor: theme.colors.header, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, gap: 10 },
  inputRowError: { borderWidth: 1, borderColor: theme.colors.error },
  input: { flex: 1, color: theme.colors.accent, fontSize: 15, fontWeight: '800', borderBottomWidth: 1, borderBottomColor: theme.colors.accent, paddingVertical: 4 },
  error: { color: theme.colors.error, fontSize: 11, fontWeight: '700', marginTop: 6 },
  helper: { color: theme.colors.textMuted, fontSize: 10, fontWeight: '700', marginTop: 8 },
  button: { alignSelf: 'center', width: 155, minHeight: 45, borderRadius: 12, backgroundColor: theme.colors.accent, alignItems: 'center', justifyContent: 'center', marginTop: 54 },
  buttonPressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  buttonDisabled: { opacity: 0.62 },
  buttonText: { color: theme.colors.background, fontSize: 18, fontWeight: '900' },
  icon: { position: 'absolute', top: '5%', left: 15, zIndex: 10 },
  });
}

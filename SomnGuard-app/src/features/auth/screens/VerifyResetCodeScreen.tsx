import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import SomnGuardLogo from '@/shared/components/SomnGuardLogo';
import { Screen } from '@/shared/components/Screen';
import { useAppTheme } from '@/shared/theme';
import { authService } from '@/features/auth/services/auth.service';

export default function VerifyResetCodeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { email } = useLocalSearchParams<{ email?: string }>();
  const recoveryEmail = String(email ?? '').trim().toLowerCase();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  function handleCodeChange(value: string) {
    // Solo números, máximo 6, sin espacios/letras/símbolos
    const digits = value.replace(/\D/g, '').slice(0, 6);
    setCode(digits);
    if (error) setError('');
  }

  async function handleSubmit() {
    const clean = code.replace(/\D/g, '').slice(0, 6);
    if (!/^\d{6}$/.test(clean)) {
      setError(t('auth.errors.invalidResetCode'));
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      await authService.verifyResetCode(clean);
      // verify-reset-code solo valida, no consume -> navegar a reset-password con code como token
      router.push({ pathname: '/(auth)/reset-password', params: { token: clean, email: recoveryEmail } });
    } catch (e) {
      const message = e instanceof Error ? e.message : t('auth.errors.resetCodeInvalid');
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Screen keyboard contentStyle={styles.screen}>
      <View style={styles.content}>
        <View style={styles.logoBlock}>
          <SomnGuardLogo size={118} hideName />
        </View>

        <View style={styles.messageBlock}>
          <Text style={styles.messageText}>{t('auth.verify.messageLine1')}</Text>
          <Text style={styles.messageText}>{t('auth.verify.messageLine2')}</Text>
          <Text style={styles.messageText}>{t('auth.verify.messageLine3')}</Text>
          {!!recoveryEmail && <Text style={styles.emailText}>{recoveryEmail}</Text>}
        </View>

        <View style={styles.inputWrapper}>
          <TextInput
            value={code}
            onChangeText={handleCodeChange}
            placeholder="000000"
            keyboardType="number-pad"
            maxLength={6}
            autoCapitalize="none"
            autoCorrect={false}
            style={[styles.input, !!error && styles.inputError]}
            textAlign="center"
            placeholderTextColor={theme.colors.placeholder}
            selectionColor={theme.colors.accent}
          />
        </View>
        {!!error && <Text style={styles.error}>{error}</Text>}

        <Pressable
          accessibilityRole="button"
          disabled={isSubmitting}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed, isSubmitting && styles.buttonDisabled]}
          onPress={handleSubmit}
        >
          <Text style={styles.buttonText}>{isSubmitting ? t('common.validating') : t('auth.verifyEmail.submit')}</Text>
        </Pressable>

        <Pressable onPress={() => router.replace('/(auth)/forgot-password' as any)} style={styles.resendWrap}>
          <Text style={styles.resendText}>{t('auth.errors.requestCodeFirst')}</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  return StyleSheet.create({
    screen: { justifyContent: 'center', alignItems: 'center', paddingTop: 8, paddingHorizontal: 12 },
    content: { width: '100%', maxWidth: 360, alignItems: 'center' },
    logoBlock: { marginBottom: 18 },
    messageBlock: { width: '100%', paddingHorizontal: 8, paddingVertical: 8, gap: 4, alignItems: 'center' },
    messageText: { color: theme.colors.text, fontSize: 14, fontWeight: '500', lineHeight: 20, textAlign: 'center' },
    emailText: { color: theme.colors.accent, fontSize: 13, fontWeight: '800', marginTop: 6, textAlign: 'center' },
    inputWrapper: { width: '100%', marginTop: 40, marginBottom: 8 },
    input: {
      width: '100%',
      minHeight: 56,
      backgroundColor: theme.colors.input,
      color: theme.colors.text,
      borderRadius: theme.radius.input,
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      fontSize: 24,
      fontFamily: 'monospace',
      letterSpacing: 8,
      fontWeight: '900',
    },
    inputError: { borderColor: theme.colors.error, backgroundColor: theme.colors.errorBg },
    error: { color: theme.colors.error, fontSize: 11, fontWeight: '800', marginTop: 10, textAlign: 'center' },
    button: { width: 184, minHeight: 55, borderRadius: 28, backgroundColor: theme.colors.header, alignItems: 'center', justifyContent: 'center', marginTop: 30, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 10, elevation: 4 },
    buttonPressed: { opacity: 0.82, transform: [{ scale: 0.98 }] },
    buttonDisabled: { opacity: 0.62 },
    buttonText: { color: theme.colors.accent, fontSize: 18, fontWeight: '900' },
    resendWrap: { marginTop: 16, padding: 8 },
    resendText: { color: theme.colors.textLink, fontSize: 12, fontWeight: '700', textDecorationLine: 'underline' },
  });
}

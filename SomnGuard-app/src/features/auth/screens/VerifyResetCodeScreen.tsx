import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
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
  const [code, setCode] = useState<string[]>(Array(6).fill(''));
  const codeInputs = useRef<Array<TextInput | null>>([]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  function handleDigitChange(value: string, index: number) {
    const digits = value.replace(/\D/g, '');
    if (!digits) {
      const nextCode = [...code];
      nextCode[index] = '';
      setCode(nextCode);
      if (error) setError('');
      return;
    }

    const nextCode = [...code];
    digits.slice(0, 6 - index).split('').forEach((digit, offset) => {
      nextCode[index + offset] = digit;
    });
    setCode(nextCode);
    if (error) setError('');
    codeInputs.current[Math.min(index + digits.length, 5)]?.focus();
  }

  async function handleSubmit() {
    const clean = code.join('').replace(/\D/g, '').slice(0, 6);
    if (!/^\d{6}$/.test(clean)) {
      setError(t('auth.errors.invalidResetCode'));
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      await authService.verifyResetCode(clean, recoveryEmail);
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
          <View style={styles.codeRow}>
            {Array.from({ length: 6 }, (_, index) => (
              <TextInput
                key={index}
                ref={(input) => { codeInputs.current[index] = input; }}
                value={code[index]}
                onChangeText={(value) => handleDigitChange(value, index)}
                onKeyPress={({ nativeEvent }) => {
                  if (nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
                    const previousCode = [...code];
                    previousCode[index - 1] = '';
                    setCode(previousCode);
                    codeInputs.current[index - 1]?.focus();
                  }
                }}
                keyboardType="number-pad"
                maxLength={6}
                autoCapitalize="none"
                autoCorrect={false}
                accessibilityLabel={`Dígito ${index + 1} del código`}
                style={[styles.codeCell, !!error && styles.inputError]}
                textAlign="center"
                selectionColor={theme.colors.accent}
                returnKeyType={index === 5 ? 'done' : 'next'}
                onSubmitEditing={() => index < 5 && codeInputs.current[index + 1]?.focus()}
              />
            ))}
          </View>
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
    content: { width: '100%', maxWidth: 360, alignItems: 'center', alignSelf: 'center' },
    logoBlock: { marginBottom: 18 },
    messageBlock: { width: '100%', paddingHorizontal: 8, paddingVertical: 8, gap: 4, alignItems: 'center' },
    messageText: { color: theme.colors.text, fontSize: 14, fontWeight: '500', textAlign: 'center' },
    emailText: { color: theme.colors.accent, fontSize: 13, fontWeight: '800', marginTop: 6, textAlign: 'center', maxWidth: '100%', flexShrink: 1 },
    inputWrapper: { width: '100%', marginTop: 24, marginBottom: 8 },
    codeRow: { flexDirection: 'row', width: '100%', gap: 8 },
    codeCell: {
      flex: 1,
      minWidth: 0,
      height: 64,
      backgroundColor: theme.colors.input,
      color: theme.colors.text,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.accent,
      paddingHorizontal: 0,
      paddingVertical: 0,
      fontSize: 24,
      fontFamily: 'monospace',
      fontWeight: '900',
      textAlign: 'center',
      textAlignVertical: 'center',
      includeFontPadding: false,
    },
    inputError: { borderColor: theme.colors.error, backgroundColor: theme.colors.errorBg },
    error: { color: theme.colors.error, fontSize: 11, fontWeight: '800', marginTop: 10, textAlign: 'center' },
    button: { width: '100%', minWidth: 160, maxWidth: 280, alignSelf: 'center', minHeight: 55, borderRadius: 28, backgroundColor: theme.colors.header, alignItems: 'center', justifyContent: 'center', marginTop: 30, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 10, elevation: 4 },
    buttonPressed: { opacity: 0.82, transform: [{ scale: 0.98 }] },
    buttonDisabled: { opacity: 0.62 },
    buttonText: { color: theme.colors.accent, fontSize: 18, fontWeight: '900', textAlign: 'center', flexShrink: 1 },
    resendWrap: { marginTop: 16, padding: 8 },
    resendText: { color: theme.colors.textLink, fontSize: 12, fontWeight: '700', textDecorationLine: 'underline', textAlign: 'center', flexShrink: 1 },
  });
}

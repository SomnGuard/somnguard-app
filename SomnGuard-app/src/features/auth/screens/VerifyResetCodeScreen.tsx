import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import SomnGuardLogo from '@/shared/components/SomnGuardLogo';
import { Screen } from '@/shared/components/Screen';
import { useAppTheme } from '@/shared/theme';

export default function VerifyResetCodeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { email } = useLocalSearchParams<{ email?: string }>();
  const recoveryEmail = String(email ?? '').trim().toLowerCase();
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  function handleSubmit() {
    const normalizedToken = token.trim();
    if (!normalizedToken) {
      setError(t('auth.errors.tokenRequired') || 'Ingresa el token recibido por correo');
      return;
    }
    router.push({ pathname: '/(auth)/reset-password', params: { token: normalizedToken, email: recoveryEmail } });
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
        </View>

        <View style={styles.inputWrapper}>
          <TextInput
            value={token}
            onChangeText={(value) => {
              setToken(value);
              if (error) setError('');
            }}
            placeholder={t('auth.verifyEmail.tokenPlaceholder')}
            autoCapitalize="none"
            autoCorrect={false}
            style={[styles.input, !!error && styles.inputError]}
            textAlign="center"
          />
        </View>
        {!!error && <Text style={styles.error}>{error}</Text>}

        <Pressable accessibilityRole="button" style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]} onPress={handleSubmit}>
          <Text style={styles.buttonText}>{t('common.change')}</Text>
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
  inputWrapper: { width: '100%', marginTop: 40, marginBottom: 16 },
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
    fontSize: theme.fontSize.sm,
    fontFamily: 'monospace',
  },
  inputError: { borderColor: theme.colors.error, backgroundColor: theme.colors.errorBg },
  error: { color: theme.colors.error, fontSize: 11, fontWeight: '800', marginTop: 10, textAlign: 'center' },
  button: { width: 184, minHeight: 55, borderRadius: 28, backgroundColor: theme.colors.header, alignItems: 'center', justifyContent: 'center', marginTop: 50, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 10, elevation: 4 },
  buttonPressed: { opacity: 0.82, transform: [{ scale: 0.98 }] },
  buttonText: { color: theme.colors.accent, fontSize: 20, fontWeight: '900' },
  });
}
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { authApi } from '@/shared/api/authApi';
import SomnGuardLogo from '@/shared/components/SomnGuardLogo';
import { Screen } from '@/shared/components/Screen';
import { useAppTheme } from '@/shared/theme';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  async function handleSubmit() {
    if (!token.trim()) {
      setError(t('auth.errors.tokenRequired') || 'Ingresa el código de verificación');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await authApi.verifyEmail(token.trim());
      router.replace('/(auth)/login');
    } catch (e) {
      const message = e instanceof Error ? e.message : t('auth.errors.verifyFailed') || 'Código inválido o expirado';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Screen keyboard contentStyle={styles.screen}>
      <View style={styles.content}>
        <View style={styles.logoBlock}>
          <SomnGuardLogo size={118} hideName />
        </View>

        <View style={styles.messageCard}>
          <Text style={styles.messageText}>{t('auth.verifyEmail.messageLine1')}</Text>
          <Text style={styles.messageText}>{t('auth.verifyEmail.messageLine2')}</Text>
          <Text style={styles.messageText}>{t('auth.verifyEmail.messageLine3')}</Text>
        </View>

        <View style={styles.inputWrapper}>
          <TextInput
            value={token}
            onChangeText={setToken}
            placeholder={t('auth.verifyEmail.tokenPlaceholder')}
            keyboardType="default"
            autoCapitalize="none"
            autoCorrect={false}
            style={[styles.input, !!error && styles.inputError]}
            textAlign="center"
          />
        </View>
        {!!error && <Text style={styles.error}>{error}</Text>}

        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed, isLoading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? t('common.validating') : t('auth.verifyEmail.submit')}
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          style={styles.resendLink}
          onPress={() => {
            router.back();
          }}
        >
          <Text style={styles.resendText}>{t('auth.verifyEmail.backToRegister')}</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  return StyleSheet.create({
    screen: { justifyContent: 'center', alignItems: 'center', paddingTop: 28, paddingHorizontal: 12 },
    content: { width: '100%', maxWidth: 360, alignItems: 'center' },
    logoBlock: { marginBottom: 18 },
    messageCard: {
      width: '100%',
      borderRadius: 10,
      backgroundColor: theme.colors.header,
      paddingHorizontal: 16,
      paddingVertical: 16,
      gap: 14,
      shadowColor: '#000',
      shadowOpacity: 0.28,
      shadowRadius: 10,
      elevation: 5,
    },
    messageText: { color: theme.colors.accent, fontSize: 18, fontWeight: '900', lineHeight: 24, textAlign: 'center' },
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
    error: { color: theme.colors.error, fontSize: 11, fontWeight: '800', marginTop: 8, textAlign: 'center' },
    button: {
      width: '100%',
      minHeight: 55,
      borderRadius: 28,
      backgroundColor: theme.colors.header,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 24,
      shadowColor: '#000',
      shadowOpacity: 0.25,
      shadowRadius: 10,
      elevation: 4,
    },
    buttonPressed: { opacity: 0.82, transform: [{ scale: 0.98 }] },
    buttonDisabled: { opacity: 0.6 },
    buttonText: { color: theme.colors.accent, fontSize: 20, fontWeight: '900' },
    resendLink: { marginTop: 20 },
    resendText: { color: theme.colors.textLink, fontSize: 14, fontWeight: '600', textDecorationLine: 'underline' },
  });
}
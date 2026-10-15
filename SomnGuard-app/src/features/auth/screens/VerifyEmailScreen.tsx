import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { authApi } from '@/shared/api/authApi';
import { ApiError } from '@/shared/api/client';
import { AppAlertModal } from '@/shared/components/AppAlertModal';
import SomnGuardLogo from '@/shared/components/SomnGuardLogo';
import { Screen } from '@/shared/components/Screen';
import { useAppTheme } from '@/shared/theme';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  function handleTokenChange(value: string) {
    // solo números, sin letras/espacios/signos, máx 7
    const digits = value.replace(/\D/g, '').slice(0, 7);
    setToken(digits);
    if (error) setError('');
  }

  async function handleSubmit() {
    const clean = token.trim();
    if (!clean) {
      setError(t('auth.errors.tokenRequired') || 'Ingresa el código de verificación');
      return;
    }
    if (!/^\d+$/.test(clean) || clean.length > 7) {
      setError('Token inválido');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await authApi.verifyEmail(clean);
      setShowSuccess(true);
    } catch (e) {
      // Manejo de errores: código incorrecto → "Token inválido", otros → mensaje no técnico
      if (e instanceof ApiError && (e.status === 400 || e.status === 404)) {
        setError('Token inválido');
      } else if (e instanceof Error && /Token/i.test(e.message)) {
        setError('Token inválido');
      } else {
        setError('Token inválido');
      }
    } finally {
      setIsLoading(false);
    }
  }

  function handleSuccessClose() {
    setShowSuccess(false);
    router.replace('/(auth)/login');
  }

  return (
    <Screen keyboard contentStyle={styles.screen}>
      <View style={styles.content}>
        <View style={styles.logoBlock}>
          <SomnGuardLogo size={118} hideName />
        </View>

        <View style={styles.messageBlock}>
          <Text style={styles.messageText}>{t('auth.verifyEmail.messageLine1')}</Text>
          <Text style={styles.messageText}>{t('auth.verifyEmail.messageLine2')}</Text>
          <Text style={styles.messageText}>{t('auth.verifyEmail.messageLine3')}</Text>
        </View>

        <View style={styles.inputWrapper}>
          <TextInput
            value={token}
            onChangeText={handleTokenChange}
            placeholder={t('auth.verifyEmail.tokenPlaceholder')}
            keyboardType="number-pad"
            maxLength={7}
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
      <AppAlertModal
        visible={showSuccess}
        title={t('auth.verifyEmail.successTitle') || 'Correo verificado'}
        message={t('auth.verifyEmail.successMessage') || 'Tu correo electrónico fue verificado correctamente. Tu cuenta ya quedó verificada en el sistema.'}
        onRequestClose={handleSuccessClose}
        buttons={[{ text: t('common.confirm'), onPress: handleSuccessClose }]}
      />
    </Screen>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  return StyleSheet.create({
    screen: { justifyContent: 'center', alignItems: 'center', paddingTop: 8, paddingHorizontal: 12 },
    content: { width: '100%', maxWidth: 360, alignItems: 'center', alignSelf: 'center' },
    logoBlock: { marginBottom: 18 },
    messageBlock: {
      width: '100%',
      paddingHorizontal: 8,
      paddingVertical: 8,
      gap: 4,
      alignItems: 'center',
    },
    messageText: { color: theme.colors.text, fontSize: 14, fontWeight: '500', textAlign: 'center' },
    inputWrapper: { width: '100%', marginTop: 24, marginBottom: 16 },
    input: {
      width: '100%',
      minHeight: 48,
      backgroundColor: theme.colors.input,
      color: theme.colors.accent,
      borderRadius: theme.radius.input,
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      fontSize: 15,
      fontWeight: '700',
      fontFamily: 'monospace',
      letterSpacing: 2,
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
      boxShadow: '0px 5px 10px rgba(0,0,0,0.25)',
    },
    buttonPressed: { opacity: 0.82, transform: [{ scale: 0.98 }] },
    buttonDisabled: { opacity: 0.6 },
    buttonText: { color: theme.colors.accent, fontSize: 20, fontWeight: '900', textAlign: 'center', flexShrink: 1 },
    resendLink: { marginTop: 20 },
    resendText: { color: theme.colors.textLink, fontSize: 14, fontWeight: '600', textDecorationLine: 'underline' },
  });
}
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { authService } from '@/features/auth/services/auth.service';
import SomnGuardLogo from '@/shared/components/SomnGuardLogo';
import { Screen } from '@/shared/components/Screen';
import { STATIC_COPY } from '@/shared/i18n/constants';
import { useAppTheme } from '@/shared/theme';

const CODE_LENGTH = 5;

export default function VerifyResetCodeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { email } = useLocalSearchParams<{ email?: string }>();
  const recoveryEmail = String(email ?? '').trim().toLowerCase();
  const [digits, setDigits] = useState(Array(CODE_LENGTH).fill(''));
  const [error, setError] = useState('');
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  function updateDigit(value: string, index: number) {
    const digit = value.replace(/\D/g, '').slice(-1);
    const nextDigits = [...digits];
    nextDigits[index] = digit;
    setDigits(nextDigits);
    if (error) setError('');
    if (digit && index < CODE_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  }

  function handleSubmit() {
    if (!recoveryEmail || !authService.isRegisteredEmail(recoveryEmail)) {
      setError(t('auth.errors.requestRegisteredEmail'));
      return;
    }

    const code = digits.join('');
    if (code.length !== CODE_LENGTH) {
      setError(t('auth.errors.completeCode', { count: CODE_LENGTH }));
      return;
    }
    if (code !== STATIC_COPY.recoveryCode) {
      setError(t('auth.errors.invalidCode', { code: STATIC_COPY.recoveryCode }));
      return;
    }
    router.push({ pathname: '/(auth)/reset-password', params: { email: recoveryEmail } });
  }

  return (
    <Screen keyboard contentStyle={styles.screen}>
      <View style={styles.content}>
        <View style={styles.logoBlock}>
          <SomnGuardLogo size={118} hideName />
        </View>

        <View style={styles.messageCard}>
          <Text style={styles.messageText}>{t('auth.verify.messageLine1')}</Text>
          <Text style={styles.messageText}>{t('auth.verify.messageLine2')}</Text>
          <Text style={styles.messageText}>{t('auth.verify.messageLine3')}</Text>
        </View>

        <View style={styles.codeRow}>
          {digits.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => { inputRefs.current[index] = ref; }}
              value={digit}
              onChangeText={(value) => updateDigit(value, index)}
              onKeyPress={({ nativeEvent }) => {
                if (nativeEvent.key === 'Backspace' && !digits[index] && index > 0) inputRefs.current[index - 1]?.focus();
              }}
              keyboardType="number-pad"
              maxLength={1}
              style={[styles.codeBox, !!error && styles.codeBoxError]}
              textAlign="center"
            />
          ))}
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
  screen: { justifyContent: 'center', alignItems: 'center', paddingTop: 28, paddingHorizontal: 12 },
  content: { width: '100%', maxWidth: 360, alignItems: 'center' },
  logoBlock: { marginBottom: 18 },
  messageCard: { width: '100%', borderRadius: 10, backgroundColor: theme.colors.header, paddingHorizontal: 16, paddingVertical: 16, gap: 14, shadowColor: '#000', shadowOpacity: 0.28, shadowRadius: 10, elevation: 5 },
  messageText: { color: theme.colors.accent, fontSize: 18, fontWeight: '900', lineHeight: 24 },
  codeRow: { flexDirection: 'row', justifyContent: 'center', gap: 7, marginTop: 52 },
  codeBox: { width: 37, height: 37, borderRadius: 7, backgroundColor: theme.colors.header, color: theme.colors.accent, fontSize: 18, fontWeight: '900' },
  codeBoxError: { borderWidth: 1, borderColor: theme.colors.error },
  error: { color: theme.colors.error, fontSize: 11, fontWeight: '800', marginTop: 10, textAlign: 'center' },
  button: { width: 184, minHeight: 55, borderRadius: 28, backgroundColor: theme.colors.header, alignItems: 'center', justifyContent: 'center', marginTop: 50, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 10, elevation: 4 },
  buttonPressed: { opacity: 0.82, transform: [{ scale: 0.98 }] },
  buttonText: { color: theme.colors.accent, fontSize: 20, fontWeight: '900' },
  });
}

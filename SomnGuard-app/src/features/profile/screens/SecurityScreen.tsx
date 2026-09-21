import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppAlertModal } from '@/shared/components/AppAlertModal';
import { AppButton } from '@/shared/components/AppButton';
import { AppTextInput } from '@/shared/components/AppTextInput';
import { Screen } from '@/shared/components/Screen';
import { useAppTheme } from '@/shared/theme';
import { authApi } from '@/shared/api/authApi';
import { ApiError } from '@/shared/api/client';
import { isAllowedEmailDomain } from '@/shared/utils/validation';
import { profileService } from '@/features/profile/services/profile.service';

export default function SecurityScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [currentEmail, setCurrentEmail] = useState(() => profileService.getEmail());
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailError, setEmailError] = useState<string | undefined>(undefined);
  const [passwordError, setPasswordError] = useState<string | undefined>(undefined);
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [showEmailConfirm, setShowEmailConfirm] = useState(false);
  const [showEmailSuccess, setShowEmailSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  // Cargar email actual desde API
  useEffect(() => {
    profileService.fetchProfile().then((u) => setCurrentEmail(u.email)).catch(() => {});
  }, []);

  async function handleChangeEmail() {
    // Validar nuevo correo
    if (!newEmail.trim()) {
      setEmailError(t('auth.errors.emailRequired') || t('security.errors.emailChangeRequired'));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.trim())) {
      setEmailError(t('auth.errors.invalidEmail'));
      return;
    }
    if (!isAllowedEmailDomain(newEmail)) {
      setEmailError(t('auth.errors.invalidEmailDomain'));
      return;
    }
    // Validar contraseñas
    if (!currentPassword.trim()) {
      setPasswordError(t('security.errors.currentPasswordRequired') || 'Ingresa tu contraseña actual');
      return;
    }
    if (!confirmPassword.trim()) {
      setPasswordError(t('security.errors.confirmNewPassword') || 'Confirma tu contraseña');
      return;
    }
    if (currentPassword !== confirmPassword) {
      setPasswordError(t('auth.errors.passwordsMismatch') || 'Las contraseñas no coinciden');
      return;
    }
    // Validar que la contraseña sea correcta en backend ANTES de abrir el modal
    // POST /api/v1/auth/verify-password con la seguridad actual de la API
    setEmailError(undefined);
    setPasswordError(undefined);
    try {
      setIsChangingEmail(true);
      await authApi.verifyPassword(currentPassword);
    } catch (e) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 400)) {
        setPasswordError(t('security.errors.invalidCurrentPassword'));
      } else if (e instanceof Error && /invalid|no válida|incorrecta/i.test(e.message)) {
        setPasswordError(t('security.errors.invalidCurrentPassword'));
      } else {
        setPasswordError(t('security.errors.invalidCurrentPassword'));
      }
      return;
    } finally {
      setIsChangingEmail(false);
    }
    // Contraseña correcta y coincidente -> mostrar modal de confirmación
    setShowEmailConfirm(true);
  }

  async function confirmChangeEmail() {
    setShowEmailConfirm(false);
    try {
      setIsChangingEmail(true);
      setEmailError(undefined);
      // La contraseña ya fue validada antes de abrir el modal; solo se envía el cambio
      await profileService.changeEmail(newEmail.trim());
      setShowEmailSuccess(true);
    } catch (error) {
      setEmailError(error instanceof Error ? error.message : t('security.errors.updateFailed'));
    } finally {
      setIsChangingEmail(false);
    }
  }

  function handleDeleteAccount() {
    setShowDeleteConfirm(true);
  }

  async function confirmDeleteAccount() {
    try {
      setIsDeleting(true);
      await profileService.deleteAccount();
      setShowDeleteConfirm(false);
      // limpiar sesión y navegar a login
      const { clearTokens } = await import('@/shared/api/client');
      clearTokens();
      router.replace('/(auth)/login' as any);
    } catch (e) {
      setShowDeleteConfirm(false);
      setEmailError(e instanceof Error ? e.message : t('security.errors.updateFailed'));
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Screen contentStyle={styles.screen}>
      <View style={styles.topBar}>
        <Pressable accessibilityRole="button" style={styles.backButton} onPress={() => router.push('/profile' as any)}>
          <Ionicons name="arrow-back-outline" size={30} color={theme.colors.accent} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('security.title')}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('security.changeEmailSection')}</Text>
          <Text style={styles.cardDescription}>{t('security.changeEmailDescription')}</Text>
          <AppTextInput label={t('security.currentEmail')} value={currentEmail} editable={false} />
          <AppTextInput label={t('security.newEmail')} placeholder={t('account.emailPlaceholder')} value={newEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} error={emailError} onChangeText={(text) => { setNewEmail(text); setEmailError(undefined); }} />
          <AppTextInput label={t('security.currentPassword')} placeholder="******" secureTextEntry value={currentPassword} error={passwordError} onChangeText={(text) => { setCurrentPassword(text); setPasswordError(undefined); }} />
          <AppTextInput label={t('security.confirmPassword')} placeholder="******" secureTextEntry value={confirmPassword} error={passwordError} onChangeText={(text) => { setConfirmPassword(text); setPasswordError(undefined); }} />
          <Text style={styles.warningText}>{t('security.changeEmailWarning')}</Text>
          <AppButton title={isChangingEmail ? t('common.saving') : t('security.changeEmailButton')} onPress={handleChangeEmail} />
        </View>

        <View style={styles.cardDanger}>
          <Text style={styles.cardTitleDanger}>{t('privacy.deleteTitle')}</Text>
          <Text style={styles.cardDescription}>{t('security.deleteAccountDescription')}</Text>
          <AppButton title={t('privacy.deleteTitle')} variant="danger" onPress={handleDeleteAccount} />
        </View>
      </View>
      <AppAlertModal
        visible={showEmailConfirm}
        title={t('security.changeEmailConfirmTitle')}
        message={t('security.changeEmailConfirmMessage', { email: newEmail.trim().toLowerCase() })}
        onRequestClose={() => setShowEmailConfirm(false)}
        buttons={[
          { text: t('security.changeEmailButton'), style: 'cancel', onPress: () => setShowEmailConfirm(false) },
          { text: t('common.confirm'), style: 'default', onPress: confirmChangeEmail },
        ]}
      />
      <AppAlertModal
        visible={showEmailSuccess}
        title={t('security.changeEmailSuccessTitle')}
        message={t('security.changeEmailSuccessMessage')}
        onRequestClose={() => setShowEmailSuccess(false)}
        buttons={[
          {
            text: t('common.confirm'),
            onPress: () => {
              setShowEmailSuccess(false);
              router.push({ pathname: '/(tabs)/profile/verificar-correo' as any, params: { email: newEmail.trim().toLowerCase() } });
            },
          },
        ]}
      />
      <AppAlertModal
        visible={showDeleteConfirm}
        title={t('privacy.deleteTitle')}
        message={t('security.deleteAccountConfirm')}
        onRequestClose={() => setShowDeleteConfirm(false)}
        buttons={[
          { text: t('common.cancel'), style: 'cancel', onPress: () => setShowDeleteConfirm(false) },
          { text: t('common.delete'), style: 'destructive', onPress: confirmDeleteAccount },
        ]}
      />
    </Screen>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  return StyleSheet.create({
  screen: { paddingHorizontal: 0, paddingBottom: 0, paddingTop: 0 },
  topBar: { height: 56, backgroundColor: theme.colors.header, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14 },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  headerTitle: { color: theme.colors.accent, fontSize: 20, fontWeight: '900', textDecorationLine: 'underline' },
  content: { width: '100%', maxWidth: 420, alignSelf: 'center', paddingTop: 16, paddingHorizontal: 24, paddingBottom: 24, gap: 16 },
  sectionTitle: { color: theme.colors.accent, fontSize: 20, fontWeight: '900', marginBottom: 16 },
  card: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.card, padding: 18, gap: 12, shadowColor: '#000', shadowOpacity: 0.14, shadowRadius: 8, elevation: 4 },
  cardDescription: { color: theme.colors.textMuted, fontSize: theme.fontSize.sm, lineHeight: 18 },
  warningText: { color: '#ff9900', fontSize: theme.fontSize.sm, fontWeight: '700', lineHeight: 18 },
  cardDanger: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.card, padding: 20, gap: 12, borderWidth: 1, borderColor: 'rgba(255, 85, 85, 0.4)', marginTop: 12 },
  cardTitleDanger: { color: '#ff5555', fontSize: theme.fontSize.md, fontWeight: '900' },
  });
}
import { useRouter } from 'expo-router';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppButton } from '@/shared/components/AppButton';
import { AppTextInput } from '@/shared/components/AppTextInput';
import { Screen } from '@/shared/components/Screen';
import { useAppTheme } from '@/shared/theme';
import { getPasswordStrengthLabel, useRegisterForm } from '@/features/auth/hooks/useRegisterForm';
import { Checkbox } from 'expo-checkbox';

export default function RegisterScreen() {

  const router = useRouter();
  const { t } = useTranslation();
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsError, setTermsError] = useState('');
  const [termsModalVisible, setTermsModalVisible] = useState(false);
  const [termsAcceptedInModal, setTermsAcceptedInModal] = useState(false);

  const { form, errors, isSubmitting, updateField, submit, passwordStrength } = useRegisterForm(() => {
    router.push('/(auth)/verify-email' as any);
  });

  const handleSubmit = () => {
    if (!acceptedTerms) {
      setTermsError(t('auth.errors.termsRequired') !== 'auth.errors.termsRequired' ? t('auth.errors.termsRequired') : 'Debes aceptar los términos y condiciones');
      return;
    }
    setTermsError('');
    submit();
  };

  return (
    <Screen keyboard contentStyle={styles.scroll}>
      <View style={styles.icon}>
        <Pressable onPress={() => router.back()} style={{ padding: 8 }}>
          <Ionicons name="arrow-back" size={28} color={theme.colors.accent} />
        </Pressable>
      </View>
      <Text style={styles.title}>{t('auth.register.title')}</Text>
      <Text style={styles.subtitle}>{t('auth.register.subtitle')}</Text>
      <View style={styles.row}>
        <AppTextInput wrapperStyle={styles.half} placeholder={t('auth.register.firstName')} value={form.firstName} autoCapitalize="words" error={errors.firstName} onChangeText={(text) => updateField('firstName', text)} />
        <AppTextInput wrapperStyle={styles.half} placeholder={t('auth.register.lastName')} value={form.lastName} autoCapitalize="words" error={errors.lastName} onChangeText={(text) => updateField('lastName', text)} />
      </View>
      <AppTextInput placeholder={t('auth.register.email')} value={form.email} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} error={errors.email} onChangeText={(text) => updateField('email', text)} />
      <AppTextInput placeholder={t('auth.register.password')} value={form.password} secureTextEntry error={errors.password} onChangeText={(text) => updateField('password', text)} />
      {!!form.password && (
        <PasswordStrengthBar level={passwordStrength.level} label={getPasswordStrengthLabel(passwordStrength.level, t)} />
      )}
      <AppTextInput placeholder={t('auth.register.confirmPassword')} value={form.confirmPassword} secureTextEntry error={errors.confirmPassword} onChangeText={(text) => updateField('confirmPassword', text)} />
      {!!errors.general && <Text style={styles.formError}>{errors.general}</Text>}
      <Text style={styles.phoneLabel}>{t('auth.register.phone')}</Text>
      <View style={[styles.phoneRow, !!errors.phone && styles.phoneRowError]}>
        <Text style={styles.phonePrefix}>+57</Text>
        <TextInput style={styles.phoneInput} value={form.phone} keyboardType="phone-pad" maxLength={10} placeholder="" placeholderTextColor={theme.colors.placeholder} onChangeText={(text) => updateField('phone', text)} />
      </View>
      {!!errors.phone && <Text style={styles.error}>{errors.phone}</Text>}


      <View style={[styles.termsContainer, !!termsError && styles.termsContainerError]}>
        <Checkbox
          value={acceptedTerms}
          onValueChange={(v) => {
            setAcceptedTerms(v);
            if (v && termsError) setTermsError('');
          }}
          color={termsError ? theme.colors.error : undefined}
        />
        <Pressable onPress={() => setTermsModalVisible(true)}>
          <Text style={styles.termsText}>{t('auth.register.acceptTerms')}<Text style={styles.termsLink}> {t('auth.register.termsAndConditions')}</Text></Text>
        </Pressable>
      </View>
      {!!termsError && <Text style={styles.termsError}>{termsError}</Text>}

      <View style={styles.buttonWrap}><AppButton title={isSubmitting ? t('common.submitting') : t('common.submit')} onPress={handleSubmit} /></View>

      <Modal visible={termsModalVisible} transparent animationType="fade" onRequestClose={() => setTermsModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Pressable onPress={() => setTermsModalVisible(false)} style={styles.modalClose}>
              <Text style={styles.modalCloseText}>×</Text>
            </Pressable>
            <Text style={styles.modalTitle}>Términos y Condiciones de uso — SomnGuard</Text>
            <Text style={styles.modalSubtitle}>Revisa los términos antes de continuar</Text>
            <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalSectionTitle}>1. Objeto</Text>
              <Text style={styles.modalText}>SomnGuard es una plataforma de apoyo a la conducción segura (dispositivo de monitoreo, aplicación móvil y portal web). Monitorea signos de somnolencia y distracción y genera alertas, historial de eventos y evidencia multimedia.</Text>
              <Text style={styles.modalText}><Text style={styles.modalBold}>SomnGuard es una herramienta de apoyo: no sustituye la atención del conductor ni garantiza evitar accidentes.</Text> El conductor mantiene en todo momento la responsabilidad de conducir de forma segura.</Text>

              <Text style={styles.modalSectionTitle}>2. Cuenta de usuario</Text>
              <Text style={styles.modalText}>Debe registrarse con nombre, apellido, correo, teléfono y contraseña. El correo se verifica con un código de 6 dígitos vigente por 15 minutos. Sus credenciales son personales e intransferibles. Puede actualizar sus datos en Mi cuenta y cambiar su correo con verificación de su contraseña actual en Seguridad.</Text>

              <Text style={styles.modalSectionTitle}>3. Dispositivo</Text>
              <Text style={styles.modalText}>El dispositivo se vincula con el código entregado por el administrador. Mientras tenga un dispositivo vinculado, el formulario de vinculación no se muestra; para vincular otro equipo primero debe desvincular el actual. No manipule el equipo y manténgalo energizado y conectado.</Text>

              <Text style={styles.modalSectionTitle}>4. Monitoreo, video y detección</Text>
              <Text style={styles.modalText}>El portal y la app ofrecen vista en vivo y controles para encender/apagar la cámara y pausar/reanudar la detección. <Text style={styles.modalBold}>La detección pausada no se reanuda sola.</Text> Los eventos se clasifican por severidad (Informativa, Advertencia, Alta y Crítica).</Text>

              <Text style={styles.modalSectionTitle}>5. Evidencia multimedia</Text>
              <Text style={styles.modalText}>Algunos eventos incluyen imagen, visible únicamente para el titular de la cuenta y los administradores, siempre con autenticación; no se expone públicamente.</Text>

              <Text style={styles.modalSectionTitle}>6. Uso aceptable</Text>
              <Text style={styles.modalText}>Se prohíbe compartir credenciales o códigos con terceros no autorizados, interferir con el servicio o dispositivos ajenos, usarlo con fines ilícitos o intentar vulnerar su seguridad.</Text>

              <Text style={styles.modalSectionTitle}>7. Disponibilidad</Text>
              <Text style={styles.modalText}>Servicio bajo mejor esfuerzo: depende de que el dispositivo esté encendido, conectado y reportando. Cortes de energía, conectividad o mantenimientos pueden interrumpirlo.</Text>

              <Text style={styles.modalSectionTitle}>8. Limitación de responsabilidad</Text>
              <Text style={styles.modalText}>En la máxima medida permitida por la ley, SomnGuard no responde por accidentes o daños derivados de la conducción, incluso si el sistema no detectó un evento o no emitió una alerta.</Text>

              <Text style={styles.modalSectionTitle}>9. Terminación y eliminación</Text>
              <Text style={styles.modalText}>Puede desvincular su dispositivo en Mi cuenta y eliminar su cuenta en Seguridad: se desactiva por 30 días y se revocan sus sesiones.</Text>

              <Text style={styles.modalSectionTitle}>10. Modificaciones y ley aplicable</Text>
              <Text style={styles.modalText}>Podremos actualizar estos términos e informaremos los cambios relevantes en el portal. Se rigen por las leyes de la República de Colombia. Contacto y datos del responsable: ver la Política de Privacidad.</Text>
            </ScrollView>
            <View style={styles.modalFooter}>
              <Pressable style={styles.modalAcceptButton} onPress={() => { setAcceptedTerms(true); setTermsAcceptedInModal(true); setTermsModalVisible(false); }}>
                <Text style={styles.modalAcceptButtonText}>Acepto los términos y condiciones</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

function PasswordStrengthBar({ level, label }: { level: 'weak' | 'medium' | 'good' | 'strong'; label: string }) {
  const { theme } = useAppTheme();
  const colors: Record<string, string> = { weak: '#D32F2F', medium: '#F9A825', good: '#1976D2', strong: '#00A86B' };
  const widths: Record<string, string> = { weak: '25%', medium: '50%', good: '75%', strong: '100%' };
  return (
    <View style={{ gap: 6, marginTop: -4, marginBottom: 8 }}>
      <View style={{ height: 6, borderRadius: 6, backgroundColor: theme.colors.input, overflow: 'hidden' }}>
        <View style={{ height: 6, width: widths[level] as any, backgroundColor: colors[level], borderRadius: 6 }} />
      </View>
      <Text style={{ color: colors[level], fontSize: 11, fontWeight: '800' }}>{label}</Text>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  return StyleSheet.create({
  
  scroll: { paddingTop: theme.spacing.xl, paddingHorizontal: theme.spacing.lg, width: '100%', maxWidth: 520, alignSelf: 'center' },
  icon: { marginTop: 4, marginBottom: 8, alignSelf: 'flex-start', paddingLeft: 4 },
  title: { color: theme.colors.accent, fontSize: theme.fontSize.xxl, fontWeight: '900', textAlign: 'center', marginBottom: theme.spacing.md },
  subtitle: { color: theme.colors.accent, fontSize: theme.fontSize.sm, textAlign: 'left', marginBottom: 30 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  half: { flexGrow: 1, flexShrink: 1, flexBasis: 140, minWidth: 0 },
  phoneLabel: { color: theme.colors.accent, fontSize: theme.fontSize.xs, fontWeight: '800', letterSpacing: 1.5, marginBottom: theme.spacing.xs, marginTop: theme.spacing.xs },
  phoneRow: { flexDirection: 'row', alignItems: 'center', minHeight: 44, backgroundColor: theme.colors.input, borderRadius: theme.radius.input, borderWidth: 1, borderColor: theme.colors.border, marginBottom: 4 },
  phoneRowError: { borderColor: theme.colors.error, backgroundColor: theme.colors.errorBg },
  phonePrefix: { color: theme.colors.accent, fontSize: theme.fontSize.sm, fontWeight: '700', paddingHorizontal: theme.spacing.md, flexShrink: 0 },
  phoneInput: { flex: 1, minWidth: 0, flexShrink: 1, color: theme.colors.text, fontSize: theme.fontSize.sm, paddingVertical: theme.spacing.sm, paddingRight: theme.spacing.md },
  error: { color: theme.colors.error, fontSize: theme.fontSize.xs, marginBottom: theme.spacing.sm, marginLeft: 4 },
  buttonWrap: { marginTop: theme.spacing.xl, alignSelf: 'center', width: '100%', maxWidth: 400 },
  formError: { color: theme.colors.error, textAlign: 'center', fontSize: theme.fontSize.xs, marginTop: theme.spacing.xs, marginBottom: theme.spacing.md },
  successModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  successModalContent: { backgroundColor: theme.colors.header, borderRadius: 17, padding: 24, width: '80%', maxWidth: 320, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 10, elevation: 10 },
  successModalTitle: { color: theme.colors.accent, fontSize: 24, fontWeight: '900', marginBottom: 12 },
  successModalMessage: { color: theme.colors.accent, fontSize: 16, textAlign: 'center' },
  termsContainer: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', marginTop: theme.spacing.md, borderWidth: 1, borderColor: 'transparent', borderRadius: 8, padding: 4 },
  termsContainerError: { borderColor: theme.colors.error, backgroundColor: theme.colors.errorBg },
  termsText: { marginLeft: theme.spacing.sm, color: theme.colors.text, flex: 1, minWidth: 0, flexShrink: 1 },
  termsLink: { color: theme.colors.textLink, textDecorationLine: 'underline', fontWeight: '700', },
  termsError: { color: theme.colors.error, fontSize: theme.fontSize.xs, marginTop: 6, marginLeft: 4 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(9, 17, 31, 0.9)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  modalContent: { backgroundColor: '#2a5f8f', borderWidth: 4, borderColor: theme.colors.header, borderRadius: theme.radius.card, padding: 0, width: '100%', maxWidth: 520, height: '80%', position: 'relative' },
  modalClose: { position: 'absolute', top: 8, right: 8, zIndex: 10, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  modalCloseText: { color: '#ffffff', fontSize: 28, lineHeight: 28 },
  modalTitle: { color: theme.colors.accent, fontSize: theme.fontSize.lg, fontWeight: '700', marginTop: 40, marginBottom: 8, paddingHorizontal: 12, textAlign: 'center' },
  modalSubtitle: { color: theme.colors.textMuted, fontSize: theme.fontSize.sm, textAlign: 'center', marginBottom: 8, paddingHorizontal: 12 },
  modalScroll: { flex: 1, width: '100%' },
  modalScrollContent: { paddingHorizontal: 12, paddingBottom: 8 },
  modalSectionTitle: { color: theme.colors.accent, fontSize: theme.fontSize.sm, fontWeight: '700', marginTop: 10, marginBottom: 4 },
  modalText: { color: theme.colors.text, fontSize: theme.fontSize.xs, lineHeight: 16, marginBottom: 2 },
  modalBold: { fontWeight: '700' },
  modalFooter: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 },
  modalAcceptButton: { backgroundColor: theme.colors.accent, borderRadius: theme.radius.button, paddingVertical: 10, alignItems: 'center', width: '100%' },
  modalAcceptButtonText: { color: '#ffffff', fontSize: theme.fontSize.sm, fontWeight: '700' },
  });
}

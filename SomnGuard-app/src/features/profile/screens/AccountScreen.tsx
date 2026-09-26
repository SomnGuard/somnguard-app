import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppAlertModal } from '@/shared/components/AppAlertModal';
import { AppButton } from '@/shared/components/AppButton';
import { AppTextInput } from '@/shared/components/AppTextInput';
import { Screen } from '@/shared/components/Screen';
import { useAppTheme } from '@/shared/theme';
import { useAccountForm } from '@/features/profile/hooks/useAccountForm';

export default function AccountScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [saved, setSaved] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showUpdatedModal, setShowUpdatedModal] = useState(false);
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  const {
    form,
    errors,
    isSubmitting,
    isLoading,
    updateField,
    submit,
    device,
    devices,
    isLoadingDevices,
    devicesError,
    refreshDevices,
    deviceCode,
    deviceError,
    isLinking,
    deviceLinked,
    dismissDeviceLinked,
    isUnlinking,
    updateDeviceCode,
    linkDevice,
    unlinkDevice,
  } = useAccountForm(() => {
    setSaved(true);
    setShowUpdatedModal(true);
  });

  function handleSavePress() {
    // Validación rápida antes de mostrar confirmación
    if (!form.firstName.trim() || !form.lastName.trim() || !form.phone.trim()) {
      submit();
      return;
    }
    setShowConfirmModal(true);
  }

  function handleConfirmUpdate() {
    setShowConfirmModal(false);
    submit();
  }

  return (
    <Screen keyboard contentStyle={styles.screen}>
      <View style={styles.topBar}>
        <Pressable accessibilityRole="button" style={styles.backButton} onPress={() => router.push('/profile' as any)}>
          <Ionicons name="arrow-back-outline" size={30} color={theme.colors.accent} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('account.title')}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>{t('account.section')}</Text>
        {isLoading && (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={theme.colors.accent} size="small" />
            <Text style={styles.loadingText}>{t('common.validating')}</Text>
          </View>
        )}
        <AppTextInput label={t('account.firstName')} placeholder={t('account.firstNamePlaceholder')} value={form.firstName} error={errors.firstName} onChangeText={(text) => updateField('firstName', text)} />
        <AppTextInput label={t('account.lastName')} placeholder={t('account.lastNamePlaceholder')} value={form.lastName} error={errors.lastName} onChangeText={(text) => updateField('lastName', text)} />
        <AppTextInput label={t('account.phone')} placeholder={t('account.phonePlaceholder')} value={form.phone} keyboardType="phone-pad" error={errors.phone} onChangeText={(text) => updateField('phone', text)} />
        <View style={styles.buttonWrap}>
          <AppButton title={isSubmitting ? t('common.saving') : t('common.saveChanges')} onPress={handleSavePress} />
        </View>
        {saved && <Text style={styles.helpText}>{t('account.updatedHelp')}</Text>}

        <View style={styles.deviceCard}>
          <Text style={styles.deviceTitle}>{t('account.deviceSection')}</Text>
          {isLoadingDevices ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={theme.colors.accent} size="small" />
              <Text style={styles.loadingText}>{t('common.validating')}</Text>
            </View>
          ) : devicesError && !device ? (
            <View style={styles.deviceInfo}>
              <Text style={styles.deviceErrorText}>{devicesError}</Text>
              <View style={styles.buttonWrap}>
                <AppButton title={t('common.retry')} variant="outline" onPress={refreshDevices} />
              </View>
            </View>
          ) : device ? (
            <View style={styles.deviceInfo}>
              <View style={styles.deviceInfoRow}>
                <Ionicons name="hardware-chip-outline" size={20} color={theme.colors.accent} />
                <Text style={styles.deviceInfoLabel}>{t('account.deviceName')}: </Text>
                <Text style={styles.deviceInfoValue} numberOfLines={1}>{device.name}</Text>
              </View>
              <View style={styles.deviceInfoRow}>
                <Ionicons name="barcode-outline" size={20} color={theme.colors.accent} />
                <Text style={styles.deviceInfoLabel}>{t('account.deviceId')}: </Text>
                <Text style={styles.deviceInfoValue} numberOfLines={1}>{device.id.slice(0, 8)}…</Text>
              </View>
              <View style={styles.deviceInfoRow}>
                <Ionicons name="pulse-outline" size={20} color={theme.colors.accent} />
                <Text style={styles.deviceInfoLabel}>{t('account.deviceStatus')}: </Text>
                <Text style={[styles.deviceInfoValue, device.status === 'connected' && styles.deviceConnected]}>{device.status === 'connected' ? t('account.deviceConnected') : t('account.deviceDisconnected')}</Text>
              </View>
              <View style={styles.deviceInfoRow}>
                <Ionicons name="calendar-outline" size={20} color={theme.colors.accent} />
                <Text style={styles.deviceInfoValue}>{new Date(device.linkedAt).toLocaleDateString()}</Text>
              </View>
              {devices.length > 1 && (
                <Text style={styles.deviceHelp}>+{devices.length - 1} {t('account.deviceMore')}</Text>
              )}
              {!!deviceError && <Text style={styles.deviceErrorText}>{deviceError}</Text>}
              <View style={styles.buttonWrap}>
                <AppButton title={isUnlinking ? t('common.saving') : t('account.deviceUnlink')} variant="outline" onPress={unlinkDevice} />
              </View>
            </View>
          ) : (
            <>
              <Text style={styles.deviceDescription}>{t('account.deviceDescription')}</Text>
              <Text style={styles.deviceEmpty}>{t('account.deviceNoLinked')}</Text>
              <AppTextInput label={t('account.deviceCode')} placeholder={t('account.deviceCodePlaceholder')} value={deviceCode} keyboardType="default" autoCapitalize="none" autoCorrect={false} maxLength={64} error={deviceError} onChangeText={updateDeviceCode} />
              <Text style={styles.deviceHelp}>{t('account.deviceHelp')}</Text>
              <View style={styles.buttonWrap}>
                <AppButton title={isLinking ? t('common.saving') : t('account.deviceLink')} onPress={linkDevice} />
              </View>
            </>
          )}
        </View>
      </View>
      <AppAlertModal
        visible={showConfirmModal}
        title={t('account.confirmTitle')}
        message={`${t('account.confirmMessage')}\n\n${t('account.firstName')}: ${form.firstName}\n${t('account.lastName')}: ${form.lastName}\n${t('account.phone')}: ${form.phone}\n\n${t('account.confirmQuestion')}`}
        onRequestClose={() => setShowConfirmModal(false)}
        buttons={[
          { text: t('common.cancel'), style: 'cancel', onPress: () => setShowConfirmModal(false) },
          { text: t('common.confirm'), style: 'default', onPress: handleConfirmUpdate },
        ]}
      />
      <AppAlertModal
        visible={showUpdatedModal}
        title={t('account.updatedTitle')}
        message={t('account.updatedMessage')}
        onRequestClose={() => setShowUpdatedModal(false)}
        buttons={[{ text: t('common.confirm'), onPress: () => setShowUpdatedModal(false) }]}
      />
      <AppAlertModal
        visible={deviceLinked}
        title={t('account.deviceLinkedTitle')}
        message={t('account.deviceLinkedMessage')}
        onRequestClose={dismissDeviceLinked}
        buttons={[{ text: t('common.confirm'), style: 'confirm', onPress: dismissDeviceLinked }]}
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
  content: { width: '100%', maxWidth: 420, alignSelf: 'center', paddingTop: 16, paddingHorizontal: 24, paddingBottom: 24 },
  sectionTitle: { color: theme.colors.accent, fontSize: 20, fontWeight: '900', marginBottom: 16 },
  loadingWrap: { paddingVertical: 24, alignItems: 'center', gap: 8 },
  loadingText: { color: theme.colors.textMuted, fontSize: theme.fontSize.sm },
  buttonWrap: { marginTop: theme.spacing.lg, width: '100%' },
  helpText: { marginTop: theme.spacing.md, color: theme.colors.textMuted, fontSize: theme.fontSize.sm, textAlign: 'center' },
  deviceCard: { marginTop: 28, backgroundColor: theme.colors.surface, borderRadius: theme.radius.card, padding: 20, gap: 12, shadowColor: '#000', shadowOpacity: 0.14, shadowRadius: 10, elevation: 5 },
  deviceTitle: { color: theme.colors.accent, fontSize: 18, fontWeight: '900' },
  deviceDescription: { color: theme.colors.textMuted, fontSize: theme.fontSize.sm, lineHeight: 18 },
  deviceHelp: { color: theme.colors.textMuted, fontSize: theme.fontSize.xs, marginTop: -8 },
  deviceEmpty: { color: theme.colors.text, fontSize: theme.fontSize.sm, fontWeight: '800', textAlign: 'center', marginVertical: 4 },
  deviceErrorText: { color: theme.colors.error, fontSize: theme.fontSize.xs, fontWeight: '700', textAlign: 'center' },
  deviceInfo: { gap: 10, marginTop: 8 },
  deviceInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  deviceInfoLabel: { color: theme.colors.textMuted, fontSize: theme.fontSize.sm, fontWeight: '700' },
  deviceInfoValue: { color: theme.colors.text, fontSize: theme.fontSize.sm, fontWeight: '800', flex: 1 },
  deviceConnected: { color: '#00c853' },
  });
}
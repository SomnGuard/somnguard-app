import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppAlertModal } from '@/shared/components/AppAlertModal';
import SomnGuardLogo from '@/shared/components/SomnGuardLogo';
import { AppButton } from '@/shared/components/AppButton';
import { Screen } from '@/shared/components/Screen';
import { useAppTheme } from '@/shared/theme';
import { useMonitoring } from '@/features/monitoring/hooks/useMonitoring';
import { profileService } from '@/features/profile/services/profile.service';

export default function DashboardScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isMonitoring } = useMonitoring();
  const { theme } = useAppTheme();
  const [showNoDevice, setShowNoDevice] = useState(false);
  const styles = createStyles(theme);

  function handleStartMonitoring() {
    if (isMonitoring) {
      router.push('/(tabs)/monitoring' as any);
      return;
    }
    if (!profileService.hasLinkedDevice()) {
      setShowNoDevice(true);
      return;
    }
    router.push('/(tabs)/monitoring' as any);
  }

  return (
    <Screen scrollable={false} centered contentStyle={styles.screen}>
      <View style={styles.logoBlock}>
        <SomnGuardLogo size={156} />
        <Text style={styles.subtitle}>{t('dashboard.subtitle')}</Text>
      </View>
      <View style={styles.actions}>
        <AppButton title={isMonitoring ? t('dashboard.stop') : t('dashboard.start')} onPress={handleStartMonitoring} />
        <AppButton title={t('dashboard.history')} onPress={() => router.push('/(tabs)/history')} variant="outline" />
      </View>
      <AppAlertModal
        visible={showNoDevice}
        title={t('dashboard.noDeviceTitle')}
        message={t('dashboard.noDeviceMessage')}
        onRequestClose={() => setShowNoDevice(false)}
        buttons={[
          { text: t('common.cancel'), style: 'cancel', onPress: () => setShowNoDevice(false) },
          { text: t('dashboard.linkDevice'), onPress: () => { setShowNoDevice(false); router.push('/(tabs)/profile/cuenta' as any); } },
        ]}
      />
    </Screen>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  return StyleSheet.create({
  screen: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 34, paddingTop: theme.spacing.xxl },
  logoBlock: { alignItems: 'center', marginBottom: 54 },
  subtitle: { color: theme.colors.text, fontSize: 15, fontWeight: '900', letterSpacing: 0.3, marginTop: -2 },
  actions: { width: '100%', gap: theme.spacing.sm },
  });
}

import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { AppAlertModal } from '@/shared/components/AppAlertModal';
import { AppButton } from '@/shared/components/AppButton';
import { Screen } from '@/shared/components/Screen';
import { dailyAlerts } from '@/features/monitoring/mocks/monitoring.mock';
import { useAppTheme } from '@/shared/theme';
import { useMonitoring } from '@/features/monitoring/hooks/useMonitoring';
import { profileService } from '@/features/profile/services/profile.service';

export default function MonitoringScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { isMonitoring, toggleMonitoring } = useMonitoring();

  const pulseRef = useRef(new Animated.Value(1));
  // eslint-disable-next-line react-hooks/refs
  const pulse = pulseRef.current;
  const { theme } = useAppTheme();
  const [showNoDevice, setShowNoDevice] = useState(false);
  const styles = createStyles(theme);

  function handleToggle() {
    if (!isMonitoring && !profileService.hasLinkedDevice()) {
      setShowNoDevice(true);
      return;
    }
    toggleMonitoring();
  }

  useEffect(() => {
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1.16, duration: 750, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1, duration: 750, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]));
    if (isMonitoring) animation.start(); else pulse.setValue(1);
    return () => animation.stop();
  }, [isMonitoring, pulse]);

  return (
    <Screen scrollable={false} contentStyle={styles.screen}>
      <View style={styles.header}>
        <View style={[styles.dot, isMonitoring && styles.dotActive]} />
        <Text style={styles.headerText}>{isMonitoring ? t('monitoring.active') : t('monitoring.inactive')}</Text>
      </View>
      <View style={[styles.viewer, isMonitoring && styles.viewerActive]}>
        <Animated.View style={[styles.eyeOuter, { transform: [{ scale: pulse }] }]}>
          <View style={[styles.eyeInner, isMonitoring && styles.eyeInnerActive]} />
        </Animated.View>
        <Text style={styles.viewerText}>{isMonitoring ? t('monitoring.monitoring') : t('monitoring.cameraInactive')}</Text>
      </View>
      <View style={styles.dailyCard}>
        <Text style={styles.dailyTitle}>{t('monitoring.dailyAlerts')}</Text>
        <ScrollView style={styles.dailyScroll} contentContainerStyle={styles.dailyContent} showsVerticalScrollIndicator={false} nestedScrollEnabled>
          {dailyAlerts.map((alert) => (
            <View key={alert.id} style={[styles.alertRow, alert.tone === 'danger' && styles.alertDanger, alert.tone === 'warning' && styles.alertWarning]}>
              <View style={styles.alertLeft}>
                <Text style={styles.alertType}>{alert.type}</Text>
                <Text style={styles.alertDetail}>{alert.detail}</Text>
              </View>
              <Text style={styles.alertTime}>{alert.time}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
      <View style={styles.action}>
        <AppButton title={isMonitoring ? t('dashboard.stop') : t('dashboard.start')} onPress={handleToggle} />
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
  screen: { flex: 1, paddingTop: 0, paddingHorizontal: theme.spacing.lg, justifyContent: 'space-between' },
  header: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.md },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.textMuted },
  dotActive: { backgroundColor: '#00ff88' },
  headerText: { flex: 1, color: theme.colors.accent, fontSize: theme.fontSize.lg, fontWeight: '800', letterSpacing: 1.2 },
  viewer: { flex: 1, maxHeight: 340, aspectRatio: 1, alignSelf: 'center', width: '100%', maxWidth: 340, borderRadius: theme.radius.card, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.viewer, alignItems: 'center', justifyContent: 'center', marginBottom: theme.spacing.md },
  viewerActive: { borderColor: theme.colors.accent },
  eyeOuter: { width: 96, height: 96, borderRadius: 48, borderWidth: 2, borderColor: theme.colors.accent, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,200,200,0.06)' },
  eyeInner: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.border },
  eyeInnerActive: { backgroundColor: theme.colors.accent },
  viewerText: { position: 'absolute', bottom: 18, color: theme.colors.textMuted, fontSize: theme.fontSize.xs, fontWeight: '800', letterSpacing: 2 },
  dailyCard: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.card, borderWidth: 1, borderColor: theme.colors.border, padding: theme.spacing.md, marginBottom: theme.spacing.md, flex: 1, minHeight: 120, maxHeight: 220 },
  dailyTitle: { color: theme.colors.accent, fontSize: theme.fontSize.md, fontWeight: '900', marginBottom: 10 },
  dailyScroll: { flex: 1 },
  dailyContent: { gap: 8, paddingBottom: 4 },
  alertRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.colors.background, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: theme.colors.border },
  alertDanger: { borderColor: 'rgba(255,50,50,0.4)', backgroundColor: 'rgba(255,50,50,0.08)' },
  alertWarning: { borderColor: 'rgba(255,153,0,0.4)', backgroundColor: 'rgba(255,153,0,0.08)' },
  alertLeft: { flex: 1, paddingRight: 8 },
  alertType: { color: theme.colors.accent, fontSize: theme.fontSize.sm, fontWeight: '800' },
  alertDetail: { color: theme.colors.textMuted, fontSize: theme.fontSize.xs, marginTop: 2 },
  alertTime: { color: theme.colors.text, fontSize: theme.fontSize.sm, fontWeight: '800' },
  action: { paddingTop: theme.spacing.sm },
  });
}

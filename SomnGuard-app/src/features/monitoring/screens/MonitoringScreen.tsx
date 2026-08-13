import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppButton } from '@/shared/components/AppButton';
import { Screen } from '@/shared/components/Screen';
import { monitoringStats } from '@/features/monitoring/mocks/monitoring.mock';
import { STATIC_COPY } from '@/shared/i18n/constants';
import { useAppTheme } from '@/shared/theme';
import { useMonitoring } from '@/features/monitoring/hooks/useMonitoring';

export default function MonitoringScreen() {
  const { t } = useTranslation();
  const { isMonitoring, time, toggleMonitoring } = useMonitoring();
  const pulse = useRef(new Animated.Value(1)).current;
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  useEffect(() => {
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1.16, duration: 750, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1, duration: 750, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]));
    if (isMonitoring) animation.start(); else pulse.setValue(1);
    return () => animation.stop();
  }, [isMonitoring, pulse]);

  return (
    <Screen contentStyle={styles.screen}>
      <View style={styles.header}>
        <View style={[styles.dot, isMonitoring && styles.dotActive]} />
        <Text style={styles.headerText}>{isMonitoring ? t('monitoring.active') : t('monitoring.inactive')}</Text>
        <Text style={styles.time}>{time}</Text>
      </View>
      <View style={[styles.viewer, isMonitoring && styles.viewerActive]}>
        <Animated.View style={[styles.eyeOuter, { transform: [{ scale: pulse }] }]}>
          <View style={[styles.eyeInner, isMonitoring && styles.eyeInnerActive]} />
        </Animated.View>
        <Text style={styles.viewerText}>{isMonitoring ? t('monitoring.monitoring') : t('monitoring.cameraInactive')}</Text>
      </View>
      <View style={styles.statsRow}>
        <StatBox value={`${monitoringStats.km}`} label={STATIC_COPY.kmUnit} />
        <StatBox value={`${monitoringStats.alerts}`} label={t('monitoring.alerts')} />
        <StatBox value={`${monitoringStats.sync}%`} label={STATIC_COPY.syncLabel} />
      </View>
      <AppButton title={isMonitoring ? t('dashboard.stop') : t('dashboard.start')} onPress={toggleMonitoring} />
    </Screen>
  );
}

function StatBox({ value, label }: { value: string; label: string }) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  return <View style={styles.statBox}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  return StyleSheet.create({
  screen: { paddingTop: '15%', paddingHorizontal: theme.spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.lg },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.textMuted },
  dotActive: { backgroundColor: '#00ff88' },
  headerText: { flex: 1, color: theme.colors.accent, fontSize: theme.fontSize.xl, fontWeight: '800', letterSpacing: 1.2 },
  time: { color: theme.colors.text, fontWeight: '700' },
  viewer: { aspectRatio: 1, borderRadius: theme.radius.card, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.viewer, alignItems: 'center', justifyContent: 'center', marginBottom: theme.spacing.lg },
  viewerActive: { borderColor: theme.colors.accent },
  eyeOuter: { width: 96, height: 96, borderRadius: 48, borderWidth: 2, borderColor: theme.colors.accent, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,200,200,0.06)' },
  eyeInner: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.border },
  eyeInnerActive: { backgroundColor: theme.colors.accent },
  viewerText: { position: 'absolute', bottom: 18, color: theme.colors.textMuted, fontSize: theme.fontSize.xs, fontWeight: '800', letterSpacing: 2 },
  statsRow: { flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.lg },
  statBox: { flex: 1, backgroundColor: theme.colors.surface, borderRadius: theme.radius.card, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center', paddingVertical: theme.spacing.md },
  statValue: { color: theme.colors.accent, fontSize: theme.fontSize.lg, fontWeight: '900' },
  statLabel: { color: theme.colors.textMuted, fontSize: theme.fontSize.xs, fontWeight: '700' },
  });
}

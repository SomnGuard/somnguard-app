import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Screen } from '@/shared/components/Screen';
import { AppButton } from '@/shared/components/AppButton';
import { useAppTheme } from '@/shared/theme';
import { profileService } from '@/features/profile/services/profile.service';
import type { DeviceResponse } from '@/shared/api/devicesApi';

function formatDateTime(value: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString();
}

export default function DeviceScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  const [device, setDevice] = useState<DeviceResponse | null>(null);
  const [deviceCount, setDeviceCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [devicesError, setDevicesError] = useState<string | undefined>(undefined);

  async function load() {
    try {
      setIsLoading(true);
      setDevicesError(undefined);
      const list = await profileService.fetchDevices();
      setDeviceCount(list.length);
      setDevice(list[0] ?? null);
    } catch (e) {
      setDevicesError(e instanceof Error ? e.message : t('device.loadError'));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const linked = device !== null;
  const pending = device?.pendingConfigUpdate ?? false;

  return (
    <Screen contentStyle={styles.screen}>
      <View style={styles.topBar}>
        <Pressable accessibilityRole="button" style={styles.backButton} onPress={() => router.push('/profile' as any)}>
          <Ionicons name="arrow-back-outline" size={28} color={theme.colors.accent} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('device.title')}</Text>
        {linked && (
          <View style={styles.headerBadge}>
            <View style={[styles.dot, !pending && styles.dotOn]} />
            <Text style={styles.badgeText}>{pending ? t('device.pending') : t('device.synced')}</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        {isLoading ? (
          <View style={styles.centerWrap}>
            <ActivityIndicator color={theme.colors.accent} size="small" />
            <Text style={styles.mutedText}>{t('common.validating')}</Text>
          </View>
        ) : devicesError && !linked ? (
          <View style={styles.card}>
            <Text style={styles.errorText}>{devicesError}</Text>
            <View style={styles.buttonWrap}>
              <AppButton title={t('common.retry')} variant="outline" onPress={load} />
            </View>
          </View>
        ) : !linked ? (
          <View style={styles.card}>
            <Ionicons name="hardware-chip-outline" size={40} color={theme.colors.accent} style={{ alignSelf: 'center' }} />
            <Text style={styles.emptyTitle}>{t('device.notLinked')}</Text>
            <Text style={styles.mutedTextCenter}>{t('device.noDeviceHint')}</Text>
            <View style={styles.buttonWrap}>
              <AppButton title={t('device.goToAccount')} variant="confirm" onPress={() => router.push('/profile/cuenta' as any)} />
            </View>
          </View>
        ) : (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{t('device.infoTitle')}</Text>
              <View style={styles.row}>
                <Text style={styles.label}>{t('device.serialNumber')}</Text>
                <Text style={styles.value} numberOfLines={1}>{device?.serialNumber || '—'}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>{t('device.status')}</Text>
                <Text style={[styles.value, device?.statusCategory === 'active' && styles.valueOn]}>
                  {device?.status || '—'}{device?.statusCategory ? ` · ${device.statusCategory}` : ''}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>{t('device.firmware')}</Text>
                <Text style={styles.value}>{device?.firmwareVersion || '—'}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>{t('device.assignedAt')}</Text>
                <Text style={styles.value}>{formatDateTime(device?.assignedAt ?? null)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>{t('device.lastHeartbeat')}</Text>
                <Text style={styles.value}>{formatDateTime(device?.lastHeartbeatAt ?? null)}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>{t('device.appliedVersion')}</Text>
                <Text style={styles.value}>
                  {device?.appliedConfigVersion ?? '—'}
                  {pending ? ` (${t('device.pending')})` : ''}
                </Text>
              </View>
              {deviceCount > 1 && (
                <Text style={styles.mutedTextCenter}>+{deviceCount - 1} {t('device.moreDevices')}</Text>
              )}
            </View>
          </>
        )}
      </View>
    </Screen>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  return StyleSheet.create({
    screen: { paddingHorizontal: 0, paddingTop: 0, paddingBottom: 0, gap: 0 },
    topBar: { height: 56, backgroundColor: theme.colors.header, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 8 },
    backButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { color: theme.colors.accent, fontSize: 18, fontWeight: '900', textDecorationLine: 'underline' },
    headerBadge: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.colors.surface, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: theme.colors.border },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.textMuted },
    dotOn: { backgroundColor: '#00C853' },
    badgeText: { color: theme.colors.text, fontSize: 11, fontWeight: '800' },
    content: { flex: 1, width: '100%', maxWidth: 420, alignSelf: 'center', padding: 16, gap: 14 },
    card: { backgroundColor: theme.colors.surface, borderRadius: 16, padding: 16, gap: 12, borderWidth: 1, borderColor: theme.colors.border, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, elevation: 4 },
    cardTitle: { color: theme.colors.text, fontSize: 16, fontWeight: '900' },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: theme.colors.border, gap: 8 },
    label: { color: theme.colors.textMuted, fontSize: 12, fontWeight: '700', flex: 1 },
    value: { color: theme.colors.text, fontSize: 12, fontWeight: '800', flex: 1, textAlign: 'right' },
    valueOn: { color: '#00A86B' },
    centerWrap: { paddingVertical: 24, alignItems: 'center', gap: 8 },
    mutedText: { color: theme.colors.textMuted, fontSize: theme.fontSize.sm },
    mutedTextCenter: { color: theme.colors.textMuted, fontSize: theme.fontSize.sm, textAlign: 'center' },
    emptyTitle: { color: theme.colors.text, fontSize: 15, fontWeight: '900', textAlign: 'center' },
    errorText: { color: theme.colors.error, fontSize: theme.fontSize.sm, fontWeight: '700', textAlign: 'center' },
    buttonWrap: { marginTop: 4, width: '100%' },
  });
}

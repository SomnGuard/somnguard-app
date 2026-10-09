import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useIsFocused, useRouter } from 'expo-router';
import { AppAlertModal } from '@/shared/components/AppAlertModal';
import { AppButton } from '@/shared/components/AppButton';
import { Screen } from '@/shared/components/Screen';
import { useAppTheme } from '@/shared/theme';
import { getSeverityBg } from '@/shared/theme/theme';
import { useMonitoring } from '@/features/monitoring/hooks/useMonitoring';
import { useLiveCamera } from '@/features/monitoring/hooks/useLiveCamera';
import { LiveKitVideoView } from '@/features/monitoring/components/LiveKitVideoView';
import { RelayVideoView } from '@/features/monitoring/components/RelayVideoView';
import { getLiveKitInitializationError, isLiveKitReady } from '@/features/monitoring/services/livekitRuntime';
import { getDetectionPaused, setDetectionPaused } from '@/features/monitoring/services/streaming.service';
import { profileService } from '@/features/profile/services/profile.service';
import { eventsApi, type EventDetailDto } from '@/shared/api/eventsApi';
import { formatEventTime, severityColor, toAlertSeverity } from '@/shared/utils/eventDisplay';

export default function MonitoringScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const isFocused = useIsFocused();
  const { isMonitoring, setIsMonitoring } = useMonitoring();
  const { session, error: streamError, isStarting, isStopping, start, stop, clearError } = useLiveCamera();

  const pulseRef = useRef(new Animated.Value(1));
  // eslint-disable-next-line react-hooks/refs
  const pulse = pulseRef.current;
  const { theme } = useAppTheme();
  const [showNoDevice, setShowNoDevice] = useState(false);
  const [dailyEvents, setDailyEvents] = useState<EventDetailDto[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [eventsError, setEventsError] = useState<string | undefined>(undefined);
  const [hasDevice, setHasDevice] = useState(false);
  const [deviceStatus, setDeviceStatus] = useState('');
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [detectionPaused, setDetectionPausedState] = useState(false);
  const [isUpdatingDetection, setIsUpdatingDetection] = useState(false);
  const [hasVideo, setHasVideo] = useState(false);
  const [liveKitConnected, setLiveKitConnected] = useState(false);
  const [forceRelay, setForceRelay] = useState(false);
  const [videoTimedOut, setVideoTimedOut] = useState(false);
  const [playerError, setPlayerError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const hasVideoRef = useRef(false);
  const disconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const styles = createStyles(theme);

  const loadDailyEvents = useCallback(async () => {
    try {
      setIsLoadingEvents(true);
      setEventsError(undefined);
      const list = await profileService.fetchDevices();
      const first = list[0] ?? null;
      setHasDevice(!!first);
      setDeviceId(first?.id ?? null);
      setDeviceStatus(first?.status ?? '');
      if (!first) {
        setDailyEvents([]);
        return;
      }
      setDailyEvents(await eventsApi.listTodayEvents(first.id, 20));
      void getDetectionPaused(first.id).then(setDetectionPausedState).catch(() => undefined);
    } catch (error) {
      setEventsError(error instanceof Error ? error.message : t('monitoring.emptyDaily'));
    } finally {
      setIsLoadingEvents(false);
    }
  }, [t]);

  useEffect(() => {
    void Promise.resolve().then(() => loadDailyEvents());
  }, [loadDailyEvents]);

  useEffect(() => {
    setIsMonitoring(!!session);
  }, [session, setIsMonitoring]);

  useEffect(() => {
    if (isFocused || !session) return;
    const timer = setTimeout(() => {
      void stop();
      setIsMonitoring(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [isFocused, session, setIsMonitoring, stop]);

  useEffect(() => {
    const timer = setTimeout(() => {
      hasVideoRef.current = false;
      if (disconnectTimerRef.current) {
        clearTimeout(disconnectTimerRef.current);
        disconnectTimerRef.current = null;
      }
      setHasVideo(false);
      setLiveKitConnected(false);
      setForceRelay(false);
      setVideoTimedOut(false);
      setPlayerError(null);
    }, 0);
    return () => clearTimeout(timer);
  }, [session]);

  useEffect(() => {
    if (!session || hasVideo) return;
    // ICE en móvil tarda: el fallo real visto en LiveKit es ~15s (requests sin
    // respuesta y SIGNAL_SOURCE_CLOSE). Sin transporte se cae al relay a los
    // 15s; con transporte conectado se espera al Pi (poll 10s + publicar).
    const timer = setTimeout(() => {
      setVideoTimedOut(true);
      setForceRelay(true);
    }, liveKitConnected ? 30000 : 15000);
    return () => clearTimeout(timer);
  }, [session, hasVideo, liveKitConnected]);

  const handleVideo = useCallback((available: boolean) => {
    hasVideoRef.current = available || hasVideoRef.current;
    setHasVideo(available);
    if (available) {
      setVideoTimedOut(false);
      setPlayerError(null);
      if (disconnectTimerRef.current) {
        clearTimeout(disconnectTimerRef.current);
        disconnectTimerRef.current = null;
      }
    }
  }, []);

  const handleLiveKitConnected = useCallback(() => {
    setPlayerError(null);
    setLiveKitConnected(true);
    if (disconnectTimerRef.current) {
      clearTimeout(disconnectTimerRef.current);
      disconnectTimerRef.current = null;
    }
  }, []);

  const handleLiveKitDisconnected = useCallback(() => {
    setLiveKitConnected(false);
    // No matar LiveKit al primer corte: el SDK reintenta ICE solo si la Room
    // sigue montada. Solo se cae al relay si no hay video tras el margen.
    if (disconnectTimerRef.current) clearTimeout(disconnectTimerRef.current);
    const hadVideo = hasVideoRef.current;
    disconnectTimerRef.current = setTimeout(() => {
      setHasVideo(false);
      setForceRelay(true);
      console.warn('[LiveKit] Sin recuperación, usando relay MJPEG', { hadVideo });
    }, hadVideo ? 8000 : 2000);
  }, []);

  useEffect(() => () => {
    if (disconnectTimerRef.current) clearTimeout(disconnectTimerRef.current);
  }, []);

  const handlePlayerError = useCallback((message: string) => {
    setPlayerError(message);
    setForceRelay(true);
  }, []);

  async function handleCameraToggle() {
    setActionError(null);
    clearError();
    if (session) {
      await stop();
      setIsMonitoring(false);
      return;
    }

    try {
      const devices = await profileService.fetchDevices();
      const first = devices[0] ?? null;
      setHasDevice(!!first);
      setDeviceId(first?.id ?? null);
      setDeviceStatus(first?.status ?? '');
      if (!first) {
        setShowNoDevice(true);
        return;
      }
      const started = await start(first.id);
      if (started) setIsMonitoring(true);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : t('common.connectionError'));
    }
  }

  async function handleDetectionToggle() {
    if (!deviceId || isUpdatingDetection) return;
    const next = !detectionPaused;
    setIsUpdatingDetection(true);
    setActionError(null);
    setDetectionPausedState(next);
    try {
      const applied = await setDetectionPaused(deviceId, next);
      setDetectionPausedState(applied);
    } catch (error) {
      setDetectionPausedState(!next);
      setActionError(error instanceof Error ? error.message : t('common.connectionError'));
    } finally {
      setIsUpdatingDetection(false);
    }
  }

  useEffect(() => {
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1.16, duration: 750, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1, duration: 750, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]));
    if (isMonitoring) animation.start(); else pulse.setValue(1);
    return () => animation.stop();
  }, [isMonitoring, pulse]);

  const liveKitCredentials = !!session?.livekitUrl && !!session.livekitToken;
  const nativeReady = isLiveKitReady();
  const liveKitInitError = getLiveKitInitializationError();
  const playerMessage = playerError
    ?? (liveKitCredentials && !nativeReady
      ? liveKitInitError ?? t('monitoring.liveKitUnavailable')
      : forceRelay && liveKitCredentials ? t('monitoring.relayFallback')
      : videoTimedOut ? (liveKitConnected ? t('monitoring.noVideoTrack') : t('monitoring.videoTimeout')) : null);
  const isDeviceActive = ['DEVICE_ACTIVE', 'ACTIVE', 'ACTIVO'].includes(deviceStatus.toUpperCase());
  const isBusy = isStarting || isStopping;
  const useRelay = !!session && (!liveKitCredentials || !nativeReady || forceRelay);

  return (
    <Screen contentStyle={styles.screen}>
      <View style={styles.header}>
        <View style={[styles.dot, isDeviceActive && styles.dotActive]} />
        <Text style={styles.headerText}>{isDeviceActive ? t('monitoring.active') : t('monitoring.inactive')}</Text>
        <Text style={styles.deviceHint}>{hasDevice ? t('monitoring.deviceLinked') : t('monitoring.noDeviceShort')}</Text>
      </View>

      <View style={[styles.viewer, session && styles.viewerActive]}>
        {session && liveKitCredentials && nativeReady && !forceRelay ? (
          <LiveKitVideoView
            session={session}
            onConnected={handleLiveKitConnected}
            onDisconnected={handleLiveKitDisconnected}
            onError={handlePlayerError}
            onTrack={handleVideo}
          />
        ) : session && useRelay ? (
          <RelayVideoView session={session} onFrame={() => handleVideo(true)} onDeviceStatus={setDeviceStatus} />
        ) : null}

        {(!session || (liveKitCredentials && !nativeReady && !useRelay) || (playerMessage && !hasVideo)) && (
          <View style={styles.videoOverlay} pointerEvents="none">
            {isBusy ? (
              <ActivityIndicator color={theme.colors.accent} size="large" />
            ) : (
              <Ionicons name={playerMessage ? 'warning-outline' : 'videocam-off-outline'} size={48} color={playerMessage ? theme.colors.error : theme.colors.textMuted} />
            )}
            <Text style={styles.viewerText}>
              {playerMessage ?? (isStarting ? t('monitoring.connecting') : isStopping ? t('monitoring.stopping') : session ? t('monitoring.waitingForVideo') : t('monitoring.cameraInactive'))}
            </Text>
          </View>
        )}
        <View style={styles.liveBadge}>
          <View style={[styles.liveDot, session && hasVideo && styles.liveDotOn]} />
          <Text style={styles.liveBadgeText}>{session && hasVideo ? t('monitoring.live') : session && liveKitConnected ? t('monitoring.waitingForVideo') : session ? t('monitoring.connecting') : t('monitoring.paused')}</Text>
        </View>
      </View>

      {(streamError || actionError || (playerMessage && hasVideo)) && (
        <Text style={styles.actionError}>{streamError ?? actionError ?? playerMessage}</Text>
      )}

      <View style={styles.controls}>
        <AppButton
          title={isStarting ? t('monitoring.connecting') : isStopping ? t('monitoring.stopping') : session ? t('monitoring.pauseCamera') : t('monitoring.resumeCamera')}
          onPress={() => void handleCameraToggle()}
          variant={session ? 'danger' : 'primary'}
          disabled={isBusy}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !hasDevice || isUpdatingDetection }}
          disabled={!hasDevice || isUpdatingDetection}
          onPress={() => void handleDetectionToggle()}
          style={({ pressed }) => [styles.secondaryAction, (!hasDevice || isUpdatingDetection) && styles.disabledAction, pressed && styles.pressedAction]}
        >
          <Ionicons name={detectionPaused ? 'play-outline' : 'pause-outline'} size={19} color={theme.colors.accent} />
          <Text style={styles.secondaryText}>
            {isUpdatingDetection ? t('common.saving') : detectionPaused ? t('monitoring.resumeDetection') : t('monitoring.pauseDetection')}
          </Text>
        </Pressable>
      </View>

      {detectionPaused && <Text style={styles.detectionNote}>{t('monitoring.detectionPausedHint')}</Text>}

      <View style={styles.dailyCard}>
        <View style={styles.dailyHeader}>
          <Text style={styles.dailyTitle}>{t('monitoring.dailyAlerts')}</Text>
          <Pressable accessibilityRole="button" onPress={() => void loadDailyEvents()} style={styles.refreshButton}>
            <Ionicons name="refresh-outline" size={21} color={theme.colors.accent} />
          </Pressable>
        </View>
        {isLoadingEvents ? (
          <View style={styles.dailyCenter}>
            <ActivityIndicator color={theme.colors.accent} size="small" />
          </View>
        ) : eventsError ? (
          <View style={styles.dailyCenter}>
            <Text style={styles.dailyError}>{eventsError}</Text>
            <Pressable accessibilityRole="button" onPress={() => void loadDailyEvents()}>
              <Text style={styles.retryText}>{t('common.retry')}</Text>
            </Pressable>
          </View>
        ) : !hasDevice || dailyEvents.length === 0 ? (
          <View style={styles.dailyCenter}>
            <Text style={styles.dailyEmpty}>{!hasDevice ? t('dashboard.noDeviceMessage') : t('monitoring.emptyDaily')}</Text>
          </View>
        ) : (
          <ScrollView style={styles.dailyScroll} contentContainerStyle={styles.dailyContent} showsVerticalScrollIndicator={false} nestedScrollEnabled>
            {dailyEvents.map((event) => {
              const color = severityColor(event.severity?.code);
              const severity = toAlertSeverity(event.severity?.code);
              return (
                <View key={event.id} style={[styles.alertRow, { borderColor: color, backgroundColor: getSeverityBg(severity) }]}>
                  <View style={[styles.severityDot, { backgroundColor: color }]} />
                  <View style={styles.alertLeft}>
                    <Text style={[styles.alertType, { color }]} numberOfLines={1}>
                      {event.eventType?.name || event.eventType?.code || '—'}
                    </Text>
                    <Text style={styles.alertDetail} numberOfLines={2}>
                      {event.severity?.name || event.severity?.code || ''}
                      {event.hasEvidence ? ' · ✓' : ''}
                    </Text>
                  </View>
                  <Text style={styles.alertTime}>{formatEventTime(event.occurredAt)}</Text>
                </View>
              );
            })}
          </ScrollView>
        )}
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
    screen: { flexGrow: 1, paddingTop: 0, paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.md, gap: theme.spacing.md },
    header: { minHeight: 30, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.textMuted },
    dotActive: { backgroundColor: '#22c55e' },
    headerText: { flex: 1, color: theme.colors.accent, fontSize: theme.fontSize.md, fontWeight: '900', letterSpacing: 0.7 },
    deviceHint: { color: theme.colors.textMuted, fontSize: theme.fontSize.xs, fontWeight: '700' },
    viewer: { width: '100%', aspectRatio: 4 / 3, maxHeight: 300, alignSelf: 'center', borderRadius: theme.radius.card, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: '#03070d', overflow: 'hidden' },
    viewerActive: { borderColor: theme.colors.accent },
    videoOverlay: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', padding: theme.spacing.xl, gap: theme.spacing.md },
    viewerText: { color: theme.colors.textMuted, fontSize: theme.fontSize.sm, fontWeight: '800', textAlign: 'center' },
    liveBadge: { position: 'absolute', top: 12, left: 12, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: 'rgba(3,7,13,0.78)' },
    liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: theme.colors.textMuted },
    liveDotOn: { backgroundColor: '#22c55e' },
    liveBadgeText: { color: '#f5fbff', fontSize: 10, fontWeight: '900', letterSpacing: 0.7 },
    controls: { gap: theme.spacing.sm },
    secondaryAction: { minHeight: 43, borderRadius: theme.radius.button, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.surface, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, paddingHorizontal: theme.spacing.lg },
    secondaryText: { color: theme.colors.accent, fontSize: theme.fontSize.sm, fontWeight: '800' },
    disabledAction: { opacity: 0.5 },
    pressedAction: { opacity: 0.78 },
    detectionNote: { color: theme.colors.textMuted, fontSize: theme.fontSize.xs, textAlign: 'center' },
    actionError: { color: theme.colors.error, fontSize: theme.fontSize.xs, fontWeight: '700', textAlign: 'center' },
    dailyCard: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.card, borderWidth: 1, borderColor: theme.colors.border, padding: theme.spacing.md, minHeight: 140, maxHeight: 205 },
    dailyHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
    dailyTitle: { color: theme.colors.accent, fontSize: theme.fontSize.md, fontWeight: '900' },
    refreshButton: { padding: 4 },
    dailyCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10 },
    dailyEmpty: { color: theme.colors.textMuted, fontSize: theme.fontSize.sm, textAlign: 'center' },
    dailyError: { color: theme.colors.error, fontSize: theme.fontSize.sm, fontWeight: '700', textAlign: 'center' },
    retryText: { color: theme.colors.textLink, fontSize: theme.fontSize.sm, fontWeight: '700', textDecorationLine: 'underline' },
    dailyScroll: { flex: 1 },
    dailyContent: { gap: 8, paddingBottom: 4 },
    alertRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.colors.background, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: theme.colors.border },
    severityDot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
    alertLeft: { flex: 1, paddingRight: 8 },
    alertType: { color: theme.colors.accent, fontSize: theme.fontSize.sm, fontWeight: '800' },
    alertDetail: { color: theme.colors.textMuted, fontSize: theme.fontSize.xs, marginTop: 2 },
    alertTime: { color: theme.colors.text, fontSize: theme.fontSize.sm, fontWeight: '800' },
  });
}

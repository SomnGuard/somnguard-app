import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { LiveKitRoom, VideoTrack, isTrackReference, useTracks } from '@livekit/react-native';
import { Track } from 'livekit-client';
import { useAppTheme } from '@/shared/theme';
import { useTranslation } from 'react-i18next';
import type { StreamSession } from '../services/streaming.service';
import { isLiveKitHostStale, resolveLiveKitFallbackUrl, resolveLiveKitServerUrl } from '../services/streaming.service';

type Props = {
  session: StreamSession;
  onConnected: () => void;
  onDisconnected: () => void;
  onError: (message: string) => void;
  onTrack: (available: boolean) => void;
};

export default function NativeLiveKitVideoView({ session, onConnected, onDisconnected, onError, onTrack }: Props) {
  const { t } = useTranslation();
  const primaryUrl = resolveLiveKitServerUrl(session.livekitUrl ?? '');
  const fallbackUrl = resolveLiveKitFallbackUrl(session.livekitUrl ?? '');
  const [serverUrl, setServerUrl] = useState(primaryUrl);
  const triedFallbackRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setServerUrl(primaryUrl);
      triedFallbackRef.current = false;
    }, 0);
    if (session.livekitUrl && isLiveKitHostStale(session.livekitUrl)) {
      console.warn('[LiveKit] URL anunciada obsoleta, se reintentará con host del API si falla', {
        livekit: session.livekitUrl,
        fallback: fallbackUrl,
      });
    }
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.sessionId, session.livekitToken]);

  if (!session.livekitUrl || !session.livekitToken) return null;

  const handleRoomError = (error: Error) => {
    // La IP LAN cambia seguido (10.3.x -> 10.74.x): SOLO en ese caso se
    // reintenta una vez con el host del API antes de rendirse al relay.
    // En despliegue público (livekit.somnguard.tech vs api.somnguard.tech)
    // son hosts distintos a propósito: no reintentar, ir directo al relay.
    const stale = !!session.livekitUrl && isLiveKitHostStale(session.livekitUrl);
    if (!triedFallbackRef.current && stale && fallbackUrl && fallbackUrl !== serverUrl) {
      triedFallbackRef.current = true;
      console.warn('[LiveKit] Falló URL primaria, reintentando con host del API', { from: serverUrl, to: fallbackUrl });
      setServerUrl(fallbackUrl);
      return;
    }
    onError(error.message || t('monitoring.liveKitConnectionError'));
  };

  return (
    <LiveKitRoom
      key={`${session.sessionId}:${session.livekitToken}:${serverUrl}`}
      serverUrl={serverUrl}
      token={session.livekitToken}
      connect
      audio={false}
      video={false}
      options={{ adaptiveStream: { pixelDensity: 'screen' } }}
      onConnected={onConnected}
      onDisconnected={onDisconnected}
      onError={handleRoomError}
    >
      <RemoteCameraTrack deviceId={session.deviceId} onTrack={onTrack} />
    </LiveKitRoom>
  );
}

function RemoteCameraTrack({ deviceId, onTrack }: { deviceId: string; onTrack: Props['onTrack'] }) {
  const { theme } = useAppTheme();
  const { t } = useTranslation();
  // Older device builds published the video with SOURCE_UNKNOWN. Include that
  // source while the device is upgraded, then filter by video kind and device.
  const tracks = useTracks([Track.Source.Camera, Track.Source.Unknown]);
  const deviceIdentity = `device-${deviceId}`;
  const trackRef = tracks.find((track) =>
    isTrackReference(track)
    && track.publication.kind === Track.Kind.Video
    && track.participant.identity === deviceIdentity,
  );
  const trackSid = trackRef?.publication.trackSid ?? null;
  const trackSource = trackRef?.publication.source ?? null;
  const trackParticipant = trackRef?.participant.identity ?? null;

  useEffect(() => {
    onTrack(trackSid !== null);
    if (trackSid && trackSource && trackParticipant) {
      console.info('[LiveKit] Track de video recibido', {
        participant: trackParticipant,
        source: trackSource,
        sid: trackSid,
      });
    }
  }, [onTrack, trackParticipant, trackSid, trackSource]);

  if (!trackRef) {
    return (
      <View style={styles.waiting}>
        <ActivityIndicator color={theme.colors.accent} />
        <Text style={[styles.message, { color: theme.colors.textMuted }]}>{t('monitoring.waitingForVideo')}</Text>
      </View>
    );
  }

  return <VideoTrack trackRef={trackRef} style={styles.video} />;
}

const styles = StyleSheet.create({
  video: { ...StyleSheet.absoluteFill },
  waiting: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 24 },
  message: { fontSize: 13, fontWeight: '700', textAlign: 'center' },
});

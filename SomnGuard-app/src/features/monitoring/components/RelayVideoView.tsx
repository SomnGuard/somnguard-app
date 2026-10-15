import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { resolveStreamWebSocketUrl, type StreamSession } from '../services/streaming.service';

type Props = {
  session: StreamSession;
  onFrame: () => void;
  onDeviceStatus: (status: string) => void;
};

// El relay MJPEG manda JPEG 640x480 q55 por WS (~80KB -> ~110KB base64).
// Con <Image> de RN cada cambio de uri limpia el anterior y se ve negro.
// Doble buffer con expo-image: el visible nunca se limpia, el oculto decodifica
// y solo al onLoad se intercambian. Throttle a ~6fps + reconexión con backoff.
const MIN_FRAME_INTERVAL_MS = 160;
const MIN_PAYLOAD_LEN = 1000;
const MAX_PAYLOAD_LEN = 700_000;

export function RelayVideoView({ session, onFrame, onDeviceStatus }: Props) {
  const { t } = useTranslation();
  const [bufA, setBufA] = useState<string | null>(null);
  const [bufB, setBufB] = useState<string | null>(null);
  const [active, setActive] = useState<'a' | 'b'>('a');
  const [error, setError] = useState<string | null>(null);
  const frameCallback = useRef(onFrame);
  const statusCallback = useRef(onDeviceStatus);
  const hasFrameRef = useRef(false);
  const lastPaintRef = useRef(0);
  const activeRef = useRef<'a' | 'b'>('a');
  const pendingRef = useRef<string | null>(null);

  useEffect(() => {
    frameCallback.current = onFrame;
    statusCallback.current = onDeviceStatus;
  }, [onFrame, onDeviceStatus]);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  // Al cambiar de sesión se limpian buffers para no mostrar video viejo.
  useEffect(() => {
    const timer = setTimeout(() => {
      setBufA(null);
      setBufB(null);
      setActive('a');
      setError(null);
    }, 0);
    hasFrameRef.current = false;
    lastPaintRef.current = 0;
    pendingRef.current = null;
    return () => clearTimeout(timer);
  }, [session.deviceId, session.sessionId]);

  useEffect(() => {
    let socket: WebSocket | null = null;
    let active = true;
    let attempts = 0;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    hasFrameRef.current = false;

    const pushPending = (uri: string) => {
      // Solo se pinta a ritmo MAX; el resto se descarta (el device manda 4-8fps).
      const now = Date.now();
      if (now - lastPaintRef.current < MIN_FRAME_INTERVAL_MS) return;
      lastPaintRef.current = now;
      pendingRef.current = uri;
      if (activeRef.current === 'a') setBufB(uri);
      else setBufA(uri);
    };

    const scheduleReconnect = () => {
      if (!active) return;
      // Si ya hubo video, reconectar rápido: un corte WS no debe dejar negro.
      // Si nunca hubo video, backoff para no saturar.
      const delay = hasFrameRef.current ? 1200 : Math.min(8000, 1500 * Math.pow(1.6, attempts));
      attempts += 1;
      retryTimer = setTimeout(() => {
        if (active) connect();
      }, delay);
    };

    const connect = () => {
      if (!active) return;
      try {
        socket = new WebSocket(resolveStreamWebSocketUrl(session.wsUrl));
      } catch {
        scheduleReconnect();
        return;
      }
      socket.onopen = () => {
        if (!active || !socket) return;
        attempts = 0;
        setError(null);
        socket.send(JSON.stringify({ type: 'subscribe', session_id: session.sessionId }));
        socket.send(JSON.stringify({ type: 'request-offer', session_id: session.sessionId }));
        socket.send(JSON.stringify({ type: 'subscribe-status', device_id: session.deviceId }));
      };
      socket.onmessage = (event) => {
        if (!active || typeof event.data !== 'string') return;
        let message: { type?: string; data?: string; status?: string };
        try {
          message = JSON.parse(event.data);
        } catch {
          return;
        }
        if (message.type === 'frame' && typeof message.data === 'string') {
          const raw = message.data;
          if (raw.length < MIN_PAYLOAD_LEN || raw.length > MAX_PAYLOAD_LEN) return;
          const uri = raw.startsWith('data:') ? raw : `data:image/jpeg;base64,${raw}`;
          pushPending(uri);
          if (!hasFrameRef.current) {
            hasFrameRef.current = true;
            frameCallback.current();
          }
        } else if (message.type === 'status' && typeof message.status === 'string') {
          statusCallback.current(message.status);
        } else if (message.type === 'error') {
          if (!hasFrameRef.current) setError(t('monitoring.streamConnectionError'));
        }
      };
      socket.onerror = () => {
        if (active && !hasFrameRef.current) setError(t('monitoring.streamConnectionError'));
      };
      socket.onclose = () => {
        socket = null;
        if (!active) return;
        // Corte con video en pantalla: se mantiene el último frame y se reintenta.
        scheduleReconnect();
      };
    };

    connect();

    return () => {
      active = false;
      if (retryTimer) clearTimeout(retryTimer);
      try { socket?.close(); } catch { /* socket may already be closed */ }
      socket = null;
    };
  }, [session.deviceId, session.sessionId, session.wsUrl, t]);

  const handleHiddenLoad = (slot: 'a' | 'b') => {
    // El oculto ya decodificó: recién ahí pasa a visible, sin flash negro.
    if (slot !== activeRef.current) setActive(slot);
  };

  const displayed = active === 'a' ? bufA : bufB;

  return (
    <View style={styles.container}>
      {bufA && (
        <Image
          source={{ uri: bufA }}
          contentFit="cover"
          transition={0}
          cachePolicy="none"
          onLoad={() => handleHiddenLoad('a')}
          style={[styles.video, { opacity: active === 'a' ? 1 : 0 }]}
          accessibilityLabel={active === 'a' ? t('monitoring.liveCamera') : undefined}
        />
      )}
      {bufB && (
        <Image
          source={{ uri: bufB }}
          contentFit="cover"
          transition={0}
          cachePolicy="none"
          onLoad={() => handleHiddenLoad('b')}
          style={[styles.video, { opacity: active === 'b' ? 1 : 0 }]}
          accessibilityLabel={active === 'b' ? t('monitoring.liveCamera') : undefined}
        />
      )}
      {!displayed && (
        <View style={styles.waiting}>
          <Text style={styles.message}>{error ?? t('monitoring.waitingForVideo')}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', height: '100%', backgroundColor: '#03070d' },
  video: { ...StyleSheet.absoluteFill, width: '100%', height: '100%' },
  waiting: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', padding: 24 },
  message: { color: '#d8eef6', fontSize: 13, fontWeight: '700', textAlign: 'center' },
});

import { useCallback, useEffect, useRef, useState } from 'react';
import { getStreamSession, isExistingSessionError, startStream, stopStream, type StreamSession } from '../services/streaming.service';

export function useLiveCamera() {
  const [session, setSession] = useState<StreamSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const sessionRef = useRef<StreamSession | null>(null);
  const mountedRef = useRef(true);
  const startingRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      const active = sessionRef.current;
      if (active) void stopStream(active.deviceId, active.sessionId).catch(() => undefined);
    };
  }, []);

  const start = useCallback(async (deviceId: string): Promise<StreamSession | null> => {
    if (startingRef.current) return null;
    startingRef.current = true;
    setIsStarting(true);
    setError(null);
    try {
      let next: StreamSession;
      try {
        next = await startStream(deviceId);
      } catch (startError) {
        if (!isExistingSessionError(startError)) throw startError;
        const existing = await getStreamSession(deviceId);
        if (!existing) throw startError;
        next = existing;
      }

      if (!mountedRef.current) {
        await stopStream(deviceId, next.sessionId).catch(() => undefined);
        return null;
      }
      sessionRef.current = next;
      setSession(next);
      return next;
    } catch (startError) {
      const message = startError instanceof Error ? startError.message : 'No se pudo iniciar la cámara.';
      if (mountedRef.current) setError(message);
      return null;
    } finally {
      startingRef.current = false;
      if (mountedRef.current) setIsStarting(false);
    }
  }, []);

  const stop = useCallback(async () => {
    const active = sessionRef.current;
    if (!active || isStopping) return;
    setIsStopping(true);
    setError(null);
    sessionRef.current = null;
    setSession(null);
    try {
      await stopStream(active.deviceId, active.sessionId);
    } catch (stopError) {
      setError(stopError instanceof Error ? stopError.message : 'No se pudo detener la cámara en el servidor.');
    } finally {
      if (mountedRef.current) setIsStopping(false);
    }
  }, [isStopping]);

  return { session, error, isStarting, isStopping, start, stop, clearError: () => setError(null) };
}

import { ApiError, API_BASE_URL, apiFetch, tokenStore } from '@/shared/api/client';

export type StreamSession = {
  sessionId: string;
  deviceId: string;
  room: string;
  tokenViewer: string;
  wsUrl: string;
  expiresAt: string;
  livekitUrl?: string;
  livekitToken?: string;
};

function pick<T>(value: Record<string, unknown>, ...keys: string[]): T | undefined {
  for (const key of keys) {
    const item = value[key];
    if (item !== undefined && item !== null) return item as T;
  }
  return undefined;
}

function normalizeSession(raw: Record<string, unknown>, deviceId: string): StreamSession {
  return {
    sessionId: pick<string>(raw, 'session_id', 'sessionId') ?? '',
    deviceId: pick<string>(raw, 'device_id', 'deviceId') ?? deviceId,
    room: pick<string>(raw, 'room') ?? '',
    tokenViewer: pick<string>(raw, 'token_viewer', 'tokenViewer') ?? '',
    wsUrl: pick<string>(raw, 'ws_url', 'wsUrl') ?? '/ws/stream',
    expiresAt: pick<string>(raw, 'expires_at', 'expiresAt') ?? '',
    livekitUrl: pick<string>(raw, 'livekit_url', 'livekitUrl'),
    livekitToken: pick<string>(raw, 'livekit_token', 'livekitToken'),
  };
}

export async function startStream(deviceId: string): Promise<StreamSession> {
  const raw = await apiFetch<Record<string, unknown>>(`/api/v1/devices/${deviceId}/stream/start`, {
    method: 'POST',
  });
  const session = normalizeSession(raw, deviceId);
  if (!session.sessionId) throw new Error('La API no devolvió el identificador de sesión de video.');
  return session;
}

export async function getStreamSession(deviceId: string): Promise<StreamSession | null> {
  try {
    const raw = await apiFetch<Record<string, unknown>>(`/api/v1/devices/${deviceId}/stream/session`, {
      method: 'GET',
    });
    const session = normalizeSession(raw, deviceId);
    return session.sessionId ? session : null;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function stopStream(deviceId: string, sessionId?: string) {
  if (!tokenStore.accessToken) return;
  await apiFetch(`/api/v1/devices/${deviceId}/stream/stop`, {
    method: 'POST',
    body: JSON.stringify(sessionId ? { session_id: sessionId } : {}),
  });
}

export async function setDetectionPaused(deviceId: string, paused: boolean): Promise<boolean> {
  const raw = await apiFetch<Record<string, unknown>>(`/api/v1/devices/${deviceId}/stream/detection`, {
    method: 'POST',
    body: JSON.stringify({ paused }),
  });
  return Boolean(pick<boolean>(raw, 'paused') ?? paused);
}

export async function getDetectionPaused(deviceId: string): Promise<boolean> {
  const raw = await apiFetch<Record<string, unknown>>(`/api/v1/devices/${deviceId}/stream/detection`, {
    method: 'GET',
  });
  return Boolean(pick<boolean>(raw, 'paused', 'detection_paused', 'detectionPaused') ?? false);
}

export function resolveStreamWebSocketUrl(path: string) {
  if (/^wss?:\/\//i.test(path)) return path;
  const api = new URL(API_BASE_URL);
  const scheme = api.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${scheme}//${api.host}${path.startsWith('/') ? path : `/${path}`}`;
}

export function resolveLiveKitServerUrl(url: string) {
  const raw = (url ?? '').trim();
  if (!raw) return raw;
  try {
    const server = new URL(raw);
    const host = server.hostname.toLowerCase().replace(/^\[|\]$/g, '');
    if (['localhost', '127.0.0.1', '0.0.0.0', '::1'].includes(host)) {
      server.hostname = new URL(API_BASE_URL).hostname;
    }
    return server.toString().replace(/\/$/, '');
  } catch {
    return raw;
  }
}

/**
 * URL alternativa cuando la IP LAN del backend cambió (ej. 10.3.x -> 10.74.x)
 * y el LiveKit anunciado quedó obsoleto. Conserva protocolo/puerto y usa el
 * host del API, que en el móvil sí resolvió el REST. Solo tiene sentido para
 * ws:// sin TLS en LAN; en servidor con dominio se ignora (mismo host).
 */
export function resolveLiveKitFallbackUrl(url: string) {
  const raw = (url ?? '').trim();
  if (!raw) return raw;
  try {
    const server = new URL(raw);
    const apiHost = new URL(API_BASE_URL).hostname;
    if (!apiHost || server.hostname.toLowerCase() === apiHost.toLowerCase()) return server.toString().replace(/\/$/, '');
    server.hostname = apiHost;
    return server.toString().replace(/\/$/, '');
  } catch {
    return raw;
  }
}

export function isLiveKitHostStale(url: string) {
  try {
    const liveHost = new URL(url).hostname.toLowerCase();
    const apiHost = new URL(API_BASE_URL).hostname.toLowerCase();
    if (!liveHost || !apiHost || liveHost === apiHost) return false;
    const loopback = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1', '[::1]']);
    if (loopback.has(liveHost)) return false;
    // Dos IPs privadas distintas = casi seguro cambio de WiFi/red.
    return /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(liveHost);
  } catch {
    return false;
  }
}

export function isExistingSessionError(error: unknown) {
  return error instanceof ApiError && error.status === 409;
}

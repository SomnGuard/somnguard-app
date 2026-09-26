

const rawUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');

if (!rawUrl) {
  throw new Error(
    'EXPO_PUBLIC_API_URL no definida. Crea somnguard-app/SomnGuard-app/.env a partir de .env.example (ej: EXPO_PUBLIC_API_URL=http://localhost:8080)'
  );
}

export const API_BASE_URL = rawUrl;

type TokenStore = {
  accessToken: string | null;
  refreshToken: string | null;
};

// En memoria (suficiente para web/móvil dev; migrar a SecureStore si se requiere persistencia).
export const tokenStore: TokenStore = {
  accessToken: null,
  refreshToken: null,
};

export function setTokens(accessToken: string | null, refreshToken: string | null) {
  tokenStore.accessToken = accessToken;
  tokenStore.refreshToken = refreshToken;
}

export function clearTokens() {
  tokenStore.accessToken = null;
  tokenStore.refreshToken = null;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const CONNECTION_ERROR_MESSAGE = 'No hay conexión con el servidor. Verifica tu conexión e intenta nuevamente.';
const SERVER_ERROR_MESSAGE = 'Ocurrió un error en el servidor. Intenta más tarde.';

function isNetworkErrorMessage(msg: string): boolean {
  const lower = msg.toLowerCase();
  return (
    lower.includes('failed to fetch') ||
    lower.includes('fetch failed') ||
    lower.includes('networkerror') ||
    lower.includes('network request failed') ||
    lower.includes('load failed') ||
    lower.includes('econnrefused') ||
    lower.includes('enotfound') ||
    lower.includes('etimedout') ||
    lower.includes('timeout') ||
    lower.includes('abort')
  );
}

function sanitizeErrorMessage(message: string): string {
  // Nunca exponer URL, IP o path :8080 al usuario
  if (!message) return SERVER_ERROR_MESSAGE;
  if (isNetworkErrorMessage(message) || message.includes('://') || message.includes(':8080') || message.includes(API_BASE_URL) || message.includes('/api/v1/')) {
    return CONNECTION_ERROR_MESSAGE;
  }
  return message;
}

const FETCH_TIMEOUT_MS = 8000;

async function fetchWithTimeout(url: string, options: RequestInit & { timeoutMs?: number } = {}): Promise<Response> {
  const { timeoutMs = FETCH_TIMEOUT_MS, signal: externalSignal, ...rest } = options as RequestInit & { timeoutMs?: number };
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  // Si ya hay signal externo, propagar abort
  if (externalSignal) {
    externalSignal.addEventListener('abort', () => controller.abort());
  }
  try {
    return await fetch(url, { ...rest, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  return apiFetchInternal<T>(path, options, false);
}

async function apiFetchInternal<T>(path: string, options: RequestInit, isRetry: boolean): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) ?? {}),
  };
  if (tokenStore.accessToken) {
    headers.Authorization = `Bearer ${tokenStore.accessToken}`;
  }
  let res: Response;
  try {
    res = await fetchWithTimeout(`${API_BASE_URL}${path}`, { ...options, headers });
  } catch (err) {
    const raw = err instanceof Error ? err.message : String(err);
    // Abort por timeout también es error de conexión
    if (raw.toLowerCase().includes('abort') || (err as Error).name === 'AbortError') {
      throw new ApiError(0, CONNECTION_ERROR_MESSAGE);
    }
    throw new ApiError(0, sanitizeErrorMessage(raw) || CONNECTION_ERROR_MESSAGE);
  }
  if (res.status === 204) return undefined as T;

  // AC-004: rotación silenciosa - si 401 y hay refreshToken, intenta renovar una vez
  const isAuthEndpoint = path.includes('/api/v1/auth/refresh') || path.includes('/api/v1/auth/login') || path.includes('/api/v1/auth/logout');
  if (res.status === 401 && !isRetry && !isAuthEndpoint && tokenStore.refreshToken) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      return apiFetchInternal<T>(path, options, true);
    }
  }

  let text: string;
  try {
    text = await res.text();
  } catch {
    throw new ApiError(res.status, SERVER_ERROR_MESSAGE);
  }
  let data: any;
  try {
    data = text ? JSON.parse(text) : undefined;
  } catch {
    data = text || undefined;
  }
  if (!res.ok) {
    const rawMessage: string | undefined = (() => {
      if (!data) return text && text.length < 500 && !text.includes('<html') ? text : undefined;
      if (typeof data === 'string') return data;
      if (typeof data.message === 'string') return data.message;
      if (typeof data.msg === 'string') return data.msg;
      if (typeof data.error === 'string') return data.error;
      if (typeof data.detail === 'string') return data.detail;
      if (Array.isArray(data.errors) && data.errors[0]) {
        const first = data.errors[0];
        if (typeof first === 'string') return first;
        if (typeof first.message === 'string') return first.message;
        if (typeof first.msg === 'string') return first.msg;
      }
      if (typeof data.title === 'string') return data.title;
      // fallback raw text si es corto
      if (text && text.length < 500 && !text.includes('<html')) return text;
      return undefined;
    })();
    // Debug sin exponer URL: solo en dev
    if (typeof __DEV__ !== 'undefined' && __DEV__ && rawMessage) {
      console.log(`[apiFetch] ${path} -> ${res.status}:`, rawMessage);
    }
    const finalMessage = rawMessage ? sanitizeErrorMessage(rawMessage) : `Error ${res.status}. ${SERVER_ERROR_MESSAGE}`;
    throw new ApiError(res.status, finalMessage);
  }
  return data as T;
}

async function tryRefresh(): Promise<boolean> {
  const refreshToken = tokenStore.refreshToken;
  if (!refreshToken) return false;
  try {
    const res = await fetchWithTimeout(`${API_BASE_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) {
      clearTokens();
      return false;
    }
    const data = (await res.json()) as { access_token?: string; accessToken?: string; refresh_token?: string; refreshToken?: string };
    const newAccess = data.accessToken ?? data.access_token ?? null;
    const newRefresh = data.refreshToken ?? data.refresh_token ?? null;
    if (!newAccess) return false;
    setTokens(newAccess, newRefresh ?? refreshToken);
    return true;
  } catch {
    clearTokens();
    return false;
  }
}

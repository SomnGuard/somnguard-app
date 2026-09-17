

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
  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  if (res.status === 204) return undefined as T;

  // AC-004: rotación silenciosa - si 401 y hay refreshToken, intenta renovar una vez
  const isAuthEndpoint = path.includes('/api/v1/auth/refresh') || path.includes('/api/v1/auth/login') || path.includes('/api/v1/auth/logout');
  if (res.status === 401 && !isRetry && !isAuthEndpoint && tokenStore.refreshToken) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      return apiFetchInternal<T>(path, options, true);
    }
  }

  const text = await res.text();
  const data = text ? (JSON.parse(text) as T & { message?: string }) : (undefined as T);
  if (!res.ok) {
    const message =
      (data as { message?: string } | undefined)?.message ??
      `Error ${res.status} al llamar ${path}`;
    throw new ApiError(res.status, message);
  }
  return data as T;
}

async function tryRefresh(): Promise<boolean> {
  const refreshToken = tokenStore.refreshToken;
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
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

import { API_BASE_URL, ApiError, apiFetch, tokenStore } from '@/shared/api/client';

// Contratos reales del backend (v3/api-docs - event-query-controller)
export type EventTypeRef = {
  id: string | null;
  code: string | null;
  name: string | null;
};

export type SeverityRef = {
  id: string | null;
  code: string | null;
  name: string | null;
  priority: number | null;
};

export type EventDetailDto = {
  id: string;
  deviceId: string | null;
  eventType: EventTypeRef | null;
  severity: SeverityRef | null;
  occurredAt: string | null;
  soundPatternId: string | null;
  metadata: Record<string, unknown> | null;
  isOfflineSync: boolean | null;
  hasEvidence: boolean | null;
  createdAt: string | null;
};

export type EventPageResponse = {
  data: EventDetailDto[];
  pagination?: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
};

// Catálogo real de tipos (GET /api/v1/catalogs/event-types -> EventTypeEntity[])
export type EventTypeCatalogItem = {
  id: string | null;
  code: string | null;
  name: string | null;
  eventCategoryId: string | null;
  isActive: boolean | null;
};

export type EventsPage = {
  data: EventDetailDto[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
};

function normalizeEventType(raw: any): EventTypeCatalogItem {
  return {
    id: raw.id ?? null,
    code: raw.code ?? null,
    name: raw.name ?? null,
    eventCategoryId: raw.eventCategoryId ?? raw.event_category_id ?? null,
    isActive: raw.isActive ?? raw.is_active ?? null,
  };
}

let catalogCache: EventTypeCatalogItem[] | null = null;

async function fetchEventTypeCatalog(): Promise<EventTypeCatalogItem[]> {
  if (catalogCache) return catalogCache;
  const raw = await apiFetch<any>('/api/v1/catalogs/event-types', { method: 'GET' });
  const list = Array.isArray(raw) ? raw : (raw?.data ?? []);
  catalogCache = (list as any[]).map(normalizeEventType);
  return catalogCache;
}

function normalizeEvent(raw: any): EventDetailDto {
  return {
    id: raw.id,
    deviceId: raw.deviceId ?? raw.device_id ?? null,
    eventType: raw.eventType ?? raw.event_type ?? null,
    severity: raw.severity ?? null,
    occurredAt: raw.occurredAt ?? raw.occurred_at ?? null,
    soundPatternId: raw.soundPatternId ?? raw.sound_pattern_id ?? null,
    metadata: raw.metadata ?? null,
    isOfflineSync: raw.isOfflineSync ?? raw.is_offline_sync ?? null,
    hasEvidence: raw.hasEvidence ?? raw.has_evidence ?? null,
    createdAt: raw.createdAt ?? raw.created_at ?? null,
  };
}

export type ListEventsParams = {
  deviceId: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
  severity?: string | null;
  eventTypeId?: string | null;
};

const EVIDENCE_TIMEOUT_MS = 15000;

function evidenceErrorFor(status: number): ApiError {
  // Mensajes seguros: nunca exponer minio_key, rutas internas ni detalles del backend.
  // La UI mapea por status a i18n (history.evidence.*).
  if (status === 401) return new ApiError(401, 'Unauthorized evidence request');
  if (status === 403) return new ApiError(403, 'Forbidden evidence request');
  if (status === 404) return new ApiError(404, 'Evidence not found');
  if (status === 502) return new ApiError(502, 'Evidence storage unavailable');
  if (status === 0) return new ApiError(0, 'No hay conexión con el servidor. Verifica tu conexión e intenta nuevamente.');
  return new ApiError(status, 'Ocurrió un error en el servidor. Intenta más tarde.');
}

async function tryRefreshAccessToken(): Promise<boolean> {
  const refreshToken = tokenStore.refreshToken;
  if (!refreshToken) return false;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
        signal: controller.signal,
      });
      if (!res.ok) return false;
      const data = (await res.json()) as { accessToken?: string; access_token?: string; refreshToken?: string; refresh_token?: string };
      const newAccess = data.accessToken ?? data.access_token ?? null;
      const newRefresh = data.refreshToken ?? data.refresh_token ?? refreshToken;
      if (!newAccess) return false;
      const { setTokens } = await import('@/shared/api/client');
      setTokens(newAccess, newRefresh);
      return true;
    } finally {
      clearTimeout(timeoutId);
    }
  } catch {
    return false;
  }
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      reader.onerror = () => reject(evidenceErrorFor(502));
      reader.onload = () => {
        const result = reader.result as string;
        if (typeof result === 'string' && result.startsWith('data:')) {
          resolve(result);
          return;
        }
        reject(evidenceErrorFor(502));
      };
      reader.readAsDataURL(blob);
    } catch {
      reject(evidenceErrorFor(502));
    }
  });
}

async function fetchEvidenceOnce(eventId: string): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), EVIDENCE_TIMEOUT_MS);
  try {
    return await fetch(`${API_BASE_URL}/api/v1/events/${encodeURIComponent(eventId)}/evidence`, {
      method: 'GET',
      headers: {
        ...(tokenStore.accessToken ? { Authorization: `Bearer ${tokenStore.accessToken}` } : {}),
        Accept: 'image/jpeg, image/*;q=0.8, */*;q=0.1',
      },
      signal: controller.signal,
    });
  } catch {
    throw evidenceErrorFor(0);
  } finally {
    clearTimeout(timeoutId);
  }
}

export const eventsApi = {
  // GET /api/v1/events — parámetros oficiales del backend:
  //   device_id: string($uuid) query (requerido)
  //   event_type_id: string($uuid) query (opcional, null = todos)
  //   severity: string query (opcional, null = todas)
  //   from: string($date-time) query (opcional, ISO 8601)
  //   to: string($date-time) query (opcional, ISO 8601)
  //   page: integer($int32) query, default 1
  //   page_size: integer($int32) query, default 20
  // Eventos más recientes primero.
  async listEvents({ deviceId, from, to, page = 1, pageSize = 20, severity, eventTypeId }: ListEventsParams): Promise<EventDetailDto[]> {
    const safePage = Number.isInteger(page) && (page as number) > 0 ? (page as number) : 1;
    const safePageSize = Number.isInteger(pageSize) && (pageSize as number) > 0 ? Math.min(pageSize as number, 100) : 20;
    const parts = [
      `device_id=${encodeURIComponent(deviceId)}`,
      `page=${encodeURIComponent(String(safePage))}`,
      `page_size=${encodeURIComponent(String(safePageSize))}`,
    ];
    if (from) parts.push(`from=${encodeURIComponent(from)}`);
    if (to) parts.push(`to=${encodeURIComponent(to)}`);
    if (severity) parts.push(`severity=${encodeURIComponent(severity)}`);
    if (eventTypeId) parts.push(`event_type_id=${encodeURIComponent(eventTypeId)}`);
    const raw = await apiFetch<any>(`/api/v1/events?${parts.join('&')}`, { method: 'GET' });
    const list = Array.isArray(raw) ? raw : (raw?.data ?? []);
    const events = (list as any[]).map(normalizeEvent);
    // Más recientes primero (por si el backend no ordena)
    return events.sort((a, b) => {
      const ta = a.occurredAt ? new Date(a.occurredAt).getTime() : 0;
      const tb = b.occurredAt ? new Date(b.occurredAt).getTime() : 0;
      return tb - ta;
    });
  },

  async listRecentEvents(deviceId: string, pageSize = 10): Promise<EventDetailDto[]> {
    return this.listEvents({ deviceId, pageSize });
  },

  // Página con metadatos (para paginación numerada exacta).
  // Respuesta backend: { data, pagination: { page, pageSize, totalItems, totalPages } }.
  async listEventsPage({ deviceId, from, to, page = 1, pageSize = 10, severity, eventTypeId }: ListEventsParams): Promise<EventsPage> {
    const safePage = Number.isInteger(page) && (page as number) > 0 ? (page as number) : 1;
    const safePageSize = Number.isInteger(pageSize) && (pageSize as number) > 0 ? Math.min(pageSize as number, 100) : 10;
    const parts = [
      `device_id=${encodeURIComponent(deviceId)}`,
      `page=${encodeURIComponent(String(safePage))}`,
      `page_size=${encodeURIComponent(String(safePageSize))}`,
    ];
    if (from) parts.push(`from=${encodeURIComponent(from)}`);
    if (to) parts.push(`to=${encodeURIComponent(to)}`);
    if (severity) parts.push(`severity=${encodeURIComponent(severity)}`);
    if (eventTypeId) parts.push(`event_type_id=${encodeURIComponent(eventTypeId)}`);
    const raw = await apiFetch<any>(`/api/v1/events?${parts.join('&')}`, { method: 'GET' });
    const list = Array.isArray(raw) ? raw : (raw?.data ?? []);
    const data = (list as any[]).map(normalizeEvent).sort((a, b) => {
      const ta = a.occurredAt ? new Date(a.occurredAt).getTime() : 0;
      const tb = b.occurredAt ? new Date(b.occurredAt).getTime() : 0;
      return tb - ta;
    });
    const p = !Array.isArray(raw) ? (raw?.pagination ?? {}) : {};
    const totalItems = typeof p.totalItems === 'number' ? p.totalItems : data.length;
    const totalPages = typeof p.totalPages === 'number' ? p.totalPages : Math.max(data.length > 0 ? 1 : 0, Math.ceil(totalItems / safePageSize));
    return { data, pagination: { page: safePage, pageSize: safePageSize, totalItems, totalPages } };
  },

  getEventTypeCatalog(): Promise<EventTypeCatalogItem[]> {
    return fetchEventTypeCatalog();
  },

  // Eventos del día (medianoche local -> ahora) para el cajón de Monitoreo
  async listTodayEvents(deviceId: string, pageSize = 20): Promise<EventDetailDto[]> {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return this.listEvents({ deviceId, from: start.toISOString(), pageSize });
  },

  // Nuevo endpoint: GET /api/v1/events/{eventId}/evidence -> 200 image/jpeg (bytes)
  // Flujo backend: sub JWT -> EventRepository (404) -> DeviceAssignment activo (403 si no es suyo)
  // -> EvidenceRepository.findByEventId (404 si has_evidence=false) -> is_active=false -> 404
  // -> minio_key oficial -> MinIO -> bytes. Sin userId/deviceId/minioKey por parámetro.
  // Errores: 401 sin JWT, 403 ajeno, 404 evento/evidencia/inactiva, 502 MinIO faltante.
  async fetchEvidenceDataUrl(eventId: string): Promise<string> {
    if (!eventId) throw evidenceErrorFor(404);
    let res = await fetchEvidenceOnce(eventId);
    // Rotación silenciosa: si 401 y hay refresh, renovar una vez y reintentar
    if (res.status === 401 && tokenStore.refreshToken) {
      const refreshed = await tryRefreshAccessToken();
      if (refreshed) res = await fetchEvidenceOnce(eventId);
    }
    if (!res.ok) throw evidenceErrorFor(res.status);
    const contentType = res.headers.get('content-type') ?? '';
    // Si el servidor devolvió JSON con error pero con 200, tratarlo como fallo genérico
    if (contentType.includes('application/json')) throw evidenceErrorFor(502);
    let blob: Blob;
    try {
      blob = await res.blob();
    } catch {
      throw evidenceErrorFor(502);
    }
    if (!blob || blob.size === 0) throw evidenceErrorFor(502);
    return blobToDataUrl(blob);
  },
};

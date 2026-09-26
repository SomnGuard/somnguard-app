import { apiFetch } from '@/shared/api/client';

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
  pageSize?: number;
};

export const eventsApi = {
  // GET /api/v1/events?device_id=&from=&to=&page=&page_size= - eventos más recientes primero
  async listEvents({ deviceId, from, to, pageSize = 20 }: ListEventsParams): Promise<EventDetailDto[]> {
    const parts = [
      `device_id=${encodeURIComponent(deviceId)}`,
      'page=1',
      `page_size=${encodeURIComponent(String(pageSize))}`,
    ];
    if (from) parts.push(`from=${encodeURIComponent(from)}`);
    if (to) parts.push(`to=${encodeURIComponent(to)}`);
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

  // Eventos del día (medianoche local -> ahora) para el cajón de Monitoreo
  async listTodayEvents(deviceId: string, pageSize = 20): Promise<EventDetailDto[]> {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return this.listEvents({ deviceId, from: start.toISOString(), pageSize });
  },
};

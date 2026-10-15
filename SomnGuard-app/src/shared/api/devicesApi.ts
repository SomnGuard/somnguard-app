import { apiFetch } from '@/shared/api/client';

// Contratos reales del backend (v3/api-docs - device-controller)
export type DeviceResponse = {
  id: string;
  serialNumber: string;
  firmwareVersion: string;
  status: string;
  statusCategory: string;
  lastHeartbeatAt: string | null;
  lastSeenIp: string | null;
  assignedUserId: string | null;
  assignedAt: string | null;
  claimCode: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  appliedConfigVersion: number | null;
  pendingConfigUpdate: boolean | null;
  lastConfigPullAt: string | null;
};

export type DevicePageResponse = {
  data: DeviceResponse[];
  pagination?: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
};

export type ClaimDeviceRequest = {
  claimCode: string;
};

function normalizeDevice(raw: any): DeviceResponse {
  return {
    id: raw.id,
    serialNumber: raw.serialNumber ?? raw.serial_number ?? '',
    firmwareVersion: raw.firmwareVersion ?? raw.firmware_version ?? '',
    status: raw.status ?? '',
    statusCategory: raw.statusCategory ?? raw.status_category ?? '',
    lastHeartbeatAt: raw.lastHeartbeatAt ?? raw.last_heartbeat_at ?? null,
    lastSeenIp: raw.lastSeenIp ?? raw.last_seen_ip ?? null,
    assignedUserId: raw.assignedUserId ?? raw.assigned_user_id ?? null,
    assignedAt: raw.assignedAt ?? raw.assigned_at ?? null,
    claimCode: raw.claimCode ?? raw.claim_code ?? null,
    createdAt: raw.createdAt ?? raw.created_at ?? null,
    updatedAt: raw.updatedAt ?? raw.updated_at ?? null,
    appliedConfigVersion: raw.appliedConfigVersion ?? raw.applied_config_version ?? null,
    pendingConfigUpdate: raw.pendingConfigUpdate ?? raw.pending_config_update ?? null,
    lastConfigPullAt: raw.lastConfigPullAt ?? raw.last_config_pull_at ?? null,
  };
}

export const devicesApi = {
  // GET /api/v1/devices - lista dispositivos (el backend filtra por usuario autenticado)
  async listMyDevices(): Promise<DeviceResponse[]> {
    const raw = await apiFetch<any>('/api/v1/devices?page=1&page_size=20', { method: 'GET' });
    const list = Array.isArray(raw) ? raw : (raw?.data ?? []);
    return (list as any[]).map(normalizeDevice);
  },

  // POST /api/v1/devices/claim { claimCode }
  async claimDevice(claimCode: string): Promise<DeviceResponse> {
    const raw = await apiFetch<any>('/api/v1/devices/claim', {
      method: 'POST',
      body: JSON.stringify({ claimCode: claimCode.trim() } satisfies ClaimDeviceRequest),
    });
    return normalizeDevice(raw);
  },

  // POST /api/v1/devices/{id}/unassign
  async unassignDevice(id: string): Promise<DeviceResponse> {
    const raw = await apiFetch<any>(`/api/v1/devices/${id}/unassign`, { method: 'POST' });
    return normalizeDevice(raw);
  },
};

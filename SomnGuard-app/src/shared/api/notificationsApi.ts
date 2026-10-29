import { apiFetch } from '@/shared/api/client';

export interface DeviceTokenPayload {
  token: string;
  platform: 'fcm' | 'apns' | 'webpush';
  appVersion?: string;
  locale?: string;
}

export interface NotificationPreferences {
  userId?: string;
  pushEnabled: boolean;
  emailEnabled: boolean;
  inAppEnabled: boolean;
  quietHoursStart?: string | null;
  quietHoursEnd?: string | null;
  timezone?: string | null;
  minSeverityCode?: string | null;
}

export interface NotificationItem {
  id: string;
  alertLogId?: string | null;
  title: string;
  message: string;
  channel: string;
  status: string;
  sentAt?: string | null;
  readAt?: string | null;
  createdAt?: string | null;
}

export const notificationsApi = {
  async registerDeviceToken(payload: DeviceTokenPayload): Promise<{ message: string }> {
    return apiFetch<{ message: string }>('/api/v1/notifications/device-tokens', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async disableDeviceToken(token: string): Promise<void> {
    return apiFetch<void>(`/api/v1/notifications/device-tokens?token=${encodeURIComponent(token)}`, {
      method: 'DELETE',
    });
  },

  async getPreferences(): Promise<NotificationPreferences> {
    const raw = await apiFetch<Record<string, unknown>>('/api/v1/users/me/notification-preferences', {
      method: 'GET',
    });
    return {
      userId: (raw.user_id ?? raw.userId) as string | undefined,
      pushEnabled: Boolean(raw.push_enabled ?? raw.pushEnabled ?? true),
      emailEnabled: Boolean(raw.email_enabled ?? raw.emailEnabled ?? false),
      inAppEnabled: Boolean(raw.in_app_enabled ?? raw.inAppEnabled ?? true),
      quietHoursStart: (raw.quiet_hours_start ?? raw.quietHoursStart ?? null) as string | null,
      quietHoursEnd: (raw.quiet_hours_end ?? raw.quietHoursEnd ?? null) as string | null,
      timezone: (raw.timezone ?? null) as string | null,
      minSeverityCode: (raw.min_severity_code ?? raw.minSeverityCode ?? null) as string | null,
    };
  },

  async updatePreferences(prefs: {
    pushEnabled?: boolean;
    emailEnabled?: boolean;
    inAppEnabled?: boolean;
    quietHoursStart?: string | null;
    quietHoursEnd?: string | null;
    timezone?: string;
    minSeverityCode?: string;
  }): Promise<NotificationPreferences> {
    const body: Record<string, unknown> = {
      push_enabled: prefs.pushEnabled,
      email_enabled: prefs.emailEnabled,
      in_app_enabled: prefs.inAppEnabled,
      quiet_hours_start: prefs.quietHoursStart,
      quiet_hours_end: prefs.quietHoursEnd,
      timezone: prefs.timezone,
      min_severity_code: prefs.minSeverityCode,
    };
    const raw = await apiFetch<Record<string, unknown>>('/api/v1/users/me/notification-preferences', {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    return {
      userId: (raw.user_id ?? raw.userId) as string | undefined,
      pushEnabled: Boolean(raw.push_enabled ?? raw.pushEnabled ?? true),
      emailEnabled: Boolean(raw.email_enabled ?? raw.emailEnabled ?? false),
      inAppEnabled: Boolean(raw.in_app_enabled ?? raw.inAppEnabled ?? true),
      quietHoursStart: (raw.quiet_hours_start ?? raw.quietHoursStart ?? null) as string | null,
      quietHoursEnd: (raw.quiet_hours_end ?? raw.quietHoursEnd ?? null) as string | null,
      timezone: (raw.timezone ?? null) as string | null,
      minSeverityCode: (raw.min_severity_code ?? raw.minSeverityCode ?? null) as string | null,
    };
  },

  async listNotifications(page = 1, pageSize = 20): Promise<{ data: NotificationItem[]; total: number }> {
    const raw = await apiFetch<any>(`/api/v1/notifications?page=${page}&page_size=${pageSize}`, {
      method: 'GET',
    });
    const items = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];
    const pagination = raw?.pagination;
    return {
      data: items.map((it: any) => ({
        id: String(it.id ?? ''),
        alertLogId: it.alert_log_id ?? it.alertLogId ?? null,
        title: String(it.title ?? ''),
        message: String(it.message ?? ''),
        channel: String(it.channel ?? ''),
        status: String(it.status ?? ''),
        sentAt: it.sent_at ?? it.sentAt ?? null,
        readAt: it.read_at ?? it.readAt ?? null,
        createdAt: it.created_at ?? it.createdAt ?? null,
      })),
      total: Number(pagination?.total_items ?? pagination?.totalItems ?? items.length),
    };
  },

  async markAsRead(id: string): Promise<void> {
    return apiFetch<void>(`/api/v1/notifications/${encodeURIComponent(id)}/read`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },
};

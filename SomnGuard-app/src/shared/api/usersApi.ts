import { apiFetch } from '@/shared/api/client';

export type UserMeResponse = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  status: string;
  statusCategory: string;
};

export type UpdateMeRequest = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
};

function normalizeUser(raw: any): UserMeResponse {
  return {
    id: raw.id,
    email: raw.email,
    firstName: raw.firstName ?? raw.first_name ?? '',
    lastName: raw.lastName ?? raw.last_name ?? '',
    phone: raw.phone ?? null,
    status: raw.status,
    statusCategory: raw.statusCategory ?? raw.status_category ?? '',
  };
}

export const usersApi = {
  async getMe(): Promise<UserMeResponse> {
    const raw = await apiFetch<any>('/api/v1/users/me', { method: 'GET' });
    return normalizeUser(raw);
  },

  async updateMe(data: UpdateMeRequest): Promise<UserMeResponse> {
    const raw = await apiFetch<any>('/api/v1/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return normalizeUser(raw);
  },

  async deleteMe(): Promise<void> {
    return apiFetch<void>('/api/v1/users/me', { method: 'DELETE' });
  },
};

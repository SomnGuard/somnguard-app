import { apiFetch, setTokens, clearTokens } from '@/shared/api/client';

export type BackendLoginResponse = {
  access_token?: string;
  accessToken?: string;
  refresh_token?: string;
  refreshToken?: string;
  token_type?: string;
  tokenType?: string;
  expires_in?: number;
  expiresIn?: number;
};

export type BackendRegisterResponse = {
  id: string;
  email: string;
};

function pickAccessToken(r: BackendLoginResponse): string | null {
  return r.accessToken ?? r.access_token ?? null;
}

function pickRefreshToken(r: BackendLoginResponse): string | null {
  return r.refreshToken ?? r.refresh_token ?? null;
}

export const authApi = {
  async login(email: string, password: string): Promise<BackendLoginResponse> {
    const res = await apiFetch<BackendLoginResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
    });
    setTokens(pickAccessToken(res), pickRefreshToken(res));
    return res;
  },

  async register(input: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }): Promise<BackendRegisterResponse> {
    return apiFetch<BackendRegisterResponse>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: input.email.trim().toLowerCase(),
        password: input.password,
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        phone: input.phone?.trim() || undefined,
      }),
    });
  },

  async refresh(refreshToken: string): Promise<BackendLoginResponse> {
    const res = await apiFetch<BackendLoginResponse>('/api/v1/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
    setTokens(pickAccessToken(res), pickRefreshToken(res));
    return res;
  },

  async logout(): Promise<void> {
    try {
      const { tokenStore } = await import('@/shared/api/client');
      if (tokenStore.refreshToken) {
        await apiFetch('/api/v1/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken: tokenStore.refreshToken }),
        });
      }
    } finally {
      clearTokens();
    }
  },

  async verifyEmail(token: string): Promise<{ message: string }> {
    return apiFetch<{ message: string }>('/api/v1/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  },

  async verifyPassword(password: string): Promise<{ message: string }> {
    return apiFetch<{ message: string }>('/api/v1/auth/verify-password', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    return apiFetch<{ message: string }>('/api/v1/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    });
  },

  async verifyResetCode(code: string): Promise<{ message: string }> {
    const clean = code.replace(/\D/g, '').slice(0, 6);
    return apiFetch<{ message: string }>('/api/v1/auth/verify-reset-code', {
      method: 'POST',
      body: JSON.stringify({ code: clean }),
    });
  },

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    return apiFetch<{ message: string }>('/api/v1/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token: token.trim(), newPassword }),
    });
  },
};

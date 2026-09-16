import { AuthUser, LoginForm, RegisterForm } from '@/features/auth/types/auth.types';
import { i18n } from '@/shared/i18n';
import { authApi } from '@/shared/api/authApi';
import { ApiError } from '@/shared/api/client';

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function decodeSub(token: string | null): string | null {
  if (!token) return null;

  try {
    const payloadPart = token.split('.')[1];
    if (!payloadPart) return null;

    const normalizedBase64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
    const paddedBase64 = normalizedBase64.padEnd(Math.ceil(normalizedBase64.length / 4) * 4, '=');

    const decodedPayload = globalThis.atob
      ? globalThis.atob(paddedBase64)
      : (() => {
          throw new Error('atob is not available');
        })();

    const bytes = Uint8Array.from(decodedPayload, (char) => char.charCodeAt(0));
    const payload = JSON.parse(new TextDecoder('utf-8').decode(bytes)) as { sub?: string };
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

export const authService = {
  async login(credentials: LoginForm): Promise<AuthUser> {
    try {
      const res = await authApi.login(credentials.email, credentials.password);
      const accessToken = res.accessToken ?? res.access_token ?? null;
      const sub = decodeSub(accessToken);
      const email = normalizeEmail(credentials.email);
      return { id: sub ?? email, name: email.split('@')[0], email };
    } catch (e) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 400)) {
        throw new Error(i18n.t('auth.errors.invalidCredentials'));
      }
      throw e instanceof Error ? e : new Error(i18n.t('auth.errors.loginFailed'));
    }
  },

  async register(form: RegisterForm): Promise<AuthUser> {
    try {
      const res = await authApi.register({
        email: form.email,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
      });
      const name = `${form.firstName.trim()} ${form.lastName.trim()}`.trim();
      return { id: res.id, name, email: normalizeEmail(res.email ?? form.email) };
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        throw new Error(i18n.t('auth.errors.emailAlreadyRegistered'));
      }
      throw e instanceof Error ? e : new Error(i18n.t('auth.errors.registerFailed'));
    }
  },

  async requestPasswordReset(email: string): Promise<void> {
    try {
      await authApi.forgotPassword(email);
    } catch (e) {
      throw e instanceof Error ? e : new Error(i18n.t('auth.errors.emailValidationFailed'));
    }
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      await authApi.resetPassword(token, newPassword);
    } catch (e) {
      if (e instanceof ApiError && (e.status === 400 || e.status === 404)) {
        throw new Error(i18n.t('auth.errors.resetAgain'));
      }
      throw e instanceof Error ? e : new Error(i18n.t('auth.errors.resetFailed'));
    }
  },

  async verifyEmail(token: string): Promise<void> {
    try {
      await authApi.verifyEmail(token);
    } catch (e) {
      throw e instanceof Error ? e : new Error(i18n.t('auth.errors.emailValidationFailed'));
    }
  },

  async logout(): Promise<void> {
    try {
      await authApi.logout();
    } catch {
      return;
    }
  },
};
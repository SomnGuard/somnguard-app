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

function toFriendlyError(e: unknown, fallbackKey: string): Error {
  if (e instanceof ApiError && e.status === 0) {
    return new Error(i18n.t('common.connectionError'));
  }
  // Priorizar mensaje específico de duplicado antes de genérico 500
  if (e instanceof ApiError) {
    const lower = (e.message ?? '').toLowerCase();
    const isPhone = lower.includes('phone') || lower.includes('tel') || lower.includes('cel') || lower.includes('número') || lower.includes('numero') || lower.includes('móvil') || lower.includes('movil');
    const isEmail = lower.includes('email') || lower.includes('correo') || lower.includes('mail');
    if (isPhone) return new Error(i18n.t('auth.errors.phoneAlreadyRegistered'));
    if (isEmail) return new Error(i18n.t('auth.errors.emailAlreadyRegistered'));
    if (e.status >= 500) {
      return new Error(i18n.t('common.serverError'));
    }
  }
  return e instanceof Error ? e : new Error(i18n.t(fallbackKey));
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
      if (e instanceof ApiError && e.status === 0) throw new Error(i18n.t('common.connectionError'));
      if (e instanceof ApiError && (e.status === 401 || e.status === 400)) {
        throw new Error(i18n.t('auth.errors.invalidCredentials'));
      }
      throw toFriendlyError(e, 'auth.errors.loginFailed');
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
      if (e instanceof ApiError && e.status === 0) throw new Error(i18n.t('common.connectionError'));
      if (e instanceof ApiError) {
        const msg = e.message ?? '';
        const lower = msg.toLowerCase();
        const isPhone = lower.includes('phone') || lower.includes('tel') || lower.includes('cel') || lower.includes('número') || lower.includes('numero') || lower.includes('móvil') || lower.includes('movil');
        const isEmail = lower.includes('email') || lower.includes('correo') || lower.includes('mail');
        // Cualquier 4xx/5xx que mencione teléfono/correo debe mapearse al campo correcto, no a genérico
        if (isPhone && !isEmail) throw new Error(i18n.t('auth.errors.phoneAlreadyRegistered'));
        if (isEmail && !isPhone) throw new Error(i18n.t('auth.errors.emailAlreadyRegistered'));
        if (isPhone) throw new Error(i18n.t('auth.errors.phoneAlreadyRegistered'));
        if (isEmail) throw new Error(i18n.t('auth.errors.emailAlreadyRegistered'));
        // Si trae mensaje útil del backend y es 4xx, propagarlo para que el hook lo posicione
        if (e.status >= 400 && e.status < 500 && msg) throw new Error(msg);
      }
      throw toFriendlyError(e, 'auth.errors.registerFailed');
    }
  },

  async requestPasswordReset(email: string): Promise<void> {
    try {
      await authApi.forgotPassword(email);
    } catch (e) {
      throw toFriendlyError(e, 'auth.errors.emailValidationFailed');
    }
  },

  async verifyResetCode(code: string): Promise<void> {
    const clean = code.replace(/\D/g, '').slice(0, 6);
    if (!/^\d{6}$/.test(clean)) throw new Error(i18n.t('auth.errors.invalidResetCode'));
    try {
      await authApi.verifyResetCode(clean);
    } catch (e) {
      if (e instanceof ApiError && e.status === 0) throw new Error(i18n.t('common.connectionError'));
      if (e instanceof ApiError && e.status === 400) {
        const msg = (e.message ?? '').toLowerCase();
        if (msg.includes('expir')) throw new Error(i18n.t('auth.errors.resetCodeExpired'));
        if (msg.includes('utilizado') || msg.includes('usado') || msg.includes('used')) throw new Error(i18n.t('auth.errors.resetCodeUsed'));
        // IllegalArgumentException o genérico del backend -> mensaje amigable
        if (msg.includes('incorrect') || msg.includes('inválid') || msg.includes('invalid')) throw new Error(i18n.t('auth.errors.resetCodeIncorrect'));
        throw new Error(i18n.t('auth.errors.resetCodeInvalid'));
      }
      throw toFriendlyError(e, 'auth.errors.resetCodeInvalid');
    }
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      await authApi.resetPassword(token, newPassword);
    } catch (e) {
      if (e instanceof ApiError && e.status === 0) throw new Error(i18n.t('common.connectionError'));
      if (e instanceof ApiError && (e.status === 400 || e.status === 404)) {
        const msg = (e.message ?? '').toLowerCase();
        if (msg.includes('expir')) throw new Error(i18n.t('auth.errors.resetCodeExpired'));
        throw new Error(i18n.t('auth.errors.resetAgain'));
      }
      throw toFriendlyError(e, 'auth.errors.resetFailed');
    }
  },

  async verifyEmail(token: string): Promise<void> {
    try {
      await authApi.verifyEmail(token);
    } catch (e) {
      throw toFriendlyError(e, 'auth.errors.emailValidationFailed');
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
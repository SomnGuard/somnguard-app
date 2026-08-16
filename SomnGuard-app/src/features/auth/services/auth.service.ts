import { AuthUser, LoginForm, RegisterForm } from '@/features/auth/types/auth.types';
import { i18n } from '@/shared/i18n';

type MockUser = AuthUser & { password: string };

const MOCK_USERS: MockUser[] = [
  { id: '1', name: 'Admin SomnGuard', email: 'admin@somnguard.com', password: '1234' },
  { id: '2', name: 'Usuario de prueba', email: 'prueba@test.com', password: 'abcd' },
];

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function toAuthUser(user: MockUser): AuthUser {
  return { id: user.id, name: user.name, email: user.email };
}

export const authService = {
  async login(credentials: LoginForm): Promise<AuthUser> {
    const email = normalizeEmail(credentials.email);
    const user = MOCK_USERS.find((item) => item.email === email && item.password === credentials.password);
    if (!user) throw new Error(i18n.t('auth.errors.invalidCredentials'));
    return toAuthUser(user);
  },

  async register(form: RegisterForm): Promise<AuthUser> {
    const email = normalizeEmail(form.email);
    const existingUser = MOCK_USERS.find((item) => item.email === email);
    if (existingUser) throw new Error(i18n.t('auth.errors.emailAlreadyRegistered'));

    const user: MockUser = {
      id: String(Date.now()),
      name: `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
      email,
      password: form.password,
    };
    MOCK_USERS.push(user);
    return toAuthUser(user);
  },

  async requestPasswordReset(email: string): Promise<AuthUser> {
    const normalizedEmail = normalizeEmail(email);
    const user = MOCK_USERS.find((item) => item.email === normalizedEmail);
    if (!user) throw new Error(i18n.t('auth.errors.emailNotRegistered'));
    return toAuthUser(user);
  },

  async resetPassword(email: string, newPassword: string): Promise<void> {
    const normalizedEmail = normalizeEmail(email);
    const user = MOCK_USERS.find((item) => item.email === normalizedEmail);
    if (!user) throw new Error(i18n.t('auth.errors.resetAgain'));
    user.password = newPassword;
  },

  isRegisteredEmail(email: string): boolean {
    const normalizedEmail = normalizeEmail(email);
    return MOCK_USERS.some((item) => item.email === normalizedEmail);
  },

  async logout(): Promise<void> {
    return;
  },
};

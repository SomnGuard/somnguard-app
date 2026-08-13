export type LoginForm = { email: string; password: string };
export type LoginErrors = Partial<Record<keyof LoginForm | 'general', string>>;
export type RegisterForm = { firstName: string; lastName: string; email: string; password: string; confirmPassword: string; phone: string };
export type RegisterErrors = Partial<Record<keyof RegisterForm, string>>;
export type AuthUser = { id: string; name: string; email: string };



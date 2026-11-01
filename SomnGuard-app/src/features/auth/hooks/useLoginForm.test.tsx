import { act, renderHook } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { authService } from '@/features/auth/services/auth.service';
import { useLoginForm } from '@/features/auth/hooks/useLoginForm';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('@/features/auth/services/auth.service', () => ({
  authService: { login: jest.fn() },
}));

describe('useLoginForm', () => {
  const login = jest.mocked(authService.login);

  beforeEach(() => {
    login.mockReset();
  });

  it('validates required fields before calling the authentication service', async () => {
    const onSuccess = jest.fn();
    const { result } = renderHook(() => useLoginForm(onSuccess));

    await act(async () => {
      await result.current.submit();
    });

    expect(result.current.errors.email).toBe('auth.errors.emailRequired');
    expect(result.current.errors.password).toBe('auth.errors.passwordRequired');
    expect(login).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('submits valid credentials and calls the success handler', async () => {
    const onSuccess = jest.fn();
    login.mockResolvedValue({ id: 'user-1', name: 'User', email: 'user@example.com' });
    const { result } = renderHook(() => useLoginForm(onSuccess));

    act(() => {
      result.current.updateField('email', 'user@example.com');
      result.current.updateField('password', 'StrongPass123!');
    });

    await act(async () => {
      await result.current.submit();
    });

    expect(login).toHaveBeenCalledWith({ email: 'user@example.com', password: 'StrongPass123!' });
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.errors).toEqual({});
  });

  it('exposes authentication failures and allows the user to correct the form', async () => {
    const onSuccess = jest.fn();
    login.mockRejectedValueOnce(new Error('Invalid credentials'));
    const { result } = renderHook(() => useLoginForm(onSuccess));

    act(() => {
      result.current.updateField('email', 'user@example.com');
      result.current.updateField('password', 'wrong-password');
    });

    await act(async () => {
      await result.current.submit();
    });

    expect(result.current.errors.general).toBe('Invalid credentials');
    expect(onSuccess).not.toHaveBeenCalled();

    act(() => {
      result.current.updateField('password', 'corrected-password');
    });

    expect(result.current.errors.general).toBeUndefined();
  });
});

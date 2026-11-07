import * as SecureStore from 'expo-secure-store';
import { waitFor } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { clearStoredTokens, persistStoredTokens, readStoredTokens } from '@/shared/api/sessionStore';

describe('sessionStore', () => {
  const secureStore = {
    isAvailableAsync: jest.spyOn(SecureStore, 'isAvailableAsync'),
    getItemAsync: jest.spyOn(SecureStore, 'getItemAsync'),
    setItemAsync: jest.spyOn(SecureStore, 'setItemAsync'),
    deleteItemAsync: jest.spyOn(SecureStore, 'deleteItemAsync'),
  };

  beforeEach(() => {
    jest.resetAllMocks();
    secureStore.isAvailableAsync.mockResolvedValue(true);
    secureStore.getItemAsync.mockResolvedValue(null);
    secureStore.setItemAsync.mockResolvedValue(undefined);
    secureStore.deleteItemAsync.mockResolvedValue(undefined);
  });

  it('reads an access and refresh token from SecureStore', async () => {
    secureStore.getItemAsync
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token');

    await expect(readStoredTokens()).resolves.toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    expect(secureStore.getItemAsync).toHaveBeenNthCalledWith(1, 'somnguard.accessToken');
    expect(secureStore.getItemAsync).toHaveBeenNthCalledWith(2, 'somnguard.refreshToken');
  });

  it('returns no session when storage is unavailable or the token pair is incomplete', async () => {
    secureStore.isAvailableAsync.mockResolvedValueOnce(false);
    await expect(readStoredTokens()).resolves.toBeNull();
    expect(secureStore.getItemAsync).not.toHaveBeenCalled();

    secureStore.getItemAsync.mockResolvedValueOnce('access-token').mockResolvedValueOnce(null);
    await expect(readStoredTokens()).resolves.toBeNull();
  });

  it('persists both tokens under their separate keys', async () => {
    persistStoredTokens('access-token', 'refresh-token');

    await waitFor(() => expect(secureStore.setItemAsync).toHaveBeenCalledTimes(2));
    expect(secureStore.setItemAsync).toHaveBeenNthCalledWith(1, 'somnguard.accessToken', 'access-token');
    expect(secureStore.setItemAsync).toHaveBeenNthCalledWith(2, 'somnguard.refreshToken', 'refresh-token');
  });

  it('deletes both stored tokens when clearing the session', async () => {
    clearStoredTokens();

    await waitFor(() => expect(secureStore.deleteItemAsync).toHaveBeenCalledTimes(2));
    expect(secureStore.deleteItemAsync).toHaveBeenNthCalledWith(1, 'somnguard.accessToken');
    expect(secureStore.deleteItemAsync).toHaveBeenNthCalledWith(2, 'somnguard.refreshToken');
  });
});

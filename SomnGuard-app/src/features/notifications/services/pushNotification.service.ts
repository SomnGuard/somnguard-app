import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { notificationsApi } from '@/shared/api/notificationsApi';

const PUSH_TOKEN_STORAGE_KEY = 'somnguard_push_token';

export const pushNotificationService = {
  async registerCurrentDeviceToken(): Promise<string | null> {
    try {
      let token: string | null = null;

      if (Platform.OS !== 'web') {
        token = await SecureStore.getItemAsync(PUSH_TOKEN_STORAGE_KEY);
        if (!token) {
          token = `token-${Platform.OS}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
          await SecureStore.setItemAsync(PUSH_TOKEN_STORAGE_KEY, token);
        }
      } else {
        token = typeof localStorage !== 'undefined' ? localStorage.getItem(PUSH_TOKEN_STORAGE_KEY) : null;
        if (!token) {
          token = `token-web-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem(PUSH_TOKEN_STORAGE_KEY, token);
          }
        }
      }

      if (!token) return null;

      const platform: 'fcm' | 'apns' | 'webpush' =
        Platform.OS === 'ios' ? 'apns' : Platform.OS === 'android' ? 'fcm' : 'webpush';

      await notificationsApi.registerDeviceToken({
        token,
        platform,
        appVersion: '1.0.0',
        locale: 'es',
      });

      return token;
    } catch (e) {
      if (__DEV__) {
        console.warn('[pushNotificationService] Error registering push token:', e);
      }
      return null;
    }
  },

  async unregisterCurrentDeviceToken(): Promise<void> {
    try {
      let token: string | null = null;
      if (Platform.OS !== 'web') {
        token = await SecureStore.getItemAsync(PUSH_TOKEN_STORAGE_KEY);
      } else if (typeof localStorage !== 'undefined') {
        token = localStorage.getItem(PUSH_TOKEN_STORAGE_KEY);
      }

      if (token) {
        await notificationsApi.disableDeviceToken(token);
      }
    } catch (e) {
      if (__DEV__) {
        console.warn('[pushNotificationService] Error unregistering push token:', e);
      }
    }
  },
};

import Constants from 'expo-constants';
import { Platform } from 'react-native';

declare const require: (moduleName: string) => { registerGlobals: () => void };

let initialized = false;
let initializationError: string | null = null;

export function initializeLiveKit() {
  if (initialized || Platform.OS === 'web' || Constants.appOwnership === 'expo') return;

  try {
    // Load only in a native build. Importing the package eagerly can make Expo Go
    // or the web bundle fail before the MJPEG relay fallback can be used.
    // En Expo Go no hay módulo WebRTC nativo: el relay MJPEG es el único modo.
    const { registerGlobals } = require('@livekit/react-native');
    registerGlobals();
    initialized = true;
    console.info('[LiveKit] WebRTC nativo listo (APK/dev-client)');
  } catch (error) {
    initializationError = error instanceof Error ? error.message : String(error);
    console.error('[LiveKit] No se pudieron registrar los globales WebRTC:', error);
  }
}

export function isLiveKitReady() {
  return initialized;
}

export function getLiveKitInitializationError() {
  return initializationError;
}

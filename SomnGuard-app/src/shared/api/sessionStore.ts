import * as SecureStore from 'expo-secure-store';

// Primitivas de persistencia de sesión (solo tokens, nunca contraseñas).
// Sin dependencias internas para evitar ciclos: client.ts lo usa en
// setTokens/clearTokens y session.ts para lectura/restauración.
const ACCESS_KEY = 'somnguard.accessToken';
const REFRESH_KEY = 'somnguard.refreshToken';

async function isUsable(): Promise<boolean> {
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
}

export async function readStoredTokens(): Promise<{ accessToken: string; refreshToken: string } | null> {
  try {
    if (!(await isUsable())) return null;
    const [accessToken, refreshToken] = await Promise.all([
      SecureStore.getItemAsync(ACCESS_KEY),
      SecureStore.getItemAsync(REFRESH_KEY),
    ]);
    if (!accessToken || !refreshToken) return null;
    return { accessToken, refreshToken };
  } catch {
    return null;
  }
}

// Fire-and-forget: nunca lanza, nunca bloquea el flujo de autenticación.
export function persistStoredTokens(accessToken: string | null, refreshToken: string | null): void {
  void (async () => {
    try {
      if (!(await isUsable())) return;
      if (accessToken && refreshToken) {
        await Promise.all([
          SecureStore.setItemAsync(ACCESS_KEY, accessToken),
          SecureStore.setItemAsync(REFRESH_KEY, refreshToken),
        ]);
      } else {
        await Promise.all([
          SecureStore.deleteItemAsync(ACCESS_KEY),
          SecureStore.deleteItemAsync(REFRESH_KEY),
        ]);
      }
    } catch {
      // Almacenamiento no disponible: la sesión sigue válida solo en memoria.
    }
  })();
}

export function clearStoredTokens(): void {
  persistStoredTokens(null, null);
}

import { authApi } from '@/shared/api/authApi';
import { clearTokens, tokenStore } from '@/shared/api/client';
import { clearStoredTokens, readStoredTokens } from '@/shared/api/sessionStore';

// Restauración de sesión al arrancar: refresh guardado -> endpoint existente
// POST /api/v1/auth/refresh -> hidrata tokenStore. Promesa memoizada para
// evitar renovaciones duplicadas si arranque y primer fetch coinciden.
let restorePromise: Promise<boolean> | null = null;

export function restoreSession(): Promise<boolean> {
  if (restorePromise) return restorePromise;
  restorePromise = (async () => {
    try {
      const saved = await readStoredTokens();
      if (!saved) return false;
      // Hidratar solo memoria (sin persistir: evita que los tokens viejos
      // pisen a los renovados si los writes se intercalan). authApi.refresh
      // persiste el par nuevo vía setTokens.
      tokenStore.accessToken = saved.accessToken;
      tokenStore.refreshToken = saved.refreshToken;
      await authApi.refresh(saved.refreshToken);
      return true;
    } catch {
      // Refresh inválido/expirado o sin red: limpiar todo e ir a login.
      clearTokens();
      clearStoredTokens();
      return false;
    } finally {
      restorePromise = null;
    }
  })();
  return restorePromise;
}

export async function clearSession(): Promise<void> {
  clearTokens();
  clearStoredTokens();
}

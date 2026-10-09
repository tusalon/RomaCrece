import type { RomaCreceAccess } from "./rservas-auth";

/**
 * Estado que hace posible abrir RomaCrece con internet inestable:
 *  - el último acceso comprobado, guardado unas horas (la base sigue protegiendo los datos
 *    con RLS; esto solo decide si se muestra la app o la pantalla de bloqueo);
 *  - una marca de «cambios sin enviar», para que la nube no pise lo que la usuaria editó
 *    sin conexión;
 *  - cómo distinguir «no hay red» de «no tienes acceso».
 */

export const ACCESS_CACHE_KEY = "romacrece:access:v1";
export const DIRTY_KEY = "romacrece:pending-sync:v1";
export const ACCESS_CACHE_MAX_AGE_MS = 72 * 60 * 60 * 1000;

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function defaultStorage(): StorageLike | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

type CachedAccess = { userId: string; savedAt: number; access: RomaCreceAccess };

export function writeAccessCache(
  userId: string,
  access: RomaCreceAccess,
  storage: StorageLike | null = defaultStorage(),
  now = Date.now(),
) {
  if (!storage) return;
  try {
    if (access.allowed) {
      const entry: CachedAccess = { userId, savedAt: now, access };
      storage.setItem(ACCESS_CACHE_KEY, JSON.stringify(entry));
    } else {
      // Si el servidor dice que no hay acceso, no se guarda nada: nunca se prolonga un bloqueo.
      storage.removeItem(ACCESS_CACHE_KEY);
    }
  } catch {
    // Sin almacenamiento disponible: la app sigue funcionando, solo que sin esta ayuda.
  }
}

/** Devuelve el último acceso positivo de esta usuaria si tiene menos de 72 horas. */
export function readAccessCache(
  userId: string,
  storage: StorageLike | null = defaultStorage(),
  now = Date.now(),
): RomaCreceAccess | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(ACCESS_CACHE_KEY);
    if (!raw) return null;
    const entry = JSON.parse(raw) as Partial<CachedAccess>;
    if (entry.userId !== userId || !entry.access?.allowed) return null;
    if (typeof entry.savedAt !== "number" || now - entry.savedAt > ACCESS_CACHE_MAX_AGE_MS || entry.savedAt > now + 60_000) {
      return null;
    }
    return entry.access;
  } catch {
    return null;
  }
}

export function clearAccessCache(storage: StorageLike | null = defaultStorage()) {
  try {
    storage?.removeItem(ACCESS_CACHE_KEY);
  } catch {
    // nada que limpiar
  }
}

export function markPendingSync(userId: string, storage: StorageLike | null = defaultStorage()) {
  try {
    storage?.setItem(DIRTY_KEY, userId);
  } catch {
    // nada que marcar
  }
}

export function hasPendingSync(userId: string, storage: StorageLike | null = defaultStorage()) {
  try {
    return storage?.getItem(DIRTY_KEY) === userId;
  } catch {
    return false;
  }
}

export function hasAnyPendingSync(storage: StorageLike | null = defaultStorage()) {
  try {
    return Boolean(storage?.getItem(DIRTY_KEY));
  } catch {
    return false;
  }
}

export function clearPendingSync(storage: StorageLike | null = defaultStorage()) {
  try {
    storage?.removeItem(DIRTY_KEY);
  } catch {
    // nada que limpiar
  }
}

/**
 * ¿El fallo es de conexión y no de permisos? Una respuesta del servidor (401, 403, RLS)
 * nunca cuenta como «sin red».
 */
export function isNetworkError(error: unknown, online: boolean | undefined = typeof navigator !== "undefined" ? navigator.onLine : undefined): boolean {
  if (online === false) return true;
  if (!error) return false;
  const status = typeof (error as { status?: unknown }).status === "number" ? (error as { status: number }).status : null;
  if (status !== null && status > 0) return false;
  if (typeof (error as { code?: unknown }).code === "string" && /^(42|PGRST|23|P0)/.test((error as { code: string }).code)) return false;
  const text = `${(error as { name?: string }).name ?? ""} ${(error as { message?: string }).message ?? ""}`;
  return error instanceof TypeError || /failed to fetch|networkerror|network request failed|load failed|fetch failed|timeout|timed out|offline/i.test(text);
}

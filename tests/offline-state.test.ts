import assert from "node:assert/strict";
import test from "node:test";
import {
  ACCESS_CACHE_MAX_AGE_MS,
  clearPendingSync,
  hasAnyPendingSync,
  hasPendingSync,
  isNetworkError,
  markPendingSync,
  readAccessCache,
  writeAccessCache,
} from "../app/offline-state.ts";
import type { RomaCreceAccess } from "../app/rservas-auth.ts";

function fakeStorage() {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
  };
}

const allowed: RomaCreceAccess = {
  allowed: true,
  reason: "active",
  businessId: "b1",
  businessSlug: "salon",
  businessName: "Salón de prueba",
  subscriptionState: "active",
  renewalDate: null,
};

test("el acceso guardado sirve hasta 72 horas para la misma usuaria", () => {
  const storage = fakeStorage();
  const now = 1_700_000_000_000;
  writeAccessCache("u1", allowed, storage, now);
  assert.deepEqual(readAccessCache("u1", storage, now + 1000), allowed);
  assert.deepEqual(readAccessCache("u1", storage, now + ACCESS_CACHE_MAX_AGE_MS), allowed, "justo en el límite todavía vale");
  assert.equal(readAccessCache("u1", storage, now + ACCESS_CACHE_MAX_AGE_MS + 1), null, "pasadas las 72 h caduca");
});

test("el acceso guardado de otra usuaria no se usa", () => {
  const storage = fakeStorage();
  writeAccessCache("u1", allowed, storage, 1000);
  assert.equal(readAccessCache("u2", storage, 2000), null);
});

test("si el servidor dice que no hay acceso, se borra lo guardado", () => {
  const storage = fakeStorage();
  writeAccessCache("u1", allowed, storage, 1000);
  writeAccessCache("u1", { ...allowed, allowed: false, reason: "subscription_expired" }, storage, 2000);
  assert.equal(readAccessCache("u1", storage, 3000), null);
});

test("un reloj adelantado o datos dañados no dan acceso", () => {
  const storage = fakeStorage();
  writeAccessCache("u1", allowed, storage, 10_000_000);
  assert.equal(readAccessCache("u1", storage, 1000), null, "guardado «en el futuro»");
  storage.setItem("romacrece:access:v1", "{no es json");
  assert.equal(readAccessCache("u1", storage, 20_000_000), null);
});

test("los cambios sin enviar se recuerdan por usuaria y se pueden limpiar", () => {
  const storage = fakeStorage();
  assert.equal(hasAnyPendingSync(storage), false);
  markPendingSync("u1", storage);
  assert.equal(hasPendingSync("u1", storage), true);
  assert.equal(hasPendingSync("u2", storage), false);
  assert.equal(hasAnyPendingSync(storage), true);
  clearPendingSync(storage);
  assert.equal(hasAnyPendingSync(storage), false);
});

test("distingue «sin red» de «sin permiso»", () => {
  assert.equal(isNetworkError(new TypeError("Failed to fetch"), true), true);
  assert.equal(isNetworkError({ message: "Load failed" }, true), true);
  assert.equal(isNetworkError({ message: "cualquier cosa" }, false), true, "el navegador sabe que no hay conexión");
  assert.equal(isNetworkError({ status: 403, message: "forbidden" }, true), false);
  assert.equal(isNetworkError({ status: 401, message: "jwt expired" }, true), false);
  assert.equal(isNetworkError({ code: "42501", message: "permission denied" }, true), false);
  assert.equal(isNetworkError({ code: "PGRST301", message: "JWT expired" }, true), false);
  assert.equal(isNetworkError(null, true), false);
});

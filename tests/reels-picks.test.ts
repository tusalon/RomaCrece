import assert from "node:assert/strict";
import test from "node:test";
import {
  REELS_STATE_KEY,
  emptyReelsState,
  fillTemplate,
  hasPendingReels,
  markSent,
  pendingPayload,
  readReelsState,
  setPickNote,
  togglePick,
  writeReelsState,
} from "../app/reels-picks.ts";

function fakeStorage() {
  const data = new Map<string, string>();
  return { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => void data.set(key, value) };
}

test("marcar y desmarcar sin haber enviado no deja nada pendiente", () => {
  let state = togglePick(emptyReelsState(), "reel-01", 1000);
  assert.equal(hasPendingReels(state), true);
  state = togglePick(state, "reel-01");
  assert.equal(hasPendingReels(state), false);
  assert.deepEqual(state.removes, []);
});

test("desmarcar un reel ya enviado pide quitarlo de la nube", () => {
  let state = togglePick(emptyReelsState(), "reel-02", 1000);
  state = markSent(state, pendingPayload(state));
  assert.equal(hasPendingReels(state), false);
  state = togglePick(state, "reel-02");
  assert.deepEqual(state.removes, ["reel-02"]);
  assert.deepEqual(pendingPayload(state).removes, ["reel-02"]);
  state = togglePick(state, "reel-02", 2000);
  assert.deepEqual(state.removes, [], "volver a marcarlo cancela la baja");
});

test("lo marcado durante el envío sigue pendiente", () => {
  let state = togglePick(emptyReelsState(), "reel-03", 1000);
  const enviado = pendingPayload(state);
  state = togglePick(state, "reel-04", 1500);
  state = setPickNote(state, "reel-03", "Con mi hermana");
  state = markSent(state, enviado);
  assert.equal(state.picks["reel-03"].synced, false, "la nota cambió después de enviar");
  assert.equal(state.picks["reel-04"].synced, false);
});

test("ids desconocidos se ignoran y el estado dañado no rompe", () => {
  assert.deepEqual(togglePick(emptyReelsState(), "reel-99"), emptyReelsState());
  const storage = fakeStorage();
  storage.setItem(REELS_STATE_KEY, "{no es json");
  assert.deepEqual(readReelsState(storage), emptyReelsState());
  writeReelsState({ picks: { "reel-01": { at: 1, note: "x", synced: true }, "reel-77": { at: 1, note: "", synced: true } }, removes: ["reel-77"] }, storage);
  const leido = readReelsState(storage);
  assert.deepEqual(Object.keys(leido.picks), ["reel-01"]);
  assert.deepEqual(leido.removes, []);
});

test("las marcas del texto se rellenan con los datos de la dueña", () => {
  const vars = { salon: "Brillo", instagram: "brillo.nails", cuentaRoma: "rservasroma" };
  assert.equal(fillTemplate("{salon} · {instagram} · {cuenta_roma}", vars), "Brillo · @brillo.nails · @rservasroma");
  assert.equal(fillTemplate("{instagram}", { ...vars, instagram: "" }), "tu Instagram");
});

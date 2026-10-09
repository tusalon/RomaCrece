import { REELS, type ReelEntry } from "./reels-catalog.ts";

/**
 * Reels marcados con «Quiero hacerlo». Se guardan primero en el dispositivo y se envían a la
 * nube cuando hay red: así marcar un reel funciona aunque la conexión falle.
 */

export const REELS_STATE_KEY = "romacrece:reels:v1";

export type ReelPick = { at: number; note: string; synced: boolean };
export type ReelsState = { picks: Record<string, ReelPick>; removes: string[] };

type StorageLike = Pick<Storage, "getItem" | "setItem">;

export const emptyReelsState = (): ReelsState => ({ picks: {}, removes: [] });

function defaultStorage(): StorageLike | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

const knownIds = new Set(REELS.map((reel) => reel.id));

export function readReelsState(storage: StorageLike | null = defaultStorage()): ReelsState {
  try {
    const raw = storage?.getItem(REELS_STATE_KEY);
    if (!raw) return emptyReelsState();
    const parsed = JSON.parse(raw) as Partial<ReelsState>;
    const picks: Record<string, ReelPick> = {};
    for (const [id, pick] of Object.entries(parsed.picks ?? {})) {
      if (!knownIds.has(id) || !pick || typeof pick.at !== "number") continue;
      picks[id] = { at: pick.at, note: String(pick.note ?? "").slice(0, 280), synced: pick.synced === true };
    }
    const removes = (parsed.removes ?? []).filter((id) => typeof id === "string" && knownIds.has(id));
    return { picks, removes };
  } catch {
    return emptyReelsState();
  }
}

export function writeReelsState(state: ReelsState, storage: StorageLike | null = defaultStorage()) {
  try {
    storage?.setItem(REELS_STATE_KEY, JSON.stringify(state));
  } catch {
    // Sin espacio en el dispositivo: la marca sigue en pantalla durante esta sesión.
  }
}

/** Marca o desmarca un reel; devuelve el estado nuevo sin tocar el anterior. */
export function togglePick(state: ReelsState, reelId: string, now = Date.now()): ReelsState {
  if (!knownIds.has(reelId)) return state;
  if (state.picks[reelId]) {
    const { [reelId]: removed, ...rest } = state.picks;
    // Solo hay que avisar a la nube si esa marca ya había llegado allí.
    const removes = removed.synced && !state.removes.includes(reelId) ? [...state.removes, reelId] : state.removes;
    return { picks: rest, removes };
  }
  return { picks: { ...state.picks, [reelId]: { at: now, note: "", synced: false } }, removes: state.removes.filter((id) => id !== reelId) };
}

export function setPickNote(state: ReelsState, reelId: string, note: string): ReelsState {
  const pick = state.picks[reelId];
  if (!pick) return state;
  return { ...state, picks: { ...state.picks, [reelId]: { ...pick, note: note.slice(0, 280), synced: false } } };
}

export const hasPendingReels = (state: ReelsState) => state.removes.length > 0 || Object.values(state.picks).some((pick) => !pick.synced);

export function pendingPayload(state: ReelsState) {
  const titles = new Map(REELS.map((reel) => [reel.id, reel.title]));
  return {
    picks: Object.entries(state.picks)
      .filter(([, pick]) => !pick.synced)
      .map(([reelId, pick]) => ({ reelId, title: titles.get(reelId) ?? reelId, note: pick.note })),
    removes: state.removes,
  };
}

/** Marca como enviado solo lo que iba en el envío: lo marcado mientras tanto sigue pendiente. */
export function markSent(state: ReelsState, sent: ReturnType<typeof pendingPayload>): ReelsState {
  const picks = { ...state.picks };
  for (const { reelId, note } of sent.picks) {
    if (picks[reelId] && picks[reelId].note === note) picks[reelId] = { ...picks[reelId], synced: true };
  }
  return { picks, removes: state.removes.filter((id) => !sent.removes.includes(id) || Boolean(picks[id])) };
}

/** Las marcas {salon}, {instagram} y {cuenta_roma} se rellenan con los datos de la dueña. */
export function fillTemplate(text: string, vars: { salon: string; instagram: string; cuentaRoma: string }) {
  const handle = (value: string) => value.trim().replace(/^@?/, "@");
  return text
    .replaceAll("{salon}", vars.salon.trim() || "tu salón")
    .replaceAll("{instagram}", vars.instagram.trim() ? handle(vars.instagram) : "tu Instagram")
    .replaceAll("{cuenta_roma}", handle(vars.cuentaRoma));
}

export const scriptAsText = (reel: ReelEntry) =>
  reel.script.map((block) => (block.who ? `${block.who}: ${block.text}` : block.text)).join("\n");

export const captionAsText = (reel: ReelEntry, vars: Parameters<typeof fillTemplate>[1]) =>
  `${fillTemplate(reel.caption, vars)}\n\n${reel.hashtags.join(" ")}`;

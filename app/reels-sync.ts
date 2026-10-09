import type { pendingPayload } from "./reels-picks.ts";
import { supabase } from "./supabase";

/** Envía a la nube lo marcado y lo quitado. Si falla, lanza el error y todo queda pendiente. */
export async function sendReelPicks(payload: ReturnType<typeof pendingPayload>): Promise<void> {
  if (!supabase) throw new Error("supabase_missing");
  const { error } = await supabase.functions.invoke("submit-reel-picks", { body: payload });
  if (error) throw error;
}

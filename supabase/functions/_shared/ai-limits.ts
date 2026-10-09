import type { SupabaseClient } from "npm:@supabase/supabase-js@2.110.8";

// Tope diario por salón. Se sube aquí si hace falta; la tabla lo hace cumplir en el servidor.
export const AI_DAILY_LIMITS = { content: 15, audit: 6 } as const;

export const AI_LIMIT_MESSAGE = "Hoy ya usaste todos tus análisis e ideas con IA. Mañana vuelven a estar disponibles; mientras tanto puedes usar «Crear semana automática».";

/** true si todavía hay cupo hoy. Si la base falla, se deja pasar: un fallo nuestro no bloquea a la clienta. */
export async function takeAiQuota(admin: SupabaseClient, negocioId: string, kind: keyof typeof AI_DAILY_LIMITS): Promise<boolean> {
  const { data, error } = await admin.rpc("romacrece_take_ai_quota", {
    p_negocio: negocioId,
    p_kind: kind,
    p_limit: AI_DAILY_LIMITS[kind],
  });
  if (error) {
    console.error("No se pudo comprobar el tope de IA", error);
    return true;
  }
  return data === true;
}

/** Recorta un texto que llega del navegador antes de meterlo en un prompt. */
export const clip = (value: unknown, max: number) => String(value ?? "").slice(0, max);

/** Limita el tamaño de un objeto del navegador antes de usarlo en un prompt. */
export function clipJson(value: unknown, maxChars: number) {
  const text = JSON.stringify(value ?? null);
  return text.length <= maxChars ? value : null;
}

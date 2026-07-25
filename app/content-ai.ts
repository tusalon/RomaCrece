import type { ContentIdea } from "./audit-model";
import { supabase } from "./supabase";

type ContentResponse = {
  ideas: ContentIdea[];
  memorySignals: number;
};

type ContentErrorPayload = {
  error?: string;
  code?: string;
};

export class AiContentError extends Error {
  code: string;

  constructor(payload: ContentErrorPayload) {
    super(payload.error || "No pudimos crear contenido con Gemini.");
    this.name = "AiContentError";
    this.code = payload.code || "content_unavailable";
  }
}

async function parseFunctionError(error: unknown): Promise<ContentErrorPayload> {
  if (error && typeof error === "object" && "context" in error) {
    const context = (error as { context?: unknown }).context;
    if (context instanceof Response) {
      try {
        return await context.clone().json() as ContentErrorPayload;
      } catch {
        // Las interrupciones de red pueden llegar sin una respuesta JSON.
      }
    }
  }
  return {
    error: "No pudimos comunicarnos con el generador. Comprueba tu conexión e inténtalo nuevamente.",
    code: "content_unavailable",
  };
}

export async function generateAiContent(goal: ContentIdea["goal"], count = 1): Promise<ContentResponse> {
  if (!supabase) throw new AiContentError({ error: "RomaCrece todavía no está configurado.", code: "supabase_missing" });

  const { data, error } = await supabase.functions.invoke<ContentResponse>("generate-content", {
    body: { goal, count: Math.max(1, Math.min(5, count)) },
  });

  if (error) throw new AiContentError(await parseFunctionError(error));
  if (!data?.ideas?.length) {
    throw new AiContentError({ error: "Gemini no devolvió ideas válidas. Inténtalo nuevamente.", code: "invalid_content" });
  }
  return data;
}

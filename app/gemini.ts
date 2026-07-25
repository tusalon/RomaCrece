import type { AiAnalysis, RomaCreceData } from "./audit-model";
import { supabase } from "./supabase";

type AiAuditResponse = {
  analysis: AiAnalysis;
  cached: boolean;
};

type AiAuditErrorPayload = {
  error?: string;
  code?: string;
};

export class AiAnalysisError extends Error {
  code: string;

  constructor(payload: AiAuditErrorPayload) {
    super(payload.error || "No pudimos completar el análisis con Gemini.");
    this.name = "AiAnalysisError";
    this.code = payload.code || "gemini_unavailable";
  }
}

async function parseFunctionError(error: unknown): Promise<AiAuditErrorPayload> {
  if (error && typeof error === "object" && "context" in error) {
    const context = (error as { context?: unknown }).context;
    if (context instanceof Response) {
      try {
        return await context.clone().json() as AiAuditErrorPayload;
      } catch {
        // Una interrupción de red puede llegar sin una respuesta JSON.
      }
    }
  }
  return {
    error: "No pudimos comunicarnos con el análisis. Comprueba tu conexión e inténtalo nuevamente.",
    code: "analysis_unavailable",
  };
}

export async function generateAiAnalysis(data: RomaCreceData): Promise<AiAuditResponse> {
  if (!supabase) throw new AiAnalysisError({ error: "RomaCrece todavía no está configurado.", code: "supabase_missing" });

  const { data: response, error } = await supabase.functions.invoke<AiAuditResponse>("generate-audit", {
    body: {
      business: data.business,
      answers: data.answers,
      baseAudit: data.audit,
    },
  });

  if (error) throw new AiAnalysisError(await parseFunctionError(error));
  if (!response?.analysis) {
    throw new AiAnalysisError({ error: "Gemini no devolvió un análisis válido. Inténtalo nuevamente.", code: "invalid_analysis" });
  }
  return response;
}

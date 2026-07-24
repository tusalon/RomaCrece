import type { AiAnalysis, RomaCreceData } from "./audit-model";
import { supabase } from "./supabase";

type AiAuditResponse = {
  analysis: AiAnalysis;
  cached: boolean;
};

export async function generateAiAnalysis(data: RomaCreceData): Promise<AiAuditResponse> {
  if (!supabase) throw new Error("Supabase no está configurado.");

  const { data: response, error } = await supabase.functions.invoke<AiAuditResponse>("generate-audit", {
    body: {
      business: data.business,
      answers: data.answers,
      baseAudit: data.audit,
    },
  });

  if (error) throw error;
  if (!response?.analysis) throw new Error("Gemini no devolvió un análisis válido.");
  return response;
}

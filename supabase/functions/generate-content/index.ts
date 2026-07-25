import { GoogleGenAI } from "npm:@google/genai@2.13.0";
import { createClient } from "npm:@supabase/supabase-js@2.110.8";
import { evaluateSubscription } from "../_shared/subscription-access.ts";

const GEMINI_MODEL = "gemini-3.5-flash-lite";
const goals = new Set(["Atraer", "Educar", "Vender", "Fidelizar"]);
const allowedOrigins = new Set([
  "https://tusalon.github.io",
  "http://localhost:3000",
  "http://localhost:5173",
  "https://localhost",
]);

const contentSchema = {
  type: "object",
  additionalProperties: false,
  required: ["ideas"],
  properties: {
    ideas: {
      type: "array",
      minItems: 1,
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["format", "title", "hook", "script", "caption", "hashtags", "reason"],
        properties: {
          format: { type: "string", enum: ["Reel", "Carrusel", "Historia"] },
          title: { type: "string" },
          hook: { type: "string" },
          script: { type: "string" },
          caption: { type: "string" },
          hashtags: { type: "string" },
          reason: { type: "string" },
        },
      },
    },
  },
};

function responseHeaders(request: Request) {
  const origin = request.headers.get("origin") ?? "";
  return {
    "Access-Control-Allow-Origin": allowedOrigins.has(origin) ? origin : "https://tusalon.github.io",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
    Vary: "Origin",
  };
}

function json(request: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: responseHeaders(request) });
}

function errorStatus(error: unknown) {
  if (!error || typeof error !== "object") return null;
  const candidate = error as { status?: unknown; statusCode?: unknown; error?: { code?: unknown } };
  for (const value of [candidate.status, candidate.statusCode, candidate.error?.code]) {
    if (typeof value === "number") return value;
    if (typeof value === "string" && /^\d{3}$/.test(value)) return Number(value);
  }
  return null;
}

function geminiFailure(error: unknown) {
  const status = errorStatus(error);
  const detail = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  if (status === 429 || detail.includes("resource_exhausted") || detail.includes("quota")) {
    return { status: 429, code: "gemini_quota", error: "Gemini alcanzó el límite gratuito por ahora. Espera unos minutos e inténtalo nuevamente." };
  }
  if (status === 401 || status === 403 || detail.includes("api_key_invalid") || detail.includes("api key not valid") || detail.includes("permission_denied")) {
    return { status: 503, code: "gemini_configuration", error: "La conexión de Gemini necesita revisar su configuración." };
  }
  return { status: 502, code: "gemini_unavailable", error: "Gemini no pudo crear contenido ahora. Inténtalo nuevamente." };
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: responseHeaders(request) });
  if (request.method !== "POST") return json(request, { error: "Método no permitido.", code: "method_not_allowed" }, 405);

  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return json(request, { error: "Inicia sesión para continuar.", code: "session_required" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const geminiKey = Deno.env.get("GEMINI_API_KEY");
  if (!supabaseUrl || !serviceKey || !geminiKey) {
    return json(request, { error: "El generador todavía no está configurado.", code: "gemini_configuration" }, 503);
  }

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const token = authorization.slice("Bearer ".length);
  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData.user) return json(request, { error: "Tu sesión venció. Sal y vuelve a entrar.", code: "session_invalid" }, 401);

  const { data: membership, error: membershipError } = await admin
    .from("romacrece_memberships")
    .select("negocio_id")
    .eq("auth_user_id", userData.user.id)
    .maybeSingle();
  if (membershipError || !membership) return json(request, { error: "Tu cuenta no está vinculada a RservasRoma.", code: "membership_missing" }, 403);

  const { data: subscription, error: subscriptionError } = await admin
    .from("suscripciones")
    .select("estado,fecha_renovacion")
    .eq("negocio_id", membership.negocio_id)
    .order("fecha_renovacion", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (subscriptionError) return json(request, { error: "No pudimos comprobar tu mensualidad.", code: "subscription_unavailable" }, 503);
  if (!evaluateSubscription(subscription).allowed) {
    return json(request, { error: "Necesitas una mensualidad activa de RservasRoma para usar Gemini.", code: "subscription_required" }, 403);
  }

  let payload: { goal?: unknown; count?: unknown };
  try {
    payload = await request.json();
  } catch {
    return json(request, { error: "Los datos enviados no son válidos.", code: "invalid_payload" }, 400);
  }
  const goal = typeof payload.goal === "string" && goals.has(payload.goal) ? payload.goal : null;
  const count = Math.max(1, Math.min(5, Number(payload.count) || 1));
  if (!goal) return json(request, { error: "Elige primero el objetivo del contenido.", code: "invalid_goal" }, 400);

  const { data: business, error: businessError } = await admin
    .from("businesses")
    .select("id,name,category,city,objective,instagram")
    .eq("owner_id", userData.user.id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (businessError || !business) return json(request, { error: "Completa primero la auditoría de tu negocio.", code: "business_missing" }, 400);

  const [auditResponse, analysisResponse, ideasResponse, planResponse, metricsResponse] = await Promise.all([
    admin.from("audit_snapshots").select("answers,recommendations,score").eq("business_id", business.id).order("audited_at", { ascending: false }).limit(1).maybeSingle(),
    admin.from("ai_audits").select("analysis").eq("business_id", business.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    admin.from("content_ideas").select("client_id,format,goal,title,hook,saved,feedback,feedback_reason,created_at").eq("business_id", business.id).order("created_at", { ascending: false }).limit(30),
    admin.from("planned_content").select("client_id,format,title,status,week_start,source_idea_client_id,day_index").eq("business_id", business.id).order("client_id", { ascending: false }).limit(30),
    admin.from("weekly_metrics").select("week_start,reach,likes,comments,saves,messages,bookings,best_post,best_planned_content_client_id,posts,reels,stories").eq("business_id", business.id).order("week_start", { ascending: false }).limit(8),
  ]);

  const ideas = ideasResponse.data ?? [];
  const plan = planResponse.data ?? [];
  const metrics = metricsResponse.data ?? [];
  const memorySignals = ideas.filter((item) => item.saved).length
    + ideas.filter((item) => Boolean(item.feedback)).length
    + plan.filter((item) => item.status === "Listo" || item.status === "Publicado").length
    + metrics.length;

  const prompt = `
Eres la estratega de contenido de RomaCrece para negocios de belleza.
Crea exactamente ${count} ${count === 1 ? "idea" : "ideas"} con el objetivo "${goal}".
Escribe en español claro, cálido y listo para usar. No inventes resultados ni digas que viste Instagram.
Cada idea debe ser distinta de los títulos anteriores y específica para el negocio.
Usa la memoria de manera explícita:
- feedback="useful", saved=true y las ideas que llegaron al calendario son señales positivas.
- feedback="not_useful" es una señal negativa: evita ese enfoque y respeta feedback_reason.
- source_idea_client_id relaciona una idea con su publicación planificada.
- best_planned_content_client_id identifica qué publicación tuvo el mejor resultado semanal; crea variaciones, no copias.
- No repitas títulos ni ganchos anteriores.
El guion debe tener pasos concretos. El caption debe terminar con una llamada a escribir o reservar. Usa entre 4 y 7 hashtags pertinentes.

NEGOCIO:
${JSON.stringify(business)}

AUDITORÍA:
${JSON.stringify(auditResponse.data ?? null)}

ANÁLISIS RECIENTE:
${JSON.stringify(analysisResponse.data?.analysis ?? null)}

IDEAS ANTERIORES (saved indica preferencia):
${JSON.stringify(ideas)}

CALENDARIO Y ESTADO REAL:
${JSON.stringify(plan)}

RESULTADOS SEMANALES:
${JSON.stringify(metrics)}
`;

  try {
    const ai = new GoogleGenAI({ apiKey: geminiKey });
    const interaction = await ai.interactions.create({
      model: GEMINI_MODEL,
      input: prompt,
      response_format: { type: "text", mime_type: "application/json", schema: contentSchema },
    });
    const generated = JSON.parse(interaction.output_text ?? "null");
    if (!Array.isArray(generated?.ideas) || generated.ideas.length === 0) throw new Error("Invalid content response");

    const baseId = Date.now() * 10;
    const colors: Record<string, string> = { Reel: "#e83387", Carrusel: "#7c5ce5", Historia: "#ef8a2e" };
    const nextIdeas = generated.ideas.slice(0, count).map((idea: Record<string, unknown>, index: number) => ({
      id: baseId + index,
      format: idea.format,
      goal,
      title: idea.title,
      hook: idea.hook,
      script: idea.script,
      caption: idea.caption,
      hashtags: idea.hashtags,
      reason: idea.reason,
      score: Math.max(84, 94 - index),
      color: colors[String(idea.format)] ?? "#e83387",
      saved: false,
      feedback: null,
      feedbackReason: "",
      createdAt: new Date().toISOString(),
    }));
    return json(request, { ideas: nextIdeas, memorySignals });
  } catch (error) {
    console.error("Gemini content generation failed", error instanceof Error ? error.message : error);
    const failure = geminiFailure(error);
    return json(request, { error: failure.error, code: failure.code }, failure.status);
  }
});

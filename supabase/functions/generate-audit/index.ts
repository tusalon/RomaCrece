import { GoogleGenAI } from "npm:@google/genai@2.13.0";
import { createClient } from "npm:@supabase/supabase-js@2.110.8";
import { evaluateSubscription } from "../_shared/subscription-access.ts";

const allowedOrigins = new Set([
  "https://tusalon.github.io",
  "http://localhost:3000",
  "http://localhost:5173",
  "https://localhost",
]);

const GEMINI_MODEL = "gemini-3.5-flash-lite";

const analysisSchema = {
  type: "object",
  additionalProperties: false,
  required: ["headline", "summary", "strengths", "priorities", "weeklyPlan"],
  properties: {
    headline: { type: "string", description: "Titular breve, positivo y específico." },
    summary: { type: "string", description: "Resumen de 2 a 3 frases sin tecnicismos." },
    strengths: {
      type: "array",
      minItems: 2,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "detail"],
        properties: { title: { type: "string" }, detail: { type: "string" } },
      },
    },
    priorities: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "why", "action"],
        properties: {
          title: { type: "string" },
          why: { type: "string" },
          action: { type: "string" },
        },
      },
    },
    weeklyPlan: {
      type: "array",
      minItems: 3,
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["day", "format", "idea", "goal"],
        properties: {
          day: { type: "string" },
          format: { type: "string", enum: ["Reel", "Carrusel", "Historia"] },
          idea: { type: "string" },
          goal: { type: "string" },
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
  const candidate = error as {
    status?: unknown;
    statusCode?: unknown;
    error?: { code?: unknown };
  };
  for (const value of [candidate.status, candidate.statusCode, candidate.error?.code]) {
    if (typeof value === "number") return value;
    if (typeof value === "string" && /^\d{3}$/.test(value)) return Number(value);
  }
  return null;
}

function geminiErrorResponse(error: unknown) {
  const status = errorStatus(error);
  const detail = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  if (status === 429 || detail.includes("resource_exhausted") || detail.includes("quota")) {
    return {
      code: "gemini_quota",
      error: "Gemini alcanzó el límite gratuito por ahora. Espera unos minutos e inténtalo nuevamente.",
      status: 429,
    };
  }
  if (
    status === 401 ||
    status === 403 ||
    detail.includes("api_key_invalid") ||
    detail.includes("api key not valid") ||
    detail.includes("permission_denied")
  ) {
    return {
      code: "gemini_configuration",
      error: "La clave de Gemini no es válida o todavía no tiene permiso para usar la API.",
      status: 503,
    };
  }
  if (status === 404 || detail.includes("not_found") || detail.includes("model not found")) {
    return {
      code: "gemini_model",
      error: "El modelo de Gemini no está disponible en este momento. Inténtalo nuevamente más tarde.",
      status: 503,
    };
  }
  return {
    code: "gemini_unavailable",
    error: "Gemini no pudo completar el análisis ahora. Tu puntuación básica sigue guardada.",
    status: 502,
  };
}

function currentWeek() {
  const now = new Date();
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
  const nextMonday = new Date(monday);
  nextMonday.setUTCDate(monday.getUTCDate() + 7);
  return {
    start: monday.toISOString().slice(0, 10),
    next: nextMonday.toISOString(),
  };
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
    return json(request, { error: "El análisis todavía no está configurado.", code: "gemini_configuration" }, 503);
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
  if (membershipError || !membership) {
    return json(request, { error: "Tu cuenta no está vinculada a RservasRoma.", code: "membership_missing" }, 403);
  }

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

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return json(request, { error: "Los datos enviados no son válidos.", code: "invalid_payload" }, 400);
  }

  const business = payload.business as Record<string, unknown> | undefined;
  const answers = payload.answers as Record<string, unknown> | undefined;
  const baseAudit = payload.baseAudit as Record<string, unknown> | undefined;
  if (!business?.name || !business.instagram || !answers || !baseAudit) {
    return json(request, { error: "Completa primero el cuestionario.", code: "incomplete_audit" }, 400);
  }

  const { data: savedBusiness, error: businessError } = await admin
    .from("businesses")
    .upsert({
      owner_id: userData.user.id,
      name: business.name,
      category: business.category,
      city: business.city,
      objective: business.objective,
      instagram: business.instagram,
      updated_at: new Date().toISOString(),
    }, { onConflict: "owner_id,instagram" })
    .select("id")
    .single();
  if (businessError) return json(request, { error: "No pudimos preparar los datos del negocio.", code: "business_save_failed" }, 500);

  const week = currentWeek();
  const { data: existing } = await admin
    .from("ai_audits")
    .select("analysis")
    .eq("business_id", savedBusiness.id)
    .eq("week_start", week.start)
    .maybeSingle();
  if (existing?.analysis) return json(request, { analysis: existing.analysis, cached: true });

  const [ideasMemory, planMemory, metricsMemory] = await Promise.all([
    admin
      .from("content_ideas")
      .select("format,goal,title,hook,saved,created_at")
      .eq("business_id", savedBusiness.id)
      .order("created_at", { ascending: false })
      .limit(20),
    admin
      .from("planned_content")
      .select("format,title,status,week_offset,day_index")
      .eq("business_id", savedBusiness.id)
      .order("client_id", { ascending: false })
      .limit(20),
    admin
      .from("weekly_metrics")
      .select("week_start,reach,likes,comments,saves,messages,bookings,best_post,posts,reels,stories")
      .eq("business_id", savedBusiness.id)
      .order("week_start", { ascending: false })
      .limit(8),
  ]);

  const prompt = `
Eres la estratega de crecimiento de RomaCrece, una aplicación para negocios de belleza.
Analiza únicamente la información proporcionada. No afirmes que visitaste Instagram y no inventes métricas.
Escribe en español claro, cálido y práctico para una dueña de negocio no técnica.
Evita las palabras engagement, funnel, benchmark y KPI. Convierte cada observación en una acción posible esta semana.
Personaliza las ideas según especialidad, país, ciudad, tamaño del equipo y objetivo.

NEGOCIO:
${JSON.stringify(business)}

RESPUESTAS:
${JSON.stringify(answers)}

PUNTUACIÓN CALCULADA POR ROMACRECE:
${JSON.stringify(baseAudit)}

MEMORIA DE IDEAS (saved indica preferencia):
${JSON.stringify(ideasMemory.data ?? [])}

MEMORIA DEL CALENDARIO Y ESTADOS:
${JSON.stringify(planMemory.data ?? [])}

RESULTADOS SEMANALES:
${JSON.stringify(metricsMemory.data ?? [])}
`;

  try {
    const ai = new GoogleGenAI({ apiKey: geminiKey });
    const interaction = await ai.interactions.create({
      model: GEMINI_MODEL,
      input: prompt,
      response_format: {
        type: "text",
        mime_type: "application/json",
        schema: analysisSchema,
      },
    });
    const generated = JSON.parse(interaction.output_text ?? "null");
    if (!generated?.priorities || !generated?.weeklyPlan) throw new Error("Invalid analysis");

    const analysis = {
      ...generated,
      generatedAt: new Date().toISOString(),
      nextAvailableAt: week.next,
    };
    const { error: insertError } = await admin.from("ai_audits").insert({
      business_id: savedBusiness.id,
      owner_id: userData.user.id,
      provider: "gemini",
      model: GEMINI_MODEL,
      week_start: week.start,
      analysis,
    });
    if (insertError) throw insertError;
    return json(request, { analysis, cached: false });
  } catch (error) {
    console.error("Gemini audit failed", error instanceof Error ? error.message : error);
    const failure = geminiErrorResponse(error);
    return json(request, { error: failure.error, code: failure.code }, failure.status);
  }
});

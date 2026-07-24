import bcrypt from "npm:bcryptjs@3.0.2";
import { createClient } from "npm:@supabase/supabase-js@2.110.8";
import { evaluateSubscription } from "../_shared/subscription-access.ts";

const allowedOrigins = new Set([
  "https://tusalon.github.io",
  "http://localhost:3000",
  "http://localhost:5173",
  "https://localhost",
]);

const MAX_FAILURES = 8;
const LOCK_MINUTES = 15;
const FAKE_PASSWORD_HASH = "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

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

async function identifierHash(request: Request, username: string) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const address = request.headers.get("cf-connecting-ip") ?? forwarded ?? "unknown";
  const bytes = new TextEncoder().encode(`${address}|${username}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: responseHeaders(request) });
  if (request.method !== "POST") return json(request, { error: "Método no permitido.", code: "method_not_allowed" }, 405);

  const origin = request.headers.get("origin");
  if (origin && !allowedOrigins.has(origin)) return json(request, { error: "Origen no permitido.", code: "origin_denied" }, 403);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) return json(request, { error: "El acceso todavía no está configurado.", code: "not_configured" }, 503);

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return json(request, { error: "Los datos enviados no son válidos.", code: "invalid_payload" }, 400);
  }

  const username = String(payload.username ?? "").trim().toLowerCase();
  const password = String(payload.password ?? "");
  if (!/^[a-z0-9._-]{2,80}$/.test(username) || !password || password.length > 256) {
    return json(request, { error: "Usuario o contraseña incorrectos.", code: "invalid_credentials" }, 401);
  }

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const attemptId = await identifierHash(request, username);
  const now = new Date();
  const { data: attempt } = await admin
    .from("romacrece_login_attempts")
    .select("failure_count,first_failed_at,locked_until")
    .eq("identifier_hash", attemptId)
    .maybeSingle();

  if (attempt?.locked_until && new Date(attempt.locked_until).getTime() > now.getTime()) {
    return json(request, { error: "Espera unos minutos antes de intentarlo otra vez.", code: "too_many_attempts" }, 429);
  }

  const recordFailure = async () => {
    const windowStart = now.getTime() - LOCK_MINUTES * 60_000;
    const withinWindow = attempt?.first_failed_at && new Date(attempt.first_failed_at).getTime() >= windowStart;
    const failureCount = withinWindow ? Number(attempt.failure_count ?? 0) + 1 : 1;
    await admin.from("romacrece_login_attempts").upsert({
      identifier_hash: attemptId,
      failure_count: failureCount,
      first_failed_at: withinWindow ? attempt.first_failed_at : now.toISOString(),
      locked_until: failureCount >= MAX_FAILURES
        ? new Date(now.getTime() + LOCK_MINUTES * 60_000).toISOString()
        : null,
      updated_at: now.toISOString(),
    });
  };

  const { data: business, error: businessError } = await admin
    .from("negocios")
    .select("id,slug,nombre,password_hash")
    .eq("slug", username)
    .maybeSingle();

  if (businessError) return json(request, { error: "No pudimos comprobar tu acceso.", code: "access_unavailable" }, 503);

  const passwordMatches = business?.password_hash
    ? await bcrypt.compare(password, business.password_hash)
    : await bcrypt.compare(password, FAKE_PASSWORD_HASH);

  if (!business || !passwordMatches) {
    await recordFailure();
    return json(request, { error: "Usuario o contraseña incorrectos.", code: "invalid_credentials" }, 401);
  }

  const { data: subscription, error: subscriptionError } = await admin
    .from("suscripciones")
    .select("estado,fecha_renovacion")
    .eq("negocio_id", business.id)
    .order("fecha_renovacion", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (subscriptionError) return json(request, { error: "No pudimos comprobar tu mensualidad.", code: "access_unavailable" }, 503);

  const access = evaluateSubscription(subscription);
  if (!access.allowed) {
    await admin.from("romacrece_login_attempts").delete().eq("identifier_hash", attemptId);
    return json(request, {
      error: access.reason === "expired" ? "Tu mensualidad está vencida." : "Tu mensualidad no está activa.",
      code: access.reason === "expired" ? "subscription_expired" : "subscription_inactive",
      renewalDate: access.renewalDate,
      businessName: business.nombre,
    }, 403);
  }

  const { data: membership, error: membershipError } = await admin
    .from("romacrece_memberships")
    .select("auth_user_id")
    .eq("negocio_id", business.id)
    .maybeSingle();

  if (membershipError) return json(request, { error: "No pudimos preparar tu cuenta.", code: "access_unavailable" }, 503);

  let loginEmail = `romacrece.${business.id}@auth.romahub.app`;
  if (membership?.auth_user_id) {
    const { data: linkedUser } = await admin.auth.admin.getUserById(membership.auth_user_id);
    if (linkedUser.user?.email) loginEmail = linkedUser.user.email;
  }

  const { data: link, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: loginEmail,
    options: {
      data: {
        negocio_id: business.id,
        negocio_slug: business.slug,
        negocio_nombre: business.nombre,
        product: "romacrece",
      },
    },
  });

  if (linkError || !link.properties?.hashed_token || !link.user?.id) {
    console.error("RomaCrece auth link failed", linkError?.message ?? "missing token");
    return json(request, { error: "No pudimos abrir tu sesión.", code: "access_unavailable" }, 503);
  }

  const { error: linkMembershipError } = await admin.from("romacrece_memberships").upsert({
    auth_user_id: link.user.id,
    negocio_id: business.id,
    negocio_slug: business.slug,
    updated_at: now.toISOString(),
  }, { onConflict: "negocio_id" });

  if (linkMembershipError) {
    console.error("RomaCrece membership failed", linkMembershipError.message);
    return json(request, { error: "No pudimos vincular tu negocio.", code: "access_unavailable" }, 503);
  }

  await admin.from("romacrece_login_attempts").delete().eq("identifier_hash", attemptId);
  return json(request, {
    tokenHash: link.properties.hashed_token,
    businessName: business.nombre,
    businessSlug: business.slug,
    renewalDate: access.renewalDate,
  });
});

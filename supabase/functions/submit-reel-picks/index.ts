import { createClient } from "npm:@supabase/supabase-js@2.110.8";
import { evaluateSubscription } from "../_shared/subscription-access.ts";

// Recibe los reels que una dueña marcó, los guarda y avisa a Raudael por ntfy con el salón y su
// WhatsApp. Es idempotente: un reel ya avisado (notified_at) no vuelve a notificar.
// Secreto: NTFY_REELS_TOPIC (nombre largo e impredecible del tema de ntfy).

const allowedOrigins = new Set([
  "https://tusalon.github.io",
  "http://localhost:3000",
  "http://localhost:5173",
  "https://localhost",
]);
const MAX_PICKS = 30;

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

const clean = (value: unknown, max: number) => String(value ?? "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, max);

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: responseHeaders(request) });
  if (request.method !== "POST") return json(request, { error: "Método no permitido.", code: "method_not_allowed" }, 405);

  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return json(request, { error: "Inicia sesión para continuar.", code: "session_required" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) return json(request, { error: "El servicio todavía no está configurado.", code: "not_configured" }, 503);

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const { data: userData, error: userError } = await admin.auth.getUser(authorization.slice("Bearer ".length));
  if (userError || !userData.user) return json(request, { error: "Tu sesión venció. Sal y vuelve a entrar.", code: "session_invalid" }, 401);

  const { data: membership } = await admin
    .from("romacrece_memberships").select("negocio_id").eq("auth_user_id", userData.user.id).maybeSingle();
  if (!membership) return json(request, { error: "Tu cuenta no está vinculada a RservasRoma.", code: "membership_missing" }, 403);

  const { data: subscription, error: subscriptionError } = await admin
    .from("suscripciones").select("estado,fecha_renovacion").eq("negocio_id", membership.negocio_id)
    .order("fecha_renovacion", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false })
    .limit(1).maybeSingle();
  if (subscriptionError) return json(request, { error: "No pudimos comprobar tu mensualidad.", code: "subscription_unavailable" }, 503);
  if (!evaluateSubscription(subscription).allowed) return json(request, { error: "Necesitas una mensualidad activa de RservasRoma.", code: "subscription_required" }, 403);

  let payload: { picks?: unknown; removes?: unknown };
  try {
    payload = await request.json();
  } catch {
    return json(request, { error: "Los datos enviados no son válidos.", code: "invalid_payload" }, 400);
  }

  const picks = (Array.isArray(payload.picks) ? payload.picks : []).slice(0, MAX_PICKS).flatMap((item) => {
    const row = item as { reelId?: unknown; title?: unknown; note?: unknown };
    const reelId = clean(row.reelId, 10);
    const title = clean(row.title, 80);
    if (!/^reel-\d{2}$/.test(reelId) || !title) return [];
    return [{ reelId, title, note: clean(row.note, 280) || null }];
  });
  const removes = (Array.isArray(payload.removes) ? payload.removes : [])
    .map((id) => clean(id, 10))
    .filter((id) => /^reel-\d{2}$/.test(id))
    .slice(0, MAX_PICKS);

  if (removes.length) {
    const { error } = await admin.from("romacrece_reel_picks").delete().eq("negocio_id", membership.negocio_id).in("reel_id", removes);
    if (error) return json(request, { error: "No pudimos quitar el reel. Inténtalo otra vez.", code: "remove_failed" }, 500);
  }

  let notified = false;
  if (picks.length) {
    // ignoreDuplicates: marcar dos veces el mismo reel no cambia la fila ni repite su aviso.
    const { error } = await admin.from("romacrece_reel_picks").upsert(
      picks.map((pick) => ({
        negocio_id: membership.negocio_id,
        auth_user_id: userData.user.id,
        reel_id: pick.reelId,
        reel_title: pick.title,
        note: pick.note,
      })),
      { onConflict: "negocio_id,reel_id", ignoreDuplicates: true },
    );
    if (error) return json(request, { error: "No pudimos guardar tu elección. Inténtalo otra vez.", code: "save_failed" }, 500);

    const { data: pending } = await admin.from("romacrece_reel_picks").select("id,reel_title,note")
      .eq("negocio_id", membership.negocio_id).is("notified_at", null);
    const topic = Deno.env.get("NTFY_REELS_TOPIC");
    if (topic && pending?.length) {
      const { data: salon } = await admin.from("negocios").select("*").eq("id", membership.negocio_id).maybeSingle();
      const name = clean(salon?.nombre ?? salon?.name ?? "Salón sin nombre", 80);
      const phone = clean(salon?.whatsapp ?? salon?.telefono ?? "sin WhatsApp", 30);
      const lines = pending.map((row) => `• ${row.reel_title}${row.note ? ` (${row.note})` : ""}`);
      try {
        const response = await fetch("https://ntfy.sh", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic,
            title: `Reels: ${name}`,
            message: `${name} · WhatsApp ${phone}\nQuiere hacer:\n${lines.join("\n")}`,
            priority: 4,
            tags: ["clapper"],
          }),
        });
        if (response.ok) {
          await admin.from("romacrece_reel_picks").update({ notified_at: new Date().toISOString() }).in("id", pending.map((row) => row.id));
          notified = true;
        }
      } catch (error) {
        console.error("ntfy no respondió", error);
      }
    }
  }

  return json(request, { ok: true, notified });
});

import { supabase } from "./supabase";

type LoginFunctionResponse = {
  tokenHash: string;
  businessName: string;
  businessSlug: string;
  renewalDate: string | null;
};

type FunctionErrorPayload = {
  error?: string;
  code?: string;
  renewalDate?: string | null;
  businessName?: string | null;
};

export type RomaCreceAccess = {
  allowed: boolean;
  reason: string;
  businessId: string | null;
  businessSlug: string | null;
  businessName: string | null;
  subscriptionState: string | null;
  renewalDate: string | null;
};

export class RservasLoginError extends Error {
  code: string;
  renewalDate: string | null;
  businessName: string | null;

  constructor(payload: FunctionErrorPayload) {
    super(payload.error || "No pudimos comprobar tu acceso.");
    this.name = "RservasLoginError";
    this.code = payload.code || "access_unavailable";
    this.renewalDate = payload.renewalDate ?? null;
    this.businessName = payload.businessName ?? null;
  }
}

async function parseFunctionError(error: unknown) {
  if (error && typeof error === "object" && "context" in error) {
    const context = (error as { context?: unknown }).context;
    if (context instanceof Response) {
      try {
        return await context.clone().json() as FunctionErrorPayload;
      } catch {
        // La respuesta de red no siempre incluye JSON.
      }
    }
  }
  return { error: "No pudimos comprobar tu acceso.", code: "access_unavailable" };
}

export async function signInWithRservas(username: string, password: string) {
  if (!supabase) throw new RservasLoginError({ error: "RomaCrece todavía no está configurado." });

  const { data, error } = await supabase.functions.invoke<LoginFunctionResponse>("login-rservasroma", {
    body: { username, password },
  });
  if (error) throw new RservasLoginError(await parseFunctionError(error));
  if (!data?.tokenHash) throw new RservasLoginError({ error: "No pudimos abrir tu sesión." });

  const { data: sessionData, error: sessionError } = await supabase.auth.verifyOtp({
    token_hash: data.tokenHash,
    type: "magiclink",
  });
  if (sessionError || !sessionData.user) {
    throw new RservasLoginError({ error: "No pudimos abrir tu sesión. Inténtalo otra vez." });
  }

  return { user: sessionData.user, businessName: data.businessName };
}

export async function loadRomaCreceAccess(): Promise<RomaCreceAccess> {
  if (!supabase) throw new Error("Supabase no está configurado.");

  const { data, error } = await supabase.rpc("romacrece_access_status");
  if (error) throw error;
  const row = (data as Array<Record<string, unknown>> | null)?.[0];
  if (!row) throw new Error("No se pudo comprobar el acceso.");

  return {
    allowed: row.allowed === true,
    reason: String(row.reason ?? "access_unavailable"),
    businessId: typeof row.negocio_id === "string" ? row.negocio_id : null,
    businessSlug: typeof row.negocio_slug === "string" ? row.negocio_slug : null,
    businessName: typeof row.negocio_nombre === "string" ? row.negocio_nombre : null,
    subscriptionState: typeof row.subscription_state === "string" ? row.subscription_state : null,
    renewalDate: typeof row.renewal_date === "string" ? row.renewal_date : null,
  };
}

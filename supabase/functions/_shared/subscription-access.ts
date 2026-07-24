export const SUBSCRIPTION_CUTOFF = "2026-07-19";

export type SubscriptionRecord = {
  estado?: string | null;
  fecha_renovacion?: string | null;
};

export type SubscriptionDecision = {
  allowed: boolean;
  reason: "active" | "missing" | "inactive" | "expired";
  renewalDate: string | null;
};

export function dateKeyInHavana(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Havana",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function evaluateSubscription(
  subscription: SubscriptionRecord | null | undefined,
  today = dateKeyInHavana(),
): SubscriptionDecision {
  if (!subscription) return { allowed: false, reason: "missing", renewalDate: null };

  const state = String(subscription.estado ?? "").trim().toLowerCase();
  const renewalDate = String(subscription.fecha_renovacion ?? "").slice(0, 10) || null;

  if (state !== "activa") return { allowed: false, reason: "inactive", renewalDate };

  const mustEnforceRenewal = renewalDate && renewalDate >= SUBSCRIPTION_CUTOFF;
  if (mustEnforceRenewal && renewalDate <= today) {
    return { allowed: false, reason: "expired", renewalDate };
  }

  return { allowed: true, reason: "active", renewalDate };
}

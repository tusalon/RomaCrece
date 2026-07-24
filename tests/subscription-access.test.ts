import assert from "node:assert/strict";
import test from "node:test";
import { evaluateSubscription } from "../supabase/functions/_shared/subscription-access.ts";

test("permite una mensualidad activa y vigente", () => {
  const result = evaluateSubscription({ estado: "activa", fecha_renovacion: "2026-08-24" }, "2026-07-24");

  assert.equal(result.allowed, true);
  assert.equal(result.reason, "active");
});

test("bloquea una mensualidad suspendida", () => {
  const result = evaluateSubscription({ estado: "suspendida", fecha_renovacion: "2026-08-24" }, "2026-07-24");

  assert.equal(result.allowed, false);
  assert.equal(result.reason, "inactive");
});

test("bloquea al llegar la fecha de renovación", () => {
  const result = evaluateSubscription({ estado: "activa", fecha_renovacion: "2026-07-24" }, "2026-07-24");

  assert.equal(result.allowed, false);
  assert.equal(result.reason, "expired");
});

test("mantiene la transición histórica usada por RservasRoma", () => {
  const result = evaluateSubscription({ estado: "activa", fecha_renovacion: "2026-06-01" }, "2026-07-24");

  assert.equal(result.allowed, true);
});

test("bloquea negocios sin mensualidad", () => {
  const result = evaluateSubscription(null, "2026-07-24");

  assert.equal(result.allowed, false);
  assert.equal(result.reason, "missing");
});

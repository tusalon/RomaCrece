import assert from "node:assert/strict";
import test from "node:test";
import { calculateAudit, initialAuditAnswers } from "../app/audit-model.ts";

test("calcula seis categorías y una puntuación dentro del rango", () => {
  const result = calculateAudit(initialAuditAnswers);

  assert.equal(result.categories.length, 6);
  assert.equal(result.recommendations.length, 3);
  assert.ok(result.score >= 0 && result.score <= 100);
});

test("prioriza las áreas con menor puntuación", () => {
  const result = calculateAudit({
    ...initialAuditAnswers,
    bioComplete: true,
    bookingLink: true,
    visualConsistency: 5,
    contentQuality: 5,
    postsPerWeek: 4,
    engagementRate: 0.5,
    captionsWithCta: 100,
    messagesPerMonth: 20,
    bookingsPerMonth: 1,
  });

  assert.equal(result.recommendations[0].categoryId, "engagement");
  assert.ok(result.recommendations.some((item) => item.categoryId === "conversion"));
});

test("una cuenta optimizada obtiene una puntuación alta", () => {
  const result = calculateAudit({
    bioComplete: true,
    bookingLink: true,
    visualConsistency: 5,
    contentQuality: 5,
    postsPerWeek: 4,
    engagementRate: 5,
    captionsWithCta: 100,
    messagesPerMonth: 20,
    bookingsPerMonth: 8,
  });

  assert.equal(result.score, 100);
});


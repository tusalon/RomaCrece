import assert from "node:assert/strict";
import test from "node:test";
import { calculateAudit, calculateChange, generateContentIdea, initialAuditAnswers, normalizeAuditAnswers } from "../app/audit-model.ts";

test("calcula seis categorías y una puntuación dentro del rango", () => {
  const result = calculateAudit(initialAuditAnswers);

  assert.equal(result.categories.length, 6);
  assert.equal(result.recommendations.length, 3);
  assert.ok(result.score >= 0 && result.score <= 100);
});

test("prioriza las áreas con menor puntuación", () => {
  const result = calculateAudit({
    ...initialAuditAnswers,
    followers: 10000,
    averageLikes: 20,
    averageComments: 1,
    averageSaves: 0,
    postingFrequency: "4-6 veces por semana",
    reelsFrequency: "3-5 por semana",
    storiesFrequency: "Casi todos los días",
    mainContent: "Una mezcla de varios",
  });

  assert.equal(result.recommendations[0].categoryId, "engagement");
});

test("una cuenta optimizada obtiene una puntuación alta", () => {
  const result = calculateAudit({
    ...initialAuditAnswers,
    accountAgeMonths: 24,
    followers: 5000,
    following: 1000,
    totalPosts: 150,
    averageLikes: 220,
    averageComments: 20,
    averageSaves: 20,
    postingFrequency: "Todos los días",
    reelsFrequency: "Todos los días",
    storiesFrequency: "Todos los días",
    mainContent: "Una mezcla de varios",
  });

  assert.equal(result.score, 100);
});

test("genera contenido personalizado para el negocio y objetivo", () => {
  const idea = generateContentIdea({
    name: "Luna Studio",
    category: "Estudio de uñas",
    city: "La Habana",
    objective: "Conseguir más reservas",
    instagram: "lunastudio",
  }, "Vender", 100);

  assert.equal(idea.goal, "Vender");
  assert.match(idea.title, /Luna Studio/);
  assert.match(idea.caption, /La Habana/);
  assert.match(idea.hashtags, /#LunaStudio/);
});

test("completa los nuevos campos cuando una auditoría anterior no los contiene", () => {
  const answers = normalizeAuditAnswers({ country: "Cuba", followers: 1200 });

  assert.equal(answers.country, "Cuba");
  assert.equal(answers.followers, 1200);
  assert.equal(answers.reelsFrequency, "1-2 por semana");
  assert.equal(answers.mainContent, "Fotos de trabajos");
});

test("compara el cambio porcentual entre dos semanas", () => {
  assert.equal(calculateChange(1200, 1000), 20);
  assert.equal(calculateChange(800, 1000), -20);
  assert.equal(calculateChange(0, 0), 0);
  assert.equal(calculateChange(500, 0), null);
});

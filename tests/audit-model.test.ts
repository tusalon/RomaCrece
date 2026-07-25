import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateAudit,
  calculateChange,
  buildWeeklyAdvisor,
  generateContentIdea,
  initialAuditAnswers,
  isPlannedForWeek,
  normalizeAuditAnswers,
  type RomaCreceData,
  weekStartFromOffset,
} from "../app/audit-model.ts";

test("calcula seis categorías y una puntuación dentro del rango", () => {
  const result = calculateAudit(initialAuditAnswers);

  assert.equal(result.categories.length, 6);
  assert.equal(result.recommendations.length, 3);
  assert.ok(result.score >= 0 && result.score <= 100);
});

test("prioriza las áreas con menor puntuación", () => {
  const result = calculateAudit({
    ...initialAuditAnswers,
    bioStatus: "Explica servicio y ubicación",
    bookingMethod: "Tengo enlace directo para reservar",
    visualConsistency: "Mi cuenta se ve uniforme",
    contentQuality: "Se ve profesional",
    ctaFrequency: "Casi siempre",
    followers: 10000,
    averageLikes: 20,
    averageComments: 1,
    averageSaves: 0,
    monthlyMessages: 200,
    monthlyBookings: 80,
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
    bioStatus: "Explica servicio y ubicación",
    bookingMethod: "Tengo enlace directo para reservar",
    visualConsistency: "Mi cuenta se ve uniforme",
    contentQuality: "Se ve profesional",
    ctaFrequency: "Casi siempre",
    accountAgeMonths: 24,
    followers: 5000,
    following: 1000,
    totalPosts: 150,
    averageLikes: 220,
    averageComments: 20,
    averageSaves: 20,
    monthlyMessages: 100,
    monthlyBookings: 50,
    postingFrequency: "Todos los días",
    reelsFrequency: "Todos los días",
    storiesFrequency: "Todos los días",
    mainContent: "Una mezcla de varios",
  });

  assert.equal(result.score, 100);
});

test("una ruta de reserva clara mejora la conversión", () => {
  const withoutBookingPath = calculateAudit({
    ...initialAuditAnswers,
    followers: 1000,
    following: 500,
    totalPosts: 80,
    averageLikes: 30,
    averageComments: 3,
    monthlyMessages: 10,
    monthlyBookings: 2,
    bookingMethod: "No tengo un camino claro",
  });
  const withBookingPath = calculateAudit({
    ...initialAuditAnswers,
    followers: 1000,
    following: 500,
    totalPosts: 80,
    averageLikes: 30,
    averageComments: 3,
    monthlyMessages: 10,
    monthlyBookings: 2,
    bookingMethod: "Tengo enlace directo para reservar",
  });

  const withoutScore = withoutBookingPath.categories.find((item) => item.id === "conversion")?.score ?? 0;
  const withScore = withBookingPath.categories.find((item) => item.id === "conversion")?.score ?? 0;
  assert.ok(withScore > withoutScore);
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
  assert.equal(answers.bioStatus, "Dice qué hago, pero no dónde");
  assert.equal(answers.ctaFrequency, "A veces");
});

test("una auditoría nueva comienza sin números de demostración", () => {
  const answers = normalizeAuditAnswers();

  assert.equal(answers.followers, null);
  assert.equal(answers.totalPosts, null);
  assert.equal(answers.averageLikes, null);
  assert.equal(answers.monthlyBookings, null);
});

test("compara el cambio porcentual entre dos semanas", () => {
  assert.equal(calculateChange(1200, 1000), 20);
  assert.equal(calculateChange(800, 1000), -20);
  assert.equal(calculateChange(0, 0), 0);
  assert.equal(calculateChange(500, 0), null);
});

test("guarda el calendario con el lunes real de cada semana", () => {
  const saturday = new Date(2026, 6, 25, 12);

  assert.equal(weekStartFromOffset(0, saturday), "2026-07-20");
  assert.equal(weekStartFromOffset(1, saturday), "2026-07-27");
  assert.equal(weekStartFromOffset(-1, saturday), "2026-07-13");
});

test("prioriza la fecha real y mantiene compatibilidad con planes anteriores", () => {
  const datedItem = {
    id: 1,
    week: 0,
    weekStart: "2026-07-13",
    day: 1,
    time: "19:00",
    format: "Reel" as const,
    title: "Antes y después",
    status: "Idea" as const,
    color: "#e83387",
  };
  const legacyItem = { ...datedItem, id: 2, weekStart: undefined, week: 1 };

  assert.equal(isPlannedForWeek(datedItem, "2026-07-20", 0), false);
  assert.equal(isPlannedForWeek(datedItem, "2026-07-13", -1), true);
  assert.equal(isPlannedForWeek(legacyItem, "2026-07-27", 1), true);
});

function createAdvisorData(): RomaCreceData {
  const answers = {
    ...initialAuditAnswers,
    followers: 1200,
    following: 500,
    totalPosts: 60,
    averageLikes: 35,
    averageComments: 4,
    averageSaves: 3,
    monthlyMessages: 12,
    monthlyBookings: 3,
  };
  return {
    business: {
      name: "Luna Studio",
      category: "Manicura",
      city: "La Habana",
      objective: "Conseguir más clientas",
      instagram: "lunastudio",
    },
    answers,
    audit: calculateAudit(answers),
    ideas: [],
    plannedItems: [],
    weeklyMetrics: [],
  };
}

test("la asesora propone tres acciones sin consumir IA", () => {
  const advisor = buildWeeklyAdvisor(createAdvisorData(), new Date(2026, 6, 25, 12));

  assert.equal(advisor.total, 3);
  assert.equal(advisor.completed, 0);
  assert.equal(advisor.actions[0].destination, "ideas");
  assert.equal(advisor.actions[2].destination, "resultados");
  assert.match(advisor.headline, /3 acciones/);
});

test("la asesora reconoce publicaciones y resultados completados", () => {
  const data = createAdvisorData();
  data.plannedItems = [{
    id: 10,
    weekStart: "2026-07-20",
    day: 2,
    time: "19:00",
    format: "Reel",
    title: "Antes y después",
    status: "Publicado",
    color: "#e83387",
  }];
  data.weeklyMetrics = [{
    id: "week-1",
    weekStart: "2026-07-20",
    followers: 1210,
    reach: 800,
    profileVisits: 40,
    likes: 55,
    comments: 6,
    saves: 8,
    messages: 10,
    bookings: 3,
    posts: 1,
    reels: 1,
    stories: 4,
    bestPost: "Antes y después",
    bestPlannedContentId: 10,
    updatedAt: "2026-07-25T12:00:00.000Z",
  }];

  const advisor = buildWeeklyAdvisor(data, new Date(2026, 6, 25, 12));

  assert.equal(advisor.completed, 2);
  assert.equal(advisor.actions.find((item) => item.id === "content")?.done, true);
  assert.equal(advisor.actions.find((item) => item.id === "results")?.done, true);
});

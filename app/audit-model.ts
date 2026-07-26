export type BusinessProfile = {
  name: string;
  category: string;
  city: string;
  objective: string;
  instagram: string;
};

export type AuditAnswers = {
  country: string;
  workMode: "Trabajo sola" | "Tengo equipo";
  teamSize: number;
  accountAgeMonths: number;
  bioStatus: "No está clara" | "Dice qué hago, pero no dónde" | "Explica servicio y ubicación";
  bookingMethod: "No tengo un camino claro" | "Me escriben por mensaje" | "Tengo enlace directo para reservar";
  followers: number | null;
  following: number | null;
  totalPosts: number | null;
  averageLikes: number | null;
  averageComments: number | null;
  averageSaves: number | null;
  monthlyMessages: number | null;
  monthlyBookings: number | null;
  postingFrequency: "Cuando puedo" | "1 vez por semana" | "2-3 veces por semana" | "4-6 veces por semana" | "Todos los días";
  reelsFrequency: "No uso" | "A veces" | "1-2 por semana" | "3-5 por semana" | "Todos los días";
  storiesFrequency: "No uso" | "A veces" | "3-5 días por semana" | "Casi todos los días" | "Todos los días";
  mainContent: "Fotos de trabajos" | "Consejos" | "Contenido personal" | "Promociones" | "Una mezcla de varios";
  visualConsistency: "Cada publicación se ve diferente" | "Mantengo algunos colores o estilo" | "Mi cuenta se ve uniforme";
  contentQuality: "Necesita mejorar" | "Se ve bien" | "Se ve profesional";
  ctaFrequency: "Casi nunca" | "A veces" | "Casi siempre";
};

export type AuditCategory = {
  id: "profile" | "visual" | "frequency" | "content" | "engagement" | "conversion";
  label: string;
  score: number;
  color: string;
};

export type AuditRecommendation = {
  categoryId: AuditCategory["id"];
  title: string;
  text: string;
  action: string;
};

export type AuditResult = {
  score: number;
  categories: AuditCategory[];
  recommendations: AuditRecommendation[];
  createdAt: string;
};

export type RomaCreceData = {
  business: BusinessProfile;
  answers: AuditAnswers;
  audit: AuditResult;
  aiAnalysis?: AiAnalysis;
  ideas?: ContentIdea[];
  plannedItems?: PlannedContent[];
  weeklyMetrics?: WeeklyMetrics[];
};

export type WeeklyMetrics = {
  id: string;
  weekStart: string;
  followers: number;
  reach: number;
  profileVisits: number;
  likes: number;
  comments: number;
  saves: number;
  messages: number;
  bookings: number;
  posts: number;
  reels: number;
  stories: number;
  bestPost: string;
  bestPlannedContentId: number | null;
  updatedAt: string;
};

export type AiAnalysis = {
  headline: string;
  summary: string;
  strengths: Array<{ title: string; detail: string }>;
  priorities: Array<{ title: string; why: string; action: string }>;
  weeklyPlan: Array<{ day: string; format: "Reel" | "Carrusel" | "Historia"; idea: string; goal: string }>;
  generatedAt: string;
  nextAvailableAt: string;
  sourceAuditAt?: string;
};

export type ContentIdea = {
  id: number;
  format: "Reel" | "Carrusel" | "Historia";
  goal: "Atraer" | "Educar" | "Vender" | "Fidelizar";
  title: string;
  hook: string;
  script: string;
  caption: string;
  hashtags: string;
  reason: string;
  score: number;
  color: string;
  saved: boolean;
  feedback?: "useful" | "not_useful" | null;
  feedbackReason?: string;
  createdAt: string;
};

export type PlannedContent = {
  id: number;
  week?: number;
  weekStart?: string;
  sourceIdeaId?: number | null;
  day: number;
  time: string;
  format: ContentIdea["format"];
  title: string;
  status: "Idea" | "Borrador" | "Listo" | "Publicado";
  color: string;
};

export type AdvisorDestination = "auditoria" | "ideas" | "planificador" | "resultados";

export type WeeklyAdvisorAction = {
  id: "content" | "growth" | "results";
  kind: "content" | "growth" | "results";
  title: string;
  detail: string;
  cta: string;
  destination: AdvisorDestination;
  done: boolean;
};

export type WeeklyAdvisor = {
  headline: string;
  summary: string;
  completed: number;
  total: number;
  actions: WeeklyAdvisorAction[];
};

export type FreeWeeklyPlanSettings = {
  daysPerWeek: 2 | 3 | 4 | 5;
  time: string;
  goal: ContentIdea["goal"];
  weekOffset?: number;
};

export type FreeWeeklyPlan = {
  newIdeas: ContentIdea[];
  newItems: PlannedContent[];
  targetDays: number;
  plannedDays: number;
};

export const STORAGE_KEY = "romacrece:mvp:v1";

export function weekStartFromOffset(offset = 0, referenceDate = new Date()): string {
  const date = new Date(referenceDate);
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7) + offset * 7);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isPlannedForWeek(item: PlannedContent, weekStart: string, legacyOffset = 0): boolean {
  return item.weekStart ? item.weekStart === weekStart : (item.week ?? 0) === legacyOffset;
}

const advisorImprovement: Record<AuditCategory["id"], { destination: AdvisorDestination; cta: string }> = {
  profile: { destination: "auditoria", cta: "Ver cómo mejorarlo" },
  visual: { destination: "ideas", cta: "Crear contenido coherente" },
  frequency: { destination: "planificador", cta: "Organizar la semana" },
  content: { destination: "ideas", cta: "Crear una idea mejor" },
  engagement: { destination: "ideas", cta: "Crear contenido que conecte" },
  conversion: { destination: "auditoria", cta: "Mejorar las reservas" },
};

const advisorDayNames = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];

export function buildWeeklyAdvisor(data: RomaCreceData, referenceDate = new Date()): WeeklyAdvisor {
  const weekStart = weekStartFromOffset(0, referenceDate);
  const plan = (data.plannedItems ?? [])
    .filter((item) => isPlannedForWeek(item, weekStart, 0))
    .sort((a, b) => a.day - b.day || a.time.localeCompare(b.time));
  const pendingContent = plan.find((item) => item.status !== "Publicado");
  const weakestCategory = [...data.audit.categories].sort((a, b) => a.score - b.score)[0];
  const recommendation = weakestCategory
    ? data.audit.recommendations.find((item) => item.categoryId === weakestCategory.id)
    : undefined;
  const improvement = advisorImprovement[weakestCategory?.id ?? "content"];
  const currentResults = (data.weeklyMetrics ?? []).find((item) => item.weekStart === weekStart);

  const contentAction: WeeklyAdvisorAction = pendingContent
    ? {
      id: "content",
      kind: "content",
      title: `Publica “${pendingContent.title}”`,
      detail: `${advisorDayNames[pendingContent.day] ?? "Esta semana"} a las ${pendingContent.time} · ${pendingContent.format}`,
      cta: "Abrir calendario",
      destination: "planificador",
      done: false,
    }
    : plan.length > 0
      ? {
        id: "content",
        kind: "content",
        title: "Contenido de la semana completado",
        detail: `${plan.length} ${plan.length === 1 ? "publicación marcada" : "publicaciones marcadas"} como publicadas`,
        cta: "Ver calendario",
        destination: "planificador",
        done: true,
      }
      : {
        id: "content",
        kind: "content",
        title: "Prepara tu próxima publicación",
        detail: "Elige una idea y colócala en el calendario para dejar de improvisar",
        cta: "Crear una idea",
        destination: "ideas",
        done: false,
      };

  const growthDone = (weakestCategory?.score ?? data.audit.score) >= 75;
  const growthAction: WeeklyAdvisorAction = {
    id: "growth",
    kind: "growth",
    title: growthDone
      ? `${weakestCategory?.label ?? "Tu cuenta"} tiene una base sólida`
      : recommendation?.title ?? "Mejora tu contenido principal",
    detail: growthDone
      ? `Esta área está en ${weakestCategory?.score ?? data.audit.score}/100; mantenla mientras trabajas la siguiente oportunidad`
      : recommendation?.text ?? "Combina resultados, consejos y llamadas claras a reservar.",
    cta: improvement.cta,
    destination: improvement.destination,
    done: growthDone,
  };

  const resultsAction: WeeklyAdvisorAction = currentResults
    ? {
      id: "results",
      kind: "results",
      title: "Resultados de la semana registrados",
      detail: `${currentResults.reach} de alcance · ${currentResults.messages} mensajes · ${currentResults.bookings} reservas`,
      cta: "Ver resultados",
      destination: "resultados",
      done: true,
    }
    : {
      id: "results",
      kind: "results",
      title: "Registra cómo te fue esta semana",
      detail: "Anota alcance, mensajes y reservas para saber qué debes repetir",
      cta: "Registrar resultados",
      destination: "resultados",
      done: false,
    };

  const actions = [contentAction, growthAction, resultsAction];
  const completed = actions.filter((action) => action.done).length;
  const pending = actions.find((action) => !action.done);
  const headline = completed === actions.length
    ? "Tu semana está completa"
    : completed === actions.length - 1
      ? "Te falta un paso para cerrar la semana"
      : `Tienes ${actions.length - completed} acciones claras para avanzar`;
  const summary = pending
    ? `Empieza por: ${pending.title.toLowerCase()}.`
    : "Ya puedes revisar tus resultados y preparar la próxima semana.";

  return { headline, summary, completed, total: actions.length, actions };
}

export const initialAuditAnswers: AuditAnswers = {
  country: "",
  workMode: "Trabajo sola",
  teamSize: 0,
  accountAgeMonths: 12,
  bioStatus: "No está clara",
  bookingMethod: "No tengo un camino claro",
  followers: null,
  following: null,
  totalPosts: null,
  averageLikes: null,
  averageComments: null,
  averageSaves: null,
  monthlyMessages: null,
  monthlyBookings: null,
  postingFrequency: "2-3 veces por semana",
  reelsFrequency: "1-2 por semana",
  storiesFrequency: "3-5 días por semana",
  mainContent: "Fotos de trabajos",
  visualConsistency: "Cada publicación se ve diferente",
  contentQuality: "Necesita mejorar",
  ctaFrequency: "Casi nunca",
};

export function normalizeAuditAnswers(value?: Partial<AuditAnswers>): AuditAnswers {
  if (!value) return { ...initialAuditAnswers };
  return {
    ...initialAuditAnswers,
    bioStatus: "Dice qué hago, pero no dónde",
    bookingMethod: "Me escriben por mensaje",
    visualConsistency: "Mantengo algunos colores o estilo",
    contentQuality: "Se ve bien",
    ctaFrequency: "A veces",
    monthlyMessages: 0,
    monthlyBookings: 0,
    ...value,
  };
}

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

export function calculateChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 100);
}

export function calculateAudit(answers: AuditAnswers): AuditResult {
  const numeric = (value: number | null) => Math.max(0, value ?? 0);
  const postingScores: Record<AuditAnswers["postingFrequency"], number> = {
    "Cuando puedo": 20,
    "1 vez por semana": 40,
    "2-3 veces por semana": 75,
    "4-6 veces por semana": 95,
    "Todos los días": 100,
  };
  const reelsScores: Record<AuditAnswers["reelsFrequency"], number> = {
    "No uso": 10,
    "A veces": 35,
    "1-2 por semana": 70,
    "3-5 por semana": 95,
    "Todos los días": 100,
  };
  const storiesScores: Record<AuditAnswers["storiesFrequency"], number> = {
    "No uso": 10,
    "A veces": 35,
    "3-5 días por semana": 70,
    "Casi todos los días": 90,
    "Todos los días": 100,
  };
  const contentScores: Record<AuditAnswers["mainContent"], number> = {
    "Fotos de trabajos": 60,
    "Consejos": 80,
    "Contenido personal": 65,
    "Promociones": 35,
    "Una mezcla de varios": 100,
  };
  const bioScores: Record<AuditAnswers["bioStatus"], number> = {
    "No está clara": 15,
    "Dice qué hago, pero no dónde": 60,
    "Explica servicio y ubicación": 100,
  };
  const bookingScores: Record<AuditAnswers["bookingMethod"], number> = {
    "No tengo un camino claro": 10,
    "Me escriben por mensaje": 60,
    "Tengo enlace directo para reservar": 100,
  };
  const visualScores: Record<AuditAnswers["visualConsistency"], number> = {
    "Cada publicación se ve diferente": 20,
    "Mantengo algunos colores o estilo": 65,
    "Mi cuenta se ve uniforme": 100,
  };
  const qualityScores: Record<AuditAnswers["contentQuality"], number> = {
    "Necesita mejorar": 25,
    "Se ve bien": 70,
    "Se ve profesional": 100,
  };
  const ctaScores: Record<AuditAnswers["ctaFrequency"], number> = {
    "Casi nunca": 15,
    "A veces": 60,
    "Casi siempre": 100,
  };

  const followers = numeric(answers.followers);
  const totalPosts = numeric(answers.totalPosts);
  const averageLikes = numeric(answers.averageLikes);
  const averageComments = numeric(answers.averageComments);
  const averageSaves = numeric(answers.averageSaves);
  const monthlyMessages = numeric(answers.monthlyMessages);
  const monthlyBookings = numeric(answers.monthlyBookings);
  const expectedPosts = Math.max(12, answers.accountAgeMonths * 3);
  const activityBase = Math.min(1, totalPosts / expectedPosts) * 100;
  const profile = bioScores[answers.bioStatus];
  const visual = visualScores[answers.visualConsistency];
  const frequency = clamp(
    postingScores[answers.postingFrequency] * 0.55 +
    storiesScores[answers.storiesFrequency] * 0.25 +
    activityBase * 0.2,
  );
  const content = clamp(
    contentScores[answers.mainContent] * 0.4 +
    qualityScores[answers.contentQuality] * 0.35 +
    reelsScores[answers.reelsFrequency] * 0.25,
  );
  const interactions = averageLikes + averageComments + averageSaves;
  const engagementRate = followers > 0 ? (interactions / followers) * 100 : 0;
  const engagement = clamp((engagementRate / 5) * 100);
  const messageRate = followers > 0 ? (monthlyMessages / followers) * 100 : 0;
  const bookingRate = monthlyMessages > 0 ? (monthlyBookings / monthlyMessages) * 100 : monthlyBookings > 0 ? 100 : 0;
  const conversion = clamp(
    bookingScores[answers.bookingMethod] * 0.35 +
    ctaScores[answers.ctaFrequency] * 0.2 +
    Math.min(100, (messageRate / 2) * 100) * 0.15 +
    Math.min(100, (bookingRate / 40) * 100) * 0.3,
  );

  const categories: AuditCategory[] = [
    { id: "profile", label: "Perfil y biografía", score: profile, color: "#0c9b78" },
    { id: "visual", label: "Identidad visual", score: visual, color: "#7c5ce5" },
    { id: "frequency", label: "Constancia", score: frequency, color: "#ef8a2e" },
    { id: "content", label: "Calidad y variedad", score: content, color: "#e83387" },
    { id: "engagement", label: "Interacción", score: engagement, color: "#3a7bd5" },
    { id: "conversion", label: "Mensajes y reservas", score: conversion, color: "#d946ef" },
  ];

  const score = clamp(
    profile * 0.15 +
    visual * 0.1 +
    frequency * 0.15 +
    content * 0.2 +
    engagement * 0.2 +
    conversion * 0.2,
  );

  const recommendationByCategory: Record<AuditCategory["id"], Omit<AuditRecommendation, "categoryId">> = {
    profile: {
      title: "Aclara tu biografía",
      text: "Explica qué servicio ofreces, dónde trabajas y cuál es el siguiente paso para reservar.",
      action: "Mejorar perfil",
    },
    visual: {
      title: "Haz reconocible tu cuenta",
      text: "Repite colores, encuadres y portadas para que tus trabajos se identifiquen rápidamente.",
      action: "Crear estilo visual",
    },
    frequency: {
      title: "Crea una frecuencia sostenible",
      text: "Planifica entre tres y cuatro publicaciones por semana y deja espacio para historias diarias.",
      action: "Crear calendario",
    },
    content: {
      title: "Mejora la calidad y la variedad",
      text: "Combina resultados, consejos, procesos, testimonios y promociones con imágenes bien iluminadas.",
      action: "Crear mejores ideas",
    },
    engagement: {
      title: "Haz que sea más fácil reaccionar",
      text: "Abre con una pregunta clara y termina invitando a comentar, guardar o compartir.",
      action: "Mejorar interacción",
    },
    conversion: {
      title: "Facilita el camino a la reserva",
      text: "Termina cada contenido con una invitación clara y ofrece un enlace o mensaje directo para reservar.",
      action: "Conseguir reservas",
    },
  };

  const recommendations = [...categories]
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map((category) => ({
      categoryId: category.id,
      ...recommendationByCategory[category.id],
    }));

  return {
    score,
    categories,
    recommendations,
    createdAt: new Date().toISOString(),
  };
}

export function businessInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("") || "RC";
}

const ideaTemplates: Record<ContentIdea["goal"], Array<Pick<ContentIdea, "format" | "title" | "hook" | "reason" | "color">>> = {
  Atraer: [
    { format: "Reel", title: "3 errores que pueden arruinar tu próximo resultado", hook: "Si haces una de estas tres cosas, detente...", reason: "Formato pensado para alcance y guardados", color: "#e83387" },
    { format: "Carrusel", title: "La guía rápida que toda nueva clienta necesita", hook: "Guarda esto antes de elegir tu próximo servicio", reason: "Contenido fácil de compartir", color: "#7c5ce5" },
  ],
  Educar: [
    { format: "Carrusel", title: "Cómo cuidar tus resultados para que duren más", hook: "Tu servicio puede durar mucho más si haces esto...", reason: "Refuerza tu autoridad profesional", color: "#7c5ce5" },
    { format: "Reel", title: "Mito o realidad: lo que debes saber antes de reservar", hook: "Te dijeron esto muchas veces, pero no es exactamente así...", reason: "Responde una duda frecuente", color: "#e83387" },
  ],
  Vender: [
    { format: "Reel", title: "Transformación real: del antes al resultado final", hook: "Mira cómo cambió este resultado en una sola cita...", reason: "Muestra valor y facilita la reserva", color: "#0c9b78" },
    { format: "Historia", title: "Últimos espacios disponibles de la semana", hook: "Si estabas esperando el momento, es ahora", reason: "Crea urgencia sin perder cercanía", color: "#ef8a2e" },
  ],
  Fidelizar: [
    { format: "Historia", title: "Deja que tu comunidad elija el próximo diseño", hook: "¿Opción A, B o C? Tú decides.", reason: "Invita a participar de forma sencilla", color: "#ef8a2e" },
    { format: "Carrusel", title: "Lo que más agradecemos de nuestras clientas", hook: "Este negocio crece gracias a personas como tú", reason: "Fortalece el vínculo con tu comunidad", color: "#7c5ce5" },
  ],
};

export function generateContentIdea(business: BusinessProfile, goal: ContentIdea["goal"], seed = Date.now()): ContentIdea {
  const options = ideaTemplates[goal];
  const template = options[Math.abs(seed) % options.length];
  const service = business.category.toLowerCase();
  const cityTag = business.city.replace(/\s+/g, "");
  const brandTag = business.name.replace(/[^\p{L}\p{N}]/gu, "");

  return {
    id: seed,
    goal,
    ...template,
    title: `${template.title} · ${business.name}`,
    script: `Plano 1: muestra el resultado final.\nPlano 2: enseña un detalle del proceso.\nPlano 3: comparte un consejo profesional.\nCierre: invita a escribir o reservar con ${business.name}.`,
    caption: `${template.hook}\n\nEn ${business.name} queremos que tomes decisiones con confianza. Guarda esta publicación y escríbenos cuando quieras reservar.\n\n📍 ${business.city}`,
    hashtags: `#${brandTag} #${cityTag} #Belleza #${service.replace(/[^\p{L}\p{N}]/gu, "")} #ReservaTuCita`,
    score: Math.min(98, 86 + (seed % 12)),
    saved: false,
    feedback: null,
    feedbackReason: "",
    createdAt: new Date().toISOString(),
  };
}

const weeklyDayPatterns: Record<FreeWeeklyPlanSettings["daysPerWeek"], number[]> = {
  2: [1, 4],
  3: [0, 2, 4],
  4: [0, 2, 4, 6],
  5: [0, 1, 2, 3, 4],
};

const weeklyGoalRotation: Record<ContentIdea["goal"], ContentIdea["goal"][]> = {
  Atraer: ["Atraer", "Educar", "Atraer", "Vender", "Fidelizar"],
  Educar: ["Educar", "Atraer", "Educar", "Vender", "Fidelizar"],
  Vender: ["Vender", "Educar", "Vender", "Atraer", "Fidelizar"],
  Fidelizar: ["Fidelizar", "Educar", "Fidelizar", "Vender", "Atraer"],
};

export function generateFreeWeeklyPlan(
  data: RomaCreceData,
  settings: FreeWeeklyPlanSettings,
  referenceDate = new Date(),
  seed = Date.now(),
): FreeWeeklyPlan {
  const weekOffset = settings.weekOffset ?? 0;
  const weekStart = weekStartFromOffset(weekOffset, referenceDate);
  const currentPlan = (data.plannedItems ?? []).filter((item) =>
    isPlannedForWeek(item, weekStart, weekOffset));
  const existingDays = new Set(currentPlan.map((item) => item.day));
  const candidateDays = [
    ...weeklyDayPatterns[settings.daysPerWeek],
    ...[0, 1, 2, 3, 4, 5, 6],
  ].filter((day, index, days) => !existingDays.has(day) && days.indexOf(day) === index);
  const neededDays = Math.max(0, settings.daysPerWeek - existingDays.size);
  const daysToPlan = candidateDays.slice(0, neededDays);
  const usedTitles = new Set(currentPlan.map((item) => item.title));
  const linkedIdeaIds = new Set(currentPlan.map((item) => item.sourceIdeaId).filter((id): id is number => id !== null && id !== undefined));
  const reusableIdeas = (data.ideas ?? [])
    .filter((idea) => (idea.feedback === "useful" || idea.saved) && idea.feedback !== "not_useful" && !linkedIdeaIds.has(idea.id) && !usedTitles.has(idea.title))
    .sort((a, b) => Number(b.feedback === "useful") - Number(a.feedback === "useful") || b.score - a.score);
  const goalRotation = weeklyGoalRotation[settings.goal];
  const newIdeas: ContentIdea[] = [];
  const newItems: PlannedContent[] = [];

  daysToPlan.forEach((day, index) => {
    const goal = goalRotation[index % goalRotation.length];
    const matchingIndex = reusableIdeas.findIndex((idea) => idea.goal === goal);
    const reusableIndex = matchingIndex >= 0 ? matchingIndex : reusableIdeas.length > 0 ? 0 : -1;
    const reusedIdea = reusableIndex >= 0 ? reusableIdeas.splice(reusableIndex, 1)[0] : undefined;
    let idea = reusedIdea ?? generateContentIdea(data.business, goal, seed * 10 + index);
    let attempt = 1;
    while (!reusedIdea && usedTitles.has(idea.title) && attempt < 6) {
      idea = generateContentIdea(data.business, goal, seed * 10 + index + attempt);
      attempt += 1;
    }
    if (!reusedIdea) newIdeas.push(idea);
    usedTitles.add(idea.title);

    newItems.push({
      id: seed * 100 + index,
      week: weekOffset,
      weekStart,
      sourceIdeaId: idea.id,
      day,
      time: settings.time,
      format: idea.format,
      title: idea.title,
      status: "Idea",
      color: idea.color,
    });
  });

  return {
    newIdeas,
    newItems,
    targetDays: settings.daysPerWeek,
    plannedDays: Math.min(settings.daysPerWeek, existingDays.size + daysToPlan.length),
  };
}

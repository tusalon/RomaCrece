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
  createdAt: string;
};

export type PlannedContent = {
  id: number;
  week?: number;
  day: number;
  time: string;
  format: ContentIdea["format"];
  title: string;
  status: "Idea" | "Borrador" | "Listo" | "Publicado";
  color: string;
};

export const STORAGE_KEY = "romacrece:mvp:v1";

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
    createdAt: new Date().toISOString(),
  };
}

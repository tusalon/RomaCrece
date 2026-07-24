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
  followers: number;
  following: number;
  totalPosts: number;
  averageLikes: number;
  averageComments: number;
  averageSaves: number | null;
  postingFrequency: "Cuando puedo" | "1 vez por semana" | "2-3 veces por semana" | "4-6 veces por semana" | "Todos los días";
  reelsFrequency: "No uso" | "A veces" | "1-2 por semana" | "3-5 por semana" | "Todos los días";
  storiesFrequency: "No uso" | "A veces" | "3-5 días por semana" | "Casi todos los días" | "Todos los días";
  mainContent: "Fotos de trabajos" | "Consejos" | "Contenido personal" | "Promociones" | "Una mezcla de varios";
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
  followers: 500,
  following: 400,
  totalPosts: 80,
  averageLikes: 20,
  averageComments: 2,
  averageSaves: null,
  postingFrequency: "2-3 veces por semana",
  reelsFrequency: "1-2 por semana",
  storiesFrequency: "3-5 días por semana",
  mainContent: "Fotos de trabajos",
};

export function normalizeAuditAnswers(value?: Partial<AuditAnswers>): AuditAnswers {
  return { ...initialAuditAnswers, ...value };
}

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

export function calculateChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 100);
}

export function calculateAudit(answers: AuditAnswers): AuditResult {
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

  const expectedPosts = Math.max(12, answers.accountAgeMonths * 3);
  const activityBase = Math.min(1, answers.totalPosts / expectedPosts) * 100;
  const followerRatio = answers.followers > 0
    ? Math.min(1, answers.followers / Math.max(answers.following, 1)) * 100
    : 0;
  const profile = clamp(activityBase * 0.6 + followerRatio * 0.4);
  const visual = reelsScores[answers.reelsFrequency];
  const frequency = postingScores[answers.postingFrequency];
  const content = contentScores[answers.mainContent];
  const interactions = answers.averageLikes + answers.averageComments + (answers.averageSaves ?? 0);
  const engagementRate = answers.followers > 0 ? (interactions / answers.followers) * 100 : 0;
  const engagement = clamp((engagementRate / 5) * 100);
  const conversion = storiesScores[answers.storiesFrequency];

  const categories: AuditCategory[] = [
    { id: "profile", label: "Base de la cuenta", score: profile, color: "#0c9b78" },
    { id: "visual", label: "Uso de Reels", score: visual, color: "#7c5ce5" },
    { id: "frequency", label: "Ritmo de publicación", score: frequency, color: "#ef8a2e" },
    { id: "content", label: "Variedad de contenido", score: content, color: "#e83387" },
    { id: "engagement", label: "Respuesta del público", score: engagement, color: "#3a7bd5" },
    { id: "conversion", label: "Uso de Stories", score: conversion, color: "#d946ef" },
  ];

  const score = clamp(
    profile * 0.15 +
    visual * 0.15 +
    frequency * 0.2 +
    content * 0.15 +
    engagement * 0.25 +
    conversion * 0.1,
  );

  const recommendationByCategory: Record<AuditCategory["id"], Omit<AuditRecommendation, "categoryId">> = {
    profile: {
      title: "Fortalece la base de tu cuenta",
      text: "Publica con constancia y evita seguir muchas más cuentas de las que te siguen.",
      action: "Fortalecer cuenta",
    },
    visual: {
      title: "Usa Reels para llegar a personas nuevas",
      text: "Empieza con uno o dos Reels por semana mostrando resultados, procesos y consejos breves.",
      action: "Planear Reels",
    },
    frequency: {
      title: "Crea una frecuencia sostenible",
      text: "Planifica entre tres y cuatro publicaciones por semana y deja espacio para historias diarias.",
      action: "Crear calendario",
    },
    content: {
      title: "No publiques siempre lo mismo",
      text: "Combina trabajos terminados, consejos, historias personales, testimonios y promociones.",
      action: "Variar contenido",
    },
    engagement: {
      title: "Haz que sea más fácil reaccionar",
      text: "Abre con una pregunta clara y termina invitando a comentar, guardar o compartir.",
      action: "Mejorar interacción",
    },
    conversion: {
      title: "Mantente presente con Stories",
      text: "Comparte procesos, espacios disponibles y el día a día del negocio varias veces por semana.",
      action: "Crear Stories",
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

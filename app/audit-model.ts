export type BusinessProfile = {
  name: string;
  category: string;
  city: string;
  objective: string;
  instagram: string;
};

export type AuditAnswers = {
  bioComplete: boolean;
  bookingLink: boolean;
  visualConsistency: number;
  contentQuality: number;
  postsPerWeek: number;
  engagementRate: number;
  captionsWithCta: number;
  messagesPerMonth: number;
  bookingsPerMonth: number;
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
  ideas?: ContentIdea[];
  plannedItems?: PlannedContent[];
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
  bioComplete: false,
  bookingLink: false,
  visualConsistency: 3,
  contentQuality: 3,
  postsPerWeek: 2,
  engagementRate: 2,
  captionsWithCta: 40,
  messagesPerMonth: 10,
  bookingsPerMonth: 3,
};

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

export function calculateAudit(answers: AuditAnswers): AuditResult {
  const profile = clamp((answers.bioComplete ? 50 : 0) + (answers.bookingLink ? 50 : 0));
  const visual = clamp(answers.visualConsistency * 20);
  const frequency = clamp((answers.postsPerWeek / 4) * 100);
  const content = clamp(answers.contentQuality * 15 + answers.captionsWithCta * 0.25);
  const engagement = clamp((answers.engagementRate / 5) * 100);
  const conversionRate = answers.messagesPerMonth > 0
    ? (answers.bookingsPerMonth / answers.messagesPerMonth) * 100
    : 0;
  const conversion = clamp(conversionRate * 2.5);

  const categories: AuditCategory[] = [
    { id: "profile", label: "Perfil y biografía", score: profile, color: "#0c9b78" },
    { id: "visual", label: "Identidad visual", score: visual, color: "#7c5ce5" },
    { id: "frequency", label: "Frecuencia", score: frequency, color: "#ef8a2e" },
    { id: "content", label: "Calidad del contenido", score: content, color: "#e83387" },
    { id: "engagement", label: "Engagement", score: engagement, color: "#3a7bd5" },
    { id: "conversion", label: "Conversión a reservas", score: conversion, color: "#d946ef" },
  ];

  const score = clamp(
    profile * 0.15 +
    visual * 0.15 +
    frequency * 0.15 +
    content * 0.2 +
    engagement * 0.2 +
    conversion * 0.15,
  );

  const recommendationByCategory: Record<AuditCategory["id"], Omit<AuditRecommendation, "categoryId">> = {
    profile: {
      title: "Convierte tu biografía en una ruta de reserva",
      text: "Explica qué servicio ofreces, en qué ciudad trabajas y añade un enlace directo para reservar.",
      action: "Mejorar perfil",
    },
    visual: {
      title: "Haz que tu contenido se reconozca al instante",
      text: "Mantén una paleta, iluminación y estilo de portada consistentes en tus próximas publicaciones.",
      action: "Crear guía visual",
    },
    frequency: {
      title: "Crea una frecuencia sostenible",
      text: "Planifica entre tres y cuatro publicaciones por semana y deja espacio para historias diarias.",
      action: "Crear calendario",
    },
    content: {
      title: "Cierra cada publicación con una acción clara",
      text: "Combina contenido educativo, resultados y prueba social; termina invitando a guardar, escribir o reservar.",
      action: "Generar contenido",
    },
    engagement: {
      title: "Convierte seguidores pasivos en conversación",
      text: "Incluye preguntas fáciles de responder y contesta comentarios y mensajes durante las primeras horas.",
      action: "Crear CTA",
    },
    conversion: {
      title: "Reduce los pasos entre el interés y la reserva",
      text: "Usa una llamada a la acción concreta, respuestas rápidas y un enlace directo a tus horarios disponibles.",
      action: "Mejorar conversión",
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

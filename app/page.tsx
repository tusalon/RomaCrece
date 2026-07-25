"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, InputHTMLAttributes } from "react";
import type { User } from "@supabase/supabase-js";
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  Award,
  Bell,
  BookOpen,
  CalendarCheck2,
  CalendarDays,
  ChartNoAxesCombined,
  Check,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  CircleHelp,
  Clock3,
  Copy,
  Eye,
  Flame,
  Heart,
  Image as ImageIcon,
  Instagram,
  LayoutDashboard,
  Lightbulb,
  Link2,
  LoaderCircle,
  LogOut,
  Menu,
  MessageCircleMore,
  MessageSquareText,
  MoreHorizontal,
  MousePointerClick,
  Plus,
  RefreshCw,
  ScanSearch,
  Search,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Users,
  Video,
  WandSparkles,
  X,
  Zap,
} from "lucide-react";
import {
  STORAGE_KEY,
  businessInitials,
  calculateAudit,
  calculateChange,
  isPlannedForWeek,
  normalizeAuditAnswers,
  type AuditAnswers,
  type BusinessProfile,
  type ContentIdea,
  type PlannedContent,
  type RomaCreceData,
  type WeeklyMetrics,
} from "./audit-model";
import { AiContentError, generateAiContent } from "./content-ai";
import { AiAnalysisError, generateAiAnalysis } from "./gemini";
import {
  RservasLoginError,
  loadRomaCreceAccess,
  signInWithRservas,
  type RomaCreceAccess,
} from "./rservas-auth";
import { loadCloudData, saveCloudData } from "./supabase-data";
import { isSupabaseConfigured, supabase } from "./supabase";

type View = "inicio" | "auditoria" | "ideas" | "planificador" | "resultados";

const navItems = [
  { id: "inicio" as View, label: "Inicio", icon: LayoutDashboard },
  { id: "auditoria" as View, label: "Auditoría", icon: ScanSearch },
  { id: "ideas" as View, label: "Ideas", icon: Lightbulb },
  { id: "planificador" as View, label: "Planificador", icon: CalendarDays },
  { id: "resultados" as View, label: "Mi semana", icon: ChartNoAxesCombined },
];

const emptyBusiness: BusinessProfile = {
  name: "",
  category: "Manicura",
  city: "",
  objective: "Conseguir más clientes locales",
  instagram: "",
};

const isLocalAuditPreview = import.meta.env.DEV && typeof window !== "undefined"
  && new URLSearchParams(window.location.search).get("preview") === "audit";

type ClearableNumberInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange"> & {
  value: number | null;
  onValueChange: (value: number) => void;
  onEmpty?: () => void;
};

const AUDIT_DRAFT_KEY = "romacrece:audit-draft:v2";

type AuditDraft = {
  step: 1 | 2 | 3 | 4;
  business: BusinessProfile;
  answers: Partial<AuditAnswers>;
};

function loadAuditDraft(): AuditDraft | null {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(window.localStorage.getItem(AUDIT_DRAFT_KEY) ?? "null") as AuditDraft | null;
  } catch {
    return null;
  }
}

function ClearableNumberInput({ value, onValueChange, onEmpty, min = 0, step = 1, ...inputProps }: ClearableNumberInputProps) {
  const [text, setText] = useState(value === null ? "" : String(value));

  return (
    <input
      {...inputProps}
      type="number"
      inputMode="numeric"
      min={min}
      step={step}
      value={text}
      onChange={(event) => {
        const nextText = event.target.value;
        setText(nextText);
        if (nextText === "") {
          onEmpty?.();
          return;
        }
        const parsed = Number(nextText);
        if (Number.isFinite(parsed)) onValueChange(Math.max(Number(min), parsed));
      }}
    />
  );
}

function AuthScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      await signInWithRservas(username, password);
    } catch (error) {
      setMessage(error instanceof RservasLoginError ? error.message : "No pudimos comprobar tu acceso.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-shell">
      <section className="auth-brand-panel">
        <Brand />
        <div>
          <span><Sparkles size={15} /> INCLUIDO CON RSERVASROMA</span>
          <h1>Tu crecimiento, conectado con el negocio que ya administras.</h1>
          <p>Analiza tu Instagram, crea contenido y organiza tu semana con el mismo acceso de tu salón.</p>
        </div>
        <small>RomaCrece · Un beneficio para clientas activas</small>
      </section>
      <section className="auth-form-panel">
        <form className="auth-card" onSubmit={submit}>
          <span className="auth-kicker">ACCESO PARA CLIENTAS</span>
          <h2>Entra a RomaCrece</h2>
          <p>Usa el mismo usuario y contraseña con los que entras al panel de RservasRoma.</p>
          <label>
            <span>Usuario de tu salón</span>
            <input type="text" required autoComplete="username" autoCapitalize="none" spellCheck={false} value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Ejemplo: sandrasnails" />
          </label>
          <label>
            <span>Contraseña</span>
            <input type="password" required autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Tu contraseña de RservasRoma" />
          </label>
          {message && <div className="auth-message" role="status">{message}</div>}
          <button className="primary-button auth-submit" disabled={busy} type="submit">
            {busy ? <LoaderCircle className="spin" size={17} /> : "Entrar"}
            {!busy && <ArrowRight size={17} />}
          </button>
          <a className="auth-switch" href="https://wa.me/5354066204?text=Hola%2C%20necesito%20ayuda%20para%20entrar%20a%20RomaCrece" target="_blank" rel="noreferrer">
            ¿No recuerdas tus datos? Escríbenos por WhatsApp
          </a>
        </form>
      </section>
    </main>
  );
}

function AccessBlocked({
  access,
  onRetry,
  onSignOut,
}: {
  access: RomaCreceAccess;
  onRetry: () => void;
  onSignOut: () => void;
}) {
  const expired = access.reason === "subscription_expired";
  const unavailable = access.reason === "access_unavailable";
  const renewalDate = access.renewalDate
    ? new Date(`${access.renewalDate}T12:00:00`).toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" })
    : null;
  const businessName = access.businessName || "tu salón";
  const paymentMessage = encodeURIComponent(`Hola, soy de ${businessName}. Quiero activar mi acceso a RomaCrece.`);

  return (
    <main className="access-blocked-shell">
      <section className="access-blocked-card">
        <Brand />
        <div className={`access-blocked-icon ${unavailable ? "warning" : ""}`}>
          {unavailable ? <AlertCircle size={31} /> : <Clock3 size={31} />}
        </div>
        <span className="auth-kicker">ACCESO PROTEGIDO</span>
        <h1>{unavailable ? "No pudimos comprobar tu acceso" : expired ? "Tu mensualidad está vencida" : "Tu mensualidad no está activa"}</h1>
        <p>
          {unavailable
            ? "Comprueba tu conexión e inténtalo otra vez."
            : `RomaCrece está incluido para las clientas activas de RservasRoma${renewalDate ? `; tu fecha registrada es ${renewalDate}` : ""}.`}
        </p>
        {!unavailable && (
          <a className="primary-button access-payment-button" href={`https://wa.me/5354066204?text=${paymentMessage}`} target="_blank" rel="noreferrer">
            <MessageCircleMore size={18} /> Coordinar mi pago
          </a>
        )}
        <button className="secondary-button access-retry-button" type="button" onClick={onRetry}>
          <RefreshCw size={17} /> Ya pagué, comprobar otra vez
        </button>
        <button className="access-signout" type="button" onClick={onSignOut}>
          <LogOut size={15} /> Salir y usar otro negocio
        </button>
      </section>
    </main>
  );
}

function Onboarding({ initialData, onComplete }: { initialData?: RomaCreceData; onComplete: (data: RomaCreceData) => void }) {
  const [savedDraft] = useState<AuditDraft | null>(() => initialData ? null : loadAuditDraft());
  const [step, setStep] = useState<1 | 2 | 3 | 4>(initialData ? 2 : savedDraft?.step ?? 1);
  const [business, setBusiness] = useState(initialData?.business ?? savedDraft?.business ?? emptyBusiness);
  const [answers, setAnswers] = useState(normalizeAuditAnswers(initialData?.answers ?? savedDraft?.answers));

  useEffect(() => {
    if (initialData) return;
    window.localStorage.setItem(AUDIT_DRAFT_KEY, JSON.stringify({ step, business, answers } satisfies AuditDraft));
  }, [answers, business, initialData, step]);

  const updateBusiness = (field: keyof BusinessProfile, value: string) => {
    setBusiness((current) => ({ ...current, [field]: value }));
  };

  const updateAnswer = <Key extends keyof AuditAnswers>(field: Key, value: AuditAnswers[Key]) => {
    setAnswers((current) => ({ ...current, [field]: value }));
  };

  const continueToAudit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStep(2);
  };

  const continueTo = (event: FormEvent<HTMLFormElement>, nextStep: 2 | 3 | 4) => {
    event.preventDefault();
    setStep(nextStep);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const finishOnboarding = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedBusiness = {
      ...business,
      name: business.name.trim(),
      city: business.city.trim(),
      instagram: business.instagram.trim().replace(/^@/, ""),
    };
    window.localStorage.removeItem(AUDIT_DRAFT_KEY);
    onComplete({
      business: normalizedBusiness,
      answers,
      audit: calculateAudit(answers),
    });
  };

  return (
    <main className="onboarding-shell">
      <section className="onboarding-brand-panel">
        <Brand />
        <div className="onboarding-promise">
          <span className="onboarding-kicker"><Sparkles size={15} /> PRIMER DIAGNÓSTICO</span>
          <h1>Convierte tu presencia digital en un plan claro para crecer.</h1>
          <p>
            Cuéntanos cómo funciona hoy tu negocio. RomaCrece organizará tus
            respuestas, calculará tu puntuación y señalará las tres mejoras con mayor impacto.
          </p>
          <div className="onboarding-benefits">
            <span><CheckCircle2 size={17} /> Resultado inmediato</span>
            <span><CheckCircle2 size={17} /> Recomendaciones personalizadas</span>
            <span><CheckCircle2 size={17} /> Datos guardados en tu cuenta</span>
          </div>
        </div>
        <small>RomaCrece · Parte del ecosistema RomaHub</small>
      </section>

      <section className="onboarding-form-panel">
        <div className="onboarding-form-wrap">
          <div className="onboarding-progress" aria-label={`Paso ${step} de 4`}>
            <span className="active">1</span><i className={step >= 2 ? "active" : ""} />
            <span className={step >= 2 ? "active" : ""}>2</span><i className={step >= 3 ? "active" : ""} />
            <span className={step >= 3 ? "active" : ""}>3</span><i className={step >= 4 ? "active" : ""} />
            <span className={step >= 4 ? "active" : ""}>4</span>
          </div>
          {!initialData && <div className="draft-note"><CheckCircle2 size={14} /> Tus respuestas se guardan en este dispositivo mientras completas la auditoría.</div>}
          <div className="onboarding-heading">
            <span>PASO {step} DE 4</span>
            <h2>{step === 1 ? "Conozcamos tu negocio" : step === 2 ? "Revisemos tu perfil" : step === 3 ? "Miremos tus números reales" : "¿Cómo creas contenido hoy?"}</h2>
            <p>
              {step === 1
                ? "Estos datos nos ayudan a adaptar el análisis a tu realidad."
                : step === 2
                  ? "Queremos saber si una nueva clienta entiende qué haces y cómo reservar."
                  : step === 3
                    ? "Usa los números de tu perfil y valores aproximados si no tienes todos los datos."
                    : "No hay respuestas buenas o malas: buscamos un plan que puedas mantener."}
            </p>
          </div>

          {step === 1 && (
            <form className="onboarding-form" onSubmit={continueToAudit}>
              <label className="onboarding-field wide">
                <span>Nombre del negocio</span>
                <input required value={business.name} onChange={(event) => updateBusiness("name", event.target.value)} placeholder="Ej.: Bella Studio" />
              </label>
              <label className="onboarding-field">
                <span>¿Cuál es tu especialidad?</span>
                <select value={business.category} onChange={(event) => updateBusiness("category", event.target.value)}>
                  <option>Manicura</option>
                  <option>Peluquería</option>
                  <option>Lashes</option>
                  <option>Cejas</option>
                  <option>Barbería</option>
                  <option>Salón mixto</option>
                  <option>Estética y spa</option>
                  <option>Otro</option>
                </select>
              </label>
              <label className="onboarding-field">
                <span>Ciudad o zona donde atiendes</span>
                <input required value={business.city} onChange={(event) => updateBusiness("city", event.target.value)} placeholder="Ej.: La Habana" />
              </label>
              <label className="onboarding-field wide">
                <span>Cuenta de Instagram</span>
                <div className="instagram-input"><Instagram size={17} /><b>@</b><input required value={business.instagram} onChange={(event) => updateBusiness("instagram", event.target.value)} placeholder="bellastudio" /></div>
              </label>
              <label className="onboarding-field wide">
                <span>¿Cuál es tu meta con Instagram?</span>
                <select value={business.objective} onChange={(event) => updateBusiness("objective", event.target.value)}>
                  <option>Conseguir más clientes locales</option>
                  <option>Hacer crecer mi marca</option>
                  <option>Crecer en seguidores</option>
                  <option>Monetizar mi contenido</option>
                  <option>Vender productos o servicios</option>
                  <option>Otro objetivo</option>
                </select>
              </label>
              <button className="primary-button onboarding-submit" type="submit">Continuar <ArrowRight size={17} /></button>
            </form>
          )}

          {step === 2 && (
            <form className="onboarding-form audit-form" onSubmit={(event) => continueTo(event, 3)}>
              <label className="onboarding-field wide">
                <span>¿En qué país estás?</span>
                <input required value={answers.country} onChange={(event) => updateAnswer("country", event.target.value)} placeholder="Ej.: Cuba, España, Estados Unidos" />
              </label>
              <label className="onboarding-field">
                <span>¿Trabajas sola o tienes equipo?</span>
                <select value={answers.workMode} onChange={(event) => {
                  const value = event.target.value as AuditAnswers["workMode"];
                  updateAnswer("workMode", value);
                  if (value === "Trabajo sola") updateAnswer("teamSize", 0);
                  if (value === "Tengo equipo" && answers.teamSize < 1) updateAnswer("teamSize", 1);
                }}>
                  <option>Trabajo sola</option>
                  <option>Tengo equipo</option>
                </select>
              </label>
              {answers.workMode === "Tengo equipo" && (
                <label className="onboarding-field">
                  <span>¿Cuántas personas forman el equipo?</span>
                  <ClearableNumberInput min={1} required value={answers.teamSize || 1} onValueChange={(value) => updateAnswer("teamSize", value)} />
                </label>
              )}
              <label className={`onboarding-field ${answers.workMode === "Trabajo sola" ? "wide" : ""}`}>
                <span>¿Cuánto tiempo lleva activa tu cuenta?</span>
                <select value={answers.accountAgeMonths} onChange={(event) => updateAnswer("accountAgeMonths", Number(event.target.value))}>
                  <option value="3">Menos de 6 meses</option>
                  <option value="9">Entre 6 meses y 1 año</option>
                  <option value="12">Alrededor de 1 año</option>
                  <option value="24">Entre 1 y 3 años</option>
                  <option value="48">Más de 3 años</option>
                </select>
              </label>
              <label className="onboarding-field wide">
                <span>Cuando alguien lee tu biografía, ¿entiende qué haces y dónde trabajas?</span>
                <select value={answers.bioStatus} onChange={(event) => updateAnswer("bioStatus", event.target.value as AuditAnswers["bioStatus"])}>
                  <option>No está clara</option>
                  <option>Dice qué hago, pero no dónde</option>
                  <option>Explica servicio y ubicación</option>
                </select>
                <small className="field-help">Piensa en una persona que visita tu cuenta por primera vez.</small>
              </label>
              <label className="onboarding-field wide">
                <span>¿Cómo puede una clienta reservar desde Instagram?</span>
                <select value={answers.bookingMethod} onChange={(event) => updateAnswer("bookingMethod", event.target.value as AuditAnswers["bookingMethod"])}>
                  <option>No tengo un camino claro</option>
                  <option>Me escriben por mensaje</option>
                  <option>Tengo enlace directo para reservar</option>
                </select>
              </label>
              <div className="onboarding-actions wide">
                <button className="secondary-button" type="button" onClick={() => setStep(1)}><ChevronLeft size={17} /> Volver</button>
                <button className="primary-button" type="submit">Continuar <ArrowRight size={17} /></button>
              </div>
            </form>
          )}

          {step === 3 && (
            <form className="onboarding-form audit-form" onSubmit={(event) => continueTo(event, 4)}>
              <div className="audit-form-tip wide"><Instagram size={18} /><div><strong>¿Dónde encuentro estos datos?</strong><small>En Instagram abre tu perfil y entra en Panel profesional o Estadísticas. Un aproximado también sirve.</small></div></div>
              <label className="onboarding-field"><span>¿Cuántos seguidores tienes?</span><ClearableNumberInput min={0} required value={answers.followers} onValueChange={(value) => updateAnswer("followers", value)} /></label>
              <label className="onboarding-field"><span>¿A cuántas cuentas sigues?</span><ClearableNumberInput min={0} required value={answers.following} onValueChange={(value) => updateAnswer("following", value)} /></label>
              <label className="onboarding-field wide"><span>¿Cuántas publicaciones tienes en total?</span><ClearableNumberInput min={0} required value={answers.totalPosts} onValueChange={(value) => updateAnswer("totalPosts", value)} /></label>
              <label className="onboarding-field"><span>Likes de una publicación normal</span><ClearableNumberInput min={0} required value={answers.averageLikes} onValueChange={(value) => updateAnswer("averageLikes", value)} /><small className="field-help">No uses tu mejor publicación, piensa en una normal</small></label>
              <label className="onboarding-field"><span>Comentarios de una publicación normal</span><ClearableNumberInput min={0} required value={answers.averageComments} onValueChange={(value) => updateAnswer("averageComments", value)} /><small className="field-help">Un aproximado está bien</small></label>
              <label className="onboarding-field wide"><span>¿Cuántas personas guardan tus publicaciones?</span><ClearableNumberInput min={0} value={answers.averageSaves} onValueChange={(value) => updateAnswer("averageSaves", value)} onEmpty={() => updateAnswer("averageSaves", null)} placeholder="Déjalo vacío si no lo sabes" /><small className="field-help">Este dato es opcional</small></label>
              <label className="onboarding-field"><span>¿Cuántos mensajes recibes desde Instagram al mes?</span><ClearableNumberInput min={0} required value={answers.monthlyMessages} onValueChange={(value) => updateAnswer("monthlyMessages", value)} /><small className="field-help">Cuenta consultas de precios, citas y servicios</small></label>
              <label className="onboarding-field"><span>¿Cuántas reservas consigues desde Instagram al mes?</span><ClearableNumberInput min={0} required value={answers.monthlyBookings} onValueChange={(value) => updateAnswer("monthlyBookings", value)} /><small className="field-help">Escribe 0 si todavía no consigues reservas</small></label>
              <div className="onboarding-actions wide">
                <button className="secondary-button" type="button" onClick={() => setStep(2)}><ChevronLeft size={17} /> Volver</button>
                <button className="primary-button" type="submit">Continuar <ArrowRight size={17} /></button>
              </div>
            </form>
          )}

          {step === 4 && (
            <form className="onboarding-form audit-form" onSubmit={finishOnboarding}>
              <label className="onboarding-field wide"><span>¿Con qué frecuencia publicas?</span><select value={answers.postingFrequency} onChange={(event) => updateAnswer("postingFrequency", event.target.value as AuditAnswers["postingFrequency"])}><option>Cuando puedo</option><option>1 vez por semana</option><option>2-3 veces por semana</option><option>4-6 veces por semana</option><option>Todos los días</option></select></label>
              <label className="onboarding-field"><span>¿Con qué frecuencia usas Reels?</span><select value={answers.reelsFrequency} onChange={(event) => updateAnswer("reelsFrequency", event.target.value as AuditAnswers["reelsFrequency"])}><option>No uso</option><option>A veces</option><option>1-2 por semana</option><option>3-5 por semana</option><option>Todos los días</option></select></label>
              <label className="onboarding-field"><span>¿Con qué frecuencia usas Stories?</span><select value={answers.storiesFrequency} onChange={(event) => updateAnswer("storiesFrequency", event.target.value as AuditAnswers["storiesFrequency"])}><option>No uso</option><option>A veces</option><option>3-5 días por semana</option><option>Casi todos los días</option><option>Todos los días</option></select></label>
              <label className="onboarding-field wide"><span>¿Qué tipo de contenido publicas más?</span><select value={answers.mainContent} onChange={(event) => updateAnswer("mainContent", event.target.value as AuditAnswers["mainContent"])}><option>Fotos de trabajos</option><option>Consejos</option><option>Contenido personal</option><option>Promociones</option><option>Una mezcla de varios</option></select></label>
              <label className="onboarding-field wide"><span>¿Qué tan uniforme se ve tu cuenta?</span><select value={answers.visualConsistency} onChange={(event) => updateAnswer("visualConsistency", event.target.value as AuditAnswers["visualConsistency"])}><option>Cada publicación se ve diferente</option><option>Mantengo algunos colores o estilo</option><option>Mi cuenta se ve uniforme</option></select></label>
              <label className="onboarding-field"><span>¿Cómo describirías la calidad de tus fotos y videos?</span><select value={answers.contentQuality} onChange={(event) => updateAnswer("contentQuality", event.target.value as AuditAnswers["contentQuality"])}><option>Necesita mejorar</option><option>Se ve bien</option><option>Se ve profesional</option></select></label>
              <label className="onboarding-field"><span>¿Invitas a escribirte o reservar?</span><select value={answers.ctaFrequency} onChange={(event) => updateAnswer("ctaFrequency", event.target.value as AuditAnswers["ctaFrequency"])}><option>Casi nunca</option><option>A veces</option><option>Casi siempre</option></select></label>
              <div className="audit-ready wide"><Sparkles size={18} /><div><strong>Todo listo para analizar tu cuenta</strong><small>Usaremos tus números reales para encontrar fortalezas y oportunidades.</small></div></div>
              <div className="onboarding-actions wide">
                <button className="secondary-button" type="button" onClick={() => setStep(3)}><ChevronLeft size={17} /> Volver</button>
                <button className="primary-button" type="submit">Analizar mi cuenta <Sparkles size={17} /></button>
              </div>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}

function Brand() {
  return (
    <div className="brand">
      <div className="brand-mark" aria-hidden="true">
        {/* Vite resuelve esta imagen con una base distinta para web y Android. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`${import.meta.env.BASE_URL}icons/icon-192x192.png`}
          alt=""
        />
      </div>
      <div>
        <p className="brand-name">RomaCrece</p>
        <p className="brand-parent">by RservasRoma</p>
      </div>
    </div>
  );
}

function Sidebar({
  business,
  activeView,
  onNavigate,
  onEditBusiness,
  onSignOut,
  mobileOpen,
  closeMobile,
}: {
  business: BusinessProfile;
  activeView: View;
  onNavigate: (view: View) => void;
  onEditBusiness: () => void;
  onSignOut: () => void;
  mobileOpen: boolean;
  closeMobile: () => void;
}) {
  const initials = businessInitials(business.name);
  return (
    <>
      {mobileOpen && (
        <button
          className="sidebar-backdrop"
          aria-label="Cerrar menú"
          onClick={closeMobile}
        />
      )}
      <aside className={`sidebar ${mobileOpen ? "is-open" : ""}`}>
        <div className="sidebar-top">
          <Brand />
          <button
            className="sidebar-close"
            aria-label="Cerrar menú"
            onClick={closeMobile}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="main-nav" aria-label="Navegación principal">
          <p className="nav-label">CRECIMIENTO</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                className={`nav-item ${isActive ? "active" : ""}`}
                aria-current={isActive ? "page" : undefined}
                onClick={() => {
                  onNavigate(item.id);
                  closeMobile();
                }}
              >
                <Icon size={19} strokeWidth={isActive ? 2.4 : 2} />
                <span>{item.label}</span>
                {item.id === "ideas" && <em>IA</em>}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-grow-card">
          <div className="grow-card-icon">
            <Sparkles size={17} />
          </div>
          <p>Tu próxima gran idea está a un clic.</p>
          <button onClick={() => onNavigate("ideas")}>
            Generar contenido <ArrowRight size={14} />
          </button>
        </div>

        <div className="sidebar-footer">
          <button
            className="nav-item quiet"
            onClick={() => window.open("https://wa.me/5354066204?text=Hola%2C%20necesito%20ayuda%20con%20RomaCrece", "_blank", "noopener,noreferrer")}
          >
            <CircleHelp size={19} />
            <span>Ayuda</span>
          </button>
          <button className="nav-item quiet" onClick={onEditBusiness}>
            <Settings size={19} />
            <span>Actualizar auditoría</span>
          </button>
          <button className="profile" type="button" onClick={onSignOut} aria-label="Cerrar sesión">
            <div className="profile-avatar">{initials}</div>
            <div className="profile-copy">
              <strong>{business.name}</strong>
              <span>{business.category}</span>
            </div>
            <LogOut size={17} />
          </button>
        </div>
      </aside>
    </>
  );
}

function Header({ data, openMenu, onNavigate }: { data: RomaCreceData; openMenu: () => void; onNavigate: (view: View) => void }) {
  const [query, setQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const initials = businessInitials(data.business.name);
  const currentWeek = getCalendarWeek(0).weekStart;
  const pendingContent = (data.plannedItems ?? []).filter((item) => (item.week ?? 0) === 0 && item.status !== "Publicado").length;
  const weekRegistered = (data.weeklyMetrics ?? []).some((item) => item.weekStart === currentWeek);

  const runSearch = () => {
    const normalized = query.trim().toLocaleLowerCase("es").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (!normalized) return;
    const searchTargets: Array<{ view: View; keywords: string[] }> = [
      { view: "inicio", keywords: ["inicio", "panel", "resumen"] },
      { view: "auditoria", keywords: ["auditoria", "puntuacion", "analisis", "perfil"] },
      { view: "ideas", keywords: ["ideas", "contenido", "gemini", "caption", "guion"] },
      { view: "planificador", keywords: ["planificador", "calendario", "semana", "publicar"] },
      { view: "resultados", keywords: ["resultados", "metricas", "alcance", "reservas", "crecimiento"] },
    ];
    const match = searchTargets.find((target) => target.keywords.some((keyword) => keyword.includes(normalized) || normalized.includes(keyword)));
    if (match) {
      onNavigate(match.view);
      setQuery("");
    }
  };

  return (
    <header className="topbar">
      <button className="menu-button" aria-label="Abrir menú" onClick={openMenu}>
        <Menu size={22} />
      </button>
      <div className="mobile-brand">
        <Brand />
      </div>
      <label className="search-box">
        <Search size={18} />
        <input
          aria-label="Buscar en RomaCrece"
          placeholder="Buscar: auditoría, ideas, semana..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") runSearch();
          }}
        />
        <kbd>Enter</kbd>
      </label>
      <div className="topbar-actions">
        <div className="instagram-pill">
          <Instagram size={17} />
          <span>@{data.business.instagram}</span>
          <Check size={13} />
        </div>
        <button className="icon-button" aria-label="Notificaciones" aria-expanded={showNotifications} onClick={() => setShowNotifications((value) => !value)}>
          <Bell size={19} />
          {(!weekRegistered || pendingContent > 0) && <span className="notification-dot" />}
        </button>
        <div className="topbar-avatar">{initials}</div>
        {showNotifications && (
          <div className="notification-panel">
            <strong>Tu semana en RomaCrece</strong>
            <button onClick={() => { onNavigate("planificador"); setShowNotifications(false); }}>
              <CalendarDays size={16} />
              <span>{pendingContent > 0 ? `${pendingContent} contenidos pendientes` : "Tu calendario está al día"}</span>
            </button>
            <button onClick={() => { onNavigate("resultados"); setShowNotifications(false); }}>
              <ChartNoAxesCombined size={16} />
              <span>{weekRegistered ? "Resultados de esta semana guardados" : "Registra los resultados de esta semana"}</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

function ScoreRing({ score }: { score: number }) {
  return (
    <div className="score-ring" style={{ "--score-target": score } as React.CSSProperties} aria-label={`Puntuación de auditoría: ${score} de 100`}>
      <div>
        <strong>{score}</strong>
        <span>/100</span>
      </div>
    </div>
  );
}

function HomeView({ data, onNavigate, onUpdate }: { data: RomaCreceData; onNavigate: (view: View) => void; onUpdate: (data: RomaCreceData) => void }) {
  const weeklyMetrics = [...(data.weeklyMetrics ?? [])].sort((a, b) => a.weekStart.localeCompare(b.weekStart));
  const latest = weeklyMetrics.at(-1);
  const previous = weeklyMetrics.at(-2);
  const calendarWeek = getCalendarWeek(0);
  const currentPlan = (data.plannedItems ?? [])
    .filter((item) => isPlannedForWeek(item, calendarWeek.weekStart, 0))
    .sort((a, b) => a.day - b.day || a.time.localeCompare(b.time));
  const pendingPlan = currentPlan.filter((item) => item.status !== "Publicado");
  const nextContent = pendingPlan[0];
  const publishedDays = new Set(currentPlan.filter((item) => item.status === "Publicado").map((item) => item.day));
  const interactions = latest ? latest.likes + latest.comments + latest.saves : 0;
  const metricCards = [
    { label: "Alcance", value: latest?.reach, change: metricDifference(latest?.reach ?? 0, previous?.reach, true), icon: Eye, color: "#7c5ce5", tint: "#f0ebff" },
    { label: "Interacciones", value: latest ? interactions : undefined, change: metricDifference(interactions, previous ? previous.likes + previous.comments + previous.saves : undefined), icon: Users, color: "#e83387", tint: "#fdeaf3" },
    { label: "Visitas al perfil", value: latest?.profileVisits, change: metricDifference(latest?.profileVisits ?? 0, previous?.profileVisits), icon: MousePointerClick, color: "#ef8a2e", tint: "#fff2e3" },
    { label: "Reservas desde IG", value: latest?.bookings, change: metricDifference(latest?.bookings ?? 0, previous?.bookings), icon: CalendarDays, color: "#0c9b78", tint: "#e3f7f1" },
  ];

  const markPublished = () => {
    if (!nextContent) return;
    onUpdate({
      ...data,
      plannedItems: (data.plannedItems ?? []).map((item) => item.id === nextContent.id ? { ...item, status: "Publicado" } : item),
    });
  };

  return (
    <div className="page-content">
      <section className="welcome-row">
        <div>
          <div className="eyebrow">
            <span className="status-dot" />
            TU CENTRO DE CRECIMIENTO
          </div>
          <h1>Buenos días, {data.business.name} <span>✦</span></h1>
          <p>
            Tu objetivo es {data.business.objective.toLowerCase()}. Hoy tienes una
            oportunidad clara para fortalecer tu presencia digital.
          </p>
        </div>
        <button className="primary-button" onClick={() => onNavigate("ideas")}>
          <WandSparkles size={18} />
          Crear plan de contenido
        </button>
      </section>

      <section className="hero-grid">
        <article className="audit-card">
          <div className="audit-card-copy">
            <div className="card-kicker">
              <ScanSearch size={17} />
              AUDITORÍA DE INSTAGRAM
            </div>
            <h2>{data.audit.score >= 75 ? "Tu perfil tiene una buena base. Ahora vamos por más." : "Ya sabemos dónde concentrar tus próximos esfuerzos."}</h2>
            <p>
              Detectamos <strong>{data.audit.recommendations.length} oportunidades</strong> para avanzar
              hacia tu objetivo esta semana.
            </p>
            <button className="soft-button" onClick={() => onNavigate("auditoria")}>
              Ver auditoría completa
              <ArrowUpRight size={16} />
            </button>
          </div>
          <div className="score-panel">
            <ScoreRing score={data.audit.score} />
            <span className="score-label">
              <TrendingUp size={15} /> Evaluación actual
            </span>
          </div>
          <div className="audit-shape shape-one" />
          <div className="audit-shape shape-two" />
        </article>

        <article className="focus-card">
          <div className="focus-card-head">
            <span className="focus-icon">
              <Target size={19} />
            </span>
            <span>PRIORIDAD DE HOY</span>
          </div>
          <h3>{nextContent?.title ?? "Planifica tu próxima publicación"}</h3>
          <p>{nextContent ? "Este es el próximo contenido pendiente de tu calendario." : "Añade una idea al calendario para convertirla en una tarea clara."}</p>
          <div className="focus-meta">
            <span><Clock3 size={15} /> {nextContent?.time ?? "Elige una hora"}</span>
            <span><Instagram size={15} /> {nextContent?.format ?? "Sin formato"}</span>
          </div>
          <button
            className="task-button"
            onClick={nextContent ? markPublished : () => onNavigate("planificador")}
          >
            {nextContent ? <span className="empty-check" /> : <Plus size={17} />}
            {nextContent ? "Marcar como publicado" : "Abrir planificador"}
          </button>
        </article>
      </section>

      <section className="metrics-section">
        <div className="section-heading">
          <div>
            <h2>Así estás creciendo</h2>
            <p>Resumen de los últimos 7 días</p>
          </div>
          <button className="text-button" onClick={() => onNavigate("resultados")}>
            Ver todos los resultados <ChevronRight size={16} />
          </button>
        </div>
        <div className="metric-grid">
          {metricCards.map((metric) => {
            const Icon = metric.icon;
            return (
              <article className="metric-card" key={metric.label}>
                <div
                  className="metric-icon"
                  style={{ backgroundColor: metric.tint, color: metric.color }}
                >
                  <Icon size={20} />
                </div>
                <div className="metric-copy">
                  <span>{metric.label}</span>
                  <strong>{metric.value === undefined ? "—" : numberFormat.format(metric.value)}</strong>
                </div>
                <div className="metric-change">
                  <span className={`change-${metric.change.direction}`}>
                    <TrendingUp className={metric.change.direction === "down" ? "trend-down" : ""} size={13} />
                    {latest ? metric.change.text : "Sin datos"}
                  </span>
                  <small>{latest ? "vs. medición anterior" : "Registra tu semana"}</small>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="lower-grid">
        <article className="plan-card">
          <div className="section-heading compact">
            <div>
              <h2>Tu plan de esta semana</h2>
              <p>{pendingPlan.length} pendientes · {currentPlan.length - pendingPlan.length} publicados</p>
            </div>
            <button className="text-button" onClick={() => onNavigate("planificador")}>
              Abrir calendario <ChevronRight size={16} />
            </button>
          </div>
          <div className="content-list">
            {currentPlan.slice(0, 3).map((item) => (
              <div className="content-row" key={item.id}>
                <div className="content-date">
                  <strong>{calendarWeek.days[item.day]?.today ? "Hoy" : calendarWeek.days[item.day]?.name}</strong>
                  <span>{calendarWeek.days[item.day]?.date}</span>
                </div>
                <span
                  className="content-accent"
                  style={{ backgroundColor: item.color }}
                />
                <div className="content-main">
                  <span>{item.format}</span>
                  <strong>{item.title}</strong>
                </div>
                <div className="content-time">
                  <Clock3 size={14} />
                  {item.time}
                </div>
                <span className={`content-status status-${item.status.toLowerCase()}`}>
                  {item.status}
                </span>
                <button className="row-action" aria-label={`Abrir ${item.title}`} onClick={() => onNavigate("planificador")}>
                  <ChevronRight size={17} />
                </button>
              </div>
            ))}
            {currentPlan.length === 0 && (
              <div className="home-empty-state">
                <CalendarDays size={22} />
                <div><strong>Tu calendario está vacío</strong><span>Añade tu primera idea para comenzar.</span></div>
                <button onClick={() => onNavigate("planificador")}>Planificar</button>
              </div>
            )}
          </div>
        </article>

        <article className="streak-card">
          <div className="streak-top">
            <span className="flame-wrap"><Flame size={24} /></span>
            <div>
              <span>RACHA DE CONSTANCIA</span>
              <strong>{publishedDays.size} {publishedDays.size === 1 ? "día" : "días"}</strong>
            </div>
          </div>
          <div className="week-dots">
            {["L", "M", "X", "J", "V", "S", "D"].map((day, index) => (
              <div key={day}>
                <span className={publishedDays.has(index) ? "complete" : ""}>
                  {publishedDays.has(index) ? <Check size={14} /> : ""}
                </span>
                <small>{day}</small>
              </div>
            ))}
          </div>
          <p>
            {publishedDays.size > 0 ? "Cada publicación marcada alimenta tu historial real." : "Marca como publicado lo que completes durante la semana."}
          </p>
          <div className="mini-insight">
            <MessageCircleMore size={17} />
            <span><strong>Consejo:</strong> registra tus resultados para que las recomendaciones aprendan de lo que funciona.</span>
          </div>
        </article>
      </section>
    </div>
  );
}

function ViewIntro({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="view-intro">
      <div>
        <div className="eyebrow">
          <span className="status-dot" />
          {eyebrow}
        </div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {children && <div className="view-actions">{children}</div>}
    </section>
  );
}

function AuditView({ data, onEdit, onNavigate, onUpdate }: { data: RomaCreceData; onEdit: () => void; onNavigate: (view: View) => void; onUpdate: (data: RomaCreceData) => void }) {
  const [analysis, setAnalysis] = useState(data.aiAnalysis);
  const [aiState, setAiState] = useState<"idle" | "loading" | "error">("idle");
  const [aiError, setAiError] = useState("");

  const requestAnalysis = async () => {
    setAiState("loading");
    setAiError("");
    try {
      const result = await generateAiAnalysis(data);
      setAnalysis(result.analysis);
      onUpdate({ ...data, aiAnalysis: result.analysis });
      setAiState("idle");
    } catch (error) {
      console.error("No se pudo generar el análisis con Gemini", error);
      setAiError(error instanceof AiAnalysisError ? error.message : "No pudimos completar el análisis. Inténtalo nuevamente.");
      setAiState("error");
    }
  };

  const addAiPlanItem = (item: AiAnalysis["weeklyPlan"][number], index: number) => {
    const normalizedDay = item.day.toLocaleLowerCase("es");
    const dayIndex = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"]
      .findIndex((day) => normalizedDay.includes(day));
    const plannedItems = data.plannedItems ?? [];
    const plannedItem: PlannedContent = {
      id: Math.max(0, ...plannedItems.map((planned) => planned.id)) + index + 1,
      week: 0,
      weekStart: getCalendarWeek(0).weekStart,
      sourceIdeaId: null,
      day: dayIndex >= 0 ? dayIndex : Math.min(index, 6),
      time: "19:00",
      format: item.format,
      title: item.idea,
      status: "Idea",
      color: item.format === "Reel" ? "#e83387" : item.format === "Carrusel" ? "#7c5ce5" : "#ef8a2e",
    };
    const alreadyPlanned = plannedItems.some((planned) => planned.title === plannedItem.title && isPlannedForWeek(planned, plannedItem.weekStart!, 0));
    if (!alreadyPlanned) onUpdate({ ...data, plannedItems: [...plannedItems, plannedItem] });
    onNavigate("planificador");
  };

  const findings = analysis
    ? analysis.priorities.map((item) => ({ title: item.title, text: item.why, action: item.action }))
    : data.audit.recommendations;
  const scoreLabel = data.audit.score >= 80 ? "MUY BUENA" : data.audit.score >= 60 ? "BUENA" : data.audit.score >= 40 ? "EN PROCESO" : "POR MEJORAR";
  const analysisNeedsRefresh = !analysis || analysis.sourceAuditAt !== data.audit.createdAt;
  const auditDateLabel = new Intl.DateTimeFormat("es", { day: "numeric", month: "short", year: "numeric" })
    .format(new Date(data.audit.createdAt));

  return (
    <div className="page-content inner-page">
      <ViewIntro
        eyebrow="DIAGNÓSTICO INTELIGENTE"
        title="Auditoría de tu Instagram"
        description="Descubre qué está funcionando y qué debes cambiar para atraer más reservas."
      >
        <button
          className="secondary-button"
          onClick={onEdit}
        >
          <RefreshCw size={17} />
          Actualizar mis datos
        </button>
      </ViewIntro>

      <section className="audit-overview">
        <article className="audit-score-card">
          <div>
            <div className="card-kicker">
              <Instagram size={17} />
              PUNTUACIÓN GENERAL
            </div>
            <h2>{analysis?.headline ?? "Ya tenemos un punto de partida claro"}</h2>
            <p>{analysis?.summary ?? "Tu puntuación usa los números y hábitos que compartiste. Ahora puedes convertirlos en un plan sencillo para esta semana."}</p>
            <div className="audit-benchmark">
              <span><Award size={16} /> Basado en tus datos reales</span>
              <small>sin comparaciones inventadas</small>
            </div>
          </div>
          <div className="large-score">
            <ScoreRing score={data.audit.score} />
            <strong>{scoreLabel}</strong>
            <span>Última auditoría: {auditDateLabel}</span>
          </div>
        </article>

        <article className="category-card">
          <div className="panel-heading">
            <div>
              <span>DESGLOSE</span>
              <h3>Rendimiento por área</h3>
            </div>
            <SlidersHorizontal size={18} />
          </div>
          <div className="category-list">
            {data.audit.categories.map((item) => (
              <div className="category-row" key={item.label}>
                <div>
                  <span>{item.label}<small>{item.score >= 75 ? "Punto fuerte" : item.score >= 50 ? "En progreso" : "Prioridad"}</small></span>
                  <strong>{item.score}</strong>
                </div>
                <div className="progress-track">
                  <span
                    style={{
                      width: `${item.score}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      {analysisNeedsRefresh && (
        <section className="ai-audit-callout">
          <div className="ai-audit-icon"><WandSparkles size={24} /></div>
          <div>
            <span>ANÁLISIS PERSONALIZADO</span>
            <h2>{analysis ? "Tus datos cambiaron: actualicemos el análisis" : "Deja que Gemini convierta tus datos en un plan semanal"}</h2>
            <p>{analysis ? "Gemini volverá a revisar la auditoría para que las recomendaciones coincidan con tus respuestas nuevas." : "Recibirás fortalezas, tres prioridades y acciones adaptadas a tu especialidad."}</p>
            {aiState === "error" && <small role="alert">{aiError}</small>}
          </div>
          <button className="primary-button" onClick={requestAnalysis} disabled={aiState === "loading"}>
            {aiState === "loading" ? <LoaderCircle className="spin" size={17} /> : <Sparkles size={17} />}
            {aiState === "loading" ? "Preparando tu análisis…" : analysis ? "Actualizar análisis" : "Crear mi análisis con IA"}
          </button>
        </section>
      )}

      <section className="findings-section">
        <div className="section-heading">
          <div>
            <h2>Las 3 mejoras con mayor impacto</h2>
            <p>Ordenadas según su potencial para generar clientes</p>
          </div>
          <span className="analysis-label"><Sparkles size={14} /> {analysis ? "Analizado con Gemini" : "Análisis inicial"}</span>
        </div>
        <div className="findings-grid">
          {findings.map((finding, index) => {
            const findingStyles = [
              { icon: Link2, level: "Alta prioridad", tone: "high" },
              { icon: MessageSquareText, level: "Oportunidad", tone: "medium" },
              { icon: CalendarDays, level: "A mejorar", tone: "low" },
            ][index];
            const Icon = findingStyles.icon;
            return (
              <article className="finding-card" key={finding.title}>
                <div className="finding-top">
                  <span className={`finding-icon tone-${findingStyles.tone}`}>
                    <Icon size={20} />
                  </span>
                  <span className={`finding-level tone-${findingStyles.tone}`}>
                    {findingStyles.level}
                  </span>
                  <em>0{index + 1}</em>
                </div>
                <h3>{finding.title}</h3>
                <p>{finding.text}</p>
                <button
                  onClick={() => {
                    if ("categoryId" in finding && finding.categoryId === "profile") {
                      onEdit();
                      return;
                    }
                    onNavigate("categoryId" in finding && finding.categoryId === "frequency"
                      ? "planificador"
                      : index === 2 && analysis ? "planificador" : "ideas");
                  }}
                >
                  {finding.action} <ArrowRight size={14} />
                </button>
              </article>
            );
          })}
        </div>
      </section>

      <section className="strengths-card">
        <div className="strengths-copy">
          <span className="strength-icon"><Star size={20} /></span>
          <div>
            <span>TUS FORTALEZAS</span>
            <h3>{analysis?.strengths[0]?.title ?? "Ya tienes una base para seguir creciendo"}</h3>
            <p>{analysis?.strengths[0]?.detail ?? "Mantén lo que funciona mientras aplicas tus tres prioridades."}</p>
          </div>
        </div>
        <div className="strength-pills">
          {(analysis?.strengths ?? [
            { title: "Datos reales registrados" },
            { title: "Objetivo definido" },
            { title: "Plan listo para mejorar" },
          ]).map((strength) => <span key={strength.title}><CheckCircle2 size={16} /> {strength.title}</span>)}
        </div>
      </section>

      {analysis && (
        <section className="ai-week-plan">
          <div className="section-heading">
            <div><h2>Tu plan para esta semana</h2><p>Acciones creadas por Gemini con los datos de tu negocio</p></div>
            <span className="analysis-label"><Sparkles size={14} /> 1 análisis semanal</span>
          </div>
          <div className="ai-week-grid">
            {analysis.weeklyPlan.map((item, index) => (
              <article key={`${item.day}-${item.idea}`}>
                <span>{item.day} · {item.format}</span>
                <h3>{item.idea}</h3>
                <p>{item.goal}</p>
                {(() => {
                  const isPlanned = (data.plannedItems ?? []).some((planned) => planned.title === item.idea && (planned.week ?? 0) === 0);
                  return (
                    <button disabled={isPlanned} onClick={() => addAiPlanItem(item, index)}>
                      {isPlanned ? <><Check size={14} /> Ya está en el calendario</> : <>Añadir al calendario <ArrowRight size={14} /></>}
                    </button>
                  );
                })()}
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

const ideaIcon = (format: ContentIdea["format"]) =>
  format === "Reel" ? Video : format === "Carrusel" ? ImageIcon : MessageCircleMore;

const ideaFeedbackReasons = [
  "No va con mi negocio",
  "Ya publiqué algo parecido",
  "Es difícil de crear",
  "No me gusta el tono",
];

function IdeaModal({
  idea,
  onClose,
  onSave,
  onPlan,
}: {
  idea: ContentIdea;
  onClose: () => void;
  onSave: (idea: ContentIdea) => void;
  onPlan: (idea: ContentIdea) => void;
}) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const [hook, setHook] = useState(idea.hook);
  const [script, setScript] = useState(idea.script);
  const [caption, setCaption] = useState(idea.caption);
  const [hashtags, setHashtags] = useState(idea.hashtags);
  const [feedback, setFeedback] = useState<ContentIdea["feedback"]>(idea.feedback ?? null);
  const [feedbackReason, setFeedbackReason] = useState(idea.feedbackReason ?? "");
  const editedIdea = { ...idea, hook, script, caption, hashtags, feedback, feedbackReason };

  const saveAndClose = () => {
    onSave(editedIdea);
    onClose();
  };

  const copyContent = async () => {
    const content = `${hook}\n\n${script}\n\n${caption}\n\n${hashtags}`;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(content);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = content;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const copied = document.execCommand("copy");
        textArea.remove();
        if (!copied) throw new Error("copy_failed");
      }
      onSave(editedIdea);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 1400);
    } catch {
      setCopyState("error");
    }
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={saveAndClose}>
      <section
        className="idea-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Editor de contenido"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-head">
          <div>
            <span><Sparkles size={14} /> CONTENIDO GENERADO</span>
            <h2>{idea.title}</h2>
          </div>
          <button aria-label="Guardar y cerrar editor" onClick={saveAndClose}><X size={20} /></button>
        </div>
        <div className="editor-grid">
          <div className="editor-field">
            <label>Gancho</label>
            <textarea value={hook} onChange={(event) => setHook(event.target.value)} />
          </div>
          <div className="editor-field">
            <label>Guion</label>
            <textarea
              className="tall"
              value={script}
              onChange={(event) => setScript(event.target.value)}
            />
          </div>
          <div className="editor-field">
            <label>Caption sugerido</label>
            <textarea
              className="tall"
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
            />
          </div>
          <div className="editor-field">
            <label>Hashtags</label>
            <textarea value={hashtags} onChange={(event) => setHashtags(event.target.value)} />
          </div>
        </div>
        <section className="idea-learning" aria-label="Enseñar a RomaCrece sobre esta idea">
          <div>
            <strong>¿Esta idea encaja contigo?</strong>
            <span>Tu respuesta ayuda a que las próximas sean más acertadas.</span>
          </div>
          <div className="idea-feedback-actions">
            <button
              type="button"
              className={feedback === "useful" ? "active useful" : ""}
              aria-pressed={feedback === "useful"}
              onClick={() => { setFeedback("useful"); setFeedbackReason(""); }}
            >
              <CheckCircle2 size={16} /> Sí, me sirve
            </button>
            <button
              type="button"
              className={feedback === "not_useful" ? "active not-useful" : ""}
              aria-pressed={feedback === "not_useful"}
              onClick={() => setFeedback("not_useful")}
            >
              <X size={16} /> No es para mí
            </button>
          </div>
          {feedback === "not_useful" && (
            <div className="feedback-reasons">
              <span>¿Por qué?</span>
              {ideaFeedbackReasons.map((reason) => (
                <button
                  type="button"
                  className={feedbackReason === reason ? "active" : ""}
                  aria-pressed={feedbackReason === reason}
                  key={reason}
                  onClick={() => setFeedbackReason(reason)}
                >
                  {reason}
                </button>
              ))}
            </div>
          )}
          {feedback && (
            <small>
              {feedback === "useful"
                ? "Aprendido: RomaCrece buscará más ideas con este enfoque."
                : "Aprendido: RomaCrece evitará repetir este tipo de idea."}
            </small>
          )}
        </section>
        <div className="modal-actions">
          <button
            className="secondary-button"
            onClick={copyContent}
          >
            {copyState === "copied" ? <CheckCircle2 size={16} /> : <Copy size={16} />}
            {copyState === "copied" ? "Contenido copiado" : "Copiar contenido"}
          </button>
          <button className="primary-button" onClick={() => onPlan(editedIdea)}>
            <CalendarDays size={17} /> Añadir al planificador
          </button>
        </div>
        {copyState === "error" && <p className="copy-error" role="alert">No pudimos copiar automáticamente. Mantén pulsado el texto para copiarlo.</p>}
      </section>
    </div>
  );
}

function IdeasView({ data, onPlan, onUpdate }: { data: RomaCreceData; onPlan: (idea: ContentIdea) => void; onUpdate: (data: RomaCreceData) => void }) {
  const [goal, setGoal] = useState<ContentIdea["goal"]>("Atraer");
  const [format, setFormat] = useState<"Todos" | ContentIdea["format"]>("Todos");
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<ContentIdea | null>(null);
  const [generationError, setGenerationError] = useState("");
  const [memorySignals, setMemorySignals] = useState<number | null>(null);
  const ideas = data.ideas ?? [];
  const visibleIdeas = ideas.filter((idea) => idea.goal === goal && (format === "Todos" || idea.format === format));
  const localMemorySignals = ideas.filter((idea) => idea.saved).length
    + ideas.filter((idea) => Boolean(idea.feedback)).length
    + (data.plannedItems ?? []).filter((item) => item.status === "Publicado" || item.status === "Listo").length
    + (data.weeklyMetrics ?? []).length;

  const updateIdeas = (nextIdeas: ContentIdea[]) => onUpdate({ ...data, ideas: nextIdeas });

  const generateIdea = async (count = 1) => {
    setIsGenerating(true);
    setGenerationError("");
    try {
      const result = await generateAiContent(goal, count);
      updateIdeas([...result.ideas, ...ideas]);
      setMemorySignals(result.memorySignals);
    } catch (error) {
      console.error("No se pudo generar contenido con Gemini", error);
      setGenerationError(error instanceof AiContentError ? error.message : "No pudimos crear contenido ahora. Inténtalo nuevamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="page-content inner-page">
      <ViewIntro
        eyebrow="ESTUDIO DE CONTENIDO"
        title="Ideas que conectan y convierten"
        description={`Contenido personalizado para ${data.business.name}, listo para adaptar y publicar.`}
      >
        <button className="primary-button" onClick={() => generateIdea()} disabled={isGenerating}>
          {isGenerating ? <LoaderCircle size={17} className="spin" /> : <WandSparkles size={17} />}
          {isGenerating ? "Creando una idea..." : "Generar nueva idea"}
        </button>
      </ViewIntro>

      <section className="idea-toolbar">
        <div className="goal-filter">
          <span>Mi objetivo:</span>
          {(["Atraer", "Educar", "Vender", "Fidelizar"] as ContentIdea["goal"][]).map((item) => (
            <button
              key={item}
              className={goal === item ? "active" : ""}
              onClick={() => setGoal(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <label className="filter-button">
          <SlidersHorizontal size={16} />
          <select aria-label="Filtrar formato" value={format} onChange={(event) => setFormat(event.target.value as typeof format)}>
            <option>Todos</option><option>Reel</option><option>Carrusel</option><option>Historia</option>
          </select>
        </label>
      </section>

      <section className="ideas-summary">
        <div>
          <span className="summary-icon"><Zap size={19} /></span>
          <div>
            <strong>{visibleIdeas.length} ideas para {goal.toLowerCase()}</strong>
            <p>
              {(memorySignals ?? localMemorySignals) > 0
                ? `RomaCrece ya usa ${memorySignals ?? localMemorySignals} aprendizajes de tu negocio`
                : "Marca qué ideas te sirven y RomaCrece aprenderá de tus decisiones"}
            </p>
          </div>
        </div>
        <span>Actualizado hoy</span>
      </section>

      {generationError && <div className="content-generation-error" role="alert"><AlertCircle size={17} /> {generationError}</div>}

      <section className="ideas-grid">
        {visibleIdeas.map((idea) => {
          const Icon = ideaIcon(idea.format);
          const isSaved = idea.saved;
          return (
            <article className="idea-card new-idea" key={idea.id}>
              <div className="idea-card-top">
                <span
                  className="idea-format-icon"
                  style={{ backgroundColor: `${idea.color}16`, color: idea.color }}
                >
                  <Icon size={20} />
                </span>
                <div className="idea-score">
                  <Sparkles size={13} />
                  Recomendada para ti
                </div>
                <button
                  className={`save-idea ${isSaved ? "saved" : ""}`}
                  aria-label={isSaved ? "Quitar de guardados" : "Guardar idea"}
                  onClick={() => updateIdeas(ideas.map((item) => item.id === idea.id ? { ...item, saved: !item.saved } : item))}
                >
                  <Heart size={18} fill={isSaved ? "currentColor" : "none"} />
                </button>
              </div>
              <span className="idea-format" style={{ color: idea.color }}>{idea.goal} · {idea.format}</span>
              <h2>{idea.title}</h2>
              <div className="hook-box">
                <span>GANCHO</span>
                <p>“{idea.hook}”</p>
              </div>
              <div className="idea-reason">
                <TrendingUp size={15} />
                {idea.reason}
              </div>
              {idea.feedback && (
                <div className={`idea-feedback-status ${idea.feedback}`}>
                  {idea.feedback === "useful" ? "RomaCrece aprendió: te sirve" : "RomaCrece aprendió: no repetir"}
                </div>
              )}
              <div className="idea-actions">
                <button className="use-button" onClick={() => setSelectedIdea(idea)}>
                  Abrir y editar idea <ArrowRight size={15} />
                </button>
              </div>
            </article>
          );
        })}
        {visibleIdeas.length === 0 && !isGenerating && (
          <div className="ideas-empty-state">
            <Sparkles size={24} />
            <h2>Aún no tienes ideas para {goal.toLowerCase()}</h2>
            <p>Gemini usará la memoria de tu negocio para crear la primera.</p>
            <button className="primary-button" onClick={() => generateIdea()}>Crear una idea</button>
          </div>
        )}
      </section>

      <section className="inspiration-strip">
        <div>
          <span><BookOpen size={19} /></span>
          <div>
            <strong>¿Sin tiempo para decidir?</strong>
            <p>RomaCrece puede crear una semana completa combinando tus mejores formatos.</p>
          </div>
        </div>
        <button onClick={() => generateIdea(5)} disabled={isGenerating}>
          Crear mi semana con IA <ArrowRight size={15} />
        </button>
      </section>

      {selectedIdea && (
        <IdeaModal
          idea={selectedIdea}
          onClose={() => setSelectedIdea(null)}
          onSave={(editedIdea) => updateIdeas(ideas.map((item) => item.id === editedIdea.id ? editedIdea : item))}
          onPlan={(editedIdea) => {
            onPlan(editedIdea);
            setSelectedIdea(null);
          }}
        />
      )}
    </div>
  );
}

const dayNames = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function toLocalDateKey(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getCalendarWeek(offset: number) {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7) + offset * 7);
  const days = dayNames.map((name, index) => {
    const value = new Date(monday);
    value.setDate(monday.getDate() + index);
    return { name, date: String(value.getDate()), today: value.toDateString() === today.toDateString() };
  });
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const format = new Intl.DateTimeFormat("es", { day: "numeric", month: "short" });
  return { days, label: `${format.format(monday)} – ${format.format(sunday)}`, weekStart: toLocalDateKey(monday) };
}

function PlannerView({ items, onUpdate }: { items: PlannedContent[]; onUpdate: (items: PlannedContent[]) => void }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newFormat, setNewFormat] = useState<ContentIdea["format"]>("Reel");
  const [newTime, setNewTime] = useState("19:00");
  const [newDay, setNewDay] = useState(3);
  const [newStatus, setNewStatus] = useState<PlannedContent["status"]>("Idea");
  const [editingId, setEditingId] = useState<number | null>(null);
  const plannedItems = items;
  const calendarWeek = useMemo(() => getCalendarWeek(weekOffset), [weekOffset]);
  const visibleItems = plannedItems.filter((item) => isPlannedForWeek(item, calendarWeek.weekStart, weekOffset));
  const formatBalance = ([
    { format: "Reel", color: "#e83387" },
    { format: "Carrusel", color: "#7c5ce5" },
    { format: "Historia", color: "#ef8a2e" },
  ] as const).map((entry) => ({
    ...entry,
    count: visibleItems.filter((item) => item.format === entry.format).length,
    percent: visibleItems.length ? Math.round((visibleItems.filter((item) => item.format === entry.format).length / visibleItems.length) * 100) : 0,
  }));
  const plannedTimes = Object.entries(visibleItems.reduce<Record<string, number>>((counts, item) => {
    counts[item.time] = (counts[item.time] ?? 0) + 1;
    return counts;
  }, {})).sort((a, b) => b[1] - a[1]).slice(0, 2);

  const openNewContent = (day = 3) => {
    setEditingId(null);
    setNewTitle("");
    setNewFormat("Reel");
    setNewTime("19:00");
    setNewDay(day);
    setNewStatus("Idea");
    setShowAdd(true);
  };

  const openEditContent = (item: PlannedContent) => {
    setEditingId(item.id);
    setNewTitle(item.title);
    setNewFormat(item.format);
    setNewTime(item.time);
    setNewDay(item.day);
    setNewStatus(item.status);
    setShowAdd(true);
  };

  const addContent = () => {
    if (!newTitle.trim()) return;
    const editingItem = plannedItems.find((item) => item.id === editingId);
    const nextItem: PlannedContent = {
      id: editingId ?? Date.now(),
      week: weekOffset,
      weekStart: calendarWeek.weekStart,
      sourceIdeaId: editingItem?.sourceIdeaId ?? null,
      day: newDay,
      time: newTime,
      format: newFormat,
      title: newTitle.trim(),
      status: newStatus,
      color: newFormat === "Reel" ? "#e83387" : newFormat === "Carrusel" ? "#7c5ce5" : "#ef8a2e",
    };
    onUpdate(editingId === null
      ? [...plannedItems, nextItem]
      : plannedItems.map((item) => item.id === editingId ? nextItem : item));
    setNewTitle("");
    setShowAdd(false);
  };

  return (
    <div className="page-content inner-page planner-page">
      <ViewIntro
        eyebrow="CALENDARIO DE CONTENIDO"
        title="Planifica con intención"
        description="Organiza tu semana y mantén una presencia constante sin improvisar."
      >
        <button className="primary-button" onClick={() => openNewContent()}>
          <Plus size={17} /> Nuevo contenido
        </button>
      </ViewIntro>

      <section className="planner-toolbar">
        <div className="week-switcher">
          <button aria-label="Semana anterior" onClick={() => setWeekOffset((v) => v - 1)}>
            <ChevronLeft size={18} />
          </button>
          <div>
            <strong>
              {calendarWeek.label}
            </strong>
            <span>{weekOffset === 0 ? "Esta semana" : weekOffset < 0 ? "Semana anterior" : "Próxima semana"}</span>
          </div>
          <button aria-label="Semana siguiente" onClick={() => setWeekOffset((v) => v + 1)}>
            <ChevronRight size={18} />
          </button>
        </div>
        <div className="planner-stats">
          <span><span className="dot published" /> {visibleItems.filter((item) => item.status === "Publicado").length} publicados</span>
          <span><span className="dot ready" /> {visibleItems.filter((item) => item.status === "Listo").length} listos</span>
          <span><span className="dot draft" /> {visibleItems.filter((item) => item.status === "Idea" || item.status === "Borrador").length} pendientes</span>
        </div>
      </section>

      <section className="calendar-board">
        {calendarWeek.days.map((day, dayIndex) => (
          <div className={`calendar-column ${day.today ? "today" : ""}`} key={day.name}>
            <div className="calendar-head">
              <span>{day.name}</span>
              <strong>{day.date}</strong>
              {day.today && <em>HOY</em>}
            </div>
            <div className="calendar-body">
              {visibleItems
                .filter((item) => item.day === dayIndex)
                .map((item) => (
                  <article
                    className="calendar-item"
                    key={item.id}
                    style={{ borderTopColor: item.color }}
                  >
                    <div className="calendar-item-top">
                      <span style={{ color: item.color }}>{item.format}</span>
                      <button aria-label={`Editar ${item.title}`} onClick={() => openEditContent(item)}><MoreHorizontal size={15} /></button>
                    </div>
                    <h3>{item.title}</h3>
                    <span className="calendar-time"><Clock3 size={13} /> {item.time}</span>
                    <span className={`calendar-status ${item.status.toLowerCase()}`}>
                      {item.status === "Publicado" && <Check size={12} />}
                      {item.status}
                    </span>
                  </article>
                ))}
              {visibleItems.filter((item) => item.day === dayIndex).length === 0 && (
                <button className="add-slot" onClick={() => openNewContent(dayIndex)}>
                  <Plus size={16} /> Añadir
                </button>
              )}
            </div>
          </div>
        ))}
      </section>

      <section className="planner-bottom">
        <article className="optimal-times">
          <div className="panel-heading">
            <div>
              <span>TUS HORARIOS</span>
              <h3>Horas que has planificado esta semana</h3>
            </div>
            <Clock3 size={19} />
          </div>
          <div className="time-chips">
            {plannedTimes.map(([time, count]) => <span key={time}><strong>{time}</strong> {count} {count === 1 ? "contenido" : "contenidos"}</span>)}
            {plannedTimes.length === 0 && <span><strong>Sin horarios</strong> Añade contenido al calendario</span>}
          </div>
        </article>
        <article className="weekly-balance">
          <div className="panel-heading">
            <div>
              <span>EQUILIBRIO SEMANAL</span>
              <h3>{visibleItems.length ? "Distribución de tus formatos" : "Añade contenido para ver el equilibrio"}</h3>
            </div>
            <CheckCircle2 size={19} />
          </div>
          <div className="balance-bar">
            {formatBalance.filter((entry) => entry.percent > 0).map((entry) => (
              <span key={entry.format} style={{ width: `${entry.percent}%`, background: entry.color }} />
            ))}
          </div>
          <div className="balance-labels">
            {formatBalance.map((entry) => <span key={entry.format}>{entry.format} {entry.percent}%</span>)}
          </div>
        </article>
      </section>

      {showAdd && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setShowAdd(false)}>
          <section
            className="small-modal"
            role="dialog"
            aria-modal="true"
            aria-label={editingId === null ? "Añadir contenido" : "Editar contenido"}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="modal-head">
              <div>
                <span><CalendarCheck2 size={14} /> {editingId === null ? "NUEVO CONTENIDO" : "EDITAR CONTENIDO"}</span>
                <h2>{editingId === null ? "Añadir al calendario" : "Actualiza tu publicación"}</h2>
              </div>
              <button aria-label="Cerrar formulario" onClick={() => setShowAdd(false)}><X size={20} /></button>
            </div>
            <label className="form-field">
              <span>Título o idea</span>
              <input
                value={newTitle}
                onChange={(event) => setNewTitle(event.target.value)}
                placeholder="Ej.: Cuidados después de la manicura"
              />
            </label>
            <div className="form-row">
              <label className="form-field">
                <span>Día</span>
                <select value={newDay} onChange={(event) => setNewDay(Number(event.target.value))}>
                  {dayNames.map((day, index) => <option value={index} key={day}>{day}</option>)}
                </select>
              </label>
              <label className="form-field">
                <span>Formato</span>
                <select value={newFormat} onChange={(event) => setNewFormat(event.target.value as ContentIdea["format"])}>
                  <option>Reel</option>
                  <option>Carrusel</option>
                  <option>Historia</option>
                </select>
              </label>
            </div>
            <div className="form-row">
              <label className="form-field">
                <span>Hora</span>
                <input type="time" value={newTime} onChange={(event) => setNewTime(event.target.value)} />
              </label>
              <label className="form-field">
                <span>Estado</span>
                <select value={newStatus} onChange={(event) => setNewStatus(event.target.value as PlannedContent["status"])}>
                  <option>Idea</option><option>Borrador</option><option>Listo</option><option>Publicado</option>
                </select>
              </label>
            </div>
            <div className="planner-modal-actions">
              {editingId !== null && (
                <button className="delete-button" onClick={() => {
                  onUpdate(plannedItems.filter((item) => item.id !== editingId));
                  setShowAdd(false);
                }}>Eliminar</button>
              )}
              <button className="primary-button" onClick={addContent}>
                {editingId === null ? <Plus size={17} /> : <Check size={17} />}
                {editingId === null ? "Añadir al calendario" : "Guardar cambios"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

type WeeklyDraft = Omit<WeeklyMetrics, "id" | "weekStart" | "updatedAt">;
type WeeklyNumberField = Exclude<keyof WeeklyDraft, "bestPost" | "bestPlannedContentId">;

const emptyWeeklyDraft = (followers: number): WeeklyDraft => ({
  followers,
  reach: 0,
  profileVisits: 0,
  likes: 0,
  comments: 0,
  saves: 0,
  messages: 0,
  bookings: 0,
  posts: 0,
  reels: 0,
  stories: 0,
  bestPost: "",
  bestPlannedContentId: null,
});

const numberFormat = new Intl.NumberFormat("es");

function previousWeekKey(weekStart: string) {
  const [year, month, day] = weekStart.split("-").map(Number);
  const date = new Date(year, month - 1, day, 12);
  date.setDate(date.getDate() - 7);
  return toLocalDateKey(date);
}

function metricDifference(current: number, previous?: number, percentage = false) {
  if (previous === undefined) return { text: "Primera medición", direction: "neutral" };
  if (percentage) {
    const change = calculateChange(current, previous);
    if (change === null) return { text: "Nuevo resultado", direction: "up" };
    if (change === 0) return { text: "Sin cambio", direction: "neutral" };
    return { text: `${change > 0 ? "+" : ""}${change}%`, direction: change > 0 ? "up" : "down" };
  }
  const difference = current - previous;
  if (difference === 0) return { text: "Sin cambio", direction: "neutral" };
  return { text: `${difference > 0 ? "+" : ""}${numberFormat.format(difference)}`, direction: difference > 0 ? "up" : "down" };
}

function ResultsView({ data, onUpdate }: { data: RomaCreceData; onUpdate: (data: RomaCreceData) => void }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const week = useMemo(() => getCalendarWeek(weekOffset), [weekOffset]);
  const metrics = useMemo(
    () => [...(data.weeklyMetrics ?? [])].sort((a, b) => a.weekStart.localeCompare(b.weekStart)),
    [data.weeklyMetrics],
  );
  const current = metrics.find((item) => item.weekStart === week.weekStart);
  const previous = metrics.find((item) => item.weekStart === previousWeekKey(week.weekStart));
  const plannedWeekItems = (data.plannedItems ?? [])
    .filter((item) => isPlannedForWeek(item, week.weekStart, weekOffset))
    .sort((a, b) => a.day - b.day || a.time.localeCompare(b.time));
  const closestFollowers = [...metrics]
    .reverse()
    .find((item) => item.weekStart < week.weekStart)?.followers ?? data.answers.followers ?? 0;
  const [draft, setDraft] = useState<WeeklyDraft>(() => emptyWeeklyDraft(closestFollowers));
  const chartEntries = metrics.slice(-8);
  const highestReach = Math.max(1, ...chartEntries.map((item) => item.reach));

  const openForm = () => {
    setDraft(current
      ? {
        followers: current.followers,
        reach: current.reach,
        profileVisits: current.profileVisits,
        likes: current.likes,
        comments: current.comments,
        saves: current.saves,
        messages: current.messages,
        bookings: current.bookings,
        posts: current.posts,
        reels: current.reels,
        stories: current.stories,
        bestPost: current.bestPost,
        bestPlannedContentId: current.bestPlannedContentId ?? null,
      }
      : emptyWeeklyDraft(closestFollowers));
    setShowForm(true);
  };

  const updateNumber = (field: WeeklyNumberField, value: number) => {
    setDraft((currentDraft) => ({ ...currentDraft, [field]: value }));
  };

  const saveWeek = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const entry: WeeklyMetrics = {
      ...draft,
      id: current?.id ?? crypto.randomUUID(),
      weekStart: week.weekStart,
      updatedAt: new Date().toISOString(),
    };
    const nextMetrics = [...metrics.filter((item) => item.weekStart !== week.weekStart), entry]
      .sort((a, b) => a.weekStart.localeCompare(b.weekStart));
    onUpdate({ ...data, weeklyMetrics: nextMetrics });
    setShowForm(false);
  };

  const selectWeek = (weekStart: string) => {
    const currentMonday = new Date(`${getCalendarWeek(0).weekStart}T12:00:00`);
    const selectedMonday = new Date(`${weekStart}T12:00:00`);
    setWeekOffset(Math.round((selectedMonday.getTime() - currentMonday.getTime()) / 604800000));
  };

  const reachChange = current && previous ? calculateChange(current.reach, previous.reach) : null;
  const summary = !current
    ? "Aún no has registrado esta semana. Tardarás unos dos minutos."
    : !previous
      ? "Esta es tu primera semana registrada. La próxima vez verás aquí la comparación."
      : reachChange === null
        ? "Esta semana ya tienes alcance para empezar a medir tu crecimiento."
        : reachChange > 0
          ? `Tu alcance creció ${reachChange}% frente a la semana anterior.`
          : reachChange < 0
            ? `Tu alcance bajó ${Math.abs(reachChange)}%. Revisemos qué puedes ajustar.`
            : "Tu alcance se mantuvo igual que la semana anterior.";

  const comparisonCards = current ? [
    { label: "Seguidores", value: current.followers, change: metricDifference(current.followers, previous?.followers), icon: Users, color: "#ef8a2e" },
    { label: "Alcance", value: current.reach, change: metricDifference(current.reach, previous?.reach, true), icon: Eye, color: "#7c5ce5" },
    { label: "Mensajes", value: current.messages, change: metricDifference(current.messages, previous?.messages), icon: MessageCircleMore, color: "#e83387" },
    { label: "Reservas", value: current.bookings, change: metricDifference(current.bookings, previous?.bookings), icon: CalendarCheck2, color: "#0c9b78" },
  ] : [];

  const funnelWidth = (value: number) => {
    if (!current?.reach || value === 0) return "12%";
    return `${Math.max(24, Math.min(100, (value / current.reach) * 100))}%`;
  };
  const percentageOf = (value: number, base: number) => base > 0 ? Math.round((value / base) * 100) : 0;

  const opportunity = !current
    ? { title: "Registra tu primera semana", text: "Con tus números reales podremos darte una recomendación útil." }
    : current.messages === 0
      ? { title: "Invita a escribirte", text: "Termina tus publicaciones con una pregunta o una invitación clara a enviar mensaje." }
      : current.bookings === 0
        ? { title: "Da seguimiento a los mensajes", text: "Responde con rapidez, aclara el siguiente paso y facilita la reserva." }
        : current.bestPost
          ? { title: "Repite lo que funcionó", text: `Crea una variación de “${current.bestPost}” durante la próxima semana.` }
          : { title: "Anota tu mejor publicación", text: "La próxima semana identifica la publicación que más conversaciones generó." };

  return (
    <div className="page-content inner-page">
      <ViewIntro
        eyebrow="SEGUIMIENTO SEMANAL"
        title="¿Cómo te fue esta semana?"
        description="Anota tus números una vez por semana. RomaCrece guarda el historial y te muestra qué mejoró."
      >
        <div className="weekly-actions">
          <div className="week-switcher" aria-label="Cambiar semana">
            <button aria-label="Semana anterior" onClick={() => setWeekOffset((value) => value - 1)}><ChevronLeft size={17} /></button>
            <span><CalendarDays size={15} /> {week.label}</span>
            <button aria-label="Semana siguiente" disabled={weekOffset >= 0} onClick={() => setWeekOffset((value) => Math.min(0, value + 1))}><ChevronRight size={17} /></button>
          </div>
          <button className="primary-button" onClick={openForm}>
            {current ? <Check size={17} /> : <Plus size={17} />}
            {current ? "Editar semana" : "Registrar resultados"}
          </button>
        </div>
      </ViewIntro>

      {!current ? (
        <section className="weekly-empty">
          <div className="weekly-empty-icon"><ChartNoAxesCombined size={28} /></div>
          <div>
            <span>PRIMER PASO</span>
            <h2>Convierte tus números en decisiones</h2>
            <p>{summary} Puedes encontrarlos en las estadísticas de Instagram y también usar valores aproximados.</p>
          </div>
          <button className="primary-button" onClick={openForm}><Plus size={17} /> Registrar esta semana</button>
        </section>
      ) : (
        <>
          <section className="results-highlight weekly-highlight">
            <div className="results-copy">
              <div className="card-kicker"><TrendingUp size={17} /> RESUMEN DE LA SEMANA</div>
              <h2>{summary}</h2>
              <p>
                Publicaste <strong>{current.posts} publicaciones</strong>, <strong>{current.reels} Reels</strong> y
                recibiste <strong> {current.messages} mensajes</strong> relacionados con tu negocio.
              </p>
              {current.bestPost && (
                <div className="result-win">
                  <Award size={18} />
                  <span><strong>Lo que mejor funcionó:</strong> {current.bestPost}<small> RomaCrece usará este resultado para mejorar tus próximas ideas.</small></span>
                </div>
              )}
            </div>
            <div className="growth-figure">
              <span>RESERVAS LOGRADAS</span>
              <strong>{current.bookings}</strong>
              <small>desde Instagram esta semana</small>
            </div>
          </section>

          <section className="result-metrics">
            {comparisonCards.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.label}>
                  <span style={{ color: item.color, backgroundColor: `${item.color}14` }}><Icon size={20} /></span>
                  <div><small>{item.label}</small><strong>{numberFormat.format(item.value)}</strong></div>
                  <em className={`change-${item.change.direction}`}>
                    {item.change.direction === "down" ? <TrendingUp className="trend-down" size={12} /> : <TrendingUp size={12} />}
                    {item.change.text}
                  </em>
                </article>
              );
            })}
          </section>

          <section className="analytics-grid">
            <article className="reach-chart">
              <div className="panel-heading">
                <div>
                  <span>HISTORIAL DE ALCANCE</span>
                  <h3>{chartEntries.length > 1 ? "Así avanza tu cuenta semana a semana" : "Tu historial comienza aquí"}</h3>
                </div>
                <span className="chart-total">{chartEntries.length} {chartEntries.length === 1 ? "semana" : "semanas"}</span>
              </div>
              <div className="chart-area weekly-chart" aria-label="Gráfico de alcance por semana">
                <div className="chart-lines"><i /><i /><i /><i /></div>
                <div className="bar-columns" style={{ gridTemplateColumns: `repeat(${chartEntries.length}, minmax(0, 1fr))` }}>
                  {chartEntries.map((item) => {
                    const isSelected = item.weekStart === week.weekStart;
                    const labelDate = new Date(`${item.weekStart}T12:00:00`);
                    return (
                      <button type="button" className="bar-column" key={item.weekStart} onClick={() => selectWeek(item.weekStart)} aria-label={`Ver semana con ${item.reach} personas alcanzadas`}>
                        <span className={isSelected ? "best" : ""} style={{ height: `${Math.max(8, (item.reach / highestReach) * 100)}%` }}>
                          {isSelected && <em>{numberFormat.format(item.reach)}</em>}
                        </span>
                        <small>{new Intl.DateTimeFormat("es", { day: "numeric", month: "short" }).format(labelDate)}</small>
                      </button>
                    );
                  })}
                </div>
              </div>
            </article>

            <article className="conversion-card">
              <div className="panel-heading">
                <div>
                  <span>CAMINO A LA RESERVA</span>
                  <h3>De Instagram a una clienta</h3>
                </div>
                <Target size={19} />
              </div>
              <div className="funnel">
                <div style={{ width: "100%" }}><span>{numberFormat.format(current.reach)}</span><small>Personas alcanzadas</small></div>
                <div style={{ width: funnelWidth(current.profileVisits) }}><span>{numberFormat.format(current.profileVisits)}</span><small>Visitas · {percentageOf(current.profileVisits, current.reach)}% del alcance</small></div>
                <div style={{ width: funnelWidth(current.messages) }}><span>{numberFormat.format(current.messages)}</span><small>Mensajes · {percentageOf(current.messages, current.profileVisits)}% de visitas</small></div>
                <div style={{ width: funnelWidth(current.bookings) }}><span>{numberFormat.format(current.bookings)}</span><small>Reservas · {percentageOf(current.bookings, current.messages)}% de mensajes</small></div>
              </div>
              <p><MessageSquareText size={14} /> Estos datos los registraste tú; no son cifras de demostración.</p>
            </article>
          </section>

          <section className="insights-row">
            <article className="insight-card positive">
              <span><Heart size={19} /></span>
              <div>
                <small>RESPUESTA DEL PÚBLICO</small>
                <h3>{numberFormat.format(current.likes + current.comments + current.saves)} interacciones</h3>
                <p>{current.likes} Me gusta · {current.comments} comentarios · {current.saves} guardados.</p>
              </div>
            </article>
            <article className="insight-card attention">
              <span><AlertCircle size={19} /></span>
              <div>
                <small>PRÓXIMA OPORTUNIDAD</small>
                <h3>{opportunity.title}</h3>
                <p>{opportunity.text}</p>
              </div>
            </article>
            <article className="insight-card neutral">
              <span><Clock3 size={19} /></span>
              <div>
                <small>ACTIVIDAD DE LA SEMANA</small>
                <h3>{current.posts + current.reels} contenidos publicados</h3>
                <p>{current.posts} publicaciones · {current.reels} Reels · {current.stories} Stories.</p>
              </div>
            </article>
          </section>
        </>
      )}

      {metrics.length > 0 && (
        <section className="weekly-history">
          <div className="panel-heading">
            <div><span>TU HISTORIAL</span><h3>Semanas registradas</h3></div>
            <small>Guardado automáticamente</small>
          </div>
          <div className="weekly-history-list">
            {[...metrics].reverse().slice(0, 8).map((item) => (
              <button key={item.weekStart} className={item.weekStart === week.weekStart ? "active" : ""} onClick={() => selectWeek(item.weekStart)}>
                <span>Semana del {new Intl.DateTimeFormat("es", { day: "numeric", month: "short" }).format(new Date(`${item.weekStart}T12:00:00`))}</span>
                <strong>{numberFormat.format(item.reach)} alcance</strong>
                <small>{item.messages} mensajes · {item.bookings} reservas</small>
              </button>
            ))}
          </div>
        </section>
      )}

      {showForm && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setShowForm(false)}>
          <form
            className="small-modal weekly-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Registrar resultados semanales"
            onSubmit={saveWeek}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="modal-head">
              <div>
                <span><ChartNoAxesCombined size={14} /> SEMANA {week.label.toUpperCase()}</span>
                <h2>{current ? "Actualiza tus resultados" : "Cuéntanos cómo te fue"}</h2>
              </div>
              <button type="button" aria-label="Cerrar formulario" onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <p className="weekly-form-help">Usa las estadísticas de Instagram. Si no tienes un dato exacto, puedes escribir un aproximado.</p>

            <fieldset className="weekly-fieldset">
              <legend>Tu cuenta</legend>
              <div className="form-row">
                <label className="form-field"><span>Seguidores actuales</span><ClearableNumberInput required min={0} value={draft.followers} onValueChange={(value) => updateNumber("followers", value)} /></label>
                <label className="form-field"><span>Personas alcanzadas</span><ClearableNumberInput required min={0} value={draft.reach} onValueChange={(value) => updateNumber("reach", value)} /></label>
                <label className="form-field"><span>Visitas al perfil</span><ClearableNumberInput required min={0} value={draft.profileVisits} onValueChange={(value) => updateNumber("profileVisits", value)} /></label>
              </div>
            </fieldset>

            <fieldset className="weekly-fieldset">
              <legend>Respuesta del público</legend>
              <div className="form-row">
                <label className="form-field"><span>Me gusta</span><ClearableNumberInput required min={0} value={draft.likes} onValueChange={(value) => updateNumber("likes", value)} /></label>
                <label className="form-field"><span>Comentarios</span><ClearableNumberInput required min={0} value={draft.comments} onValueChange={(value) => updateNumber("comments", value)} /></label>
                <label className="form-field"><span>Guardados</span><ClearableNumberInput required min={0} value={draft.saves} onValueChange={(value) => updateNumber("saves", value)} /></label>
              </div>
            </fieldset>

            <fieldset className="weekly-fieldset">
              <legend>Clientes y contenido</legend>
              <div className="form-row">
                <label className="form-field"><span>Mensajes recibidos</span><ClearableNumberInput required min={0} value={draft.messages} onValueChange={(value) => updateNumber("messages", value)} /></label>
                <label className="form-field"><span>Reservas logradas</span><ClearableNumberInput required min={0} value={draft.bookings} onValueChange={(value) => updateNumber("bookings", value)} /></label>
                <label className="form-field"><span>Publicaciones</span><ClearableNumberInput required min={0} value={draft.posts} onValueChange={(value) => updateNumber("posts", value)} /></label>
              </div>
              <div className="form-row">
                <label className="form-field"><span>Reels</span><ClearableNumberInput required min={0} value={draft.reels} onValueChange={(value) => updateNumber("reels", value)} /></label>
                <label className="form-field"><span>Stories</span><ClearableNumberInput required min={0} value={draft.stories} onValueChange={(value) => updateNumber("stories", value)} /></label>
                <label className="form-field">
                  <span>Contenido que mejor funcionó</span>
                  <select
                    value={draft.bestPlannedContentId ?? ""}
                    onChange={(event) => {
                      const selectedId = event.target.value ? Number(event.target.value) : null;
                      const selected = plannedWeekItems.find((item) => item.id === selectedId);
                      setDraft((value) => ({
                        ...value,
                        bestPlannedContentId: selectedId,
                        bestPost: selected?.title ?? "",
                      }));
                    }}
                  >
                    <option value="">Otra o todavía no lo sé</option>
                    {plannedWeekItems.map((item) => (
                      <option value={item.id} key={item.id}>{item.title} · {item.status}</option>
                    ))}
                  </select>
                </label>
              </div>
              {draft.bestPlannedContentId === null && (
                <label className="form-field weekly-best-custom">
                  <span>Si no estaba en el calendario, escribe su nombre</span>
                  <input value={draft.bestPost} onChange={(event) => setDraft((value) => ({ ...value, bestPost: event.target.value }))} placeholder="Ej.: Reel antes y después" />
                </label>
              )}
            </fieldset>

            <div className="planner-modal-actions">
              <button type="button" className="secondary-button" onClick={() => setShowForm(false)}>Cancelar</button>
              <button type="submit" className="primary-button"><Check size={17} /> Guardar mi semana</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [activeView, setActiveView] = useState<View>("inicio");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [data, setData] = useState<RomaCreceData | null>(null);
  const [isReady, setIsReady] = useState(!isSupabaseConfigured || isLocalAuditPreview);
  const [editingAudit, setEditingAudit] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [accessStatus, setAccessStatus] = useState<RomaCreceAccess | null>(null);
  const [accessCheck, setAccessCheck] = useState(0);
  const [syncState, setSyncState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const loadedUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!supabase || isLocalAuditPreview) return;
    supabase.auth.getSession().then(({ data: sessionData }) => {
      setUser(sessionData.session?.user ?? null);
      setIsReady(!sessionData.session);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAccessStatus(null);
      if (!session) {
        loadedUserId.current = null;
        setData(null);
        setIsReady(true);
      } else {
        setIsReady(false);
        setAccessCheck((current) => current + 1);
      }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const load = async () => {
      setIsReady(false);
      let localData: RomaCreceData | null = null;
      try {
        const access = await loadRomaCreceAccess();
        if (cancelled) return;
        setAccessStatus(access);
        if (!access.allowed) {
          loadedUserId.current = null;
          setData(null);
          return;
        }

        if (loadedUserId.current === user.id) return;
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved) localData = JSON.parse(saved) as RomaCreceData;
        const cloudData = await loadCloudData(user);
        if (cancelled) return;
        const nextData = cloudData ?? localData;
        loadedUserId.current = user.id;
        setData(nextData);
        if (nextData) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextData));
        setSyncState(cloudData ? "saved" : "idle");
      } catch (error) {
        console.error("No se pudo comprobar el acceso de RomaCrece", error);
        if (!cancelled) {
          loadedUserId.current = null;
          setData(null);
          setAccessStatus({
            allowed: false,
            reason: "access_unavailable",
            businessId: null,
            businessSlug: null,
            businessName: null,
            subscriptionState: null,
            renewalDate: null,
          });
          setSyncState("error");
        }
      } finally {
        if (!cancelled) setIsReady(true);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [accessCheck, user]);

  useEffect(() => {
    if (!user) return;
    const recheckWhenVisible = () => {
      if (document.visibilityState === "visible") setAccessCheck((current) => current + 1);
    };
    document.addEventListener("visibilitychange", recheckWhenVisible);
    return () => document.removeEventListener("visibilitychange", recheckWhenVisible);
  }, [user]);

  useEffect(() => {
    if (!user || !accessStatus?.allowed || !data || loadedUserId.current !== user.id) return;
    setSyncState("saving");
    const timer = window.setTimeout(() => {
      saveCloudData(user, data)
        .then(() => setSyncState("saved"))
        .catch((error) => {
          console.error("No se pudieron guardar los datos en Supabase", error);
          setSyncState("error");
        });
    }, 650);
    return () => window.clearTimeout(timer);
  }, [accessStatus?.allowed, data, user]);

  const completeOnboarding = (nextData: RomaCreceData) => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextData));
    setData(nextData);
    setEditingAudit(false);
    setActiveView("auditoria");
  };

  const updateData = (nextData: RomaCreceData) => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextData));
    setData(nextData);
  };

  const signOut = async () => {
    await supabase?.auth.signOut();
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(AUDIT_DRAFT_KEY);
    setAccessStatus(null);
  };

  const retryAccess = () => {
    setAccessStatus(null);
    setIsReady(false);
    setAccessCheck((current) => current + 1);
  };

  const planIdea = (idea: ContentIdea) => {
    if (!data) return;
    const weekStart = getCalendarWeek(0).weekStart;
    const existingPlan = (data.plannedItems ?? []).some((item) =>
      item.sourceIdeaId === idea.id && isPlannedForWeek(item, weekStart, 0));
    if (existingPlan) {
      setActiveView("planificador");
      return;
    }
    const plannedItem: PlannedContent = {
      id: Date.now(),
      week: 0,
      weekStart,
      sourceIdeaId: idea.id,
      day: 3,
      time: "19:00",
      format: idea.format,
      title: idea.title,
      status: "Idea",
      color: idea.color,
    };
    updateData({
      ...data,
      ideas: (data.ideas ?? []).map((item) => item.id === idea.id
        ? { ...idea, feedback: "useful", feedbackReason: "" }
        : item),
      plannedItems: [...(data.plannedItems ?? []), plannedItem],
    });
    setActiveView("planificador");
  };

  if (!isReady) {
    return (
      <main className="app-loading" aria-label="Cargando RomaCrece">
        <Brand />
        <LoaderCircle className="spin" size={24} />
      </main>
    );
  }

  if (isSupabaseConfigured && !isLocalAuditPreview && !user) return <AuthScreen />;
  if (isSupabaseConfigured && !isLocalAuditPreview && accessStatus && !accessStatus.allowed) {
    return <AccessBlocked access={accessStatus} onRetry={retryAccess} onSignOut={signOut} />;
  }
  if (!data) return <Onboarding onComplete={completeOnboarding} />;
  if (editingAudit) return <Onboarding initialData={data} onComplete={completeOnboarding} />;

  return (
    <main className="app-shell">
      <Sidebar
        business={data.business}
        activeView={activeView}
        onNavigate={setActiveView}
        onEditBusiness={() => setEditingAudit(true)}
        onSignOut={signOut}
        mobileOpen={mobileOpen}
        closeMobile={() => setMobileOpen(false)}
      />
      <div className="main-area">
        <Header data={data} openMenu={() => setMobileOpen(true)} onNavigate={setActiveView} />
        <div className={`sync-indicator ${syncState}`} role="status">
          {syncState === "saving" && "Guardando…"}
          {syncState === "saved" && "Guardado en la nube"}
          {syncState === "error" && "Sin conexión · guardado local"}
        </div>
        <div className="view-stage" key={activeView}>
          {activeView === "inicio" && <HomeView data={data} onNavigate={setActiveView} onUpdate={updateData} />}
          {activeView === "auditoria" && <AuditView data={data} onEdit={() => setEditingAudit(true)} onNavigate={setActiveView} onUpdate={updateData} />}
          {activeView === "ideas" && <IdeasView data={data} onPlan={planIdea} onUpdate={updateData} />}
          {activeView === "planificador" && <PlannerView items={data.plannedItems ?? []} onUpdate={(items) => updateData({ ...data, plannedItems: items })} />}
          {activeView === "resultados" && <ResultsView data={data} onUpdate={updateData} />}
        </div>
      </div>
      <nav className="mobile-nav" aria-label="Navegación móvil">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={activeView === item.id ? "active" : ""}
              aria-current={activeView === item.id ? "page" : undefined}
              onClick={() => setActiveView(item.id)}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </main>
  );
}

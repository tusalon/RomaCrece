"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
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
  generateContentIdea,
  normalizeAuditAnswers,
  type AuditAnswers,
  type BusinessProfile,
  type ContentIdea,
  type PlannedContent,
  type RomaCreceData,
  type WeeklyMetrics,
} from "./audit-model";
import { generateAiAnalysis } from "./gemini";
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

const metrics = [
  {
    label: "Alcance",
    value: "12.4K",
    change: "+18%",
    detail: "vs. semana anterior",
    icon: Eye,
    color: "#7c5ce5",
    tint: "#f0ebff",
  },
  {
    label: "Interacciones",
    value: "864",
    change: "+12%",
    detail: "vs. semana anterior",
    icon: Users,
    color: "#e83387",
    tint: "#fdeaf3",
  },
  {
    label: "Visitas al perfil",
    value: "1,208",
    change: "+24%",
    detail: "vs. semana anterior",
    icon: MousePointerClick,
    color: "#ef8a2e",
    tint: "#fff2e3",
  },
  {
    label: "Reservas desde IG",
    value: "14",
    change: "+4",
    detail: "esta semana",
    icon: CalendarDays,
    color: "#0c9b78",
    tint: "#e3f7f1",
  },
];

const emptyBusiness: BusinessProfile = {
  name: "",
  category: "Manicura",
  city: "",
  objective: "Conseguir más clientes locales",
  instagram: "",
};

function AuthScreen() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setMessage("");
    const result = mode === "login"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: new URL(import.meta.env.BASE_URL, window.location.origin).toString() },
        });
    setBusy(false);
    if (result.error) {
      setMessage(result.error.message);
      return;
    }
    if (mode === "register" && !result.data.session) {
      setMessage("Revisa tu correo y confirma la cuenta para continuar.");
    }
  };

  return (
    <main className="auth-shell">
      <section className="auth-brand-panel">
        <Brand />
        <div>
          <span><Sparkles size={15} /> TU CRECIMIENTO, GUARDADO</span>
          <h1>Tu estrategia de contenido disponible donde la necesites.</h1>
          <p>Accede para conservar auditorías, ideas y publicaciones en una cuenta protegida.</p>
        </div>
        <small>RomaCrece · Parte del ecosistema RomaHub</small>
      </section>
      <section className="auth-form-panel">
        <form className="auth-card" onSubmit={submit}>
          <span className="auth-kicker">{mode === "login" ? "BIENVENIDA DE NUEVO" : "CREA TU CUENTA"}</span>
          <h2>{mode === "login" ? "Entra a RomaCrece" : "Empieza a crecer"}</h2>
          <p>{mode === "login" ? "Continúa donde dejaste tu estrategia." : "Guarda y sincroniza el progreso de tu negocio."}</p>
          <label>
            <span>Correo electrónico</span>
            <input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="tu@negocio.com" />
          </label>
          <label>
            <span>Contraseña</span>
            <input type="password" required minLength={6} autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Mínimo 6 caracteres" />
          </label>
          {message && <div className="auth-message" role="status">{message}</div>}
          <button className="primary-button auth-submit" disabled={busy} type="submit">
            {busy ? <LoaderCircle className="spin" size={17} /> : mode === "login" ? "Entrar" : "Crear cuenta"}
            {!busy && <ArrowRight size={17} />}
          </button>
          <button className="auth-switch" type="button" onClick={() => { setMode(mode === "login" ? "register" : "login"); setMessage(""); }}>
            {mode === "login" ? "¿Aún no tienes cuenta? Crear una" : "¿Ya tienes cuenta? Iniciar sesión"}
          </button>
        </form>
      </section>
    </main>
  );
}

function Onboarding({ initialData, onComplete }: { initialData?: RomaCreceData; onComplete: (data: RomaCreceData) => void }) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(initialData ? 2 : 1);
  const [business, setBusiness] = useState(initialData?.business ?? emptyBusiness);
  const [answers, setAnswers] = useState(normalizeAuditAnswers(initialData?.answers));

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
          <div className="onboarding-heading">
            <span>PASO {step} DE 4</span>
            <h2>{step === 1 ? "Conozcamos tu negocio" : step === 2 ? "Cuéntanos sobre tu trabajo" : step === 3 ? "Miremos tus números reales" : "¿Cómo publicas hoy?"}</h2>
            <p>
              {step === 1
                ? "Estos datos nos ayudan a adaptar el análisis a tu realidad."
                : step === 2
                  ? "Son preguntas rápidas para entender el contexto de tu cuenta."
                  : step === 3
                    ? "Usa los números de tu perfil y el promedio de una publicación normal."
                    : "No hay respuestas buenas o malas: queremos conocer tu rutina real."}
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
                }}>
                  <option>Trabajo sola</option>
                  <option>Tengo equipo</option>
                </select>
              </label>
              {answers.workMode === "Tengo equipo" && (
                <label className="onboarding-field">
                  <span>¿Cuántas personas forman el equipo?</span>
                  <input type="number" min="1" required value={answers.teamSize || 1} onChange={(event) => updateAnswer("teamSize", Number(event.target.value))} />
                </label>
              )}
              <label className={`onboarding-field ${answers.workMode === "Trabajo sola" ? "wide" : ""}`}>
                <span>¿Cuánto tiempo lleva activa tu cuenta?</span>
                <select value={answers.accountAgeMonths} onChange={(event) => updateAnswer("accountAgeMonths", Number(event.target.value))}>
                  <option value="3">Menos de 6 meses</option>
                  <option value="9">Entre 6 meses y 1 año</option>
                  <option value="24">Entre 1 y 3 años</option>
                  <option value="48">Más de 3 años</option>
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
              <label className="onboarding-field"><span>¿Cuántos seguidores tienes?</span><input type="number" min="0" required value={answers.followers} onChange={(event) => updateAnswer("followers", Number(event.target.value))} /></label>
              <label className="onboarding-field"><span>¿A cuántas cuentas sigues?</span><input type="number" min="0" required value={answers.following} onChange={(event) => updateAnswer("following", Number(event.target.value))} /></label>
              <label className="onboarding-field wide"><span>¿Cuántas publicaciones tienes en total?</span><input type="number" min="0" required value={answers.totalPosts} onChange={(event) => updateAnswer("totalPosts", Number(event.target.value))} /></label>
              <label className="onboarding-field"><span>Likes de una publicación normal</span><input type="number" min="0" required value={answers.averageLikes} onChange={(event) => updateAnswer("averageLikes", Number(event.target.value))} /><small className="field-help">No uses tu mejor publicación, piensa en una normal</small></label>
              <label className="onboarding-field"><span>Comentarios de una publicación normal</span><input type="number" min="0" required value={answers.averageComments} onChange={(event) => updateAnswer("averageComments", Number(event.target.value))} /><small className="field-help">Un aproximado está bien</small></label>
              <label className="onboarding-field wide"><span>¿Cuántas personas guardan tus publicaciones?</span><input type="number" min="0" value={answers.averageSaves ?? ""} onChange={(event) => updateAnswer("averageSaves", event.target.value === "" ? null : Number(event.target.value))} placeholder="Déjalo vacío si no lo sabes" /><small className="field-help">Este dato es opcional</small></label>
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

const weekContent = [
  {
    day: "Hoy",
    date: "23 JUL",
    type: "Reel",
    title: "3 errores que dañan tus uñas sin darte cuenta",
    time: "7:30 p. m.",
    status: "Listo",
    accent: "#e83387",
  },
  {
    day: "Viernes",
    date: "24 JUL",
    type: "Historia",
    title: "Antes y después: diseño almendrado",
    time: "12:00 p. m.",
    status: "Borrador",
    accent: "#7c5ce5",
  },
  {
    day: "Sábado",
    date: "25 JUL",
    type: "Carrusel",
    title: "5 diseños elegantes para tu próxima cita",
    time: "10:00 a. m.",
    status: "Idea",
    accent: "#ef8a2e",
  },
];

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
  onSignOut,
  mobileOpen,
  closeMobile,
}: {
  business: BusinessProfile;
  activeView: View;
  onNavigate: (view: View) => void;
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
          <button className="nav-item quiet">
            <CircleHelp size={19} />
            <span>Ayuda</span>
          </button>
          <button className="nav-item quiet">
            <Settings size={19} />
            <span>Configuración</span>
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

function Header({ business, openMenu }: { business: BusinessProfile; openMenu: () => void }) {
  const initials = businessInitials(business.name);
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
        <input aria-label="Buscar en RomaCrece" placeholder="Buscar en RomaCrece" />
        <kbd>⌘ K</kbd>
      </label>
      <div className="topbar-actions">
        <div className="instagram-pill">
          <Instagram size={17} />
          <span>@{business.instagram}</span>
          <Check size={13} />
        </div>
        <button className="icon-button" aria-label="Notificaciones">
          <Bell size={19} />
          <span className="notification-dot" />
        </button>
        <div className="topbar-avatar">{initials}</div>
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

function HomeView({ data, onNavigate }: { data: RomaCreceData; onNavigate: (view: View) => void }) {
  const [completed, setCompleted] = useState(false);

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
              <TrendingUp size={15} /> +6 puntos este mes
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
          <h3>Publica tu Reel educativo</h3>
          <p>
            Los Reels con consejos generan un 34% más de guardados en tu cuenta.
          </p>
          <div className="focus-meta">
            <span><Clock3 size={15} /> 7:30 p. m.</span>
            <span><Instagram size={15} /> Reel</span>
          </div>
          <button
            className={`task-button ${completed ? "done" : ""}`}
            onClick={() => setCompleted((value) => !value)}
          >
            {completed ? <CheckCircle2 size={17} /> : <span className="empty-check" />}
            {completed ? "Marcado como completado" : "Marcar como completado"}
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
          {metrics.map((metric) => {
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
                  <strong>{metric.value}</strong>
                </div>
                <div className="metric-change">
                  <span><TrendingUp size={13} /> {metric.change}</span>
                  <small>{metric.detail}</small>
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
              <p>3 contenidos pendientes · 2 publicados</p>
            </div>
            <button className="text-button" onClick={() => onNavigate("planificador")}>
              Abrir calendario <ChevronRight size={16} />
            </button>
          </div>
          <div className="content-list">
            {weekContent.map((item) => (
              <div className="content-row" key={item.date}>
                <div className="content-date">
                  <strong>{item.day}</strong>
                  <span>{item.date}</span>
                </div>
                <span
                  className="content-accent"
                  style={{ backgroundColor: item.accent }}
                />
                <div className="content-main">
                  <span>{item.type}</span>
                  <strong>{item.title}</strong>
                </div>
                <div className="content-time">
                  <Clock3 size={14} />
                  {item.time}
                </div>
                <span className={`content-status status-${item.status.toLowerCase()}`}>
                  {item.status}
                </span>
                <button className="row-action" aria-label={`Abrir ${item.title}`}>
                  <ChevronRight size={17} />
                </button>
              </div>
            ))}
          </div>
        </article>

        <article className="streak-card">
          <div className="streak-top">
            <span className="flame-wrap"><Flame size={24} /></span>
            <div>
              <span>RACHA DE CONSTANCIA</span>
              <strong>6 días</strong>
            </div>
          </div>
          <div className="week-dots">
            {["L", "M", "X", "J", "V", "S", "D"].map((day, index) => (
              <div key={day}>
                <span className={index < 6 ? "complete" : ""}>
                  {index < 6 ? <Check size={14} /> : ""}
                </span>
                <small>{day}</small>
              </div>
            ))}
          </div>
          <p>
            ¡Vas muy bien! Publica mañana para completar tu primera semana.
          </p>
          <div className="mini-insight">
            <MessageCircleMore size={17} />
            <span><strong>Consejo:</strong> responde los comentarios en menos de 3 horas.</span>
          </div>
        </article>
      </section>

      <div className="prototype-note">
        <Sparkles size={15} />
        Prototipo RomaCrece · Datos de demostración
      </div>
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

  const requestAnalysis = async () => {
    setAiState("loading");
    try {
      const result = await generateAiAnalysis(data);
      setAnalysis(result.analysis);
      onUpdate({ ...data, aiAnalysis: result.analysis });
      setAiState("idle");
    } catch (error) {
      console.error("No se pudo generar el análisis con Gemini", error);
      setAiState("error");
    }
  };

  const findings = analysis
    ? analysis.priorities.map((item) => ({ title: item.title, text: item.why, action: item.action }))
    : data.audit.recommendations;
  const scoreLabel = data.audit.score >= 80 ? "MUY BUENA" : data.audit.score >= 60 ? "BUENA" : data.audit.score >= 40 ? "EN PROCESO" : "POR MEJORAR";

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
            <span>Última auditoría: hoy</span>
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
                  <span>{item.label}</span>
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

      {!analysis && (
        <section className="ai-audit-callout">
          <div className="ai-audit-icon"><WandSparkles size={24} /></div>
          <div>
            <span>ANÁLISIS PERSONALIZADO</span>
            <h2>Deja que Gemini convierta tus datos en un plan semanal</h2>
            <p>Recibirás fortalezas, tres prioridades y acciones adaptadas a tu especialidad. Puedes generar uno gratis cada semana.</p>
            {aiState === "error" && <small>No pudimos conectar con Gemini. Tu puntuación básica sigue guardada y puedes intentarlo nuevamente.</small>}
          </div>
          <button className="primary-button" onClick={requestAnalysis} disabled={aiState === "loading"}>
            {aiState === "loading" ? <LoaderCircle className="spin" size={17} /> : <Sparkles size={17} />}
            {aiState === "loading" ? "Preparando tu análisis…" : "Crear mi análisis con IA"}
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
                  onClick={() =>
                    onNavigate(index === 2 ? "planificador" : "ideas")
                  }
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
            {analysis.weeklyPlan.map((item) => (
              <article key={`${item.day}-${item.idea}`}>
                <span>{item.day} · {item.format}</span>
                <h3>{item.idea}</h3>
                <p>{item.goal}</p>
                <button onClick={() => onNavigate("planificador")}>Abrir calendario <ArrowRight size={14} /></button>
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

function IdeaModal({
  idea,
  onClose,
  onPlan,
}: {
  idea: ContentIdea;
  onClose: () => void;
  onPlan: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [hook, setHook] = useState(idea.hook);
  const [script, setScript] = useState(idea.script);
  const [caption, setCaption] = useState(idea.caption);
  const [hashtags, setHashtags] = useState(idea.hashtags);

  const copyContent = async () => {
    await navigator.clipboard.writeText(`${hook}\n\n${script}\n\n${caption}\n\n${hashtags}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
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
          <button aria-label="Cerrar editor" onClick={onClose}><X size={20} /></button>
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
        <div className="modal-actions">
          <button
            className="secondary-button"
            onClick={copyContent}
          >
            {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
            {copied ? "Contenido copiado" : "Copiar contenido"}
          </button>
          <button className="primary-button" onClick={onPlan}>
            <CalendarDays size={17} /> Añadir al planificador
          </button>
        </div>
      </section>
    </div>
  );
}

function IdeasView({ data, onPlan, onUpdate }: { data: RomaCreceData; onPlan: (idea: ContentIdea) => void; onUpdate: (data: RomaCreceData) => void }) {
  const [goal, setGoal] = useState<ContentIdea["goal"]>("Atraer");
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<ContentIdea | null>(null);
  const ideas = data.ideas ?? [];

  const updateIdeas = (nextIdeas: ContentIdea[]) => onUpdate({ ...data, ideas: nextIdeas });

  const generateIdea = () => {
    setIsGenerating(true);
    window.setTimeout(() => {
      updateIdeas([generateContentIdea(data.business, goal), ...ideas]);
      setIsGenerating(false);
    }, 650);
  };

  return (
    <div className="page-content inner-page">
      <ViewIntro
        eyebrow="ESTUDIO DE CONTENIDO"
        title="Ideas que conectan y convierten"
        description={`Contenido personalizado para ${data.business.name}, listo para adaptar y publicar.`}
      >
        <button className="primary-button" onClick={generateIdea} disabled={isGenerating}>
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
        <span className="filter-button"><SlidersHorizontal size={16} /> Todos los formatos</span>
      </section>

      <section className="ideas-summary">
        <div>
          <span className="summary-icon"><Zap size={19} /></span>
          <div>
            <strong>{ideas.length} ideas para {goal.toLowerCase()}</strong>
            <p>Basadas en tu negocio, objetivo y auditoría</p>
          </div>
        </div>
        <span>Actualizado hoy</span>
      </section>

      <section className="ideas-grid">
        {ideas.map((idea) => {
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
                  {idea.score}% potencial
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
              <div className="idea-actions">
                <button className="secondary-button" onClick={() => setSelectedIdea(idea)}>
                  Ver contenido
                </button>
                <button className="use-button" onClick={() => setSelectedIdea(idea)}>
                  Usar idea <ArrowRight size={15} />
                </button>
              </div>
            </article>
          );
        })}
      </section>

      <section className="inspiration-strip">
        <div>
          <span><BookOpen size={19} /></span>
          <div>
            <strong>¿Sin tiempo para decidir?</strong>
            <p>RomaCrece puede crear una semana completa combinando tus mejores formatos.</p>
          </div>
        </div>
        <button onClick={generateIdea} disabled={isGenerating}>
          Generar otra idea <ArrowRight size={15} />
        </button>
      </section>

      {selectedIdea && (
        <IdeaModal
          idea={selectedIdea}
          onClose={() => setSelectedIdea(null)}
          onPlan={() => {
            onPlan(selectedIdea);
            setSelectedIdea(null);
          }}
        />
      )}
    </div>
  );
}

const initialPlannedItems: PlannedContent[] = [
  { id: 1, day: 0, time: "7:30 p. m.", format: "Reel", title: "3 errores que dañan tus uñas", status: "Listo", color: "#e83387" },
  { id: 2, day: 1, time: "12:00 p. m.", format: "Historia", title: "Encuesta: elige tu diseño", status: "Publicado", color: "#7c5ce5" },
  { id: 3, day: 2, time: "6:00 p. m.", format: "Carrusel", title: "5 diseños elegantes", status: "Borrador", color: "#ef8a2e" },
  { id: 4, day: 4, time: "8:00 p. m.", format: "Reel", title: "Transformación en 12 segundos", status: "Idea", color: "#0c9b78" },
  { id: 5, day: 5, time: "10:30 a. m.", format: "Historia", title: "Espacios disponibles", status: "Listo", color: "#3a7bd5" },
];

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
  const visibleItems = plannedItems.filter((item) => (item.week ?? 0) === weekOffset);

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
    const nextItem: PlannedContent = {
      id: editingId ?? Date.now(),
      week: weekOffset,
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
              <span>MEJORES HORARIOS</span>
              <h3>Cuándo está conectada tu audiencia</h3>
            </div>
            <Clock3 size={19} />
          </div>
          <div className="time-chips">
            <span><strong>Lun–Vie</strong> 7:00–9:00 p. m.</span>
            <span><strong>Sábados</strong> 10:00 a. m.–12:00 p. m.</span>
          </div>
        </article>
        <article className="weekly-balance">
          <div className="panel-heading">
            <div>
              <span>EQUILIBRIO SEMANAL</span>
              <h3>Tu combinación está bien distribuida</h3>
            </div>
            <CheckCircle2 size={19} />
          </div>
          <div className="balance-bar">
            <span style={{ width: "40%", background: "#e83387" }} />
            <span style={{ width: "35%", background: "#7c5ce5" }} />
            <span style={{ width: "25%", background: "#ef8a2e" }} />
          </div>
          <div className="balance-labels">
            <span>Educar 40%</span><span>Inspirar 35%</span><span>Vender 25%</span>
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
type WeeklyNumberField = Exclude<keyof WeeklyDraft, "bestPost">;

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
  const closestFollowers = [...metrics]
    .reverse()
    .find((item) => item.weekStart < week.weekStart)?.followers ?? data.answers.followers;
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
      }
      : emptyWeeklyDraft(closestFollowers));
    setShowForm(true);
  };

  const updateNumber = (field: WeeklyNumberField, value: string) => {
    setDraft((currentDraft) => ({ ...currentDraft, [field]: Math.max(0, Number(value) || 0) }));
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
                  <span><strong>Lo que mejor funcionó:</strong> {current.bestPost}</span>
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
                      <div className="bar-column" key={item.weekStart}>
                        <span className={isSelected ? "best" : ""} style={{ height: `${Math.max(8, (item.reach / highestReach) * 100)}%` }}>
                          {isSelected && <em>{numberFormat.format(item.reach)}</em>}
                        </span>
                        <small>{new Intl.DateTimeFormat("es", { day: "numeric", month: "short" }).format(labelDate)}</small>
                      </div>
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
                <div style={{ width: funnelWidth(current.profileVisits) }}><span>{numberFormat.format(current.profileVisits)}</span><small>Visitas al perfil</small></div>
                <div style={{ width: funnelWidth(current.messages) }}><span>{numberFormat.format(current.messages)}</span><small>Mensajes recibidos</small></div>
                <div style={{ width: funnelWidth(current.bookings) }}><span>{numberFormat.format(current.bookings)}</span><small>Reservas logradas</small></div>
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
              <button key={item.weekStart} className={item.weekStart === week.weekStart ? "active" : ""} onClick={() => {
                const currentMonday = new Date(`${getCalendarWeek(0).weekStart}T12:00:00`);
                const itemMonday = new Date(`${item.weekStart}T12:00:00`);
                setWeekOffset(Math.round((itemMonday.getTime() - currentMonday.getTime()) / 604800000));
              }}>
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
                <label className="form-field"><span>Seguidores actuales</span><input required min="0" type="number" value={draft.followers} onChange={(event) => updateNumber("followers", event.target.value)} /></label>
                <label className="form-field"><span>Personas alcanzadas</span><input required min="0" type="number" value={draft.reach} onChange={(event) => updateNumber("reach", event.target.value)} /></label>
                <label className="form-field"><span>Visitas al perfil</span><input required min="0" type="number" value={draft.profileVisits} onChange={(event) => updateNumber("profileVisits", event.target.value)} /></label>
              </div>
            </fieldset>

            <fieldset className="weekly-fieldset">
              <legend>Respuesta del público</legend>
              <div className="form-row">
                <label className="form-field"><span>Me gusta</span><input required min="0" type="number" value={draft.likes} onChange={(event) => updateNumber("likes", event.target.value)} /></label>
                <label className="form-field"><span>Comentarios</span><input required min="0" type="number" value={draft.comments} onChange={(event) => updateNumber("comments", event.target.value)} /></label>
                <label className="form-field"><span>Guardados</span><input required min="0" type="number" value={draft.saves} onChange={(event) => updateNumber("saves", event.target.value)} /></label>
              </div>
            </fieldset>

            <fieldset className="weekly-fieldset">
              <legend>Clientes y contenido</legend>
              <div className="form-row">
                <label className="form-field"><span>Mensajes recibidos</span><input required min="0" type="number" value={draft.messages} onChange={(event) => updateNumber("messages", event.target.value)} /></label>
                <label className="form-field"><span>Reservas logradas</span><input required min="0" type="number" value={draft.bookings} onChange={(event) => updateNumber("bookings", event.target.value)} /></label>
                <label className="form-field"><span>Publicaciones</span><input required min="0" type="number" value={draft.posts} onChange={(event) => updateNumber("posts", event.target.value)} /></label>
              </div>
              <div className="form-row">
                <label className="form-field"><span>Reels</span><input required min="0" type="number" value={draft.reels} onChange={(event) => updateNumber("reels", event.target.value)} /></label>
                <label className="form-field"><span>Stories</span><input required min="0" type="number" value={draft.stories} onChange={(event) => updateNumber("stories", event.target.value)} /></label>
                <label className="form-field"><span>Tu mejor publicación</span><input value={draft.bestPost} onChange={(event) => setDraft((value) => ({ ...value, bestPost: event.target.value }))} placeholder="Ej.: Reel antes y después" /></label>
              </div>
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
  const [isReady, setIsReady] = useState(!isSupabaseConfigured);
  const [editingAudit, setEditingAudit] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [syncState, setSyncState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const loadedUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data: sessionData }) => {
      setUser(sessionData.session?.user ?? null);
      if (!sessionData.session) setIsReady(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) {
        loadedUserId.current = null;
        setData(null);
        setIsReady(true);
      }
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || loadedUserId.current === user.id) return;
    let cancelled = false;
    const load = async () => {
      setIsReady(false);
      let localData: RomaCreceData | null = null;
      try {
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
        console.error("No se pudieron cargar los datos de Supabase", error);
        if (!cancelled) {
          loadedUserId.current = user.id;
          setData(localData);
          setSyncState("error");
        }
      } finally {
        if (!cancelled) setIsReady(true);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => {
    if (!user || !data || loadedUserId.current !== user.id) return;
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
  }, [data, user]);

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
  };

  const planIdea = (idea: ContentIdea) => {
    if (!data) return;
    const plannedItem: PlannedContent = {
      id: Date.now(),
      day: 3,
      time: "19:00",
      format: idea.format,
      title: idea.title,
      status: "Idea",
      color: idea.color,
    };
    updateData({ ...data, plannedItems: [...(data.plannedItems ?? initialPlannedItems), plannedItem] });
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

  if (isSupabaseConfigured && !user) return <AuthScreen />;
  if (!data) return <Onboarding onComplete={completeOnboarding} />;
  if (editingAudit) return <Onboarding initialData={data} onComplete={completeOnboarding} />;

  return (
    <main className="app-shell">
      <Sidebar
        business={data.business}
        activeView={activeView}
        onNavigate={setActiveView}
        onSignOut={signOut}
        mobileOpen={mobileOpen}
        closeMobile={() => setMobileOpen(false)}
      />
      <div className="main-area">
        <Header business={data.business} openMenu={() => setMobileOpen(true)} />
        <div className={`sync-indicator ${syncState}`} role="status">
          {syncState === "saving" && "Guardando…"}
          {syncState === "saved" && "Guardado en la nube"}
          {syncState === "error" && "Sin conexión · guardado local"}
        </div>
        <div className="view-stage" key={activeView}>
          {activeView === "inicio" && <HomeView data={data} onNavigate={setActiveView} />}
          {activeView === "auditoria" && <AuditView data={data} onEdit={() => setEditingAudit(true)} onNavigate={setActiveView} onUpdate={updateData} />}
          {activeView === "ideas" && <IdeasView data={data} onPlan={planIdea} onUpdate={updateData} />}
          {activeView === "planificador" && <PlannerView items={data.plannedItems ?? initialPlannedItems} onUpdate={(items) => updateData({ ...data, plannedItems: items })} />}
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

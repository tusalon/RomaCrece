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
  generateContentIdea,
  initialAuditAnswers,
  type AuditAnswers,
  type BusinessProfile,
  type ContentIdea,
  type PlannedContent,
  type RomaCreceData,
} from "./audit-model";
import { loadCloudData, saveCloudData } from "./supabase-data";
import { isSupabaseConfigured, supabase } from "./supabase";

type View = "inicio" | "auditoria" | "ideas" | "planificador" | "resultados";

const navItems = [
  { id: "inicio" as View, label: "Inicio", icon: LayoutDashboard },
  { id: "auditoria" as View, label: "Auditoría", icon: ScanSearch },
  { id: "ideas" as View, label: "Ideas", icon: Lightbulb },
  { id: "planificador" as View, label: "Planificador", icon: CalendarDays },
  { id: "resultados" as View, label: "Resultados", icon: ChartNoAxesCombined },
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
  category: "Salón de belleza",
  city: "",
  objective: "Conseguir más reservas",
  instagram: "",
};

const simpleRatingLabels = ["Muy poco", "Poco", "Bien", "Muy bien", "Excelente"];

function simpleRating(value: number) {
  return simpleRatingLabels[Math.max(1, Math.min(5, Math.round(value))) - 1];
}

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
  const [step, setStep] = useState<1 | 2>(initialData ? 2 : 1);
  const [business, setBusiness] = useState(initialData?.business ?? emptyBusiness);
  const [answers, setAnswers] = useState(initialData?.answers ?? initialAuditAnswers);

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
            <span><CheckCircle2 size={17} /> Datos guardados en este dispositivo</span>
          </div>
        </div>
        <small>RomaCrece · Parte del ecosistema RomaHub</small>
      </section>

      <section className="onboarding-form-panel">
        <div className="onboarding-form-wrap">
          <div className="onboarding-progress" aria-label={`Paso ${step} de 2`}>
            <span className="active">1</span><i className={step === 2 ? "active" : ""} /><span className={step === 2 ? "active" : ""}>2</span>
          </div>
          <div className="onboarding-heading">
            <span>PASO {step} DE 2</span>
            <h2>{step === 1 ? "Conozcamos tu negocio" : "Veamos cómo está tu Instagram"}</h2>
            <p>
              {step === 1
                ? "Estos datos nos ayudan a adaptar el diagnóstico a tu realidad."
                : "No necesitas conocer métricas: responde según lo que ves cada día."}
            </p>
          </div>

          {step === 1 ? (
            <form className="onboarding-form" onSubmit={continueToAudit}>
              <label className="onboarding-field wide">
                <span>Nombre del negocio</span>
                <input required value={business.name} onChange={(event) => updateBusiness("name", event.target.value)} placeholder="Ej.: Bella Studio" />
              </label>
              <label className="onboarding-field">
                <span>Tipo de negocio</span>
                <select value={business.category} onChange={(event) => updateBusiness("category", event.target.value)}>
                  <option>Salón de belleza</option>
                  <option>Estudio de uñas</option>
                  <option>Barbería</option>
                  <option>Spa y estética</option>
                  <option>Profesional independiente</option>
                  <option>Otro negocio de belleza</option>
                </select>
              </label>
              <label className="onboarding-field">
                <span>Ciudad</span>
                <input required value={business.city} onChange={(event) => updateBusiness("city", event.target.value)} placeholder="Ej.: La Habana" />
              </label>
              <label className="onboarding-field wide">
                <span>Cuenta de Instagram</span>
                <div className="instagram-input"><Instagram size={17} /><b>@</b><input required value={business.instagram} onChange={(event) => updateBusiness("instagram", event.target.value)} placeholder="bellastudio" /></div>
              </label>
              <label className="onboarding-field wide">
                <span>Objetivo principal</span>
                <select value={business.objective} onChange={(event) => updateBusiness("objective", event.target.value)}>
                  <option>Conseguir más reservas</option>
                  <option>Aumentar el alcance</option>
                  <option>Crear una comunidad</option>
                  <option>Vender productos o servicios</option>
                  <option>Publicar con mayor constancia</option>
                </select>
              </label>
              <button className="primary-button onboarding-submit" type="submit">Continuar con la auditoría <ArrowRight size={17} /></button>
            </form>
          ) : (
            <form className="onboarding-form audit-form" onSubmit={finishOnboarding}>
              <div className="audit-question wide toggle-question">
                <div><strong>¿Tu biografía explica qué haces y dónde trabajas?</strong><small>Debe ser fácil entender tus servicios en pocos segundos.</small></div>
                <button type="button" className={answers.bioComplete ? "yes" : ""} onClick={() => updateAnswer("bioComplete", !answers.bioComplete)}>{answers.bioComplete ? "Sí" : "No"}</button>
              </div>
              <div className="audit-question wide toggle-question">
                <div><strong>¿Tienes un enlace directo para reservar?</strong><small>Puede dirigir a RservasRoma, WhatsApp o una agenda digital.</small></div>
                <button type="button" className={answers.bookingLink ? "yes" : ""} onClick={() => updateAnswer("bookingLink", !answers.bookingLink)}>{answers.bookingLink ? "Sí" : "No"}</button>
              </div>
              <label className="onboarding-field range-field">
                <span>¿Tus publicaciones mantienen un estilo parecido? <strong>{simpleRating(answers.visualConsistency)}</strong></span>
                <input type="range" min="1" max="5" value={answers.visualConsistency} onChange={(event) => updateAnswer("visualConsistency", Number(event.target.value))} />
                <small className="field-help">1 = cambian mucho · 5 = se reconocen enseguida</small>
              </label>
              <label className="onboarding-field range-field">
                <span>¿Qué tan bien se ven tus fotos y videos? <strong>{simpleRating(answers.contentQuality)}</strong></span>
                <input type="range" min="1" max="5" value={answers.contentQuality} onChange={(event) => updateAnswer("contentQuality", Number(event.target.value))} />
                <small className="field-help">Piensa en la luz, claridad y presentación</small>
              </label>
              <label className="onboarding-field">
                <span>¿Cuántas veces publicas en una semana?</span>
                <input type="number" min="0" max="14" required value={answers.postsPerWeek} onChange={(event) => updateAnswer("postsPerWeek", Number(event.target.value))} />
                <small className="field-help">Sin contar las historias</small>
              </label>
              <label className="onboarding-field range-field">
                <span>¿Tu comunidad reacciona a lo que publicas? <strong>{simpleRating(answers.engagementRate)}</strong></span>
                <input type="range" min="1" max="5" value={Math.min(5, answers.engagementRate)} onChange={(event) => updateAnswer("engagementRate", Number(event.target.value))} />
                <small className="field-help">Piensa en los Me gusta, comentarios y respuestas</small>
              </label>
              <label className="onboarding-field">
                <span>¿Con qué frecuencia invitas a escribirte o reservar?</span>
                <select value={answers.captionsWithCta} onChange={(event) => updateAnswer("captionsWithCta", Number(event.target.value))}>
                  <option value="0">Nunca</option>
                  <option value="40">A veces</option>
                  <option value="75">Casi siempre</option>
                  <option value="100">Siempre</option>
                </select>
                <small className="field-help">Por ejemplo: “Escríbeme” o “Reserva tu cita”</small>
              </label>
              <label className="onboarding-field">
                <span>¿Cuántas personas te escriben por Instagram al mes?</span>
                <input type="number" min="0" required value={answers.messagesPerMonth} onChange={(event) => updateAnswer("messagesPerMonth", Number(event.target.value))} />
                <small className="field-help">Un aproximado está bien</small>
              </label>
              <label className="onboarding-field wide">
                <span>De esas personas, ¿cuántas terminan reservando?</span>
                <input type="number" min="0" required value={answers.bookingsPerMonth} onChange={(event) => updateAnswer("bookingsPerMonth", Number(event.target.value))} />
                <small className="field-help">También puedes usar un aproximado</small>
              </label>
              <div className="onboarding-actions wide">
                <button className="secondary-button" type="button" onClick={() => setStep(1)}><ChevronLeft size={17} /> Volver</button>
                <button className="primary-button" type="submit">Ver mi resultado <Sparkles size={17} /></button>
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
        <TrendingUp size={22} strokeWidth={2.7} />
        <span />
      </div>
      <div>
        <p className="brand-name">RomaCrece</p>
        <p className="brand-parent">by RomaHub</p>
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

function AuditView({ data, onEdit, onNavigate }: { data: RomaCreceData; onEdit: () => void; onNavigate: (view: View) => void }) {
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
            <h2>Tu cuenta está por encima del promedio</h2>
            <p>
              Con tres mejoras concretas puedes pasar de una cuenta atractiva a
              una cuenta que convierte visitas en citas.
            </p>
            <div className="audit-benchmark">
              <span><Award size={16} /> Top 28%</span>
              <small>entre negocios de belleza similares</small>
            </div>
          </div>
          <div className="large-score">
            <ScoreRing score={data.audit.score} />
            <strong>BUENA</strong>
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

      <section className="findings-section">
        <div className="section-heading">
          <div>
            <h2>Las 3 mejoras con mayor impacto</h2>
            <p>Ordenadas según su potencial para generar clientes</p>
          </div>
          <span className="analysis-label"><Sparkles size={14} /> Analizado con IA</span>
        </div>
        <div className="findings-grid">
          {data.audit.recommendations.map((finding, index) => {
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
            <h3>Ya tienes una identidad reconocible</h3>
            <p>Mantén estos elementos mientras mejoras la conversión.</p>
          </div>
        </div>
        <div className="strength-pills">
          <span><CheckCircle2 size={16} /> Fotos de buena calidad</span>
          <span><CheckCircle2 size={16} /> Colores consistentes</span>
          <span><CheckCircle2 size={16} /> Respuesta activa</span>
        </div>
      </section>
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
  return { days, label: `${format.format(monday)} – ${format.format(sunday)}` };
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

const chartBars = [38, 50, 44, 66, 58, 76, 88];

function ResultsView() {
  const [period, setPeriod] = useState("7 días");

  return (
    <div className="page-content inner-page">
      <ViewIntro
        eyebrow="MEDICIÓN Y APRENDIZAJE"
        title="Resultados que puedes entender"
        description="Mide lo que funciona y convierte cada dato en una próxima acción."
      >
        <label className="period-select">
          <CalendarDays size={16} />
          <select
            aria-label="Período de resultados"
            value={period}
            onChange={(event) => setPeriod(event.target.value)}
          >
            <option>7 días</option>
            <option>30 días</option>
            <option>90 días</option>
          </select>
        </label>
      </ViewIntro>

      <section className="results-highlight">
        <div className="results-copy">
          <div className="card-kicker"><TrendingUp size={17} /> RESUMEN DEL PERÍODO</div>
          <h2>Tu contenido está llegando a más personas</h2>
          <p>
            Creciste un <strong>18%</strong> en alcance y generaste
            <strong> 14 reservas</strong> desde Instagram durante los últimos {period}.
          </p>
          <div className="result-win">
            <Award size={18} />
            <span><strong>Mejor resultado:</strong> Reel “3 errores que dañan tus uñas”</span>
          </div>
        </div>
        <div className="growth-figure">
          <span>CRECIMIENTO GENERAL</span>
          <strong>+21%</strong>
          <small>respecto al período anterior</small>
        </div>
      </section>

      <section className="result-metrics">
        {[
          { label: "Alcance", value: "12,438", change: "+18%", icon: Eye, color: "#7c5ce5" },
          { label: "Interacciones", value: "864", change: "+12%", icon: Heart, color: "#e83387" },
          { label: "Nuevos seguidores", value: "126", change: "+9%", icon: Users, color: "#ef8a2e" },
          { label: "Reservas", value: "14", change: "+40%", icon: CalendarCheck2, color: "#0c9b78" },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.label}>
              <span style={{ color: item.color, backgroundColor: `${item.color}14` }}><Icon size={20} /></span>
              <div><small>{item.label}</small><strong>{item.value}</strong></div>
              <em><TrendingUp size={12} /> {item.change}</em>
            </article>
          );
        })}
      </section>

      <section className="analytics-grid">
        <article className="reach-chart">
          <div className="panel-heading">
            <div>
              <span>ALCANCE DIARIO</span>
              <h3>Tu mejor día fue el domingo</h3>
            </div>
            <span className="chart-total">12.4K total</span>
          </div>
          <div className="chart-area" aria-label="Gráfico de alcance diario">
            <div className="chart-lines"><i /><i /><i /><i /></div>
            <div className="bar-columns">
              {chartBars.map((height, index) => (
                <div className="bar-column" key={index}>
                  <span className={index === 6 ? "best" : ""} style={{ height: `${height}%` }}>
                    {index === 6 && <em>2.4K</em>}
                  </span>
                  <small>{["L", "M", "X", "J", "V", "S", "D"][index]}</small>
                </div>
              ))}
            </div>
          </div>
        </article>

        <article className="conversion-card">
          <div className="panel-heading">
            <div>
              <span>CONVERSIÓN</span>
              <h3>De Instagram a la reserva</h3>
            </div>
            <Target size={19} />
          </div>
          <div className="funnel">
            <div style={{ width: "100%" }}><span>12,438</span><small>Personas alcanzadas</small></div>
            <div style={{ width: "78%" }}><span>1,208</span><small>Visitas al perfil</small></div>
            <div style={{ width: "56%" }}><span>184</span><small>Clics para reservar</small></div>
            <div style={{ width: "38%" }}><span>14</span><small>Reservas confirmadas</small></div>
          </div>
          <p><TrendingUp size={14} /> Tu conversión subió del 5.4% al 7.6%</p>
        </article>
      </section>

      <section className="insights-row">
        <article className="insight-card positive">
          <span><Zap size={19} /></span>
          <div>
            <small>HAZ MÁS DE ESTO</small>
            <h3>Reels educativos cortos</h3>
            <p>Generan 2.3 veces más guardados que tus otras publicaciones.</p>
          </div>
        </article>
        <article className="insight-card attention">
          <span><AlertCircle size={19} /></span>
          <div>
            <small>PRÓXIMA OPORTUNIDAD</small>
            <h3>Convierte visitas en mensajes</h3>
            <p>Añade una pregunta clara al final de tus próximos captions.</p>
          </div>
        </article>
        <article className="insight-card neutral">
          <span><Clock3 size={19} /></span>
          <div>
            <small>MEJOR MOMENTO</small>
            <h3>Miércoles a las 8:00 p. m.</h3>
            <p>Tu audiencia interactúa un 31% más en esta franja.</p>
          </div>
        </article>
      </section>
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
          {activeView === "auditoria" && <AuditView data={data} onEdit={() => setEditingAudit(true)} onNavigate={setActiveView} />}
          {activeView === "ideas" && <IdeasView data={data} onPlan={planIdea} onUpdate={updateData} />}
          {activeView === "planificador" && <PlannerView items={data.plannedItems ?? initialPlannedItems} onUpdate={(items) => updateData({ ...data, plannedItems: items })} />}
          {activeView === "resultados" && <ResultsView />}
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

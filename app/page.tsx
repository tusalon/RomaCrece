"use client";

import { useState } from "react";
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
  Play,
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
  activeView,
  onNavigate,
  mobileOpen,
  closeMobile,
}: {
  activeView: View;
  onNavigate: (view: View) => void;
  mobileOpen: boolean;
  closeMobile: () => void;
}) {
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
          <div className="profile">
            <div className="profile-avatar">BS</div>
            <div className="profile-copy">
              <strong>Bella Studio</strong>
              <span>Plan Pro</span>
            </div>
            <LogOut size={17} />
          </div>
        </div>
      </aside>
    </>
  );
}

function Header({ openMenu }: { openMenu: () => void }) {
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
          <span>@bellastudio</span>
          <Check size={13} />
        </div>
        <button className="icon-button" aria-label="Notificaciones">
          <Bell size={19} />
          <span className="notification-dot" />
        </button>
        <div className="topbar-avatar">BS</div>
      </div>
    </header>
  );
}

function ScoreRing() {
  return (
    <div className="score-ring" aria-label="Puntuación de auditoría: 78 de 100">
      <div>
        <strong>78</strong>
        <span>/100</span>
      </div>
    </div>
  );
}

function HomeView({ onNavigate }: { onNavigate: (view: View) => void }) {
  const [completed, setCompleted] = useState(false);

  return (
    <div className="page-content">
      <section className="welcome-row">
        <div>
          <div className="eyebrow">
            <span className="status-dot" />
            TU CENTRO DE CRECIMIENTO
          </div>
          <h1>Buenos días, Bella Studio <span>✦</span></h1>
          <p>
            Tu cuenta está creciendo. Hoy tienes una oportunidad clara para
            convertir más visitas en reservas.
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
            <h2>Tu perfil tiene una buena base. Ahora vamos por más.</h2>
            <p>
              Detectamos <strong>3 oportunidades</strong> para mejorar tu
              conversión esta semana.
            </p>
            <button className="soft-button" onClick={() => onNavigate("auditoria")}>
              Ver auditoría completa
              <ArrowUpRight size={16} />
            </button>
          </div>
          <div className="score-panel">
            <ScoreRing />
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

const auditCategories = [
  { label: "Perfil y biografía", score: 92, color: "#0c9b78" },
  { label: "Calidad del contenido", score: 81, color: "#7c5ce5" },
  { label: "Consistencia", score: 68, color: "#ef8a2e" },
  { label: "Conversión a reservas", score: 61, color: "#e83387" },
  { label: "Comunidad", score: 84, color: "#3a7bd5" },
];

const auditFindings = [
  {
    level: "Alta prioridad",
    tone: "high",
    icon: Link2,
    title: "Tu biografía no indica cómo reservar",
    text: "Añade una llamada a la acción clara y el enlace directo de RservasRoma.",
    action: "Ver recomendación",
  },
  {
    level: "Oportunidad",
    tone: "medium",
    icon: MessageSquareText,
    title: "6 de 10 captions terminan sin CTA",
    text: "Cierra cada publicación invitando a guardar, comentar o reservar.",
    action: "Crear CTA",
  },
  {
    level: "A mejorar",
    tone: "low",
    icon: CalendarDays,
    title: "Tu frecuencia cambia cada semana",
    text: "Publicar 4 veces por semana puede elevar tu alcance estimado.",
    action: "Crear calendario",
  },
];

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

function AuditView({ onNavigate }: { onNavigate: (view: View) => void }) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshed, setRefreshed] = useState(false);

  const refreshAudit = () => {
    setIsRefreshing(true);
    setRefreshed(false);
    window.setTimeout(() => {
      setIsRefreshing(false);
      setRefreshed(true);
    }, 900);
  };

  return (
    <div className="page-content inner-page">
      <ViewIntro
        eyebrow="DIAGNÓSTICO INTELIGENTE"
        title="Auditoría de tu Instagram"
        description="Descubre qué está funcionando y qué debes cambiar para atraer más reservas."
      >
        <button
          className="secondary-button"
          onClick={refreshAudit}
          disabled={isRefreshing}
        >
          <RefreshCw size={17} className={isRefreshing ? "spin" : ""} />
          {isRefreshing ? "Analizando cuenta..." : "Analizar de nuevo"}
        </button>
      </ViewIntro>

      {refreshed && (
        <div className="success-banner">
          <CheckCircle2 size={17} />
          Auditoría actualizada. No detectamos cambios importantes desde ayer.
        </div>
      )}

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
            <ScoreRing />
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
            {auditCategories.map((item) => (
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
          {auditFindings.map((finding, index) => {
            const Icon = finding.icon;
            return (
              <article className="finding-card" key={finding.title}>
                <div className="finding-top">
                  <span className={`finding-icon tone-${finding.tone}`}>
                    <Icon size={20} />
                  </span>
                  <span className={`finding-level tone-${finding.tone}`}>
                    {finding.level}
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

type Idea = {
  id: number;
  format: string;
  title: string;
  hook: string;
  reason: string;
  score: number;
  color: string;
  icon: typeof Video;
  new?: boolean;
};

const initialIdeas: Idea[] = [
  {
    id: 1,
    format: "REEL EDUCATIVO",
    title: "3 señales de que tus uñas necesitan un descanso",
    hook: "Si tus uñas se ven así, no las ignores...",
    reason: "Alto potencial de guardados",
    score: 94,
    color: "#e83387",
    icon: Video,
  },
  {
    id: 2,
    format: "CARRUSEL",
    title: "5 diseños que hacen que tus manos se vean elegantes",
    hook: "Guarda esta guía para tu próxima cita ✨",
    reason: "Ideal para conseguir reservas",
    score: 91,
    color: "#7c5ce5",
    icon: ImageIcon,
  },
  {
    id: 3,
    format: "HISTORIAS",
    title: "Elige el diseño de nuestra próxima clienta",
    hook: "¿Opción A, B o C? Tú decides.",
    reason: "Aumenta la participación",
    score: 87,
    color: "#ef8a2e",
    icon: MessageCircleMore,
  },
  {
    id: 4,
    format: "REEL DE CONVERSIÓN",
    title: "Transformación completa en 12 segundos",
    hook: "De uñas sin vida a este resultado...",
    reason: "Muestra tu trabajo y genera confianza",
    score: 89,
    color: "#0c9b78",
    icon: Play,
  },
];

function IdeaModal({
  idea,
  onClose,
  onPlan,
}: {
  idea: Idea;
  onClose: () => void;
  onPlan: () => void;
}) {
  const [copied, setCopied] = useState(false);

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
            <textarea defaultValue={idea.hook} />
          </div>
          <div className="editor-field">
            <label>Guion</label>
            <textarea
              className="tall"
              defaultValue={`Plano 1: muestra el resultado final.\nPlano 2: enseña el proceso rápidamente.\nPlano 3: presenta el detalle más llamativo.\nCierre: invita a reservar desde el enlace de tu perfil.`}
            />
          </div>
          <div className="editor-field">
            <label>Caption sugerido</label>
            <textarea
              className="tall"
              defaultValue={`Un pequeño cambio puede transformar por completo tus manos ✨\n\n¿Cuál diseño elegirías tú? Déjalo en los comentarios y guarda esta idea para tu próxima cita.\n\nReserva tu espacio desde el enlace del perfil.`}
            />
          </div>
          <div className="editor-field">
            <label>Hashtags</label>
            <textarea defaultValue="#UñasCuba #NailArt #Manicura #BellaStudio #ReservaTuCita" />
          </div>
        </div>
        <div className="modal-actions">
          <button
            className="secondary-button"
            onClick={() => {
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1400);
            }}
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

function IdeasView({ onNavigate }: { onNavigate: (view: View) => void }) {
  const [goal, setGoal] = useState("Atraer");
  const [ideas, setIdeas] = useState(initialIdeas);
  const [isGenerating, setIsGenerating] = useState(false);
  const [saved, setSaved] = useState<number[]>([2]);
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);

  const generateIdea = () => {
    setIsGenerating(true);
    window.setTimeout(() => {
      setIdeas((current) => [
        {
          id: Date.now(),
          format: "NUEVA IDEA · REEL",
          title: "Lo que nadie te cuenta antes de elegir uñas acrílicas",
          hook: "Antes de pedir uñas acrílicas, mira esto...",
          reason: `Creada para ${goal.toLowerCase()} nuevas clientas`,
          score: 96,
          color: "#e83387",
          icon: Video,
          new: true,
        },
        ...current,
      ]);
      setIsGenerating(false);
    }, 900);
  };

  return (
    <div className="page-content inner-page">
      <ViewIntro
        eyebrow="ESTUDIO DE CONTENIDO"
        title="Ideas que conectan y convierten"
        description="Contenido personalizado para Bella Studio, listo para adaptar y publicar."
      >
        <button className="primary-button" onClick={generateIdea} disabled={isGenerating}>
          {isGenerating ? <LoaderCircle size={17} className="spin" /> : <WandSparkles size={17} />}
          {isGenerating ? "Creando una idea..." : "Generar ideas con IA"}
        </button>
      </ViewIntro>

      <section className="idea-toolbar">
        <div className="goal-filter">
          <span>Mi objetivo:</span>
          {["Atraer", "Educar", "Vender", "Fidelizar"].map((item) => (
            <button
              key={item}
              className={goal === item ? "active" : ""}
              onClick={() => setGoal(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <button className="filter-button"><SlidersHorizontal size={16} /> Todos los formatos</button>
      </section>

      <section className="ideas-summary">
        <div>
          <span className="summary-icon"><Zap size={19} /></span>
          <div>
            <strong>{ideas.length} ideas para {goal.toLowerCase()}</strong>
            <p>Basadas en tu auditoría, servicios y audiencia</p>
          </div>
        </div>
        <span>Actualizado hoy</span>
      </section>

      <section className="ideas-grid">
        {ideas.map((idea) => {
          const Icon = idea.icon;
          const isSaved = saved.includes(idea.id);
          return (
            <article className={`idea-card ${idea.new ? "new-idea" : ""}`} key={idea.id}>
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
                  onClick={() =>
                    setSaved((current) =>
                      isSaved
                        ? current.filter((id) => id !== idea.id)
                        : [...current, idea.id],
                    )
                  }
                >
                  <Heart size={18} fill={isSaved ? "currentColor" : "none"} />
                </button>
              </div>
              <span className="idea-format" style={{ color: idea.color }}>{idea.format}</span>
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
        <button onClick={() => onNavigate("planificador")}>
          Crear mi semana <ArrowRight size={15} />
        </button>
      </section>

      {selectedIdea && (
        <IdeaModal
          idea={selectedIdea}
          onClose={() => setSelectedIdea(null)}
          onPlan={() => {
            setSelectedIdea(null);
            onNavigate("planificador");
          }}
        />
      )}
    </div>
  );
}

type PlannedItem = {
  id: number;
  day: number;
  time: string;
  format: string;
  title: string;
  status: "Idea" | "Borrador" | "Listo" | "Publicado";
  color: string;
};

const initialPlannedItems: PlannedItem[] = [
  { id: 1, day: 0, time: "7:30 p. m.", format: "Reel", title: "3 errores que dañan tus uñas", status: "Listo", color: "#e83387" },
  { id: 2, day: 1, time: "12:00 p. m.", format: "Historia", title: "Encuesta: elige tu diseño", status: "Publicado", color: "#7c5ce5" },
  { id: 3, day: 2, time: "6:00 p. m.", format: "Carrusel", title: "5 diseños elegantes", status: "Borrador", color: "#ef8a2e" },
  { id: 4, day: 4, time: "8:00 p. m.", format: "Reel", title: "Transformación en 12 segundos", status: "Idea", color: "#0c9b78" },
  { id: 5, day: 5, time: "10:30 a. m.", format: "Historia", title: "Espacios disponibles", status: "Listo", color: "#3a7bd5" },
];

const calendarDays = [
  { name: "Lun", date: "20" },
  { name: "Mar", date: "21" },
  { name: "Mié", date: "22" },
  { name: "Jue", date: "23", today: true },
  { name: "Vie", date: "24" },
  { name: "Sáb", date: "25" },
  { name: "Dom", date: "26" },
];

function PlannerView() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [plannedItems, setPlannedItems] = useState(initialPlannedItems);
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const addContent = () => {
    if (!newTitle.trim()) return;
    setPlannedItems((current) => [
      ...current,
      {
        id: Date.now(),
        day: 3,
        time: "7:00 p. m.",
        format: "Reel",
        title: newTitle.trim(),
        status: "Idea",
        color: "#e83387",
      },
    ]);
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
        <button className="primary-button" onClick={() => setShowAdd(true)}>
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
              {weekOffset === 0
                ? "20 – 26 de julio"
                : weekOffset < 0
                  ? "13 – 19 de julio"
                  : "27 de julio – 2 de agosto"}
            </strong>
            <span>{weekOffset === 0 ? "Esta semana" : weekOffset < 0 ? "Semana anterior" : "Próxima semana"}</span>
          </div>
          <button aria-label="Semana siguiente" onClick={() => setWeekOffset((v) => v + 1)}>
            <ChevronRight size={18} />
          </button>
        </div>
        <div className="planner-stats">
          <span><span className="dot published" /> 1 publicado</span>
          <span><span className="dot ready" /> 2 listos</span>
          <span><span className="dot draft" /> 2 pendientes</span>
        </div>
      </section>

      <section className="calendar-board">
        {calendarDays.map((day, dayIndex) => (
          <div className={`calendar-column ${day.today ? "today" : ""}`} key={day.name}>
            <div className="calendar-head">
              <span>{day.name}</span>
              <strong>{day.date}</strong>
              {day.today && <em>HOY</em>}
            </div>
            <div className="calendar-body">
              {plannedItems
                .filter((item) => item.day === dayIndex)
                .map((item) => (
                  <article
                    className="calendar-item"
                    key={item.id}
                    style={{ borderTopColor: item.color }}
                  >
                    <div className="calendar-item-top">
                      <span style={{ color: item.color }}>{item.format}</span>
                      <button aria-label={`Opciones de ${item.title}`}><MoreHorizontal size={15} /></button>
                    </div>
                    <h3>{item.title}</h3>
                    <span className="calendar-time"><Clock3 size={13} /> {item.time}</span>
                    <span className={`calendar-status ${item.status.toLowerCase()}`}>
                      {item.status === "Publicado" && <Check size={12} />}
                      {item.status}
                    </span>
                  </article>
                ))}
              {dayIndex === 3 && plannedItems.filter((item) => item.day === dayIndex).length === 0 && (
                <button className="add-slot" onClick={() => setShowAdd(true)}>
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
            aria-label="Añadir contenido"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="modal-head">
              <div>
                <span><CalendarCheck2 size={14} /> NUEVO CONTENIDO</span>
                <h2>Añadir al jueves</h2>
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
                <span>Formato</span>
                <select defaultValue="Reel">
                  <option>Reel</option>
                  <option>Carrusel</option>
                  <option>Historia</option>
                </select>
              </label>
              <label className="form-field">
                <span>Hora</span>
                <input type="time" defaultValue="19:00" />
              </label>
            </div>
            <button className="primary-button modal-save" onClick={addContent}>
              <Plus size={17} /> Añadir al calendario
            </button>
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

  return (
    <main className="app-shell">
      <Sidebar
        activeView={activeView}
        onNavigate={setActiveView}
        mobileOpen={mobileOpen}
        closeMobile={() => setMobileOpen(false)}
      />
      <div className="main-area">
        <Header openMenu={() => setMobileOpen(true)} />
        {activeView === "inicio" && <HomeView onNavigate={setActiveView} />}
        {activeView === "auditoria" && <AuditView onNavigate={setActiveView} />}
        {activeView === "ideas" && <IdeasView onNavigate={setActiveView} />}
        {activeView === "planificador" && <PlannerView />}
        {activeView === "resultados" && <ResultsView />}
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

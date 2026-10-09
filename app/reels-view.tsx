"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Clapperboard, Clock3, Copy, Hand, LoaderCircle, Users, X } from "lucide-react";
import { Dialog } from "./dialog";
import { REELS, type ReelCategory, type ReelEntry } from "./reels-catalog.ts";
import {
  captionAsText,
  fillTemplate,
  hasPendingReels,
  markSent,
  pendingPayload,
  readReelsState,
  scriptAsText,
  setPickNote,
  togglePick,
  writeReelsState,
  type ReelsState,
} from "./reels-picks.ts";
import { sendReelPicks } from "./reels-sync";

// Cuenta de Instagram de RservasRoma con la que colaboran los reels «solo». Cámbiala aquí si cambia.
const CUENTA_ROMA = "rservasroma";

const CATEGORY_LABEL: Record<ReelCategory, string> = {
  rservasroma: "RservasRoma",
  superacion: "Superación",
  ensenanza: "Enseñanza",
  finanzas: "Finanzas",
};
const CATEGORIES = Object.keys(CATEGORY_LABEL) as ReelCategory[];

type SyncLabel = "idle" | "sending" | "sent" | "waiting";

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const copy = async (key: string, text: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const area = document.createElement("textarea");
        area.value = text;
        area.style.position = "fixed";
        area.style.opacity = "0";
        document.body.appendChild(area);
        area.select();
        const ok = document.execCommand("copy");
        area.remove();
        if (!ok) throw new Error("copy_failed");
      }
      setCopied(key);
    } catch {
      setCopied(`${key}:error`);
    }
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(null), 1600);
  };
  return { copied, copy };
}

export function ReelsSection({ salon, instagram, canSync }: { salon: string; instagram: string; canSync: boolean }) {
  const [state, setState] = useState<ReelsState>(() => readReelsState());
  const [category, setCategory] = useState<"todos" | ReelCategory>("todos");
  const [mode, setMode] = useState<"todos" | "solo" | "grupo">("todos");
  const [open, setOpen] = useState<ReelEntry | null>(null);
  const [sync, setSync] = useState<SyncLabel>("idle");
  const stateRef = useRef(state);
  const inFlight = useRef(false);
  const vars = { salon, instagram, cuentaRoma: CUENTA_ROMA };

  const update = (next: ReelsState) => {
    stateRef.current = next;
    writeReelsState(next);
    setState(next);
  };

  // Envía lo pendiente: al marcar, al volver la conexión y al abrir la sección.
  const flush = async () => {
    if (!canSync || inFlight.current || !hasPendingReels(stateRef.current)) return;
    inFlight.current = true;
    setSync("sending");
    const payload = pendingPayload(stateRef.current);
    let sentOk = false;
    try {
      await sendReelPicks(payload);
      // markSent solo da por enviado lo que iba en este envío; lo marcado mientras tanto sigue pendiente.
      const next = markSent(stateRef.current, payload);
      update(next);
      setSync(hasPendingReels(next) ? "waiting" : "sent");
      sentOk = true;
    } catch {
      setSync("waiting");
    } finally {
      inFlight.current = false;
    }
    // Lo marcado mientras se enviaba sale en un segundo envío (sin reintentos en bucle si falla).
    if (sentOk && hasPendingReels(stateRef.current)) void flush();
  };

  useEffect(() => {
    void flush();
    const onOnline = () => void flush();
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canSync]);

  const toggle = (reelId: string) => {
    update(togglePick(stateRef.current, reelId));
    void flush();
  };

  const visible = REELS.filter((reel) => (category === "todos" || reel.category === category) && (mode === "todos" || reel.format === mode));
  const pickedCount = Object.keys(state.picks).length;

  return (
    <section className="reels-section" aria-label="Catálogo de reels">
      <div className="reels-head">
        <p>
          <Clapperboard size={16} aria-hidden="true" /> 30 guiones con tomas y texto para publicar. Marca los que quieras hacer y te
          ayudamos a prepararlos: Raudael recibe un aviso con tu salón y tu WhatsApp.
        </p>
        <p className="reels-status" role="status" aria-live="polite">
          {pickedCount > 0 && `${pickedCount} ${pickedCount === 1 ? "elegido" : "elegidos"}`}
          {sync === "sending" && " · enviando…"}
          {sync === "sent" && " · aviso enviado"}
          {sync === "waiting" && " · se enviará al volver la conexión"}
        </p>
      </div>

      <div className="reels-filters" role="group" aria-label="Filtrar reels">
        {(["todos", ...CATEGORIES] as const).map((item) => (
          <button key={item} className={category === item ? "active" : ""} aria-pressed={category === item} onClick={() => setCategory(item)}>
            {item === "todos" ? "Todos" : CATEGORY_LABEL[item]}
          </button>
        ))}
        <span className="reels-filter-divider" aria-hidden="true" />
        {(["todos", "solo", "grupo"] as const).map((item) => (
          <button key={item} className={mode === item ? "active" : ""} aria-pressed={mode === item} onClick={() => setMode(item)}>
            {item === "todos" ? "Sola o en grupo" : item === "solo" ? "Sola" : "En grupo"}
          </button>
        ))}
      </div>

      <ul className="reels-grid">
        {visible.map((reel) => {
          const picked = Boolean(state.picks[reel.id]);
          return (
            <li key={reel.id} className={`reel-card${picked ? " is-picked" : ""}`}>
              <button className="reel-card-open" onClick={() => setOpen(reel)} aria-label={`Ver el reel: ${reel.title}`}>
                <span className="reel-card-meta">
                  <span>{CATEGORY_LABEL[reel.category]}</span>
                  <span><Clock3 size={13} /> {reel.durationSeconds} s</span>
                  <span>{reel.format === "solo" ? <Hand size={13} /> : <Users size={13} />} {reel.format === "solo" ? "Sola" : `${reel.people} personas`}</span>
                </span>
                <strong>{reel.title}</strong>
                <span className="reel-card-hook">«{reel.hook}»</span>
              </button>
              <button className={`reel-pick${picked ? " is-on" : ""}`} aria-pressed={picked} onClick={() => toggle(reel.id)}>
                {picked ? <><Check size={16} /> Lo quiero hacer</> : "Quiero hacerlo"}
              </button>
            </li>
          );
        })}
      </ul>
      {visible.length === 0 && <p className="reels-empty">No hay reels con ese filtro. Prueba con «Todos».</p>}

      {open && (
        <ReelDialog
          reel={open}
          vars={vars}
          pick={state.picks[open.id]}
          sending={sync === "sending"}
          onToggle={() => toggle(open.id)}
          onNote={(note) => update(setPickNote(stateRef.current, open.id, note))}
          onNoteDone={() => void flush()}
          onClose={() => setOpen(null)}
        />
      )}
    </section>
  );
}

function ReelDialog({
  reel,
  vars,
  pick,
  sending,
  onToggle,
  onNote,
  onNoteDone,
  onClose,
}: {
  reel: ReelEntry;
  vars: Parameters<typeof fillTemplate>[1];
  pick: ReelsState["picks"][string] | undefined;
  sending: boolean;
  onToggle: () => void;
  onNote: (note: string) => void;
  onNoteDone: () => void;
  onClose: () => void;
}) {
  const { copied, copy } = useCopy();
  const label = (key: string, idle: string) => (copied === key ? "Copiado" : copied === `${key}:error` ? "No se pudo copiar" : idle);
  const caption = captionAsText(reel, vars);

  return (
    <Dialog className="idea-modal reel-modal" label={`Reel: ${reel.title}`} onClose={onClose}>
      <div className="modal-head">
        <div>
          <span>{CATEGORY_LABEL[reel.category]} · {reel.durationSeconds} s · {reel.format === "solo" ? "Tú sola" : `${reel.people} personas`}</span>
          <h2>{reel.title}</h2>
        </div>
        <button aria-label="Cerrar" onClick={onClose}><X size={20} /></button>
      </div>

      <div className="reel-body">
        <p className="reel-hook">«{reel.hook}»</p>

        <section aria-labelledby={`${reel.id}-guion`}>
          <div className="reel-block-head">
            <h3 id={`${reel.id}-guion`}>Guion y texto en pantalla</h3>
            <button className="ghost-button" onClick={() => copy("guion", scriptAsText(reel))}><Copy size={15} /> {label("guion", "Copiar guion")}</button>
          </div>
          <ol className="reel-script">
            {reel.script.map((block, index) => (
              <li key={index}>
                {block.who && <b className="reel-who">{block.who}</b>}
                <span>{block.text}</span>
              </li>
            ))}
          </ol>
          <p className="reel-note">Cada línea se dice en voz alta y aparece escrita en pantalla.</p>
        </section>

        <section aria-labelledby={`${reel.id}-tomas`}>
          <h3 id={`${reel.id}-tomas`}>Tomas</h3>
          <ol className="reel-shots">
            {reel.shots.map((shot, index) => (
              <li key={index}><strong>{shot.what}</strong><span>{shot.how}</span></li>
            ))}
          </ol>
        </section>

        <section aria-labelledby={`${reel.id}-necesitas`}>
          <h3 id={`${reel.id}-necesitas`}>Necesitas</h3>
          <ul className="reel-needs">{reel.needs.map((need) => <li key={need}>{need}</li>)}</ul>
        </section>

        <section aria-labelledby={`${reel.id}-texto`}>
          <div className="reel-block-head">
            <h3 id={`${reel.id}-texto`}>Texto para publicar</h3>
            <button className="ghost-button" onClick={() => copy("texto", caption)}><Copy size={15} /> {label("texto", "Copiar texto")}</button>
          </div>
          <pre className="reel-caption">{caption}</pre>
        </section>

        <section className="reel-pick-box" aria-labelledby={`${reel.id}-quiero`}>
          <h3 id={`${reel.id}-quiero`}>{pick ? "Lo vas a hacer" : "¿Te animas?"}</h3>
          {pick && (
            <label className="reel-note-field">
              <span>¿Algo que debamos saber? (opcional)</span>
              <textarea
                maxLength={280}
                rows={2}
                value={pick.note}
                placeholder="Por ejemplo: lo grabo con mi compañera el sábado"
                onChange={(event) => onNote(event.target.value)}
                onBlur={onNoteDone}
              />
            </label>
          )}
          <button className={pick ? "secondary-button" : "primary-button"} onClick={onToggle}>
            {sending && <LoaderCircle size={16} className="spin" />}
            {pick ? "Ya no lo voy a hacer" : "Quiero hacerlo"}
          </button>
        </section>
      </div>
    </Dialog>
  );
}

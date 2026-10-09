"use client";

import { useEffect, useRef } from "react";
import type { FormEventHandler, ReactNode } from "react";
import { createPortal } from "react-dom";

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

type DialogProps = {
  /** Nombre accesible del diálogo (lo lee el lector de pantalla). */
  label: string;
  /** Se llama con Esc o al tocar el fondo. */
  onClose: () => void;
  className?: string;
  /** El registro semanal es un formulario; el resto, una sección. */
  as?: "section" | "form";
  onSubmit?: FormEventHandler<HTMLFormElement>;
  children: ReactNode;
};

/**
 * Diálogo modal accesible.
 *  - Va en un portal al <body>: así el fondo cubre la pantalla entera aunque la vista
 *    tenga transform o filter (antes quedaba anclado a la vista y se veía a medias).
 *  - Esc lo cierra, el foco entra al abrir, Tab no sale del diálogo y el foco vuelve
 *    al botón que lo abrió al cerrar.
 *  - Mientras está abierto, la página de atrás no se desplaza.
 */
export function Dialog({ label, onClose, className, as = "section", onSubmit, children }: DialogProps) {
  const panel = useRef<HTMLElement | null>(null);
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });

  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflowBefore = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const node = panel.current;
    const first = node?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? node)?.focus({ preventScroll: true });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeRef.current();
        return;
      }
      if (event.key !== "Tab" || !node) return;
      const items = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (item) => item.getClientRects().length > 0,
      );
      if (items.length === 0) {
        event.preventDefault();
        node.focus();
        return;
      }
      const firstItem = items[0];
      const lastItem = items[items.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === firstItem || active === node)) {
        event.preventDefault();
        lastItem.focus();
      } else if (!event.shiftKey && active === lastItem) {
        event.preventDefault();
        firstItem.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflowBefore;
      previous?.focus?.({ preventScroll: true });
    };
  }, []);

  if (typeof document === "undefined") return null;

  const Panel = as;
  return createPortal(
    <div
      className="modal-backdrop"
      role="presentation"
      // Solo cierra si el toque empezó en el fondo, no si se arrastró desde dentro.
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeRef.current();
      }}
    >
      <Panel
        ref={panel as never}
        className={className}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        onSubmit={as === "form" ? onSubmit : undefined}
      >
        {children}
      </Panel>
    </div>,
    document.body,
  );
}

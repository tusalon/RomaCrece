import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Home from "../app/page";
import "../app/globals.css";

// Solo en la web publicada: en desarrollo un service worker taparía los cambios.
if (typeof navigator !== "undefined" && "serviceWorker" in navigator && window.location.hostname.endsWith("github.io")) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {
      // Sin service worker la app funciona igual, solo que no abre sin conexión.
    });
  });
}

if (typeof document !== "undefined") {
  const root = document.getElementById("root");

  if (!root) {
    throw new Error("No se encontró el contenedor principal de RomaCrece.");
  }

  createRoot(root).render(
    <StrictMode>
      <Home />
    </StrictMode>,
  );
}

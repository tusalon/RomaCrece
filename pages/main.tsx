import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Home from "../app/page";
import "../app/globals.css";

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

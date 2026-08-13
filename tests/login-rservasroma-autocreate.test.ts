import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

// generateLink crea la cuenta de Auth si no existe, y el trigger
// handle_new_user() de la base responde creando un negocio "Pendiente de
// completar". Sin esta bandera, la primera entrada de cada salon a RomaCrece
// duplicaba su negocio en RservasRoma y en el panel SuperAdmin.
const source = fs.readFileSync(
  path.join(import.meta.dirname, "..", "supabase", "functions", "login-rservasroma", "index.ts"),
  "utf8",
);

test("el enlace de acceso pide saltarse el alta automatica de negocio", () => {
  const generateLink = source.slice(source.indexOf("generateLink("));
  const opciones = generateLink.slice(0, generateLink.indexOf("});"));

  assert.match(opciones, /skip_negocio_autocreate:\s*true/);
  assert.match(opciones, /negocio_id:\s*business\.id/);
});

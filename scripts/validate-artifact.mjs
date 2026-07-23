import { access } from "node:fs/promises";

const workerPath = new URL("../dist/server/index.js", import.meta.url);

await access(workerPath);

workerPath.searchParams.set("sites-validation", `${process.pid}-${Date.now()}`);
const worker = await import(workerPath.href);

if (!worker.default || typeof worker.default.fetch !== "function") {
  throw new Error("dist/server/index.js debe exportar default.fetch(request, env, ctx)");
}

console.log("Artefacto de producción validado correctamente.");

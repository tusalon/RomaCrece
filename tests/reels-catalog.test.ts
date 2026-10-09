import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import { REELS, REELS_CATALOG_VERSION, type ReelEntry } from "../app/reels-catalog.ts";

const RSERVASROMA_DIR = "C:\\Users\\RODO\\Documents\\ClientesRservas\\rservasroma";
const MAX_WORDS = { 15: 41, 20: 55, 25: 69, 30: 83 } as const;
const GROUP_LETTERS = ["A", "B", "C", "D"];

const words = (text: string) => text.trim().split(/\s+/).filter(Boolean);
const norm = (text: string) =>
  text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9ñ ]/g, " ").replace(/\s+/g, " ").trim();
const count = (list: ReelEntry[], pick: (r: ReelEntry) => unknown) => {
  const out = new Map<unknown, number>();
  for (const r of list) out.set(pick(r), (out.get(pick(r)) ?? 0) + 1);
  return out;
};
const textsOf = (r: ReelEntry) => [r.title, r.hook, ...r.script.map((s) => s.text), ...r.shots.flatMap((s) => [s.what, s.how]), r.caption, ...r.needs];

test("hay 30 reels con ids consecutivos reel-01 a reel-30", () => {
  assert.equal(REELS_CATALOG_VERSION, 1);
  assert.equal(REELS.length, 30);
  REELS.forEach((r, i) => assert.equal(r.id, `reel-${String(i + 1).padStart(2, "0")}`));
  assert.equal(new Set(REELS.map((r) => r.id)).size, 30);
});

test("reparto 15/5/5/5 por categoría, y por ids consecutivos", () => {
  const porCategoria = count(REELS, (r) => r.category);
  assert.equal(porCategoria.get("rservasroma"), 15);
  assert.equal(porCategoria.get("superacion"), 5);
  assert.equal(porCategoria.get("ensenanza"), 5);
  assert.equal(porCategoria.get("finanzas"), 5);
  const esperada = (i: number) => (i < 15 ? "rservasroma" : i < 20 ? "superacion" : i < 25 ? "ensenanza" : "finanzas");
  REELS.forEach((r, i) => assert.equal(r.category, esperada(i), r.id));
});

test("20 solo y 10 grupo, con 5 de 2, 3 de 3 y 2 de 4", () => {
  const porFormato = count(REELS, (r) => r.format);
  assert.equal(porFormato.get("solo"), 20);
  assert.equal(porFormato.get("grupo"), 10);
  const grupos = REELS.filter((r) => r.format === "grupo");
  const porPersonas = count(grupos, (r) => r.people);
  assert.equal(porPersonas.get(2), 5);
  assert.equal(porPersonas.get(3), 3);
  assert.equal(porPersonas.get(4), 2);
  for (const r of REELS) {
    if (r.format === "solo") assert.equal(r.people, 1, r.id);
    else assert.ok(r.people >= 2 && r.people <= 4, r.id);
  }
});

test("las duraciones y dificultades son válidas y hay variedad", () => {
  for (const r of REELS) {
    assert.ok([15, 20, 25, 30].includes(r.durationSeconds), r.id);
    assert.ok(["facil", "media"].includes(r.difficulty), r.id);
  }
  assert.equal(new Set(REELS.map((r) => r.durationSeconds)).size, 4);
});

test("cada bloque tiene de 2 a 5 palabras y su key dentro del texto", () => {
  for (const r of REELS) {
    assert.ok(r.script.length >= 8, `${r.id}: guion demasiado corto`);
    for (const block of r.script) {
      const n = words(block.text).length;
      assert.ok(n >= 2 && n <= 5, `${r.id}: «${block.text}» tiene ${n} palabras`);
      if (block.key !== undefined) assert.ok(block.text.includes(block.key), `${r.id}: key «${block.key}» no está en «${block.text}»`);
    }
  }
});

test("en grupo cada bloque lleva who con las letras que corresponden; en solo, ninguno", () => {
  for (const r of REELS) {
    if (r.format === "solo") {
      assert.ok(r.script.every((s) => s.who === undefined), `${r.id}: solo no lleva who`);
      continue;
    }
    const permitidas = GROUP_LETTERS.slice(0, r.people);
    const usadas = new Set<string>();
    for (const s of r.script) {
      assert.ok(s.who && permitidas.includes(s.who), `${r.id}: who «${s.who}» no vale para ${r.people} personas`);
      usadas.add(s.who);
    }
    assert.deepEqual([...usadas].sort(), permitidas, `${r.id}: deben hablar todas las personas`);
  }
});

test("el total de palabras del guion no pasa el máximo de su duración", () => {
  for (const r of REELS) {
    const total = r.script.reduce((sum, s) => sum + words(s.text).length, 0);
    assert.ok(total <= MAX_WORDS[r.durationSeconds], `${r.id}: ${total} palabras para ${r.durationSeconds} s`);
  }
});

test("el gancho abre el guion y los 30 ganchos son distintos", () => {
  for (const r of REELS) assert.ok(norm(r.hook).startsWith(norm(r.script[0].text)), `${r.id}: el gancho no empieza con el primer bloque`);
  assert.equal(new Set(REELS.map((r) => norm(r.hook))).size, 30);
  assert.equal(new Set(REELS.map((r) => norm(r.script[0].text))).size, 30);
});

test("3 a 6 tomas con qué y cómo; títulos de hasta 60 caracteres", () => {
  for (const r of REELS) {
    assert.ok(r.shots.length >= 3 && r.shots.length <= 6, r.id);
    for (const s of r.shots) assert.ok(s.what.trim() && s.how.trim(), r.id);
    assert.ok(r.needs.length >= 2, `${r.id}: needs`);
    assert.ok(r.title.length > 0 && r.title.length <= 60, `${r.id}: título de ${r.title.length} caracteres`);
  }
});

test("de 8 a 12 hashtags que empiezan por # y sin repetir", () => {
  for (const r of REELS) {
    assert.ok(r.hashtags.length >= 8 && r.hashtags.length <= 12, `${r.id}: ${r.hashtags.length} hashtags`);
    for (const h of r.hashtags) assert.match(h, /^#[^\s#]+$/, `${r.id}: ${h}`);
    assert.equal(new Set(r.hashtags).size, r.hashtags.length, `${r.id}: hashtags repetidos`);
  }
});

test("sin precios, cifras inventadas, estadísticas ni promesas de resultados", () => {
  const precios = /\$|\b(usd|cup|mxn|eur)\b|€|\d\s*(pesos|dólares|dolares|euros)|\b(pesos|dólares|dolares)\b\s*\d/i;
  const prohibidas = /optimiz|estrategi|monetiz|implement|potenci|sinergi|garantizad|triplic|duplic/i;
  const otrasRedes = /tiktok|facebook|youtube|publicidad|anuncio|pauta|\bads\b|gratis|\bplan(es)?\b|premium/i;
  const voseo = /(?<![\p{L}])(tenés|sos|podés|querés|sabés|hacés|vos|entrá|ingresá|mirá|decí|fijate|sentate|escribime|avisame)(?![\p{L}])/iu;
  for (const r of REELS) {
    for (const t of textsOf(r)) {
      assert.doesNotMatch(t, precios, `${r.id}: precio en «${t}»`);
      assert.doesNotMatch(t, /500/, `${r.id}: «500» en «${t}»`);
      assert.doesNotMatch(t, prohibidas, `${r.id}: palabra prohibida en «${t}»`);
      assert.doesNotMatch(t, otrasRedes, `${r.id}: tema no permitido en «${t}»`);
      assert.doesNotMatch(t, voseo, `${r.id}: voseo en «${t}»`);
      // Solo el reel de cumpleaños de la dueña puede llevar cifras, y solo «30 %».
      const sinTreinta = r.id === "reel-04" ? t.replaceAll("30 %", "") : t;
      assert.doesNotMatch(sinTreinta, /%|\d/, `${r.id}: cifra o porcentaje en «${t}»`);
    }
  }
});

test("el 30 % solo aparece en el reel de cumpleaños de la dueña", () => {
  const conTreinta = REELS.filter((r) => textsOf(r).some((t) => t.includes("30 %")));
  assert.deepEqual(conTreinta.map((r) => r.id), ["reel-04"]);
});

test("cta es una sola palabra en mayúsculas dentro del último bloque", () => {
  for (const r of REELS) {
    assert.match(r.cta, /^[A-ZÁÉÍÓÚÑ]+$/, `${r.id}: cta «${r.cta}»`);
    assert.ok(r.script[r.script.length - 1].text.includes(r.cta), `${r.id}: el cta debe estar en el último bloque`);
    assert.ok(r.caption.includes(r.cta), `${r.id}: el caption debe repetir el cta`);
  }
  assert.ok(new Set(REELS.map((r) => r.cta)).size >= 20, "hay poca variedad de CTA");
});

test("el último bloque pide comentar la palabra (CTA al final del guion)", () => {
  for (const r of REELS) {
    const ultimo = r.script[r.script.length - 1];
    assert.equal(ultimo.text, `Comenta ${r.cta}`, `${r.id}: el último bloque debe ser «Comenta ${r.cta}»`);
    assert.equal(ultimo.key, r.cta, r.id);
  }
});

test("caption: primera línea distinta del gancho; los solo mencionan {cuenta_roma}", () => {
  for (const r of REELS) {
    const primera = r.caption.split("\n")[0];
    assert.ok(primera.trim().length > 10, r.id);
    assert.notEqual(norm(primera), norm(r.hook), `${r.id}: primera línea igual al gancho`);
    if (r.format === "solo") assert.ok(r.caption.includes("{cuenta_roma}"), `${r.id}: falta {cuenta_roma}`);
    const marcas = r.caption.match(/\{[^}]*\}/g) ?? [];
    for (const m of marcas) assert.ok(["{salon}", "{instagram}", "{cuenta_roma}"].includes(m), `${r.id}: marca ${m}`);
  }
});

test("los reels de rservasroma traen featureRefs que existen en disco; los demás no", () => {
  assert.ok(existsSync(RSERVASROMA_DIR), "no se encuentra la carpeta de rservasroma");
  for (const r of REELS) {
    if (r.category !== "rservasroma") {
      assert.equal(r.featureRefs, undefined, `${r.id}: featureRefs solo en rservasroma`);
      continue;
    }
    assert.ok(r.featureRefs && r.featureRefs.length > 0, `${r.id}: sin featureRefs`);
    for (const ref of r.featureRefs) assert.ok(existsSync(resolve(RSERVASROMA_DIR, ref)), `${r.id}: no existe ${ref}`);
  }
});

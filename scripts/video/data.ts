/**
 * Data for the promo video: the 25 departments with their map and sorted positions and colors per
 * question, plus the district used as the example. Writes `.build/data.json`.
 *
 *   bun scripts/video/data.ts
 */
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { colorFor, toRgb } from "../../src/lib/color";
import { gridLayout, mapLayout } from "../../src/lib/layout";
import { type Dataset, type Metric, type Shape, value } from "../../src/lib/shapes";

const root = join(import.meta.dir, "..", "..");
const data = (await Bun.file(join(root, "public", "data", "shapes.json")).json()) as Dataset;

const BOX = { w: 880, h: 780, pad: 8 };
const METRICS: Metric[] = ["quipu", "cobertura", "emergencias"];
const DISTRICT = process.env.DISTRICT ?? "Acoria";
const FEATURED_DEP = process.env.DEP ?? "09";

const rgb = (s: Shape, m: Metric) =>
  (toRgb(colorFor(s, m, false, [1, 1e9])).match(/\d+/g) ?? []).slice(0, 3).map(Number);
const place = (p: { x: number; y: number; s: number } | undefined) =>
  p && { x: +p.x.toFixed(2), y: +p.y.toFixed(2), s: +p.s.toFixed(4) };

const map = mapLayout(data.dep, BOX);
const grids = Object.fromEntries(
  METRICS.map((m) => {
    const order = [...data.dep].sort((a, b) => (value(b, m) ?? -1) - (value(a, m) ?? -1));
    return [m, gridLayout(order, BOX)];
  }),
);

const share = (num: (s: Shape) => number, den: (s: Shape) => number) =>
  Math.round((100 * data.dep.reduce((t, s) => t + num(s), 0)) / data.dep.reduce((t, s) => t + den(s), 0));

const dist = data.dist.find((s) => s.name === DISTRICT);
if (!dist?.avance) throw new Error(`${DISTRICT} not found or without avance`);
const names = new Map(data.dep.concat(data.prov).map((s) => [s.id, s.name]));
const dep = data.dep.find((s) => s.id === FEATURED_DEP);
if (!dep?.avance) throw new Error("featured department without avance");

const out = {
  box: BOX,
  metrics: METRICS,
  deps: data.dep.map((s) => ({
    id: s.id,
    name: s.name,
    d: s.d,
    bbox: s.bbox,
    map: place(map.get(s.id)),
    grid: Object.fromEntries(METRICS.map((m) => [m, place(grids[m].get(s.id))])),
    col: Object.fromEntries(METRICS.map((m) => [m, rgb(s, m)])),
  })),
  country: {
    quipu: share((s) => s.avance?.dev ?? 0, (s) => s.avance?.pim ?? 0),
    cobertura: share((s) => s.terr?.cp4g ?? 0, (s) => s.terr?.cp ?? 0),
  },
  dep: {
    id: dep.id,
    name: dep.name,
    gentilicio: dep.gentilicio ?? "",
    quipu: Math.round((100 * dep.avance.dev) / dep.avance.pim),
  },
  district: {
    name: dist.name,
    where: `${names.get(dist.id.slice(0, 4)) ?? ""}, ${names.get(dist.dep) ?? ""}`,
    d: dist.d,
    bbox: dist.bbox,
    quipu: Math.round((100 * dist.avance.dev) / dist.avance.pim),
    prev: Math.round((100 * dist.avance.devPrev) / dist.avance.pimPrev),
    col: rgb(dist, "quipu"),
    mes: ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"][dist.avance.hasta - 1],
  },
};

const dir = join(import.meta.dir, ".build");
await mkdir(dir, { recursive: true });
await Bun.write(join(dir, "data.json"), JSON.stringify(out));
console.log("wrote", join(dir, "data.json"), out.country, out.dep, { ...out.district, d: "" });

/**
 * Data for the district video: the map of departments, the districts of one department, and the
 * five threads (ficha) of the featured district. Writes `.build/data.json`.
 *
 *   DISTRICT=Huancavelica DEP=09 bun scripts/video/data.ts
 */
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { colorFor, rangeFor, toRgb } from "../../src/lib/color";
import { fichaRows } from "../../src/lib/ficha";
import { mapLayout } from "../../src/lib/layout";
import type { Dataset, Metric, Shape } from "../../src/lib/shapes";

const root = join(import.meta.dir, "..", "..");
const data = (await Bun.file(join(root, "public", "data", "shapes.json")).json()) as Dataset;

const BOX = { w: 880, h: 780, pad: 8 };
const ID = process.env.ID ?? "090101"; // Huancavelica (district)
const dist = data.dist.find((s) => s.id === ID);
if (!dist?.avance) throw new Error(`${ID} not found or without avance`);
const depId = dist.dep;
const dep = data.dep.find((s) => s.id === depId);
if (!dep) throw new Error("department not found");

const rgb = (s: Shape, m: Metric, set: Shape[]) =>
  (toRgb(colorFor(s, m, false, rangeFor(set, m))).match(/\d+/g) ?? []).slice(0, 3).map(Number);

const map = mapLayout(data.dep, BOX);
const place = (p: { x: number; y: number; s: number } | undefined) =>
  p && { x: +p.x.toFixed(2), y: +p.y.toFixed(2), s: +p.s.toFixed(4) };

// districts of the department, all in the same projected space as `dist.bbox`
const sibs = data.dist.filter((s) => s.dep === depId);
const bb = sibs.reduce(
  (b, s) => [Math.min(b[0], s.bbox[0]), Math.min(b[1], s.bbox[1]), Math.max(b[2], s.bbox[2]), Math.max(b[3], s.bbox[3])],
  [Infinity, Infinity, -Infinity, -Infinity],
);

const names = new Map(data.dep.concat(data.prov).map((s) => [s.id, s.name]));
const rows = fichaRows(dist, data.dist);

const out = {
  box: BOX,
  deps: data.dep.map((s) => ({
    id: s.id,
    d: s.d,
    bbox: s.bbox,
    map: place(map.get(s.id)),
    col: rgb(s, "quipu", data.dep),
  })),
  dep: { id: dep.id, name: dep.name },
  sibs: { bbox: bb, items: sibs.map((s) => ({ id: s.id, d: s.d, col: rgb(s, "quipu", data.dist) })) },
  district: {
    id: dist.id,
    name: dist.name,
    where: `${names.get(dist.id.slice(0, 4)) ?? ""}, ${dep.name}`,
    d: dist.d,
    bbox: dist.bbox,
    col: rgb(dist, "quipu", data.dist),
    prev: Math.round((100 * dist.avance.devPrev) / dist.avance.pimPrev),
    mes: ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"][dist.avance.hasta - 1],
    rows: rows.map((r) => ({ key: r.key, label: r.label, text: r.text, frac: r.frac })),
  },
};

const dir = join(import.meta.dir, ".build");
await mkdir(dir, { recursive: true });
await Bun.write(join(dir, "data.json"), JSON.stringify(out));
console.log("wrote", join(dir, "data.json"), out.dep, { ...out.district, d: "" });

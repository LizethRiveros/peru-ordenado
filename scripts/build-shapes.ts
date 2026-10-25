// Simplifies and projects IGN boundaries into public/data/shapes.json, joined with MEF municipal spending.
import rewind from "@mapbox/geojson-rewind";
import { geoMercator, geoPath } from "d3-geo";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import { feature } from "topojson-client";
import { topology } from "topojson-server";
import { presimplify, quantile, simplify } from "topojson-simplify";
import type { Shape } from "@/lib/shapes";
import { key as projectKey } from "./classify-projects";
import { matchMunicipality } from "./muniscan-match";

const W = 1000;
const H = 1300;

type Props = Record<string, string | number | null>;
// d3-geo wants clockwise exterior rings (the reverse of RFC 7946); IGN ships them counterclockwise.
const read = async (n: number) =>
  rewind(
    await Bun.file(`data/raw/per_admin${n}.geojson`).json(),
    true,
  ) as FeatureCollection<Geometry, Props>;

// IGN names drop accents on departments; restore them for display.
const DEP_NAMES: Record<string, string> = {
  "01": "Amazonas",
  "02": "Áncash",
  "03": "Apurímac",
  "04": "Arequipa",
  "05": "Ayacucho",
  "06": "Cajamarca",
  "07": "Callao",
  "08": "Cusco",
  "09": "Huancavelica",
  "10": "Huánuco",
  "11": "Ica",
  "12": "Junín",
  "13": "La Libertad",
  "14": "Lambayeque",
  "15": "Lima",
  "16": "Loreto",
  "17": "Madre de Dios",
  "18": "Moquegua",
  "19": "Pasco",
  "20": "Piura",
  "21": "Puno",
  "22": "San Martín",
  "23": "Tacna",
  "24": "Tumbes",
  "25": "Ucayali",
};

const levels = { dep: await read(1), prov: await read(2), dist: await read(3) };
const keyOf = { dep: "adm1", prov: "adm2", dist: "adm3" } as const;

const topo = presimplify(
  topology({ dep: levels.dep, prov: levels.prov, dist: levels.dist }) as never,
);
const simple = simplify(topo, quantile(topo, 0.06));
const fc = (k: keyof typeof levels) =>
  feature(simple, simple.objects[k] as never) as unknown as FeatureCollection<
    Geometry,
    Props
  >;

const projection = geoMercator().fitExtent(
  [
    [20, 20],
    [W - 20, H - 20],
  ],
  levels.dep,
);
const path = geoPath(projection);
const round = (d: string) => d.replace(/\d+\.\d+/g, (n) => (+n).toFixed(1));

type Spend = {
  dist: string;
  dep: string;
  prov: string;
  pim: number;
  dev: number;
  invPim: number;
  invDev: number;
};
const mef: Spend[] = await Bun.file("data/raw/mef-municipal-2024.json")
  .json()
  .catch(() => []);
// A few ubigeos have more than one executing unit; they all count toward that district.
const byUbigeo = new Map<string, Spend>();
for (const m of mef) {
  const k = `${m.dep}${m.prov}${m.dist}`;
  const prev = byUbigeo.get(k);
  byUbigeo.set(
    k,
    prev
      ? {
          ...prev,
          invPim: prev.invPim + m.invPim,
          invDev: prev.invDev + m.invDev,
        }
      : m,
  );
}

function shape(level: keyof typeof levels, f: Feature<Geometry, Props>): Shape {
  const k = keyOf[level];
  const id = String(f.properties[`${k}_pcode`]).slice(2);
  const [[x0, y0], [x1, y1]] = path.bounds(f);
  const name =
    level === "dep" ? DEP_NAMES[id] : String(f.properties[`${k}_name`]);
  const spend = level === "dist" ? byUbigeo.get(id) : undefined;
  return {
    id,
    name,
    dep: id.slice(0, 2),
    area: Math.round(Number(f.properties.area_sqkm) * 10) / 10,
    bbox: [x0, y0, x1, y1].map((n) => Math.round(n * 10) / 10) as Shape["bbox"],
    d: round(path(f) ?? ""),
    ...(spend && spend.invPim > 0
      ? {
          inv: { pim: Math.round(spend.invPim), dev: Math.round(spend.invDev) },
        }
      : {}),
  };
}

const dist = fc("dist").features.map((f) => shape("dist", f));

// muniscan digital-surface index, joined by name; ids claimed by two entries are dropped as ambiguous.
const muniscan: { nombre: string; indice: number }[] = (
  await Bun.file("data/raw/muniscan-2026-08-21.json").json()
).municipalidades;
const geo = {
  dist,
  prov: fc("prov").features.map((f) => shape("prov", f)),
  dep: fc("dep").features.map((f) => shape("dep", f)),
};
const claims = new Map<string, number[]>();
for (const m of muniscan) {
  const id = matchMunicipality(m.nombre, geo);
  if (id) claims.set(id, [...(claims.get(id) ?? []), m.indice]);
}
for (const d of dist) {
  const c = claims.get(d.id);
  if (c?.length === 1) d.digital = c[0];
}
// Jev categories per investment project. An answer below this probability counts as unsure; 0.97 is
// the threshold that caught every ambiguous case in the Jev confidence spike (gradual-formats, slice 2).
const SURE = 0.97;
const jev = new Map<string, { c: string; p: Record<string, number> | null }>();
const jevFile = Bun.file("data/raw/jev-projects.jsonl");
if (await jevFile.exists()) {
  for (const line of (await jevFile.text()).split("\n")) {
    if (!line) continue;
    const r = JSON.parse(line);
    jev.set(r.k, r);
  }
}
const projects: { ub: string; name: string; pim: number }[] = jev.size
  ? await Bun.file("data/raw/mef-projects-2024.json").json()
  : [];
const mixes = new Map<string, NonNullable<Shape["mix"]>>();
for (const p of projects) {
  if (p.pim <= 0) continue;
  const m = mixes.get(p.ub) ?? { ornato: 0, deporte: 0, local: 0, unsure: 0 };
  const a = jev.get(projectKey(p.name));
  const top = a ? (a.p?.[a.c] ?? 1) : 0;
  if (!a || top < SURE) m.unsure += p.pim;
  else if (a.c === "ornato") m.ornato += p.pim;
  else if (a.c === "deporte") m.deporte += p.pim;
  else if (a.c === "local_municipal") m.local += p.pim;
  mixes.set(p.ub, m);
}
const roundMix = (m: NonNullable<Shape["mix"]>) => ({
  ornato: Math.round(m.ornato),
  deporte: Math.round(m.deporte),
  local: Math.round(m.local),
  unsure: Math.round(m.unsure),
});
for (const d of dist) {
  const m = mixes.get(d.id);
  if (m && d.inv) d.mix = roundMix(m);
}

// Provinces and departments sum their local governments (the provincial municipality sits in its capital district).
const rollup = (id: string) => {
  const scanned = dist.flatMap((d) =>
    d.id.startsWith(id) && d.digital !== undefined ? [d.digital] : [],
  );
  const digital = scanned.length
    ? {
        digital:
          Math.round(
            (scanned.reduce((t, v) => t + v, 0) / scanned.length) * 10,
          ) / 10,
      }
    : {};
  const kids = dist.filter((d) => d.id.startsWith(id) && d.inv);
  if (!kids.length) return digital;
  const mixed = kids.filter((d) => d.mix);
  const sum = (k: keyof NonNullable<Shape["mix"]>) =>
    mixed.reduce((t, d) => t + (d.mix?.[k] ?? 0), 0);
  return {
    ...digital,
    ...(mixed.length
      ? {
          mix: {
            ornato: sum("ornato"),
            deporte: sum("deporte"),
            local: sum("local"),
            unsure: sum("unsure"),
          },
        }
      : {}),
    inv: {
      pim: kids.reduce((t, d) => t + (d.inv?.pim ?? 0), 0),
      dev: kids.reduce((t, d) => t + (d.inv?.dev ?? 0), 0),
    },
  };
};

const out = {
  width: W,
  height: H,
  sources: {
    geo: "Instituto Geográfico Nacional (2020), vía OCHA HDX, CC BY-IGO",
    spend: "MEF, Datos Abiertos: Presupuesto y Ejecución de Gasto 2024",
  },
  dep: fc("dep").features.map((f) => {
    const s = shape("dep", f);
    return { ...s, ...rollup(s.id) };
  }),
  prov: fc("prov").features.map((f) => {
    const s = shape("prov", f);
    return { ...s, ...rollup(s.id) };
  }),
  dist,
};

const json = JSON.stringify(out);
await Bun.write("public/data/shapes.json", json);
const matched = out.dist.filter((d) => "inv" in d).length;
const unmatched = [...byUbigeo.keys()].filter(
  (k) => !out.dist.some((d) => d.id === k),
);
console.log(`MEF ubigeos without an IGN 2020 district: ${unmatched.length}`);
console.log(
  `dep ${out.dep.length} · prov ${out.prov.length} · dist ${out.dist.length} · inv matched ${matched} · ${(json.length / 1e6).toFixed(2)} MB`,
);

// quipu: suma el avance del año en curso (inversión municipal, genérica 2.6) a public/data/shapes.json.
// Entrada: data/raw/municipal-ubigeo.json, generado por scripts/municipal_ubigeo.py de
// github.com/crafter-station/quipu (mes 0 = PIM; meses 1-12 = devengado del mes).
// Se acumula hasta el último mes cerrado: el mes en curso no se cuenta, para que la comparación con
// el mismo mes del año anterior sea justa. Idempotente: se puede correr sin rehacer `data:build`.
import type { Dataset, Shape } from "../src/lib/shapes";

const data: Dataset = await Bun.file("public/data/shapes.json").json();
const q: Record<string, Record<string, { inv?: number[] }>> = await Bun.file(
  "data/raw/municipal-ubigeo.json",
).json();
const year = Object.keys(q).sort().at(-1) ?? "";
const prev = String(Number(year) - 1);
const hasta = Number(process.env.QUIPU_MES ?? new Date().getMonth());
const acum = (v?: number[]) =>
  (v ?? []).slice(1, hasta + 1).reduce((s, x) => s + x, 0);

for (const d of data.dist) {
  delete d.avance;
  const cur = q[year]?.[d.id]?.inv;
  if (!cur?.[0]) continue;
  const old = q[prev]?.[d.id]?.inv;
  d.avance = {
    pim: cur[0],
    dev: acum(cur),
    pimPrev: old?.[0] ?? 0,
    devPrev: acum(old),
    hasta,
  };
}
// Provincias y departamentos suman sus distritos (la municipalidad provincial va en su distrito capital).
for (const level of ["prov", "dep"] as const) {
  for (const s of data[level] as Shape[]) {
    delete s.avance;
    const kids = data.dist.filter((d) => d.id.startsWith(s.id) && d.avance);
    if (!kids.length) continue;
    const sum = (k: "pim" | "dev" | "pimPrev" | "devPrev") =>
      kids.reduce((t, d) => t + (d.avance?.[k] ?? 0), 0);
    s.avance = {
      pim: sum("pim"),
      dev: sum("dev"),
      pimPrev: sum("pimPrev"),
      devPrev: sum("devPrev"),
      hasta,
    };
  }
}
data.sources.quipu = `MEF, Datos Abiertos: Presupuesto y Ejecución de Gasto ${year}, procesado con quipu`;
await Bun.write("public/data/shapes.json", JSON.stringify(data));
const n = data.dist.filter((d) => d.avance).length;
const nat = data.dep.reduce(
  (t, d) => ({
    pim: t.pim + (d.avance?.pim ?? 0),
    dev: t.dev + (d.avance?.dev ?? 0),
  }),
  { pim: 0, dev: 0 },
);
console.log(
  `quipu ${year} hasta mes ${hasta}: ${n} distritos con avance · inversión municipal ${((nat.dev / nat.pim) * 100).toFixed(1)} %`,
);

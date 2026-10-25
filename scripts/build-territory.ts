// Suma tres capas territoriales por ubigeo a public/data/shapes.json, desde data/territory.json:
//  - cobertura: centros poblados con y sin señal 4G (OSIPTEL, cobertura móvil por centro poblado);
//  - emergencias: decretos supremos de estado de emergencia por lluvias o déficit hídrico 2017-2024 (PCM),
//    contando también las prórrogas, un decreto distinto cada uno;
//  - zonas: zonas críticas por peligros geológicos inventariadas por INGEMMET (solo ~1,000 distritos
//    están inventariados: el resto queda sin datos, no en cero).
// Provincias y departamentos suman sus distritos; las emergencias y zonas se promedian por distrito.
// Idempotente: se puede correr sin rehacer `data:build`.
import type { Dataset, Shape } from "../src/lib/shapes";

type Territory = {
  cobertura: Record<string, [number, number]>;
  emergencias: Record<string, number>;
  zonas: Record<string, number>;
};

const data: Dataset = await Bun.file("public/data/shapes.json").json();
const t: Territory = await Bun.file("data/territory.json").json();

type Terr = NonNullable<Shape["terr"]>;
const zero = (): Terr => ({
  cp: 0,
  cp4g: 0,
  emerg: 0,
  emergN: 0,
  zonas: 0,
  zonasN: 0,
});

for (const d of data.dist) {
  delete d.terr;
  const cob = t.cobertura[d.id];
  if (!cob) continue; // el INEI 2022 trae todos los distritos con centros poblados
  const x = zero();
  [x.cp, x.cp4g] = cob;
  x.emerg = t.emergencias[d.id] ?? 0; // sin decretos = cero, la fuente es completa
  x.emergN = 1;
  if (t.zonas[d.id] !== undefined) {
    x.zonas = t.zonas[d.id];
    x.zonasN = 1;
  }
  d.terr = x;
}
for (const level of ["prov", "dep"] as const) {
  for (const s of data[level]) {
    delete s.terr;
    const x = zero();
    for (const d of data.dist) {
      if (!d.terr || !d.id.startsWith(s.id)) continue;
      for (const k of Object.keys(x) as (keyof Terr)[]) x[k] += d.terr[k];
    }
    if (x.cp) s.terr = x;
  }
}
await Bun.write("public/data/shapes.json", JSON.stringify(data));
const n = data.dist.filter((d) => d.terr).length;
const nz = data.dist.filter((d) => d.terr?.zonasN).length;
const peru = data.dep.reduce(
  (a, d) => ({ cp: a.cp + (d.terr?.cp ?? 0), c4: a.c4 + (d.terr?.cp4g ?? 0) }),
  { cp: 0, c4: 0 },
);
console.log(
  `territorio: ${n} distritos con cobertura/emergencias, ${nz} con zonas críticas · ${((peru.c4 / peru.cp) * 100).toFixed(1)} % de los centros poblados con 4G`,
);

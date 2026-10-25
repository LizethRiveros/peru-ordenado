// Pone las tildes a los nombres de provincias y distritos en public/data/shapes.json.
// El IGN no las trae (ni el INEI ni los datasets de ubigeo comunes); `data/ubigeo-names.json` mapea
// ubigeo -> nombre y solo lista los que cambian. Se armó con Wikidata (etiquetas en español, cruzadas
// por nombre + departamento, aceptando solo diferencias de tilde o mayúsculas) más unas pocas
// correcciones a mano; la receta está en github.com/crafter-station/quipu (scripts/nombres_tabla.py).
// Idempotente: se puede correr sin rehacer `data:build`.
import type { Dataset } from "../src/lib/shapes";

const names: Record<string, string> = await Bun.file(
  "data/ubigeo-names.json",
).json();
const data: Dataset = await Bun.file("public/data/shapes.json").json();
let changed = 0;
for (const level of ["prov", "dist"] as const) {
  for (const s of data[level]) {
    const name = names[s.id];
    if (name && name !== s.name) {
      s.name = name;
      changed++;
    }
  }
}
await Bun.write("public/data/shapes.json", JSON.stringify(data));
console.log(`${changed} nombres con tilde aplicados`);

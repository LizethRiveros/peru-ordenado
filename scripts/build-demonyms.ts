// Pone el gentilicio (huancavelicano, tambopatino...) a cada departamento, provincia y distrito que lo tenga.
// `data/demonyms.json` mapea ubigeo -> gentilicio: los 25 departamentos están escritos a mano y el resto sale
// de la ficha del artículo de Wikipedia de cada provincia o distrito, tal como está, sin verificar uno por uno.
// Lo que la ficha no trae queda sin gentilicio: no se genera por reglas. Receta en
// github.com/crafter-station/quipu (scripts/gentilicios_wikipedia.py y gentilicios_tabla.py).
// Idempotente: se puede correr sin rehacer `data:build`.
import type { Dataset } from "../src/lib/shapes";

const demonyms: Record<string, string> = await Bun.file(
  "data/demonyms.json",
).json();
const data: Dataset = await Bun.file("public/data/shapes.json").json();
let n = 0;
for (const level of ["dep", "prov", "dist"] as const) {
  for (const s of data[level]) {
    delete s.gentilicio;
    const g = demonyms[s.id];
    if (g) {
      s.gentilicio = g;
      n++;
    }
  }
}
await Bun.write("public/data/shapes.json", JSON.stringify(data));
console.log(`${n} gentilicios aplicados`);

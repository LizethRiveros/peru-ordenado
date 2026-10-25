import { count, km2, pct } from "@/lib/format";
import type { Selection } from "@/lib/selection";
import { type Dataset, type Shape, value } from "@/lib/shapes";

export type Step = {
  sel: Selection;
  kicker: string;
  title: string;
  body: string;
  /** Shapes at the step's level to ring and call out. */
  highlight: string[];
};

const top = (shapes: Shape[], metric: Selection["metric"]) =>
  [...shapes]
    .filter((s) => value(s, metric) !== undefined)
    .sort((a, b) => (value(b, metric) ?? 0) - (value(a, metric) ?? 0));

/** The guided tour: every number in the copy is read from the dataset, none is typed in. */
export function buildStory(data: Dataset): Step[] {
  const deps = top(data.dep, "area");
  const biggest = deps[0];
  const smallest = deps[deps.length - 1];
  // How many of the smallest departments fit inside the biggest one.
  let fit = 0;
  let sum = 0;
  for (const d of [...deps].reverse()) {
    if (sum + d.area > biggest.area) break;
    sum += d.area;
    fit++;
  }
  const provs = top(data.prov, "area");
  const dists = top(data.dist, "area");

  const depExec = top(data.dep, "ejecucion");
  const distExec = top(data.dist, "ejecucion");
  const underHalf = distExec.filter(
    (d) => (value(d, "ejecucion") ?? 1) < 0.5,
  ).length;
  const totalPim = data.dep.reduce((t, d) => t + (d.inv?.pim ?? 0), 0);
  const totalDev = data.dep.reduce((t, d) => t + (d.inv?.dev ?? 0), 0);

  const distOrn = top(
    data.dist.filter((d) => (d.inv?.pim ?? 0) > 5_000_000),
    "ornato",
  );
  const ornato = data.dep.reduce((t, d) => t + (d.mix?.ornato ?? 0), 0);
  const unsure = data.dep.reduce((t, d) => t + (d.mix?.unsure ?? 0), 0);
  const depDigital = top(data.dep, "digital");

  return [
    {
      sel: { level: "dep", view: "mapa", metric: "area" },
      kicker: "El punto de partida",
      title: `El Perú, en ${count(data.dep.length)} piezas`,
      body: "Cada color es un departamento. Mira dónde está cada uno, porque en un momento todos van a salir de su lugar.",
      highlight: [],
    },
    {
      sel: { level: "dep", view: "ordenado", metric: "area" },
      kicker: "Desarmado por tamaño",
      title: `${biggest.name} es más grande que ${fit} departamentos juntos`,
      body: `Las mismas formas, a la misma escala, ordenadas de mayor a menor. ${biggest.name} mide ${km2(biggest.area)}; ${smallest.name}, ${km2(smallest.area)}.`,
      highlight: [biggest.id, smallest.id],
    },
    {
      sel: { level: "prov", view: "ordenado", metric: "area" },
      kicker: "Un nivel más abajo",
      title: `${count(data.prov.length)} provincias`,
      body: `Cada departamento se parte en sus provincias, que salen volando de su forma. La más grande es ${provs[0].name}, con ${km2(provs[0].area)}.`,
      highlight: [provs[0].id],
    },
    {
      sel: { level: "dist", view: "ordenado", metric: "area" },
      kicker: "Hasta el último distrito",
      title: `${count(data.dist.length)} distritos`,
      body: `De ${dists[0].name} (${km2(dists[0].area)}) a ${dists[dists.length - 1].name} (${km2(dists[dists.length - 1].area)}). Cada uno tiene su municipalidad y su presupuesto.`,
      highlight: [dists[0].id, dists[dists.length - 1].id],
    },
    {
      sel: { level: "dep", view: "ordenado", metric: "ejecucion" },
      kicker: "Otra pregunta",
      title: "¿Cuánto de su inversión gastaron?",
      body: `En 2024 las municipalidades ejecutaron ${pct(totalDev / totalPim)} de su presupuesto de inversión. Verde gastó casi todo, rojo dejó plata sin usar. ${depExec[0].name} va primero con ${pct(value(depExec[0], "ejecucion") ?? 0)}.`,
      highlight: [depExec[0].id, depExec[depExec.length - 1].id],
    },
    {
      sel: { level: "dist", view: "ordenado", metric: "ejecucion" },
      kicker: "Distrito por distrito",
      title: `${count(underHalf)} distritos no llegaron a la mitad`,
      body: `El tamaño ya no importa, importa el color. Al fondo, ${distExec[distExec.length - 1].name} ejecutó ${pct(value(distExec[distExec.length - 1], "ejecucion") ?? 0)} de lo que tenía.`,
      highlight: [distExec[distExec.length - 1].id],
    },
    {
      sel: { level: "dist", view: "ordenado", metric: "ornato" },
      kicker: "¿Y en qué?",
      title: `${pct(ornato / totalPim)} se fue a plazas, parques y arcos`,
      body: `Jev, un modelo de evaluación, leyó el nombre de cada proyecto. En ${distOrn[0].name}, ${pct(value(distOrn[0], "ornato") ?? 0)} de la inversión fue ornato. Las formas tenues son las que Jev no pudo clasificar con seguridad (${pct(unsure / totalPim)} del total).`,
      highlight: [distOrn[0].id],
    },
    {
      sel: { level: "dep", view: "mapa", metric: "digital" },
      kicker: "De vuelta al mapa",
      title: "El mismo país, otra lectura",
      body: `Ahora coloreado por superficie digital: cuánto sistema propio declaran sus municipalidades. ${depDigital[0].name} lidera. Elige un criterio y explóralo tú.`,
      highlight: [depDigital[0].id],
    },
  ];
}

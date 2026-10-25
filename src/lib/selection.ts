import { LEVELS, type Level, METRICS, type Metric } from "@/lib/shapes";

export type View = "mapa" | "ordenado";
export type Selection = {
  level: Level;
  view: View;
  metric: Metric;
  /** Department id (`09` = Huancavelica) to show on its own; absent = all of Peru. */
  dep?: string;
};

export const DEFAULT: Selection = {
  level: "dep",
  view: "mapa",
  metric: "area",
};

type Params = Record<string, string | string[] | undefined> | URLSearchParams;

const get = (p: Params, k: string) => {
  const v = p instanceof URLSearchParams ? p.get(k) : p[k];
  return typeof v === "string" ? v : undefined;
};

/** URL state (`?nivel=dist&vista=ordenado&orden=ornato`), invalid values fall back to defaults. */
export function parseSelection(p: Params): Partial<Selection> {
  const level = get(p, "nivel");
  const view = get(p, "vista");
  const metric = get(p, "orden");
  const dep = get(p, "dep");
  return {
    dep: dep && /^\d{2}$/.test(dep) ? dep : undefined,
    level: level && level in LEVELS ? (level as Level) : undefined,
    view: view === "mapa" || view === "ordenado" ? view : undefined,
    metric: metric && metric in METRICS ? (metric as Metric) : undefined,
  };
}

export function withDefaults(p: Partial<Selection>): Selection {
  return {
    level: p.level ?? DEFAULT.level,
    view: p.view ?? DEFAULT.view,
    metric: p.metric ?? DEFAULT.metric,
    dep: p.dep,
  };
}

export function selectionTitle(sel: Selection, n: number): string {
  const count = new Intl.NumberFormat("es-PE").format(n);
  const base = `${count} ${LEVELS[sel.level].plural}`;
  if (sel.view === "mapa") return base;
  const title = METRICS[sel.metric].title;
  // "provincias" is feminine; the metric titles are written for departamentos and distritos.
  return `${base} ${sel.level === "prov" ? title.replace(/^ordenados/, "ordenadas") : title}`;
}

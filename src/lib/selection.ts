import { LEVELS, type Level, METRICS, type Metric } from "@/lib/shapes";

export type View = "mapa" | "ordenado";
export type Selection = { level: Level; view: View; metric: Metric };

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
  return {
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
  };
}

export function selectionTitle(sel: Selection, n: number): string {
  const count = new Intl.NumberFormat("es-PE").format(n);
  const base = `${count} ${LEVELS[sel.level].plural}`;
  return sel.view === "mapa" ? base : `${base} ${METRICS[sel.metric].title}`;
}

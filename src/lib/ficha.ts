import { type Metric, type Shape, value } from "@/lib/shapes";

/** One thread of a place's quipu: what it measures, the figure, and how long it hangs (0–1). */
export type FichaRow = {
  key: Metric;
  label: string;
  text: string;
  /** Share of same-level places that sit below this one; null when there is no data. */
  frac: number | null;
};

const count = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1));

const ROWS: [Metric, string, (v: number) => string][] = [
  ["quipu", "Gasto", (v) => `${Math.round(v * 100)} %`],
  ["cobertura", "Señal 4G", (v) => `${Math.round(v * 100)} %`],
  ["emergencias", "Emergencias", count],
  ["zonas", "Zonas críticas", count],
  ["digital", "Digital", (v) => String(Math.round(v))],
];

/** Every layer we have for a place, each compared with the places of its own level. */
export function fichaRows(shape: Shape, peers: Shape[]): FichaRow[] {
  return ROWS.map(([key, label, fmt]) => {
    const v = value(shape, key);
    if (v === undefined) return { key, label, text: "sin dato", frac: null };
    const all = peers.flatMap((p) => {
      const x = value(p, key);
      return x === undefined ? [] : [x];
    });
    const below = all.filter((x) => x < v).length;
    return {
      key,
      label,
      text: fmt(v),
      frac: all.length > 1 ? below / (all.length - 1) : 0.5,
    };
  });
}

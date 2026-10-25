import type { Metric, Shape } from "@/lib/shapes";

// Macro-regions get a hue family, departments a step inside it (north wine, center blue,
// south amber, east green, Lima and Callao slate), so neighbours stay distinguishable.
const DEP: Record<string, [number, number, number]> = {
  "24": [0.6, 0.14, 5],
  "20": [0.52, 0.15, 0],
  "14": [0.66, 0.12, 15],
  "13": [0.48, 0.14, 355],
  "06": [0.58, 0.16, 350],
  "01": [0.44, 0.12, 5],
  "02": [0.62, 0.13, 345],
  "10": [0.62, 0.11, 230],
  "19": [0.5, 0.1, 225],
  "12": [0.7, 0.1, 220],
  "09": [0.56, 0.12, 240],
  "05": [0.78, 0.07, 225],
  "11": [0.82, 0.08, 75],
  "04": [0.74, 0.12, 60],
  "18": [0.6, 0.13, 40],
  "23": [0.8, 0.09, 50],
  "21": [0.66, 0.13, 35],
  "08": [0.7, 0.12, 50],
  "03": [0.62, 0.11, 30],
  "16": [0.76, 0.16, 145],
  "25": [0.82, 0.08, 140],
  "17": [0.74, 0.1, 115],
  "22": [0.66, 0.12, 155],
  "15": [0.45, 0.01, 60],
  "07": [0.62, 0.02, 60],
};

const hash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return ((h >>> 0) % 1000) / 1000;
};

export function departmentColor(shape: Shape, jitter: boolean): string {
  const [l, c, h] = DEP[shape.dep] ?? [0.6, 0.02, 60];
  const dl = jitter ? (hash(shape.id) - 0.5) * 0.1 : 0;
  return `oklch(${(l + dl).toFixed(3)} ${c} ${h})`;
}

export const NO_DATA = "oklch(0.6 0.005 60 / 0.35)";

/** Execution ratio 0..1 on a red → amber → green ramp. */
export function executionColor(r: number): string {
  const t = Math.max(0, Math.min(1, r));
  const h = 25 + t * 125;
  const l = 0.58 + Math.sin(t * Math.PI) * 0.14;
  return `oklch(${l.toFixed(3)} 0.15 ${h.toFixed(1)})`;
}

/** Budget in soles on a log ramp from pale to deep teal. */
export function budgetColor(pim: number, min: number, max: number): string {
  const t = Math.max(0, Math.min(1, Math.log(pim / min) / Math.log(max / min)));
  return `oklch(${(0.86 - t * 0.44).toFixed(3)} ${(0.04 + t * 0.1).toFixed(3)} 200)`;
}

/** Ornament share on a sand → deep magenta ramp; 30% and above saturates. */
export function ornatoColor(r: number): string {
  const t = Math.max(0, Math.min(1, r / 0.3));
  return `oklch(${(0.88 - t * 0.42).toFixed(3)} ${(0.03 + t * 0.16).toFixed(3)} ${(80 - t * 85).toFixed(1)})`;
}

/** muniscan index on a slate → electric blue ramp over 20–70, where nearly every score falls. */
export function digitalColor(v: number): string {
  const t = Math.max(0, Math.min(1, (v - 20) / 50));
  return `oklch(${(0.82 - t * 0.3).toFixed(3)} ${(0.02 + t * 0.17).toFixed(3)} 255)`;
}

export function colorFor(
  shape: Shape,
  metric: Metric,
  jitter: boolean,
  range: [number, number],
): string {
  if (metric === "area") return departmentColor(shape, jitter);
  if (metric === "digital")
    return shape.digital === undefined ? NO_DATA : digitalColor(shape.digital);
  if (metric === "ornato")
    return shape.mix && shape.inv?.pim
      ? ornatoColor(shape.mix.ornato / shape.inv.pim)
      : NO_DATA;
  if (!shape.inv) return NO_DATA;
  if (metric === "ejecucion")
    return executionColor(shape.inv.dev / shape.inv.pim);
  return budgetColor(shape.inv.pim, range[0], range[1]);
}

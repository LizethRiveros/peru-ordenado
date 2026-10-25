export type Shape = {
  id: string;
  name: string;
  dep: string;
  area: number;
  bbox: [number, number, number, number];
  d: string;
  /** Local-government investment (genérica 2.6), soles. Absent when MEF reports no budget. */
  inv?: { pim: number; dev: number };
  /** muniscan digital-surface index 0–100 (provinces and departments: mean of their districts). */
  digital?: number;
  /**
   * Investment PIM by Jev category, soles. `unsure` is the PIM whose top category came with
   * probability below the confidence threshold.
   */
  mix?: { ornato: number; deporte: number; local: number; unsure: number };
};

export type Level = "dep" | "prov" | "dist";

export type Dataset = {
  width: number;
  height: number;
  sources: { geo: string; spend: string };
} & Record<Level, Shape[]>;

export type Metric = "area" | "inversion" | "ejecucion" | "ornato" | "digital";

export const LEVELS: Record<Level, { label: string; plural: string }> = {
  dep: { label: "Departamento", plural: "departamentos" },
  prov: { label: "Provincia", plural: "provincias" },
  dist: { label: "Distrito", plural: "distritos" },
};

export const METRICS: Record<Metric, { label: string; title: string }> = {
  area: { label: "Área", title: "ordenados por área (km²)" },
  inversion: {
    label: "Presupuesto de inversión",
    title: "ordenados por presupuesto de inversión municipal 2024",
  },
  ejecucion: {
    label: "Inversión ejecutada",
    title: "ordenados por % de inversión municipal ejecutada en 2024",
  },
  ornato: {
    label: "Inversión en ornato",
    title:
      "ordenados por % de la inversión municipal 2024 en plazas, parques y arcos",
  },
  digital: {
    label: "Superficie digital",
    title: "ordenados por índice de superficie digital municipal (muniscan)",
  },
};

export const SOURCE: Record<Metric, string> = {
  area: "IGN",
  inversion: "MEF 2024",
  ejecucion: "MEF 2024",
  ornato: "MEF + Jev",
  digital: "muniscan",
};

/** The parent id one level up: districts belong to provinces, provinces to departments. */
export function parentId(level: Level, id: string): string | undefined {
  if (level === "dist") return id.slice(0, 4);
  if (level === "prov") return id.slice(0, 2);
  return undefined;
}

/** Share of investment PIM Jev placed in a category with confidence; 1 when no Jev data applies. */
export function certainty(shape: Shape): number {
  if (!shape.mix || !shape.inv?.pim) return 1;
  return 1 - shape.mix.unsure / shape.inv.pim;
}

export function value(shape: Shape, metric: Metric): number | undefined {
  if (metric === "area") return shape.area;
  if (metric === "digital") return shape.digital;
  if (metric === "ornato")
    return shape.mix && shape.inv?.pim
      ? shape.mix.ornato / shape.inv.pim
      : undefined;
  if (!shape.inv) return undefined;
  if (metric === "inversion") return shape.inv.pim;
  return shape.inv.dev / shape.inv.pim;
}

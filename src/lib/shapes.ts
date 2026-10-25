export type Shape = {
  id: string;
  name: string;
  dep: string;
  area: number;
  bbox: [number, number, number, number];
  d: string;
  /** Local-government investment (genérica 2.6), soles. Absent when MEF reports no budget. */
  inv?: { pim: number; dev: number };
};

export type Level = "dep" | "prov" | "dist";

export type Dataset = {
  width: number;
  height: number;
  sources: { geo: string; spend: string };
} & Record<Level, Shape[]>;

export type Metric = "area" | "inversion" | "ejecucion";

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
};

/** The parent id one level up: districts belong to provinces, provinces to departments. */
export function parentId(level: Level, id: string): string | undefined {
  if (level === "dist") return id.slice(0, 4);
  if (level === "prov") return id.slice(0, 2);
  return undefined;
}

export function value(shape: Shape, metric: Metric): number | undefined {
  if (metric === "area") return shape.area;
  if (!shape.inv) return undefined;
  if (metric === "inversion") return shape.inv.pim;
  return shape.inv.dev / shape.inv.pim;
}

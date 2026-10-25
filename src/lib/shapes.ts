export type Shape = {
  id: string;
  name: string;
  dep: string;
  area: number;
  bbox: [number, number, number, number];
  d: string;
  /** Local-government investment (genérica 2.6), soles. Absent when MEF reports no budget. */
  inv?: { pim: number; dev: number };
  /** Gentilicio (huancavelicano, tambopatino); ausente si la fuente no lo trae. */
  gentilicio?: string;
  /**
   * quipu: avance del año en curso, inversión municipal (genérica 2.6). `dev` es el devengado
   * acumulado hasta el mes cerrado `hasta`; `devPrev`/`pimPrev` son lo mismo del año anterior.
   */
  avance?: {
    pim: number;
    dev: number;
    pimPrev: number;
    devPrev: number;
    hasta: number;
  };
  /**
   * Territorio (OSIPTEL, PCM, INGEMMET): centros poblados con y sin 4G, declaratorias de emergencia
   * 2017-2024 y zonas críticas inventariadas. `emerg`/`zonas` son sumas sobre `emergN`/`zonasN` distritos,
   * para poder promediar en provincias y departamentos.
   */
  terr?: {
    cp: number;
    cp4g: number;
    emerg: number;
    emergN: number;
    zonas: number;
    zonasN: number;
  };
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
  sources: { geo: string; spend: string; quipu?: string };
} & Record<Level, Shape[]>;

export type Metric =
  | "area"
  | "inversion"
  | "ejecucion"
  | "quipu"
  | "ornato"
  | "digital"
  | "cobertura"
  | "emergencias"
  | "zonas";

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
  quipu: {
    label: "Avance 2026 (quipu)",
    title:
      "ordenados por % de inversión municipal ya gastada en lo que va de 2026",
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
  cobertura: {
    label: "Cobertura 4G",
    title: "ordenados por % de centros poblados con señal 4G",
  },
  emergencias: {
    label: "Emergencias por lluvias y sequía",
    title:
      "ordenados por decretos de emergencia 2017-2024 (promedio por distrito)",
  },
  zonas: {
    label: "Zonas críticas",
    title:
      "ordenados por zonas críticas por peligros geológicos (promedio por distrito inventariado)",
  },
};

export const SOURCE: Record<Metric, string> = {
  area: "IGN",
  inversion: "MEF 2024",
  ejecucion: "MEF 2024",
  quipu: "MEF 2026 · quipu",
  ornato: "MEF + Jev",
  digital: "muniscan",
  cobertura: "OSIPTEL",
  emergencias: "PCM",
  zonas: "INGEMMET",
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
  if (metric === "quipu")
    return shape.avance?.pim ? shape.avance.dev / shape.avance.pim : undefined;
  if (metric === "cobertura")
    return shape.terr?.cp ? shape.terr.cp4g / shape.terr.cp : undefined;
  if (metric === "emergencias")
    return shape.terr?.emergN ? shape.terr.emerg / shape.terr.emergN : undefined;
  if (metric === "zonas")
    return shape.terr?.zonasN ? shape.terr.zonas / shape.terr.zonasN : undefined;
  if (metric === "ornato")
    return shape.mix && shape.inv?.pim
      ? shape.mix.ornato / shape.inv.pim
      : undefined;
  if (!shape.inv) return undefined;
  if (metric === "inversion") return shape.inv.pim;
  return shape.inv.dev / shape.inv.pim;
}

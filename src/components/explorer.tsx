"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AboutDialog } from "@/components/about-dialog";
import { SiteHeader } from "@/components/site-header";
import { Stage, sortShapes, valueLabel } from "@/components/stage";
import {
  budgetColor,
  digitalColor,
  executionColor,
  NO_DATA,
  ornatoColor,
} from "@/lib/color";
import { count, km2, pct, soles } from "@/lib/format";
import { parseSelection, type Selection } from "@/lib/selection";
import {
  certainty,
  type Dataset,
  LEVELS,
  type Level,
  METRICS,
  type Metric,
  type Shape,
  SOURCE,
  value,
} from "@/lib/shapes";

type Hit = { shape: Shape; level: Level; x: number; y: number };

const TOUR: Partial<Selection>[] = [
  { level: "dep", view: "mapa" },
  { level: "dep", view: "ordenado" },
  { level: "prov", view: "ordenado" },
  { level: "dist", view: "ordenado" },
  { level: "prov", view: "ordenado" },
  { level: "dep", view: "ordenado" },
  { level: "dep", view: "mapa" },
];
const TOUR_STEP = 3200;

export function Explorer() {
  const [data, setData] = useState<Dataset | null>(null);
  const [sel, setSel] = useState<Selection>({
    level: "dep",
    view: "mapa",
    metric: "area",
  });
  const [hit, setHit] = useState<Hit | null>(null);
  const [touring, setTouring] = useState(false);
  const [video, setVideo] = useState(false);
  const tour = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const rest = parseSelection(q);
    const v = q.has("video");
    setSel((s) => ({
      ...s,
      ...Object.fromEntries(Object.entries(rest).filter(([, x]) => x)),
    }));
    setVideo(Boolean(v));
    setReady(true);
    fetch("/data/shapes.json")
      .then((r) => r.json())
      .then(setData);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const q = new URLSearchParams(window.location.search);
    q.set("nivel", sel.level);
    q.set("vista", sel.view);
    q.set("orden", sel.metric);
    window.history.replaceState(null, "", `?${q}`);
  }, [sel, ready]);

  const stopTour = useCallback(() => {
    for (const t of tour.current) clearTimeout(t);
    tour.current = [];
    setTouring(false);
  }, []);

  const startTour = useCallback(
    (loop: boolean) => {
      stopTour();
      setTouring(true);
      const run = () => {
        TOUR.forEach((step, i) => {
          tour.current.push(
            setTimeout(() => setSel((s) => ({ ...s, ...step })), i * TOUR_STEP),
          );
        });
        tour.current.push(
          setTimeout(
            () => (loop ? run() : setTouring(false)),
            TOUR.length * TOUR_STEP,
          ),
        );
      };
      run();
    },
    [stopTour],
  );

  useEffect(() => {
    if (video && data) startTour(true);
    return stopTour;
  }, [video, data, startTour, stopTour]);

  const choose = (next: Partial<Selection>) => {
    stopTour();
    setSel((s) => ({ ...s, ...next }));
  };

  const shapes = data?.[sel.level] ?? [];
  const title =
    sel.view === "mapa"
      ? `${count(shapes.length)} ${LEVELS[sel.level].plural}`
      : `${count(shapes.length)} ${LEVELS[sel.level].plural} ${METRICS[sel.metric].title}`;

  const ranked = useMemo(
    () =>
      sortShapes(shapes, sel.metric).filter(
        (s) => value(s, sel.metric) !== undefined,
      ),
    [shapes, sel.metric],
  );
  const withData = sel.metric === "area" ? shapes.length : ranked.length;

  const names = useMemo(() => {
    const m = new Map<string, string>();
    for (const l of ["dep", "prov"] as const)
      for (const s of data?.[l] ?? []) m.set(s.id, s.name);
    return m;
  }, [data]);

  const stage = (
    <section
      className={
        video
          ? "relative mx-auto aspect-[4/5] h-[min(100dvh,125vw)] overflow-hidden bg-background"
          : "glass glass-border relative order-1 min-h-[125vw] overflow-hidden rounded-3xl sm:min-h-[80vh] lg:order-none lg:min-h-0"
      }
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-col items-center gap-1 px-4 pt-4 text-center sm:pt-5">
        <p className="text-[13px] font-semibold tracking-[0.18em] text-foreground">
          PERÚ
        </p>
        <p
          key={title}
          className="animate-in text-[10.5px] font-medium tracking-[0.08em] text-muted-foreground uppercase"
        >
          {title}
        </p>
      </div>
      <div className="absolute inset-x-0 top-20 bottom-10 sm:top-16">
        {data ? (
          <Stage
            data={data}
            level={sel.level}
            view={sel.view}
            metric={sel.metric}
            label={`Mapa del Perú: ${title}`}
            onHover={setHit}
          />
        ) : (
          <div className="grid size-full place-items-center text-[12px] text-muted-foreground">
            Cargando {count(1873)} distritos…
          </div>
        )}
        {hit && <Tooltip hit={hit} metric={sel.metric} names={names} />}
      </div>
      <div className="absolute inset-x-0 bottom-3 z-10 flex justify-center">
        <Scrubber level={sel.level} onChange={(level) => choose({ level })} />
      </div>
    </section>
  );

  if (video)
    return (
      <main className="grid min-h-dvh place-items-center bg-background">
        {stage}
      </main>
    );

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader about={<AboutDialog sources={data?.sources} />} />
      <main className="grid flex-1 gap-4 lg:min-h-0 lg:flex-none px-3 pb-3 sm:px-5 lg:h-[calc(100dvh-3.75rem)] lg:grid-cols-[minmax(20rem,23rem)_1fr] lg:grid-rows-[minmax(0,1fr)]">
        <aside className="contents lg:flex lg:min-h-0 lg:flex-col lg:gap-5 lg:overflow-y-auto lg:pt-8 lg:pr-1">
          <div className="animate-in order-first pt-3 lg:pt-0">
            <h1 className="font-display text-5xl leading-[0.95] tracking-[-0.02em] sm:text-6xl">
              Perú, <em className="font-light">ordenado</em>
            </h1>
            <p className="mt-3 max-w-sm text-[14px] leading-relaxed text-muted-foreground">
              El mismo país, desarmado y vuelto a ordenar. Cada forma es un
              territorio real, a escala; cambia el criterio y mira quién queda
              arriba.
            </p>
          </div>

          <div className="glass glass-border order-2 flex flex-col gap-4 rounded-3xl p-4 lg:order-none">
            <Field label="Vista">
              <Segmented
                value={sel.view}
                options={[
                  ["mapa", "Mapa"],
                  ["ordenado", "Ordenado"],
                ]}
                onChange={(view) => choose({ view })}
              />
            </Field>
            <Field label="Nivel">
              <Segmented
                value={sel.level}
                options={[
                  ["dep", "Departamentos"],
                  ["prov", "Provincias"],
                  ["dist", "Distritos"],
                ]}
                onChange={(level) => choose({ level })}
              />
            </Field>
            <Field label="Ordenar y colorear por">
              <div className="flex flex-col gap-1.5">
                {(Object.keys(METRICS) as Metric[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => choose({ metric: m, view: "ordenado" })}
                    aria-pressed={sel.metric === m}
                    className="flex items-center justify-between rounded-xl border border-border px-3 py-2 text-left text-[13px] transition hover:border-foreground/20 aria-pressed:border-accent/50 aria-pressed:bg-accent/10"
                  >
                    <span>{METRICS[m].label}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {SOURCE[m]}
                    </span>
                  </button>
                ))}
              </div>
            </Field>
            <Legend metric={sel.metric} shapes={shapes} />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => (touring ? stopTour() : startTour(false))}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-foreground px-3 py-2.5 text-[13px] font-medium text-background transition hover:opacity-90"
              >
                {touring ? "Detener recorrido" : "Reproducir recorrido"}
              </button>
              <ShareButton title={title} />
            </div>
          </div>

          {data && ranked.length > 0 && (
            <div className="order-3 grid grid-cols-2 gap-3 text-[12.5px] lg:order-none">
              <Extremes
                title="Arriba"
                shapes={ranked.slice(0, 5)}
                metric={sel.metric}
              />
              <Extremes
                title="Abajo"
                shapes={ranked.slice(-5).reverse()}
                metric={sel.metric}
              />
              {sel.metric !== "area" && (
                <p className="col-span-2 text-[11px] leading-relaxed text-muted-foreground">
                  {count(withData)} de {count(shapes.length)}{" "}
                  {LEVELS[sel.level].plural} con presupuesto de inversión
                  registrado en el MEF.
                </p>
              )}
            </div>
          )}
        </aside>
        {stage}
      </main>
    </div>
  );
}

function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        const url = window.location.href;
        if (navigator.share) {
          await navigator
            .share({ title: "Perú, ordenado", text: title, url })
            .catch(() => {});
          return;
        }
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      }}
      className="rounded-xl border border-border px-3 py-2.5 text-[13px] transition hover:border-foreground/20"
    >
      {copied ? "Copiado" : "Compartir"}
    </button>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
        {label}
      </span>
      {children}
    </div>
  );
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: [T, string][];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex rounded-xl border border-border bg-foreground/[0.03] p-0.5">
      {options.map(([v, label]) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          aria-pressed={value === v}
          className="flex-1 rounded-[0.6rem] px-2 py-1.5 text-[12.5px] text-muted-foreground transition hover:text-foreground aria-pressed:bg-surface aria-pressed:text-foreground aria-pressed:shadow-sm"
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function Scrubber({
  level,
  onChange,
}: {
  level: Level;
  onChange: (l: Level) => void;
}) {
  const steps: Level[] = ["dep", "prov", "dist"];
  return (
    <div className="glass flex items-center gap-1 rounded-full px-1.5 py-1 text-[10.5px]">
      {steps.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => onChange(l)}
          aria-pressed={level === l}
          className="rounded-full px-2.5 py-1 text-muted-foreground transition hover:text-foreground aria-pressed:bg-foreground aria-pressed:text-background"
        >
          {LEVELS[l].label}s
        </button>
      ))}
    </div>
  );
}

function Legend({ metric, shapes }: { metric: Metric; shapes: Shape[] }) {
  if (metric === "area") {
    return (
      <p className="text-[11.5px] leading-relaxed text-muted-foreground">
        Color por departamento, agrupados por macrorregión: norte, centro, sur,
        oriente y Lima.
      </p>
    );
  }
  const stops = Array.from({ length: 9 }, (_, i) => i / 8);
  const pims = shapes.flatMap((s) => (s.inv ? [s.inv.pim] : []));
  const [min, max] = [Math.max(1, Math.min(...pims)), Math.max(2, ...pims)];
  const scale = {
    ejecucion: {
      colors: stops.map((t) => executionColor(t)),
      lo: "0%",
      hi: "100%",
    },
    inversion: {
      colors: stops.map((t) => budgetColor(min * (max / min) ** t, min, max)),
      lo: soles(min),
      hi: soles(max),
    },
    ornato: {
      colors: stops.map((t) => ornatoColor(t * 0.3)),
      lo: "0%",
      hi: "30%+",
    },
    digital: {
      colors: stops.map((t) => digitalColor(20 + t * 50)),
      lo: "≤20",
      hi: "70+",
    },
  }[metric];
  return (
    <div className="flex flex-col gap-1.5">
      <div
        className="h-2 rounded-full"
        style={{
          background: `linear-gradient(90deg, ${scale.colors.join(",")})`,
        }}
      />
      <div className="flex justify-between text-[10.5px] text-muted-foreground">
        <span>{scale.lo}</span>
        <span className="flex items-center gap-1">
          <i
            className="inline-block size-2 rounded-full"
            style={{ background: NO_DATA }}
          />{" "}
          sin datos
        </span>
        <span>{scale.hi}</span>
      </div>
      {metric === "ornato" && (
        <p className="text-[11.5px] leading-relaxed text-muted-foreground">
          Jev clasificó cada proyecto por su nombre. Las formas más
          transparentes tienen más inversión que Jev no pudo clasificar con
          seguridad.
        </p>
      )}
      {metric === "digital" && (
        <p className="text-[11.5px] leading-relaxed text-muted-foreground">
          Índice de muniscan: qué tanto sistema propio declara cada
          municipalidad en gob.pe. Provincias y departamentos muestran el
          promedio de sus distritos.
        </p>
      )}
    </div>
  );
}

function Extremes({
  title,
  shapes,
  metric,
}: {
  title: string;
  shapes: Shape[];
  metric: Metric;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
        {title}
      </span>
      <ol className="flex flex-col gap-1">
        {shapes.map((s) => (
          <li key={s.id} className="flex items-baseline justify-between gap-2">
            <span className="truncate">{s.name}</span>
            <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
              {valueLabel(s, metric)}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Tooltip({
  hit,
  metric,
  names,
}: {
  hit: Hit;
  metric: Metric;
  names: Map<string, string>;
}) {
  const { shape, level } = hit;
  const where = [
    level === "dist" ? names.get(shape.id.slice(0, 4)) : undefined,
    level !== "dep" ? names.get(shape.dep) : undefined,
  ]
    .filter(Boolean)
    .join(", ");
  const left = hit.x > 220 ? hit.x - 212 : hit.x + 16;
  return (
    <div
      className="glass glass-solid pointer-events-none absolute z-20 w-[196px] rounded-2xl p-3 text-[12px]"
      style={{ left, top: Math.max(0, hit.y - 24) }}
    >
      <p className="text-[10.5px] tracking-[0.06em] text-muted-foreground uppercase">
        {LEVELS[level].label}
      </p>
      <p className="font-display text-[17px] leading-tight">{shape.name}</p>
      {where && <p className="text-[11px] text-muted-foreground">{where}</p>}
      <dl className="mt-2 grid grid-cols-[1fr_auto] gap-x-3 gap-y-0.5">
        <dt className="text-muted-foreground">Área</dt>
        <dd className="text-right font-mono">{km2(shape.area)}</dd>
        {shape.inv ? (
          <>
            <dt className="text-muted-foreground">Inversión (PIM)</dt>
            <dd className="text-right font-mono">{soles(shape.inv.pim)}</dd>
            <dt className="text-muted-foreground">Ejecutado</dt>
            <dd className="text-right font-mono">{soles(shape.inv.dev)}</dd>
            <dt
              className={
                metric === "ejecucion"
                  ? "text-foreground"
                  : "text-muted-foreground"
              }
            >
              Avance
            </dt>
            <dd className="text-right font-mono">
              {pct(shape.inv.dev / shape.inv.pim)}
            </dd>
          </>
        ) : (
          <>
            <dt className="text-muted-foreground">Inversión</dt>
            <dd className="text-right text-muted-foreground">sin datos</dd>
          </>
        )}
        {shape.mix && shape.inv?.pim ? (
          <>
            <dt
              className={
                metric === "ornato"
                  ? "text-foreground"
                  : "text-muted-foreground"
              }
            >
              Ornato
            </dt>
            <dd className="text-right font-mono">
              {pct(shape.mix.ornato / shape.inv.pim)}
            </dd>
            <dt className="text-muted-foreground">Deporte</dt>
            <dd className="text-right font-mono">
              {pct(shape.mix.deporte / shape.inv.pim)}
            </dd>
            <dt className="text-muted-foreground">Local municipal</dt>
            <dd className="text-right font-mono">
              {pct(shape.mix.local / shape.inv.pim)}
            </dd>
            <dt className="text-muted-foreground">Jev seguro</dt>
            <dd className="text-right font-mono">{pct(certainty(shape))}</dd>
          </>
        ) : null}
        <dt
          className={
            metric === "digital" ? "text-foreground" : "text-muted-foreground"
          }
        >
          Superficie digital
        </dt>
        <dd className="text-right font-mono">
          {shape.digital === undefined ? "sin datos" : `${shape.digital}/100`}
        </dd>
      </dl>
    </div>
  );
}

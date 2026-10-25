"use client";

import { useRef } from "react";

/** "Acerca de" modal: what the map shows, where each number comes from, and its limits. */
export function AboutDialog({
  sources,
}: {
  sources?: { geo: string; spend: string };
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        aria-label="Acerca de este proyecto"
        className="grid size-8 place-items-center rounded-lg border border-border bg-surface text-foreground/80 transition hover:border-foreground/20 hover:text-foreground"
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v5M12 8h.01" />
        </svg>
      </button>
      <dialog
        ref={dialog}
        onClick={(e) => {
          if (e.target === dialog.current) dialog.current?.close();
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") dialog.current?.close();
        }}
        className="glass glass-solid glass-border m-auto w-[min(92vw,34rem)] rounded-3xl p-0 text-foreground backdrop:bg-black/50 backdrop:backdrop-blur-sm open:animate-in"
      >
        <div className="flex flex-col gap-5 p-6 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-medium tracking-[0.08em] text-accent uppercase">
                Acerca de
              </p>
              <h2 className="mt-1 font-display text-2xl">Perú, ordenado</h2>
            </div>
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              aria-label="Cerrar"
              className="grid size-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-foreground/5 hover:text-foreground"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="rounded-2xl border border-accent/30 bg-accent/10 px-4 py-3 text-[13px] leading-relaxed">
            <strong className="font-semibold">Prototipo no oficial.</strong> No
            es un sitio del Estado peruano. Los datos vienen de fuentes públicas
            y pueden tener rezagos; verifica cifras puntuales en la Consulta
            Amigable del MEF.
          </div>

          <section className="flex flex-col gap-1.5 text-sm leading-relaxed text-foreground/85">
            <h3 className="font-medium text-foreground">Qué es</h3>
            <p>
              El mapa del Perú desarmado: cada departamento, provincia y
              distrito sale de su lugar y se ordena en filas, a escala real,
              según el criterio que elijas. La geografía se queda, cambia la
              pregunta.
            </p>
          </section>

          <section className="flex flex-col gap-1.5 text-sm leading-relaxed text-foreground/85">
            <h3 className="font-medium text-foreground">
              De dónde salen los datos
            </h3>
            <p>
              Límites y áreas: Instituto Geográfico Nacional (2020), publicados
              por OCHA en HDX. Son 1,873 distritos; los creados después de 2020
              no aparecen.
            </p>
            <p>
              Inversión: Presupuesto y Ejecución de Gasto 2024 del portal de
              Datos Abiertos del MEF. Sumamos, por municipalidad, la genérica
              2.6 (adquisición de activos no financieros): el presupuesto
              modificado (PIM) y lo devengado. El avance es devengado entre PIM.
              Cada municipalidad provincial cuenta en el distrito de su capital,
              y provincias y departamentos suman a sus gobiernos locales. Las 19
              municipalidades de distritos creados después de 2020 no tienen
              forma en el mapa y quedan fuera.
            </p>
          </section>

          <section className="flex flex-col gap-1.5 text-sm leading-relaxed text-foreground/85">
            <h3 className="font-medium text-foreground">Quién lo hace</h3>
            <p>
              <a
                href="https://crafter.ing"
                target="_blank"
                rel="noreferrer"
                className="text-accent underline underline-offset-4"
              >
                Crafter Research
              </a>
              , el área de investigación de Crafter Station, una comunidad sin
              fines de lucro que construye el ecosistema tecnológico del Perú.
            </p>
          </section>

          <p className="border-t border-border pt-4 font-mono text-[10.5px] text-muted-foreground/70">
            Código abierto en github.com/crafter-research/peru-ordenado
            {sources ? ` · ${sources.geo} · ${sources.spend}` : ""}
          </p>
        </div>
      </dialog>
    </>
  );
}

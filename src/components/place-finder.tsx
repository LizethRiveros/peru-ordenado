"use client";

import { useMemo, useState } from "react";
import type { Dataset, Shape } from "@/lib/shapes";

const fold = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

/** "¿Dónde vives?": type a district, province or department and jump to it. */
export function PlaceFinder({
  data,
  names,
  onPick,
}: {
  data: Dataset | null;
  names: Map<string, string>;
  onPick: (s: Shape) => void;
}) {
  const [q, setQ] = useState("");
  const index = useMemo(
    () =>
      data
        ? [...data.dist, ...data.prov, ...data.dep].map((s) => ({
            s,
            key: fold(s.name),
          }))
        : [],
    [data],
  );
  const found = useMemo(() => {
    const t = fold(q.trim());
    if (t.length < 2) return [];
    const starts = index.filter((i) => i.key.startsWith(t));
    const has = index.filter((i) => !i.key.startsWith(t) && i.key.includes(t));
    return [...starts, ...has].slice(0, 7);
  }, [q, index]);

  const where = (s: Shape) => {
    if (s.id.length === 6)
      return `Distrito · ${names.get(s.id.slice(0, 4)) ?? ""}, ${names.get(s.dep) ?? ""}`;
    if (s.id.length === 4) return `Provincia · ${names.get(s.dep) ?? ""}`;
    return "Departamento";
  };

  return (
    <div className="relative">
      <label className="sr-only" htmlFor="lugar">
        ¿Dónde vives?
      </label>
      <input
        id="lugar"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="¿Dónde vives? Escribe tu distrito"
        autoComplete="off"
        className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-[14px] text-foreground placeholder:text-muted-foreground focus:border-accent/60 focus:outline-none"
      />
      {found.length > 0 && (
        <ul className="absolute inset-x-0 top-full z-50 mt-1.5 overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_20px_50px_-20px_rgba(60,40,20,0.45)]">
          {found.map(({ s }) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => {
                  setQ("");
                  onPick(s);
                }}
                className="flex w-full flex-col px-4 py-2 text-left transition hover:bg-foreground/5"
              >
                <span className="text-[14px]">{s.name}</span>
                <span className="text-[11.5px] text-muted-foreground">
                  {where(s)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

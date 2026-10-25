"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

const REPO = "https://github.com/crafter-research/peru-ordenado";

function Mark() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="1"
        y="1"
        width="22"
        height="22"
        rx="7"
        className="fill-foreground/10 stroke-foreground/20"
      />
      <path
        d="M5 6.5h14"
        className="stroke-accent"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M8 6.5v6M12 6.5v10M16 6.5v4"
        className="stroke-accent"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <circle cx="8" cy="12.5" r="1.5" className="fill-accent" />
      <circle cx="12" cy="16.5" r="1.5" className="fill-accent" />
      <circle cx="16" cy="10.5" r="1.5" className="fill-accent" />
    </svg>
  );
}

/** Logo links home; right side holds the about dialog, theme, Crafter Research and the repo. */
export function SiteHeader({ about }: { about?: ReactNode }) {
  const brand = (
    <>
      <Mark />
      <span className="font-medium tracking-wide">quipu</span>
    </>
  );
  const brandClass =
    "flex items-center gap-2 rounded-xl px-1.5 py-1 text-sm text-foreground transition hover:bg-foreground/5 hover:text-foreground";
  return (
    <header className="relative z-30 flex items-center justify-between gap-3 px-3 pt-[max(env(safe-area-inset-top),0.75rem)] pb-2 sm:px-5">
      <Link href="/" className={brandClass}>
        {brand}
      </Link>
      <nav className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
        {about}
        <ThemeToggle />
        <a
          href="https://crafter.ing"
          target="_blank"
          rel="noreferrer"
          className="hidden rounded-lg px-2 py-1 transition hover:bg-foreground/5 hover:text-foreground sm:inline"
        >
          Crafter Research
        </a>
        <a
          href={REPO}
          target="_blank"
          rel="noreferrer"
          className="grid size-8 place-items-center rounded-lg border border-border bg-surface text-foreground/85 transition hover:border-foreground/20 hover:text-foreground"
        >
          <span className="sr-only">Repositorio en GitHub</span>
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.42c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.56-.29-5.25-1.28-5.25-5.68 0-1.26.45-2.28 1.19-3.08-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.8 1.19 1.82 1.19 3.08 0 4.41-2.69 5.38-5.26 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
          </svg>
        </a>
      </nav>
    </header>
  );
}

"use client";

import { useState } from "react";
import { type CardInput, renderCard } from "@/lib/share-card";

/** Share a place: story image (Instagram / Facebook), WhatsApp message, or plain link. */
export function ShareMenu({
  card,
  text,
  url,
}: {
  card: Omit<CardInput, "url">;
  text: string;
  url: string;
}) {
  const [state, setState] = useState<"" | "busy" | "copied" | "saved">("");

  const story = async () => {
    setState("busy");
    try {
      const blob = await renderCard({ ...card, url });
      const file = new File([blob], `${card.shape.name}.png`, {
        type: "image/png",
      });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: `${text} ${url}` });
        setState("");
        return;
      }
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `quipu-${card.shape.name.toLowerCase().replace(/\s+/g, "-")}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
      setState("saved");
      setTimeout(() => setState(""), 2400);
    } catch {
      setState("");
    }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setState("copied");
    setTimeout(() => setState(""), 1600);
  };

  const btn =
    "rounded-xl border border-border px-3 py-2 text-[12.5px] transition hover:border-foreground/30";
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={story}
        disabled={state === "busy"}
        className="rounded-xl bg-foreground px-3 py-2.5 text-[13px] font-medium text-background transition hover:opacity-90 disabled:opacity-60"
      >
        {state === "busy"
          ? "Armando la imagen…"
          : state === "saved"
            ? "Imagen guardada: súbela a tu historia"
            : "Historia para Instagram o Facebook"}
      </button>
      <div className="grid grid-cols-3 gap-2">
        <a
          className={`${btn} text-center`}
          target="_blank"
          rel="noreferrer"
          href={`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`}
        >
          WhatsApp
        </a>
        <a
          className={`${btn} text-center`}
          target="_blank"
          rel="noreferrer"
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
        >
          Facebook
        </a>
        <button type="button" onClick={copy} className={btn}>
          {state === "copied" ? "Copiado" : "Copiar enlace"}
        </button>
      </div>
    </div>
  );
}
